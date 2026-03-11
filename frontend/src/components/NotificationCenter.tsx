import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton, Badge, Menu, Box, Typography, List, ListItem,
  ListItemText, ListItemIcon, Divider, Button, Tooltip, Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  Mail as MailIcon,
  AccountTree as WorkflowIcon,
  Info as SystemIcon,
  DoneAll as DoneAllIcon,
  Circle as UnreadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import {
  AppNotification, getNotifications, getUnreadNotificationCount,
  markNotificationAsRead, markAllNotificationsAsRead,
} from '../services/notification.service';

// Request browser notification permission
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

// Show browser notification
const showBrowserNotification = (title: string, body: string, onClick?: () => void) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: `cflux-${Date.now()}`,
  });
  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);
};

const NotificationCenter: React.FC = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial notifications
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    requestNotificationPermission();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);

      // Show browser notification
      showBrowserNotification(notification.title, notification.body, () => {
        if (notification.linkUrl) {
          navigate(notification.linkUrl);
        }
      });
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, navigate]);

  // Periodically refresh unread count (fallback for missed WebSocket events)
  useEffect(() => {
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(50);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    loadNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClickNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
    handleClose();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'CHAT_MESSAGE': return <ChatIcon color="primary" fontSize="small" />;
      case 'MESSAGE': return <MailIcon color="info" fontSize="small" />;
      case 'WORKFLOW': return <WorkflowIcon color="warning" fontSize="small" />;
      case 'SYSTEM': return <SystemIcon color="action" fontSize="small" />;
      default: return <NotificationsIcon fontSize="small" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Gerade eben';
    if (diffMin < 60) return `vor ${diffMin} Min.`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `vor ${diffHrs} Std.`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString('de-DE');
  };

  return (
    <>
      <Tooltip title="Benachrichtigungen">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 380, maxHeight: '70vh' },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Benachrichtigungen
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<DoneAllIcon />} onClick={handleMarkAllRead}>
              Alle gelesen
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" variant="body2">
              Keine Benachrichtigungen
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                component="div"
                onClick={() => handleClickNotification(notification)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                  borderLeft: notification.isRead ? 0 : 3,
                  borderColor: 'primary.main',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" fontWeight={notification.isRead ? 400 : 600} noWrap sx={{ flex: 1 }}>
                        {notification.title}
                      </Typography>
                      {!notification.isRead && (
                        <UnreadIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" noWrap component="span" sx={{ display: 'block' }}>
                        {notification.body}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" component="span">
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
