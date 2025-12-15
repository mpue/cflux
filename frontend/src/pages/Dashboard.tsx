import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { timeService } from '../services/time.service';
import { projectService } from '../services/project.service';
import { absenceService } from '../services/absence.service';
import { reportService } from '../services/report.service';
import { TimeEntry, Project, AbsenceRequest, Report } from '../types';
import '../App.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [current, projectsData, absences, entries, reportData] = await Promise.all([
        timeService.getCurrentTimeEntry(),
        projectService.getAllProjects(),
        absenceService.getMyAbsenceRequests(),
        timeService.getMyTimeEntries(),
        reportService.getMySummary(),
      ]);

      setCurrentEntry(current);
      setProjects(projectsData);
      setAbsenceRequests(absences);
      setTimeEntries(entries);
      setReport(reportData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      await timeService.clockIn(selectedProject || undefined);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Einstempeln fehlgeschlagen');
    }
  };

  const handleClockOut = async () => {
    try {
      await timeService.clockOut();
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ausstempeln fehlgeschlagen');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDuration = (clockIn: string, clockOut?: string) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div>
      <nav className="navbar">
        <h1>Zeiterfassung</h1>
        <div className="navbar-right">
          <span>{user?.firstName} {user?.lastName}</span>
          {user?.role === 'ADMIN' && (
            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
              Admin Panel
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleLogout}>
            Abmelden
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Gesamtstunden (Monat)</h3>
            <div className="value">{report?.totalHours.toFixed(1) || 0}h</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <h3>Gesamttage</h3>
            <div className="value">{report?.totalDays || 0}</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <h3>Urlaubstage übrig</h3>
            <div className="value">{user?.vacationDays || 0}</div>
          </div>
        </div>

        <div className="card">
          <h2>Zeit erfassen</h2>
          
          {currentEntry ? (
            <div>
              <div className="clock-status clocked-in">
                <span className="status-indicator"></span>
                <span>
                  Eingestempelt seit {new Date(currentEntry.clockIn).toLocaleString('de-DE')}
                  {currentEntry.project && ` - ${currentEntry.project.name}`}
                </span>
              </div>
              <button className="btn btn-danger" onClick={handleClockOut}>
                Ausstempeln
              </button>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label>Projekt (optional)</label>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                  <option value="">Kein Projekt</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-success" onClick={handleClockIn}>
                Einstempeln
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Abwesenheitsanträge</h2>
            <button className="btn btn-primary" onClick={() => setShowAbsenceModal(true)}>
              Neuer Antrag
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Von</th>
                <th>Bis</th>
                <th>Tage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {absenceRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.type}</td>
                  <td>{new Date(request.startDate).toLocaleDateString('de-DE')}</td>
                  <td>{new Date(request.endDate).toLocaleDateString('de-DE')}</td>
                  <td>{request.days}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor:
                        request.status === 'APPROVED' ? '#d4edda' :
                        request.status === 'REJECTED' ? '#f8d7da' :
                        '#fff3cd',
                      color:
                        request.status === 'APPROVED' ? '#155724' :
                        request.status === 'REJECTED' ? '#721c24' :
                        '#856404'
                    }}>
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Letzte Zeiteinträge</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Einstempeln</th>
                <th>Ausstempeln</th>
                <th>Dauer</th>
                <th>Projekt</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.slice(0, 10).map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.clockIn).toLocaleDateString('de-DE')}</td>
                  <td>{new Date(entry.clockIn).toLocaleTimeString('de-DE')}</td>
                  <td>{entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('de-DE') : '-'}</td>
                  <td>{entry.clockOut ? formatDuration(entry.clockIn, entry.clockOut) : 'Läuft...'}</td>
                  <td>
                    {entry.clockOut ? (
                      <select
                        value={entry.projectId || ''}
                        onChange={async (e) => {
                          try {
                            await timeService.updateTimeEntry(entry.id, {
                              projectId: e.target.value || undefined
                            });
                            await loadData();
                          } catch (error) {
                            alert('Fehler beim Aktualisieren');
                          }
                        }}
                        style={{ padding: '4px', fontSize: '12px' }}
                      >
                        <option value="">Kein Projekt</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{entry.project?.name || '-'}</span>
                    )}
                  </td>
                  <td>
                    {entry.clockOut && (
                      <span style={{ fontSize: '12px', color: '#999' }}>✓ Änderbar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAbsenceModal && (
        <AbsenceModal
          onClose={() => setShowAbsenceModal(false)}
          onSubmit={async (data) => {
            await absenceService.createAbsenceRequest(data);
            await loadData();
            setShowAbsenceModal(false);
          }}
        />
      )}
    </div>
  );
};

const AbsenceModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'VACATION',
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Abwesenheitsantrag erstellen</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Typ</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="VACATION">Urlaub</option>
              <option value="SICK_LEAVE">Krankheit</option>
              <option value="PERSONAL_LEAVE">Persönlich</option>
              <option value="UNPAID_LEAVE">Unbezahlt</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>

          <div className="form-group">
            <label>Von</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Bis</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Tage</label>
            <input
              type="number"
              step="0.5"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Grund (optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Antrag stellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
