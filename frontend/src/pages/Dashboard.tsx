import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { timeService } from '../services/time.service';
import { projectService } from '../services/project.service';
import { absenceService } from '../services/absence.service';
import { reportService } from '../services/report.service';
import { locationService } from '../services/location.service';
import { TimeEntry, Project, AbsenceRequest, Report, Location } from '../types';
import PDFReportModal from '../components/PDFReportModal';
import '../App.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showPauseReminderModal, setShowPauseReminderModal] = useState(false);
  const [pauseReminderMessage, setPauseReminderMessage] = useState<string>('');
  const [pauseMinutes, setPauseMinutes] = useState<number>(0);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('de-DE'));
  const [workDuration, setWorkDuration] = useState<string>('0h 0m');
  const [pauseCheckDone, setPauseCheckDone] = useState<Set<string>>(new Set());
  const [showPDFReportModal, setShowPDFReportModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('de-DE'));
      updateWorkDuration();
    }, 1000);
    return () => clearInterval(timer);
  }, [currentEntry]);

  const updateWorkDuration = () => {
    if (!currentEntry || currentEntry.status === 'CLOCKED_OUT') {
      setWorkDuration('0h 0m');
      return;
    }

    const start = new Date(currentEntry.clockIn);
    const now = new Date();
    let totalMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    // Abzug bereits abgeschlossene Pausen
    if (currentEntry.pauseMinutes) {
      totalMinutes -= currentEntry.pauseMinutes;
    }
    
    // Abzug aktuelle Pause
    if (currentEntry.status === 'ON_PAUSE' && currentEntry.pauseStartedAt) {
      const pauseStart = new Date(currentEntry.pauseStartedAt);
      const currentPauseMinutes = Math.floor((now.getTime() - pauseStart.getTime()) / (1000 * 60));
      totalMinutes -= currentPauseMinutes;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setWorkDuration(`${hours}h ${minutes}m`);

    // Auto-Reminder für Pausen
    checkPauseReminder(totalMinutes);
  };

  const checkPauseReminder = (workMinutes: number) => {
    if (!currentEntry || currentEntry.status !== 'CLOCKED_IN') return;
    
    const workHours = workMinutes / 60;
    const entryId = currentEntry.id;
    const totalPause = currentEntry.pauseMinutes || 0;

    // 5.5 Stunden = 15 Min Pause
    if (workHours >= 5.5 && totalPause < 15 && !pauseCheckDone.has(`${entryId}-5.5`)) {
      setPauseReminderMessage('Du hast jetzt 5,5 Stunden gearbeitet. Bitte mache eine 15-minütige Pause! 🕒');
      setShowPauseReminderModal(true);
      setPauseCheckDone(prev => new Set(prev).add(`${entryId}-5.5`));
    }
    // 7 Stunden = 30 Min Pause
    else if (workHours >= 7 && totalPause < 30 && !pauseCheckDone.has(`${entryId}-7`)) {
      setPauseReminderMessage('Du hast jetzt 7 Stunden gearbeitet. Bitte mache eine 30-minütige Pause! ⚠️');
      setShowPauseReminderModal(true);
      setPauseCheckDone(prev => new Set(prev).add(`${entryId}-7`));
    }
    // 9 Stunden = 60 Min Pause
    else if (workHours >= 9 && totalPause < 60 && !pauseCheckDone.has(`${entryId}-9`)) {
      setPauseReminderMessage('Du hast jetzt 9 Stunden gearbeitet. Du musst jetzt eine Stunde Pause machen! 🚨');
      setShowPauseReminderModal(true);
      setPauseCheckDone(prev => new Set(prev).add(`${entryId}-9`));
    }
  };

  const loadData = async () => {
    try {
      const [current, projectsData, locationsData, absences, entries, reportData] = await Promise.all([
        timeService.getCurrentTimeEntry(),
        projectService.getAllProjects(),
        locationService.getActiveLocations(),
        absenceService.getMyAbsenceRequests(),
        timeService.getMyTimeEntries(),
        reportService.getMySummary(),
      ]);

      setCurrentEntry(current);
      setProjects(projectsData);
      setLocations(locationsData);
      setAbsenceRequests(absences);
      setTimeEntries(entries);
      setReport(reportData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      await timeService.clockIn(
        selectedProject || undefined, 
        selectedLocation || undefined
      );
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Einstempeln fehlgeschlagen');
    }
  };

  const handleClockOut = () => {
    setShowPauseModal(true);
  };

  const confirmClockOut = async () => {
    try {
      await timeService.clockOut(pauseMinutes);
      setShowPauseModal(false);
      setPauseMinutes(0);
      setPauseCheckDone(new Set()); // Reset pause checks
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ausstempeln fehlgeschlagen');
    }
  };

  const handleStartPause = async () => {
    try {
      await timeService.startPause();
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Pause starten fehlgeschlagen');
    }
  };

  const handleEndPause = async () => {
    try {
      await timeService.endPause();
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Pause beenden fehlgeschlagen');
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
    <>
      <div>
        <nav className="navbar">
          <h1>Zeiterfassung</h1>
          <div className="navbar-right">
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{currentTime}</span>
            <span>{user?.firstName} {user?.lastName}</span>
            <button className="btn btn-success" onClick={() => setShowPDFReportModal(true)}>
              PDF-Bericht
            </button>
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
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
              <div className={`clock-status ${currentEntry.status === 'ON_PAUSE' ? 'on-pause' : 'clocked-in'}`}>
                <span className="status-indicator"></span>
                <span>
                  {currentEntry.status === 'ON_PAUSE' ? (
                    <>
                      ⏸️ Pause läuft seit {currentEntry.pauseStartedAt ? new Date(currentEntry.pauseStartedAt).toLocaleTimeString('de-DE') : ''}
                      <br />
                      <small style={{ color: '#666' }}>Arbeitszeit: {workDuration}</small>
                    </>
                  ) : (
                    <>
                      Eingestempelt seit {new Date(currentEntry.clockIn).toLocaleString('de-DE')}
                      {currentEntry.project && ` - ${currentEntry.project.name}`}
                      {currentEntry.location && ` (${currentEntry.location.name})`}
                      <br />
                      <small style={{ color: '#666' }}>Arbeitszeit: {workDuration} | Pausen: {currentEntry.pauseMinutes || 0} Min</small>
                    </>
                  )}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {currentEntry.status === 'CLOCKED_IN' && (
                  <>
                    <button className="btn" style={{ background: '#ff9800', color: 'white' }} onClick={handleStartPause}>
                      ⏸️ Pause starten
                    </button>
                    <button className="btn btn-danger" onClick={handleClockOut}>
                      Ausstempeln
                    </button>
                  </>
                )}
                {currentEntry.status === 'ON_PAUSE' && (
                  <button className="btn btn-primary" onClick={handleEndPause}>
                    ▶️ Pause beenden
                  </button>
                )}
              </div>
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
              <div className="form-group">
                <label>Standort (optional)</label>
                <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                  <option value="">Kein Standort</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
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

          <div className="data-table-wrapper">
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
        </div>

        <div className="card">
          <h2>Letzte Zeiteinträge</h2>
          <div className="data-table-wrapper">
            <table className="table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Einstempeln</th>
                <th>Ausstempeln</th>
                <th>Dauer</th>
                <th>Projekt</th>
                <th>Standort</th>
                <th>Beschreibung</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.slice(0, 10).map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.clockIn).toLocaleDateString('de-DE')}</td>
                  <td>
                    {editingEntry === entry.id && entry.clockOut ? (
                      <input
                        type="time"
                        defaultValue={new Date(entry.clockIn).toTimeString().slice(0, 5)}
                        onBlur={async (e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newClockIn = new Date(entry.clockIn);
                          newClockIn.setHours(parseInt(hours), parseInt(minutes));
                          try {
                            await timeService.updateMyTimeEntry(entry.id, {
                              clockIn: newClockIn.toISOString()
                            });
                            await loadData();
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Fehler beim Aktualisieren');
                          }
                        }}
                        style={{ padding: '4px', fontSize: '12px', width: '80px' }}
                      />
                    ) : (
                      new Date(entry.clockIn).toLocaleTimeString('de-DE')
                    )}
                  </td>
                  <td>
                    {editingEntry === entry.id && entry.clockOut ? (
                      <input
                        type="time"
                        defaultValue={new Date(entry.clockOut).toTimeString().slice(0, 5)}
                        onBlur={async (e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newClockOut = new Date(entry.clockOut!);
                          newClockOut.setHours(parseInt(hours), parseInt(minutes));
                          try {
                            await timeService.updateMyTimeEntry(entry.id, {
                              clockOut: newClockOut.toISOString()
                            });
                            await loadData();
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Fehler beim Aktualisieren');
                          }
                        }}
                        style={{ padding: '4px', fontSize: '12px', width: '80px' }}
                      />
                    ) : (
                      entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('de-DE') : '-'
                    )}
                  </td>
                  <td>{entry.clockOut ? formatDuration(entry.clockIn, entry.clockOut) : 'Läuft...'}</td>
                  <td>
                    {editingEntry === entry.id && entry.clockOut ? (
                      <select
                        value={entry.projectId || ''}
                        onChange={async (e) => {
                          try {
                            await timeService.updateMyTimeEntry(entry.id, {
                              projectId: e.target.value || undefined
                            });
                            await loadData();
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Fehler beim Aktualisieren');
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
                    <span>{entry.location?.name || '-'}</span>
                  </td>
                  <td>
                    {editingEntry === entry.id && entry.clockOut ? (
                      <input
                        type="text"
                        defaultValue={entry.description || ''}
                        onBlur={async (e) => {
                          try {
                            await timeService.updateMyTimeEntry(entry.id, {
                              description: e.target.value
                            });
                            await loadData();
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Fehler beim Aktualisieren');
                          }
                        }}
                        placeholder="Beschreibung..."
                        style={{ padding: '4px', fontSize: '12px', width: '100%' }}
                      />
                    ) : (
                      <span>{entry.description || '-'}</span>
                    )}
                  </td>
                  <td>
                    {entry.clockOut && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          className="btn btn-small"
                          onClick={() => setEditingEntry(editingEntry === entry.id ? null : entry.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          {editingEntry === entry.id ? '✓' : '✏️'}
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={async () => {
                            if (window.confirm('Zeiteintrag wirklich löschen?')) {
                              try {
                                await timeService.deleteMyTimeEntry(entry.id);
                                await loadData();
                              } catch (error: any) {
                                alert(error.response?.data?.error || 'Fehler beim Löschen');
                              }
                            }
                          }}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
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

      {showPauseModal && (
        <PauseModal
          onClose={() => {
            setShowPauseModal(false);
            setPauseMinutes(0);
          }}
          onConfirm={confirmClockOut}
          pauseMinutes={pauseMinutes}
          setPauseMinutes={setPauseMinutes}
        />
      )}

      {showPauseReminderModal && (
        <PauseReminderModal
          message={pauseReminderMessage}
          onClose={() => setShowPauseReminderModal(false)}
          onStartPause={handleStartPause}
        />
      )}

      {user && showPDFReportModal && (
        <PDFReportModal
          user={user}
          isOpen={showPDFReportModal}
          onClose={() => setShowPDFReportModal(false)}
          isAdmin={false}
        />
      )}
    </>
  );
};

const PauseReminderModal: React.FC<{
  message: string;
  onClose: () => void;
  onStartPause: () => void;
}> = ({ message, onClose, onStartPause }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <h2>⏰ Pausenzeit!</h2>
        
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
            {message}
          </p>

          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffc107',
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>📋 Gesetzliche Pausenpflicht (Art. 15 ArGV 1):</strong>
            <ul style={{ marginTop: '10px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Ab 5,5 Stunden: mindestens 15 Minuten</li>
              <li>Ab 7 Stunden: mindestens 30 Minuten</li>
              <li>Ab 9 Stunden: mindestens 60 Minuten</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => {
                onStartPause();
                onClose();
              }}
              style={{ flex: '1' }}
            >
              ⏸️ Jetzt Pause machen
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ flex: '1' }}
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PauseModal: React.FC<{
  onClose: () => void;
  onConfirm: () => void;
  pauseMinutes: number;
  setPauseMinutes: (value: number) => void;
}> = ({ onClose, onConfirm, pauseMinutes, setPauseMinutes }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Pausenzeit erfassen</h2>
        
        <div style={{ padding: '0 0 20px 0' }}>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Wie viele Minuten Pause hattest du während deiner Arbeitszeit?
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${pauseMinutes === 0 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPauseMinutes(0)}
              style={{ flex: '1', minWidth: '100px' }}
            >
              Keine Pause
            </button>
            <button
              type="button"
              className={`btn ${pauseMinutes === 15 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPauseMinutes(15)}
              style={{ flex: '1', minWidth: '100px' }}
            >
              15 Min
            </button>
            <button
              type="button"
              className={`btn ${pauseMinutes === 30 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPauseMinutes(30)}
              style={{ flex: '1', minWidth: '100px' }}
            >
              30 Min
            </button>
            <button
              type="button"
              className={`btn ${pauseMinutes === 60 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPauseMinutes(60)}
              style={{ flex: '1', minWidth: '100px' }}
            >
              60 Min
            </button>
          </div>

          <div className="form-group">
            <label>Oder eigene Zeit eingeben (Minuten)</label>
            <input
              type="number"
              min="0"
              max="999"
              value={pauseMinutes}
              onChange={(e) => setPauseMinutes(parseInt(e.target.value) || 0)}
              placeholder="z.B. 45"
            />
          </div>

          <div style={{ 
            background: '#f0f7ff', 
            padding: '15px', 
            borderRadius: '8px', 
            marginTop: '20px',
            fontSize: '14px',
            color: '#333'
          }}>
            <strong>📋 Gesetzliche Pausenzeiten (Art. 15 ArGV 1):</strong>
            <ul style={{ marginTop: '10px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Ab 5,5 Stunden: mindestens 15 Minuten</li>
              <li>Ab 7 Stunden: mindestens 30 Minuten</li>
              <li>Ab 9 Stunden: mindestens 60 Minuten</li>
            </ul>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" onClick={onConfirm}>
              Ausstempeln ({pauseMinutes} Min Pause)
            </button>
          </div>
        </div>
      </div>
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
