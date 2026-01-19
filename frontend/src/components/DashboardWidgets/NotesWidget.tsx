import React, { useState, useEffect } from 'react';
import { StickyNote, Trash2, Plus } from 'lucide-react';
import WidgetHeader from './WidgetHeader';
import './DashboardWidgets.css';

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

interface NotesWidgetProps {
  onRemove: () => void;
}

const NOTES_STORAGE_KEY = 'cflux-dashboard-notes';

const NotesWidget: React.FC<NotesWidgetProps> = ({ onRemove }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const loadNotes = () => {
      try {
        const stored = localStorage.getItem(NOTES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotes(parsed);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };
    loadNotes();
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, [notes]);

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddNote();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <WidgetHeader 
        title="Notizen" 
        icon="📝"
        onRemove={onRemove}
      />
      
      <div className="widget-content notes-widget-content">
        {/* Add Note Button/Form */}
        {!isAddingNote ? (
          <button 
            className="notes-add-btn"
            onClick={() => setIsAddingNote(true)}
          >
            <Plus size={16} />
            Neue Notiz
          </button>
        ) : (
          <div className="notes-add-form">
            <textarea
              className="notes-textarea"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Notiz eingeben... (Strg+Enter zum Speichern)"
              autoFocus
              rows={3}
            />
            <div className="notes-form-actions">
              <button 
                className="btn btn-primary btn-small"
                onClick={handleAddNote}
                disabled={!newNoteContent.trim()}
              >
                Speichern
              </button>
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteContent('');
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="notes-list">
          {notes.length === 0 ? (
            <div className="notes-empty">
              <StickyNote size={48} />
              <p>Keine Notizen vorhanden</p>
              <small>Erstelle deine erste Notiz</small>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-header">
                  <span className="note-date">{formatDate(note.createdAt)}</span>
                  <button
                    className="note-delete-btn"
                    onClick={() => handleDeleteNote(note.id)}
                    title="Notiz löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="note-content">{note.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotesWidget;
