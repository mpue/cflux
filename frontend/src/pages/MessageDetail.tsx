import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessage, moveMessage, deleteMessage, Message } from '../services/message.service';
import AppNavbar from '../components/AppNavbar';
import '../styles/Messages.css';

const MessageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadMessage();
    }
  }, [id]);

  const loadMessage = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await getMessage(id);
      setMessage(data);
    } catch (error) {
      console.error('Error loading message:', error);
      alert('Nachricht konnte nicht geladen werden');
      navigate('/messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!id || !message) return;

    if (!window.confirm('Nachricht in den Papierkorb verschieben?')) return;

    try {
      await moveMessage(id, 'TRASH');
      alert('Nachricht in den Papierkorb verschoben');
      navigate('/messages');
    } catch (error) {
      console.error('Error moving message:', error);
      alert('Fehler beim Verschieben der Nachricht');
    }
  };

  const handleDelete = async () => {
    if (!id || !message) return;

    if (!window.confirm('Nachricht endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;

    try {
      await deleteMessage(id);
      alert('Nachricht gelöscht');
      navigate('/messages');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Fehler beim Löschen der Nachricht');
    }
  };

  const handleReply = () => {
    if (!message || !message.sender) return;
    
    // Navigate to compose with pre-filled data
    navigate('/messages/compose', {
      state: {
        receiverId: message.sender.id,
        subject: `Re: ${message.subject}`,
        replyToId: message.id
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSenderName = (message: Message) => {
    if (message.type === 'SYSTEM') return 'System';
    if (message.type === 'WORKFLOW') return 'Workflow System';
    return message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Unbekannt';
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === 'high') return '🔴 Hoch';
    if (priority === 'low') return '🔵 Niedrig';
    return 'Normal';
  };

  if (loading) {
    return <div className="message-detail-loading">Lade Nachricht...</div>;
  }

  if (!message) {
    return <div className="message-detail-error">Nachricht nicht gefunden</div>;
  }

  return (
    <>
      <AppNavbar title="Nachrichtendetails" />
      <div className="message-detail-page" style={{ paddingTop: '20px' }}>
      <div className="message-detail-header">
        <button className="btn btn-secondary" onClick={() => navigate('/messages')}>
          ← Zurück zu Nachrichten
        </button>
        <div className="message-actions">
          {message.type === 'USER' && message.sender && (
            <button className="btn btn-primary" onClick={handleReply}>
              ↩️ Antworten
            </button>
          )}
          {message.receiverFolder !== 'TRASH' && (
            <button className="btn btn-secondary" onClick={handleMoveToTrash}>
              🗑️ In Papierkorb
            </button>
          )}
          {message.receiverFolder === 'TRASH' && (
            <button className="btn btn-danger" onClick={handleDelete}>
              🗑️ Endgültig löschen
            </button>
          )}
        </div>
      </div>

      <div className="message-detail-content">
        <div className="message-header-info">
          <h1>{message.subject}</h1>
          <div className="message-metadata">
            <div className="metadata-row">
              <span className="metadata-label">Von:</span>
              <span className="metadata-value">
                {getSenderName(message)}
                {message.sender && ` <${message.sender.email}>`}
              </span>
            </div>
            {message.receiver && (
              <div className="metadata-row">
                <span className="metadata-label">An:</span>
                <span className="metadata-value">
                  {message.receiver.firstName} {message.receiver.lastName} &lt;{message.receiver.email}&gt;
                </span>
              </div>
            )}
            <div className="metadata-row">
              <span className="metadata-label">Datum:</span>
              <span className="metadata-value">{formatDate(message.createdAt)}</span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Priorität:</span>
              <span className="metadata-value">{getPriorityLabel(message.priority)}</span>
            </div>
            {message.type !== 'USER' && (
              <div className="metadata-row">
                <span className="metadata-label">Typ:</span>
                <span className="message-type-badge">{message.type}</span>
              </div>
            )}
          </div>
        </div>

        {message.replyTo && (
          <div className="message-reply-context">
            <strong>Antwort auf:</strong> {message.replyTo.subject}
          </div>
        )}

        <div className="message-body" dangerouslySetInnerHTML={{ __html: message.body }} />

        {message.replies && message.replies.length > 0 && (
          <div className="message-replies">
            <h3>Antworten ({message.replies.length})</h3>
            {message.replies.map(reply => (
              <div key={reply.id} className="reply-item" onClick={() => navigate(`/messages/${reply.id}`)}>
                <div className="reply-sender">
                  {reply.sender.firstName} {reply.sender.lastName}
                </div>
                <div className="reply-subject">{reply.subject}</div>
                <div className="reply-date">{formatDate(reply.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default MessageDetail;
