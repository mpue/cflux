import React from 'react';
import WidgetHeader from './WidgetHeader';
import { TimeEntry } from '../../types';
import { ProjectTimeAllocation } from '../../services/projectTimeAllocation.service';
import './DashboardWidgets.css';

interface RecentEntriesWidgetProps {
  timeEntries: TimeEntry[];
  editingEntry: string | null;
  existingAllocations: ProjectTimeAllocation[];
  onEditToggle: (entryId: string) => void;
  onUpdateEntry: (entryId: string, field: string, value: any) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onOpenAllocation: (entry: TimeEntry) => void;
  formatDuration: (clockIn: string, clockOut: string) => string;
}

const RecentEntriesWidget: React.FC<RecentEntriesWidgetProps> = ({
  timeEntries,
  editingEntry,
  existingAllocations,
  onEditToggle,
  onUpdateEntry,
  onDeleteEntry,
  onOpenAllocation,
  formatDuration,
}) => {
  return (
    <div className="dashboard-widget">
      <WidgetHeader title="Letzte Zeiteinträge" icon="📊" />
      <div className="widget-content">
        <p className="hint-text">
          💡 Tipp: Nutzen Sie den 📊 Button, um Ihre Arbeitszeit auf verschiedene Projekte aufzuteilen. Mit dem ✏️ Button können Sie Zeiten nachträglich anpassen.
        </p>
        <div className="data-table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Einstempeln</th>
                <th>Ausstempeln</th>
                <th>Dauer</th>
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
                          await onUpdateEntry(entry.id, 'clockIn', newClockIn.toISOString());
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
                          await onUpdateEntry(entry.id, 'clockOut', newClockOut.toISOString());
                        }}
                        style={{ padding: '4px', fontSize: '12px', width: '80px' }}
                      />
                    ) : (
                      entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('de-DE') : '-'
                    )}
                  </td>
                  <td>{entry.clockOut ? formatDuration(entry.clockIn, entry.clockOut) : 'Läuft...'}</td>
                  <td>
                    <span>{entry.location?.name || '-'}</span>
                  </td>
                  <td>
                    {editingEntry === entry.id && entry.clockOut ? (
                      <input
                        type="text"
                        defaultValue={entry.description || ''}
                        onBlur={async (e) => {
                          await onUpdateEntry(entry.id, 'description', e.target.value);
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
                          onClick={() => onOpenAllocation(entry)}
                          style={{ 
                            fontSize: '12px', 
                            padding: '4px 8px',
                            background: existingAllocations.some(a => a.timeEntryId === entry.id) ? '#28a745' : '#007bff',
                            color: 'white'
                          }}
                          title="Zeit auf Projekte aufteilen"
                        >
                          📊
                        </button>
                        <button
                          className="btn btn-small"
                          onClick={() => onEditToggle(entry.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          {editingEntry === entry.id ? '✓' : '✏️'}
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={async () => {
                            if (window.confirm('Zeiteintrag wirklich löschen?')) {
                              await onDeleteEntry(entry.id);
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
  );
};

export default RecentEntriesWidget;
