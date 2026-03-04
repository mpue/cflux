import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import WidgetHeader from './WidgetHeader';
import { TimeEntry, Project, Location, Story } from '../../types';
import { storyService } from '../../services/story.service';
import './DashboardWidgets.css';

interface TimeTrackingWidgetProps {
  currentEntry: TimeEntry | null;
  projects: Project[];
  locations: Location[];
  stories: Story[];
  selectedProject: string;
  selectedLocation: string;
  selectedStory: string;
  currentTime: string;
  workDuration: string;
  onProjectChange: (projectId: string) => void;
  onLocationChange: (locationId: string) => void;
  onStoryChange: (storyId: string) => void;
  onClockIn: () => void;
  onClockOut: () => void;
  onStartPause: () => void;
  onEndPause: () => void;
  onManualEntry?: (data: {
    clockIn: string;
    clockOut?: string;
    projectId?: string;
    storyId?: string;
    locationId?: string;
    description?: string;
    pauseMinutes?: number;
  }) => Promise<void>;
  onRemove?: () => void;
}

/* ── Helper: duration text from two datetime-local values ──── */
const calcDuration = (clockIn: string, clockOut: string, pauseMin: number) => {
  if (!clockIn || !clockOut) return null;
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  if (end <= start) return { total: 'Ungültig', net: 'Ungültig' };
  const totalMin = Math.floor((end.getTime() - start.getTime()) / 60000);
  const netMin = totalMin - (pauseMin || 0);
  const fmt = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
  return { total: fmt(totalMin), net: fmt(Math.max(netMin, 0)) };
};

