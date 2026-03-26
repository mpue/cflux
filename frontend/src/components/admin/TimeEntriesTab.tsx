import React, { useState, useEffect } from 'react';
import { TimeEntry, User, Project } from '../../types';
import { userService } from '../../services/user.service';
import { projectService } from '../../services/project.service';
import { timeService } from '../../services/time.service';
import { roundMsToMinutes } from '../../utils/timeRounding';
import SollIstVergleichTab from './SollIstVergleichTab';

type SubTab = 'entries' | 'sollIst';

export const TimeEntriesTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('entries');

  return (
    <div>
      <h2>Zeiteinträge & Korrekturen</h2>
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e0e0e0',
        marginBottom: '20px',
        marginTop: '10px',
        gap: '0'
      }}>
        <button
          onClick={() => setActiveSubTab('entries')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeSubTab === 'entries' ? '3px solid #1976d2' : '3px solid transparent',
            backgroundColor: activeSubTab === 'entries' ? '#e3f2fd' : 'transparent',
            color: activeSubTab === 'entries' ? '#1976d2' : '#666',
            fontWeight: activeSubTab === 'entries' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
        >
          ⏱️ Zeiteinträge
        </button>
        <button
          onClick={() => setActiveSubTab('sollIst')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeSubTab === 'sollIst' ? '3px solid #1976d2' : '3px solid transparent',
            backgroundColor: activeSubTab === 'sollIst' ? '#e3f2fd' : 'transparent',
            color: activeSubTab === 'sollIst' ? '#1976d2' : '#666',
            fontWeight: activeSubTab === 'sollIst' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
        >
          📊 Soll-Ist Vergleich
        </button>
      </div>

      {activeSubTab === 'entries' && <TimeEntriesContent />}
      {activeSubTab === 'sollIst' && <SollIstVergleichTab />}
    </div>
  );
};

const TimeEntriesContent: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, []);

  const loadUsers = async () => {
    const usersData = await userService.getAllUsersAdmin();
    usersData.sort((a: User, b: User) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
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
    const totalMinutes = roundMsToMinutes(end.getTime() - start.getTime());
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', marginTop: '10px', marginBottom: '20px' }}>
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
        <button 
          className="btn btn-success" 
          onClick={() => setShowCreateModal(true)}
          disabled={!userId}
          style={{ height: '40px', marginTop: '24px' }}
        >
          + Neuer Eintrag
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

      {showCreateModal && (
        <TimeEntryCreateModal
          userId={userId}
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            try {
              await timeService.createTimeEntry(data);
              setShowCreateModal(false);
              await loadEntries();
            } catch (error) {
              alert('Fehler beim Erstellen');
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

  const calculateDuration = () => {
    if (!formData.clockIn || !formData.clockOut) return null;
    const start = new Date(formData.clockIn);
    const end = new Date(formData.clockOut);
    if (end <= start) return 'Ungültig';
    
    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = roundMsToMinutes(diffMs);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const duration = calculateDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.clockOut) {
      const start = new Date(formData.clockIn);
      const end = new Date(formData.clockOut);
      if (end <= start) {
        alert('Ausstempeln muss nach Einstempeln liegen!');
        return;
      }
    }
    
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

          {duration && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f0f9ff', 
              borderLeft: '4px solid #3b82f6',
              marginBottom: '15px',
              borderRadius: '4px'
            }}>
              <strong>Berechnete Dauer:</strong>{' '}
              <span style={{ fontSize: '16px', color: duration === 'Ungültig' ? '#ef4444' : '#059669' }}>
                {duration}
              </span>
            </div>
          )}

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

const TimeEntryCreateModal: React.FC<{
  userId: string;
  projects: Project[];
  onClose: () => void;
  onSave: (data: {
    userId: string;
    clockIn: string;
    clockOut?: string;
    projectId?: string;
    description?: string;
    pauseMinutes?: number;
  }) => Promise<void>;
}> = ({ userId, projects, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    clockIn: new Date().toISOString().slice(0, 16),
    clockOut: '',
    projectId: '',
    description: '',
    pauseMinutes: 0,
  });

  const calculateDuration = () => {
    if (!formData.clockIn || !formData.clockOut) return null;
    const start = new Date(formData.clockIn);
    const end = new Date(formData.clockOut);
    if (end <= start) return { total: 'Ungültig', net: 'Ungültig' };
    
    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = roundMsToMinutes(diffMs);
    const netMinutes = totalMinutes - (formData.pauseMinutes || 0);
    
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;
    
    const netHours = Math.floor(netMinutes / 60);
    const netMins = netMinutes % 60;
    
    return {
      total: `${totalHours}h ${totalMins}m`,
      net: `${netHours}h ${netMins}m`
    };
  };

  const duration = calculateDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.clockOut) {
      const start = new Date(formData.clockIn);
      const end = new Date(formData.clockOut);
      if (end <= start) {
        alert('Ausstempeln muss nach Einstempeln liegen!');
        return;
      }
    }
    
    await onSave({
      userId,
      clockIn: formData.clockIn,
      clockOut: formData.clockOut || undefined,
      projectId: formData.projectId || undefined,
      description: formData.description,
      pauseMinutes: formData.pauseMinutes || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Neuer Zeiteintrag</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Einstempeln *</label>
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
            <small style={{ color: '#666', fontSize: '12px' }}>
              Optional - leer lassen für offenen Eintrag
            </small>
          </div>

          {duration && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f0f9ff', 
              borderLeft: '4px solid #3b82f6',
              marginBottom: '15px',
              borderRadius: '4px'
            }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Gesamtdauer:</strong>{' '}
                <span style={{ fontSize: '16px', color: duration.total === 'Ungültig' ? '#ef4444' : '#059669' }}>
                  {duration.total}
                </span>
              </div>
              {formData.pauseMinutes > 0 && duration.net !== 'Ungültig' && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Nettoarbeitszeit (abzgl. {formData.pauseMinutes} Min Pause): <strong>{duration.net}</strong>
                </div>
              )}
            </div>
          )}

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
            <label>Pausenzeit (Minuten)</label>
            <input
              type="number"
              min="0"
              value={formData.pauseMinutes}
              onChange={(e) => setFormData({ ...formData, pauseMinutes: parseInt(e.target.value) || 0 })}
            />
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
            <button type="submit" className="btn btn-success">
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
