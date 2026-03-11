import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton, List, ListItem,
  ListItemAvatar, ListItemText, Avatar, Badge, Divider, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Chip, Autocomplete, Tooltip, CircularProgress, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Circle as CircleIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  ChatRoom, ChatMessage, getChatRooms, getChatMessages,
  sendChatMessage, markChatRoomAsRead, getOrCreateDirectChat, createGroupChat,
} from '../services/chat.service';
import { getMessageRecipients, MessageRecipient } from '../services/message.service';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  // New chat dialog
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<MessageRecipient[]>([]);
  const [groupName, setGroupName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      // Update messages if in the same room
      if (selectedRoom && message.roomId === selectedRoom.id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        // Mark as read if viewing
        if (message.senderId !== user?.id) {
          markChatRoomAsRead(message.roomId).catch(console.error);
        }
      }
      // Update room list (move room to top, update preview)
      loadRooms();
    };

    const handleTyping = (data: { roomId: string; userId: string }) => {
      if (data.userId !== user?.id) {
        setTypingUsers((prev) => new Map(prev).set(data.userId, data.roomId));
      }
    };

    const handleStopTyping = (data: { roomId: string; userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stop-typing', handleStopTyping);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stop-typing', handleStopTyping);
    };
  }, [socket, selectedRoom, user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join/leave room on selection
  useEffect(() => {
    if (!socket || !selectedRoom) return;
    socket.emit('chat:join', selectedRoom.id);
    return () => {
      socket.emit('chat:leave', selectedRoom.id);
    };
  }, [socket, selectedRoom]);

  const loadRooms = async () => {
    try {
      const data = await getChatRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    try {
      const msgs = await getChatMessages(room.id);
      setMessages(msgs);
      await markChatRoomAsRead(room.id);
      // Update unread count in room list
      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
      );
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || sendingMessage) return;
    setSendingMessage(true);
    try {
      await sendChatMessage(selectedRoom.id, newMessage.trim());
      setNewMessage('');
      // Stop typing indicator
      if (socket) {
        socket.emit('chat:stop-typing', { roomId: selectedRoom.id });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedRoom) return;
    socket.emit('chat:typing', { roomId: selectedRoom.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop-typing', { roomId: selectedRoom.id });
    }, 2000);
  };

  const openNewChatDialog = async () => {
    try {
      const users = await getMessageRecipients();
      setRecipients(users.filter((u) => u.id !== user?.id));
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
    setNewChatOpen(true);
  };

  const handleCreateChat = async () => {
    try {
      if (chatType === 'direct' && selectedUsers.length === 1) {
        const room = await getOrCreateDirectChat(selectedUsers[0].id);
        await loadRooms();
        setSelectedRoom(room);
        const msgs = await getChatMessages(room.id);
        setMessages(msgs);
      } else if (chatType === 'group' && selectedUsers.length >= 1 && groupName.trim()) {
        const room = await createGroupChat(
          groupName.trim(),
          selectedUsers.map((u) => u.id)
        );
        await loadRooms();
        setSelectedRoom(room);
        setMessages([]);
      }
      setNewChatOpen(false);
      setSelectedUsers([]);
      setGroupName('');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const getRoomDisplayName = (room: ChatRoom): string => {
    if (room.type === 'GROUP') return room.name || 'Gruppenchat';
    const otherMember = room.members.find((m) => m.userId !== user?.id);
    return otherMember ? `${otherMember.user.firstName} ${otherMember.user.lastName}` : 'Chat';
  };

  const getRoomAvatar = (room: ChatRoom): string => {
    if (room.type === 'GROUP') return room.name?.[0]?.toUpperCase() || 'G';
    const otherMember = room.members.find((m) => m.userId !== user?.id);
    return otherMember ? `${otherMember.user.firstName[0]}${otherMember.user.lastName[0]}` : '?';
  };

  const isRoomOnline = (room: ChatRoom): boolean => {
    if (room.type === 'GROUP') return room.members.some((m) => m.userId !== user?.id && onlineUsers.includes(m.userId));
    const otherMember = room.members.find((m) => m.userId !== user?.id);
    return otherMember ? onlineUsers.includes(otherMember.userId) : false;
  };

  const getTypingText = (): string | null => {
    if (!selectedRoom) return null;
    const typing = Array.from(typingUsers.entries())
      .filter(([, roomId]) => roomId === selectedRoom.id)
      .map(([userId]) => {
        const member = selectedRoom.members.find((m) => m.userId === userId);
        return member ? member.user.firstName : 'Jemand';
      });
    if (typing.length === 0) return null;
    if (typing.length === 1) return `${typing[0]} tippt...`;
    return `${typing.join(', ')} tippen...`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) +
      ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const name = getRoomDisplayName(room).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const roomListContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Chat suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="Neuer Chat">
          <IconButton color="primary" onClick={openNewChatDialog}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredRooms.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              {searchQuery ? 'Keine Chats gefunden' : 'Noch keine Chats'}
            </Typography>
            <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={openNewChatDialog}>
              Chat starten
            </Button>
          </Box>
        ) : (
          filteredRooms.map((room) => (
            <ListItem
              key={room.id}
              component="div"
              onClick={() => handleSelectRoom(room)}
              sx={{
                cursor: 'pointer',
                bgcolor: selectedRoom?.id === room.id ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
                borderLeft: selectedRoom?.id === room.id ? 3 : 0,
                borderColor: 'primary.main',
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    isRoomOnline(room) ? (
                      <CircleIcon sx={{ fontSize: 12, color: 'success.main' }} />
                    ) : null
                  }
                >
                  <Avatar sx={{ bgcolor: room.type === 'GROUP' ? 'secondary.main' : 'primary.main' }}>
                    {room.type === 'GROUP' ? <GroupIcon /> : getRoomAvatar(room)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                      {getRoomDisplayName(room)}
                    </Typography>
                    {room.messages[0] && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                        {formatTime(room.messages[0].createdAt)}
                      </Typography>
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
                      {room.messages[0]
                        ? `${room.messages[0].sender.firstName}: ${room.messages[0].content}`
                        : 'Noch keine Nachrichten'}
                    </Typography>
                    {room.unreadCount > 0 && (
                      <Chip
                        label={room.unreadCount}
                        color="primary"
                        size="small"
                        sx={{ ml: 1, minWidth: 24, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );

  const chatContent = selectedRoom ? (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        {isMobile && (
          <IconButton onClick={() => setSelectedRoom(null)} size="small">
            <ArrowBackIcon />
          </IconButton>
        )}
        <Avatar sx={{ bgcolor: selectedRoom.type === 'GROUP' ? 'secondary.main' : 'primary.main', width: 36, height: 36 }}>
          {selectedRoom.type === 'GROUP' ? <GroupIcon fontSize="small" /> : getRoomAvatar(selectedRoom)}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {getRoomDisplayName(selectedRoom)}
          </Typography>
          {getTypingText() ? (
            <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
              {getTypingText()}
            </Typography>
          ) : isRoomOnline(selectedRoom) ? (
            <Typography variant="caption" color="success.main">Online</Typography>
          ) : (
            selectedRoom.type === 'GROUP' && (
              <Typography variant="caption" color="text.secondary">
                {selectedRoom.members.length} Mitglieder
              </Typography>
            )
          )}
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {messages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              Schreibe die erste Nachricht...
            </Typography>
          </Box>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === user?.id;
            const showAvatar = !isOwn && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
            return (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  flexDirection: isOwn ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 0.5,
                  mb: showAvatar ? 1 : 0.25,
                }}
              >
                {!isOwn && (
                  <Avatar
                    sx={{
                      width: 28, height: 28, fontSize: '0.75rem',
                      visibility: showAvatar ? 'visible' : 'hidden',
                    }}
                  >
                    {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                  </Avatar>
                )}
                <Box
                  sx={{
                    maxWidth: '70%',
                    bgcolor: isOwn ? 'primary.main' : 'grey.100',
                    color: isOwn ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                    position: 'relative',
                    ...(theme.palette.mode === 'dark' && !isOwn && { bgcolor: 'grey.800' }),
                  }}
                >
                  {showAvatar && !isOwn && selectedRoom.type === 'GROUP' && (
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 600, display: 'block' }}>
                      {msg.sender.firstName} {msg.sender.lastName}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: 'right',
                      mt: 0.25,
                      opacity: 0.7,
                      fontSize: '0.65rem',
                    }}
                  >
                    {formatTime(msg.createdAt)}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Nachricht schreiben..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  ) : (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ textAlign: 'center' }}>
        <ChatIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Wähle einen Chat aus
        </Typography>
        <Typography variant="body2" color="text.secondary">
          oder starte einen neuen Chat
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={openNewChatDialog} startIcon={<AddIcon />}>
          Neuer Chat
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppNavbar title="Chat" />
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Room List */}
        {(!isMobile || !selectedRoom) && (
          <Paper
            elevation={0}
            sx={{
              width: isMobile ? '100%' : 360,
              minWidth: isMobile ? 'auto' : 360,
              borderRight: 1,
              borderColor: 'divider',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {roomListContent}
          </Paper>
        )}

        {/* Chat Area */}
        {(!isMobile || selectedRoom) && (
          <Box sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            {chatContent}
          </Box>
        )}
      </Box>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onClose={() => setNewChatOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neuer Chat</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
            <Button
              variant={chatType === 'direct' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { setChatType('direct'); setSelectedUsers([]); }}
              startIcon={<ChatIcon />}
            >
              Direktchat
            </Button>
            <Button
              variant={chatType === 'group' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { setChatType('group'); setSelectedUsers([]); }}
              startIcon={<GroupIcon />}
            >
              Gruppenchat
            </Button>
          </Box>

          {chatType === 'group' && (
            <TextField
              fullWidth
              size="small"
              label="Gruppenname"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          <Autocomplete
            multiple={chatType === 'group'}
            options={recipients}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
            value={chatType === 'group' ? selectedUsers : (selectedUsers[0] || null) as any}
            onChange={(_, value) => {
              if (Array.isArray(value)) {
                setSelectedUsers(value);
              } else if (value) {
                setSelectedUsers([value as MessageRecipient]);
              } else {
                setSelectedUsers([]);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={chatType === 'group' ? 'Teilnehmer auswählen' : 'Benutzer auswählen'}
                size="small"
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      onlineUsers.includes(option.id)
                        ? <CircleIcon sx={{ fontSize: 10, color: 'success.main' }} />
                        : null
                    }
                  >
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                      {option.firstName[0]}{option.lastName[0]}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="body2">{option.firstName} {option.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                  </Box>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleCreateChat}
            disabled={
              selectedUsers.length === 0 ||
              (chatType === 'group' && !groupName.trim())
            }
          >
            Chat starten
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatPage;