const TimeTrackingWidget: React.FC<TimeTrackingWidgetProps> = ({
  currentEntry,
  projects,
  locations,
  stories,
  selectedProject,
  selectedLocation,
  selectedStory,
  currentTime,
  workDuration,
  onProjectChange,
  onLocationChange,
  onStoryChange,
  onClockIn,
  onClockOut,
  onStartPause,
  onEndPause,
  onManualEntry,
  onRemove,
}) => {
  const [showManualModal, setShowManualModal] = useState(false);

  return (
    <div className="dashboard-widget">
      <WidgetHeader title="Zeit erfassen" icon="⏰" onRemove={onRemove} />
      <div className="widget-content">
        {currentEntry ? (
          <div>
            <div className={`clock-status ${currentEntry.status === 'ON_PAUSE' ? 'on-pause' : 'clocked-in'}`}>
              <span className="status-indicator"></span>
              <span>
                {currentEntry.status === 'ON_PAUSE' ? (
                  <>
                    ⏸️ Pause läuft seit {currentEntry.pauseStartedAt ? new Date(currentEntry.pauseStartedAt).toLocaleTimeString('de-DE') : ''}
                    <br />
                    <small className="hint-text">Arbeitszeit: {workDuration}</small>
                  </>
                ) : (
                  <>
                    Eingestempelt seit {new Date(currentEntry.clockIn).toLocaleString('de-DE')}
                    {currentEntry.project && ` - ${currentEntry.project.name}`}
                    {currentEntry.story && (
                      <span style={{ 
                        display: 'inline-block',
                        marginLeft: '6px',
                        padding: '1px 6px', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        backgroundColor: currentEntry.story.color || '#e0e0e0',
                        color: '#fff',
                      }}>
                        {currentEntry.story.name}
                      </span>
                    )}
                    {currentEntry.location && ` (${currentEntry.location.name})`}
                    <br />
                    <small className="hint-text">Arbeitszeit: {workDuration} | Pausen: {currentEntry.pauseMinutes || 0} Min</small>
                  </>
                )}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {currentEntry.status === 'CLOCKED_IN' && (
                <>
                  <button className="btn" style={{ background: '#ff9800', color: 'white' }} onClick={onStartPause}>
                    ⏸️ Pause starten
                  </button>
                  <button className="btn btn-danger" onClick={onClockOut}>
                    Ausstempeln
                  </button>
                </>
              )}
              {currentEntry.status === 'ON_PAUSE' && (
                <button className="btn btn-primary" onClick={onEndPause}>
                  ▶️ Pause beenden
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label>Projekt (optional)</label>
              <select value={selectedProject} onChange={(e) => onProjectChange(e.target.value)}>
                <option value="">Kein Projekt</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedProject && stories.length > 0 && (
              <div className="form-group">
                <label>Story (optional)</label>
                <select value={selectedStory} onChange={(e) => onStoryChange(e.target.value)}>
                  <option value="">Keine Story</option>
                  {stories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Standort (optional)</label>
              <select value={selectedLocation} onChange={(e) => onLocationChange(e.target.value)}>
                <option value="">Kein Standort</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-success" onClick={onClockIn}>
                Einstempeln
              </button>
              {onManualEntry && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowManualModal(true)}
                  title="Zeiteintrag manuell erfassen"
                >
                  ✏️ Manuell erfassen
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Manual time entry modal (portal to body) ────── */}
      {showManualModal && onManualEntry && ReactDOM.createPortal(
        <ManualEntryModal
          projects={projects}
          locations={locations}
          onClose={() => setShowManualModal(false)}
          onSave={async (data) => {
            await onManualEntry(data);
            setShowManualModal(false);
          }}
        />,
        document.body
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────── */
/* ManualEntryModal - inline modal for manual time entries     */
/* ──────────────────────────────────────────────────────────── */
interface ManualEntryModalProps {
  projects: Project[];
  locations: Location[];
  onClose: () => void;
  onSave: (data: {
    clockIn: string;
    clockOut?: string;
    projectId?: string;
    storyId?: string;
    locationId?: string;
    description?: string;
    pauseMinutes?: number;
  }) => Promise<void>;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ projects, locations, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    clockIn: new Date().toISOString().slice(0, 16),
    clockOut: '',
    projectId: '',
    storyId: '',
    locationId: '',
    description: '',
    pauseMinutes: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectStories, setProjectStories] = useState<Story[]>([]);

  const duration = calcDuration(formData.clockIn, formData.clockOut, formData.pauseMinutes);

  // Load stories whenever the selected project changes
  useEffect(() => {
    if (formData.projectId) {
      storyService.getStoriesByProject(formData.projectId)
        .then(setProjectStories)
        .catch(() => setProjectStories([]));
    } else {
      setProjectStories([]);
    }
  }, [formData.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.clockOut) {
      const start = new Date(formData.clockIn);
      const end = new Date(formData.clockOut);
      if (end <= start) {
        setError('Ausstempeln muss nach Einstempeln liegen!');
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        clockIn: formData.clockIn,
        clockOut: formData.clockOut || undefined,
        projectId: formData.projectId || undefined,
        storyId: formData.storyId || undefined,
        locationId: formData.locationId || undefined,
        description: formData.description || undefined,
        pauseMinutes: formData.pauseMinutes || 0,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Fehler beim Erstellen');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2>✏️ Zeiteintrag manuell erfassen</h2>

        {error && (
          <div style={{ padding: '10px 14px', marginBottom: 12, borderRadius: 4, backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: 14 }}>
            {error}
          </div>
        )}

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
            <small style={{ color: '#666', fontSize: 12 }}>Optional — leer lassen für offenen Eintrag</small>
          </div>

          {duration && (
            <div style={{ padding: 12, backgroundColor: '#f0f9ff', borderLeft: '4px solid #3b82f6', marginBottom: 15, borderRadius: 4 }}>
              <div style={{ marginBottom: 4 }}>
                <strong>Gesamtdauer:</strong>{' '}
                <span style={{ fontSize: 16, color: duration.total === 'Ungültig' ? '#ef4444' : '#059669' }}>{duration.total}</span>
              </div>
              {formData.pauseMinutes > 0 && duration.net !== 'Ungültig' && (
                <div style={{ fontSize: 14, color: '#666' }}>
                  Netto (abzgl. {formData.pauseMinutes} Min Pause): <strong>{duration.net}</strong>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Projekt</label>
            <select value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value, storyId: '' })}>
              <option value="">Kein Projekt</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {projectStories.length > 0 && (
            <div className="form-group">
              <label>Story</label>
              <select value={formData.storyId} onChange={(e) => setFormData({ ...formData, storyId: e.target.value })}>
                <option value="">Keine Story</option>
                {projectStories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Standort</label>
            <select value={formData.locationId} onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}>
              <option value="">Kein Standort</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
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
              placeholder="Optionale Beschreibung der Tätigkeit..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Wird erstellt...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeTrackingWidget;
