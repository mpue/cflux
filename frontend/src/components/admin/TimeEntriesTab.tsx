import React, { useState, useEffect } from 'react';
import { TimeEntry, User, Project } from '../../types';
import { userService } from '../../services/user.service';
import { projectService } from '../../services/project.service';
import { timeService } from '../../services/time.service';

export const TimeEntriesTab: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, []);

  const loadUsers = async () => {
    const usersData = await userService.getAllUsersAdmin();
    setUsers(usersData);
  };

  const loadProjects = async () => {
    const projectsData = await projectService.getAllProjects();
    setProjects(projectsData);
  };

  const loadEntries = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const entriesData = await timeService.getUserTimeEntries(userId);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading entries:', error);
      alert('Fehler beim Laden der Zeiteinträge');
    }
    setLoading(false);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Zeiteintrag wirklich löschen?')) return;
    try {
      await timeService.deleteTimeEntry(id);
      await loadEntries();
    } catch (error) {
      alert('Fehler beim Löschen');
    }
  };

  const formatDuration = (clockIn: string, clockOut?: string) => {
    if (!clockOut) return 'Läuft...';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div>
      <h2>Zeiteinträge & Korrekturen</h2>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
        <div className="form-group" style={{ flex: 1, maxWidth: '400px' }}>
          <label>Benutzer auswählen</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Bitte wählen...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={loadEntries} 
          disabled={!userId || loading}
          style={{ height: '40px', marginTop: '24px' }}
        >
          {loading ? 'Lädt...' : 'Einträge laden'}
        </button>
      </div>

      {entries.length > 0 && (
        <div>
          <h3>
            {entries.length} Einträge für {users.find(u => u.id === userId)?.firstName} {users.find(u => u.id === userId)?.lastName}
          </h3>
          <table className="table" style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Einstempeln</th>
                <th>Ausstempeln</th>
                <th>Dauer</th>
                <th>Projekt</th>
                <th>Beschreibung</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.clockIn).toLocaleDateString('de-DE')}</td>
                  <td>{new Date(entry.clockIn).toLocaleTimeString('de-DE')}</td>
                  <td>{entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('de-DE') : '-'}</td>
                  <td>{formatDuration(entry.clockIn, entry.clockOut)}</td>
                  <td>{entry.project?.name || '-'}</td>
                  <td>{entry.description || '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: entry.status === 'CLOCKED_OUT' ? '#d4edda' : '#fff3cd',
                      color: entry.status === 'CLOCKED_OUT' ? '#155724' : '#856404'
                    }}>
                      {entry.status === 'CLOCKED_OUT' ? 'Abgeschlossen' : 'Aktiv'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => {
                        setEditingEntry(entry);
                        setShowEditModal(true);
                      }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && editingEntry && (
        <TimeEntryEditModal
          entry={editingEntry}
          projects={projects}
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
          onSave={async (data) => {
            try {
              await timeService.updateTimeEntry(editingEntry.id, data);
              setShowEditModal(false);
              setEditingEntry(null);
              await loadEntries();
            } catch (error) {
              alert('Fehler beim Speichern');
            }
          }}
        />
      )}
    </div>
  );
};

const TimeEntryEditModal: React.FC<{
  entry: TimeEntry;
  projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<TimeEntry>) => Promise<void>;
}> = ({ entry, projects, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    clockIn: new Date(entry.clockIn).toISOString().slice(0, 16),
    clockOut: entry.clockOut ? new Date(entry.clockOut).toISOString().slice(0, 16) : '',
    projectId: entry.projectId || '',
    description: entry.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      clockIn: formData.clockIn,
      clockOut: formData.clockOut || undefined,
      projectId: formData.projectId || undefined,
      description: formData.description,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Zeiteintrag bearbeiten</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Einstempeln</label>
            <input
              type="datetime-local"
              value={formData.clockIn}
              onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Ausstempeln</label>
            <input
              type="datetime-local"
              value={formData.clockOut}
              onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Projekt</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">Kein Projekt</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
