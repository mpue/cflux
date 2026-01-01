import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMessages,
  moveMessage,
  toggleReadStatus,
  getUnreadCount,
  Message
} from '../services/message.service';
import '../styles/Messages.css';

const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentFolder, setCurrentFolder] = useState<'INBOX' | 'SENT' | 'TRASH'>('INBOX');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadMessages();
    loadUnreadCount();
  }, [currentFolder]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await getMessages(currentFolder);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleFolderChange = (folder: 'INBOX' | 'SENT' | 'TRASH') => {
    setCurrentFolder(folder);
    setSelectedMessages(new Set());
  };

  const handleMessageClick = (messageId: string) => {
    navigate(`/messages/${messageId}`);
  };

  const handleToggleSelect = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(messages.map(m => m.id)));
    }
  };

  const handleMoveToTrash = async () => {
    if (selectedMessages.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedMessages).map(id => moveMessage(id, 'TRASH'))
      );
      setSelectedMessages(new Set());
      loadMessages();
      loadUnreadCount();
    } catch (error) {
      console.error('Error moving messages:', error);
      alert('Fehler beim Verschieben der Nachrichten');
    }
  };

  const handleMarkAsRead = async (isRead: boolean) => {
    if (selectedMessages.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedMessages).map(id => toggleReadStatus(id, isRead))
      );
      setSelectedMessages(new Set());
      loadMessages();
      loadUnreadCount();
    } catch (error) {
      console.error('Error updating messages:', error);
      alert('Fehler beim Aktualisieren der Nachrichten');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Gestern';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('de-DE', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const getSenderName = (message: Message) => {
    if (message.type === 'SYSTEM') return 'System';
    if (message.type === 'WORKFLOW') return 'Workflow System';
    if (currentFolder === 'SENT') {
      return message.receiver ? `${message.receiver.firstName} ${message.receiver.lastName}` : 'Unbekannt';
    }
    return message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'System';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return '🔴';
    if (priority === 'low') return '🔵';
    return '';
  };

  return (
    <div className="messages-page">
      <div className="messages-header">
        <h1>📨 Nachrichten</h1>
        <button className="btn btn-primary" onClick={() => navigate('/messages/compose')}>
          ✍️ Neue Nachricht
        </button>
      </div>

      <div className="messages-container">
        {/* Sidebar */}
        <div className="messages-sidebar">
          <div className="folder-list">
            <button
              className={`folder-item ${currentFolder === 'INBOX' ? 'active' : ''}`}
              onClick={() => handleFolderChange('INBOX')}
            >
              <span className="folder-icon">📥</span>
              <span className="folder-name">Posteingang</span>
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>
            <button
              className={`folder-item ${currentFolder === 'SENT' ? 'active' : ''}`}
              onClick={() => handleFolderChange('SENT')}
            >
              <span className="folder-icon">📤</span>
              <span className="folder-name">Gesendet</span>
            </button>
            <button
              className={`folder-item ${currentFolder === 'TRASH' ? 'active' : ''}`}
              onClick={() => handleFolderChange('TRASH')}
            >
              <span className="folder-icon">🗑️</span>
              <span className="folder-name">Papierkorb</span>
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="messages-content">
          {selectedMessages.size > 0 && (
            <div className="messages-toolbar">
              <span>{selectedMessages.size} ausgewählt</span>
              <div className="toolbar-actions">
                {currentFolder === 'INBOX' && (
                  <>
                    <button onClick={() => handleMarkAsRead(true)}>Als gelesen markieren</button>
                    <button onClick={() => handleMarkAsRead(false)}>Als ungelesen markieren</button>
                  </>
                )}
                {currentFolder !== 'TRASH' && (
                  <button onClick={handleMoveToTrash}>In Papierkorb verschieben</button>
                )}
              </div>
            </div>
          )}

          <div className="message-list-header">
            <input
              type="checkbox"
              checked={selectedMessages.size === messages.length && messages.length > 0}
              onChange={handleSelectAll}
            />
            <span className="message-count">{messages.length} Nachrichten</span>
          </div>

          {loading ? (
            <div className="messages-loading">Lade Nachrichten...</div>
          ) : messages.length === 0 ? (
            <div className="messages-empty">
              {currentFolder === 'INBOX' && '📭 Keine neuen Nachrichten'}
              {currentFolder === 'SENT' && '📭 Keine gesendeten Nachrichten'}
              {currentFolder === 'TRASH' && '🗑️ Papierkorb ist leer'}
            </div>
          ) : (
            <div className="message-list">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message-item ${!message.isRead && currentFolder === 'INBOX' ? 'unread' : ''} ${selectedMessages.has(message.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMessages.has(message.id)}
                    onChange={() => handleToggleSelect(message.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div
                    className="message-content"
                    onClick={() => handleMessageClick(message.id)}
                  >
                    <div className="message-sender">
                      {getPriorityIcon(message.priority)} {getSenderName(message)}
                      {message.type !== 'USER' && (
                        <span className="message-type-badge">{message.type}</span>
                      )}
                    </div>
                    <div className="message-subject">{message.subject}</div>
                    <div className="message-preview">
                      {message.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </div>
                  </div>
                  <div className="message-date">{formatDate(message.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
