import React from 'react';
import WidgetHeader from './WidgetHeader';
import { TimeEntry, Project, Location } from '../../types';
import './DashboardWidgets.css';

interface TimeTrackingWidgetProps {
  currentEntry: TimeEntry | null;
  projects: Project[];
  locations: Location[];
  selectedProject: string;
  selectedLocation: string;
  currentTime: string;
  workDuration: string;
  onProjectChange: (projectId: string) => void;
  onLocationChange: (locationId: string) => void;
  onClockIn: () => void;
  onClockOut: () => void;
  onStartPause: () => void;
  onEndPause: () => void;
  onRemove?: () => void;
}

const TimeTrackingWidget: React.FC<TimeTrackingWidgetProps> = ({
  currentEntry,
  projects,
  locations,
  selectedProject,
  selectedLocation,
  currentTime,
  workDuration,
  onProjectChange,
  onLocationChange,
  onClockIn,
  onClockOut,
  onStartPause,
  onEndPause,
  onRemove,
}) => {
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
            <button className="btn btn-success" onClick={onClockIn}>
              Einstempeln
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTrackingWidget;
