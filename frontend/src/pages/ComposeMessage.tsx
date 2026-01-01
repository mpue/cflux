import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage, getMessageRecipients, MessageRecipient } from '../services/message.service';
import '../styles/Messages.css';

const ComposeMessage: React.FC = () => {
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      const data = await getMessageRecipients();
      setRecipients(data);
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverId || !subject || !body.trim()) {
      alert('Bitte füllen Sie alle Felder aus');
      return;
    }

    setLoading(true);
    try {
      await sendMessage({
        receiverId,
        subject,
        body,
        priority
      });
      alert('Nachricht erfolgreich gesendet!');
      navigate('/messages');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Fehler beim Senden der Nachricht');
    } finally {
      setLoading(false);
    }
  };

  // Simple text formatting functions
  const formatText = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('URL eingeben:');
    if (url) {
      document.execCommand('createLink', false, url);
      editorRef.current?.focus();
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="compose-message-page">
      <div className="compose-header">
        <h1>✍️ Neue Nachricht</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/messages')}>
          ← Zurück
        </button>
      </div>

      <form onSubmit={handleSubmit} className="compose-form">
        <div className="form-group">
          <label>Empfänger *</label>
          <select
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            required
          >
            <option value="">-- Empfänger auswählen --</option>
            {recipients.map(recipient => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.firstName} {recipient.lastName} ({recipient.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Betreff *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Betreff der Nachricht"
            required
          />
        </div>

        <div className="form-group">
          <label>Priorität</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Niedrig 🔵</option>
            <option value="normal">Normal</option>
            <option value="high">Hoch 🔴</option>
          </select>
        </div>

        <div className="form-group">
          <label>Nachricht *</label>
          <div className="editor-toolbar">
            <button type="button" onClick={() => formatText('bold')} title="Fett">
              <strong>B</strong>
            </button>
            <button type="button" onClick={() => formatText('italic')} title="Kursiv">
              <em>I</em>
            </button>
            <button type="button" onClick={() => formatText('underline')} title="Unterstrichen">
              <u>U</u>
            </button>
            <button type="button" onClick={() => formatText('insertUnorderedList')} title="Liste">
              • Liste
            </button>
            <button type="button" onClick={() => formatText('insertOrderedList')} title="Nummerierte Liste">
              1. Liste
            </button>
            <button type="button" onClick={insertLink} title="Link einfügen">
              🔗 Link
            </button>
            <button type="button" onClick={() => formatText('removeFormat')} title="Formatierung entfernen">
              ✕ Format
            </button>
          </div>
          <div
            ref={editorRef}
            className="message-editor"
            contentEditable
            onInput={handleEditorChange}
            data-placeholder="Ihre Nachricht hier eingeben..."
          />
        </div>

        <div className="compose-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Wird gesendet...' : '📤 Senden'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/messages')}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComposeMessage;
