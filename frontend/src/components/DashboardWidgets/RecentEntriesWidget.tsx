import React, { useState, useEffect } from 'react';
import WidgetHeader from './WidgetHeader';
import { TimeEntry, Project, Story } from '../../types';
import { ProjectTimeAllocation } from '../../services/projectTimeAllocation.service';
import './DashboardWidgets.css';

interface RecentEntriesWidgetProps {
  timeEntries: TimeEntry[];
  editingEntry: string | null;
  existingAllocations: ProjectTimeAllocation[];
  projects: Project[];
  onEditToggle: (entryId: string) => void;
  onUpdateEntry: (entryId: string, field: string, value: any) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onOpenAllocation: (entry: TimeEntry) => void;
  onLoadStories: (projectId: string) => Promise<Story[]>;
  formatDuration: (clockIn: string, clockOut: string) => string;
  onRemove?: () => void;
}

const RecentEntriesWidget: React.FC<RecentEntriesWidgetProps> = ({
  timeEntries,
  editingEntry,
  existingAllocations,
  projects,
  onEditToggle,
  onUpdateEntry,
  onDeleteEntry,
  onOpenAllocation,
  onLoadStories,
  formatDuration,
  onRemove,
}) => {
  const [storiesMap, setStoriesMap] = useState<Record<string, Story[]>>({});

  // Load stories when entering edit mode for an entry with a project
  useEffect(() => {
    if (editingEntry) {
      const entry = timeEntries.find(e => e.id === editingEntry);
      if (entry?.projectId && !storiesMap[entry.projectId]) {
        onLoadStories(entry.projectId).then(stories => {
          setStoriesMap(prev => ({ ...prev, [entry.projectId!]: stories }));
        });
      }
    }
  }, [editingEntry, timeEntries, onLoadStories, storiesMap]);

  const handleProjectChange = async (entryId: string, projectId: string) => {
    // Load stories for the new project
    if (projectId && !storiesMap[projectId]) {
      const stories = await onLoadStories(projectId);
      setStoriesMap(prev => ({ ...prev, [projectId]: stories }));
    }
    // Update project and clear story
    await onUpdateEntry(entryId, 'projectId', projectId || null);
    await onUpdateEntry(entryId, 'storyId', null);
  };

  return (
    <div className="dashboard-widget">
      <WidgetHeader title="Letzte Zeiteinträge" icon="📊" onRemove={onRemove} />
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
                <th>Projekt / Story</th>
                <th>Standort</th>
                <th>Beschreibung</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.slice(0, 10).map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {editingEntry === entry.id && entry.clockOut ? (
                      <input
                        type="date"
                        defaultValue={new Date(entry.clockIn).toISOString().slice(0, 10)}
                        onBlur={async (e) => {
                          const newDate = new Date(e.target.value);
                          if (isNaN(newDate.getTime())) return;
                          const oldClockIn = new Date(entry.clockIn);
                          const newClockIn = new Date(entry.clockIn);
                          newClockIn.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
                          await onUpdateEntry(entry.id, 'clockIn', newClockIn.toISOString());
                          if (entry.clockOut) {
                            const newClockOut = new Date(entry.clockOut);
                            // Shift clockOut by the same day difference
                            const dayDiff = newDate.getTime() - new Date(oldClockIn.getFullYear(), oldClockIn.getMonth(), oldClockIn.getDate()).getTime();
                            const oldClockOutDate = new Date(new Date(entry.clockOut).getFullYear(), new Date(entry.clockOut).getMonth(), new Date(entry.clockOut).getDate());
                            newClockOut.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
                            // If clockOut was on a different day than clockIn (e.g. night shift), preserve that offset
                            const originalDayOffset = oldClockOutDate.getTime() - new Date(oldClockIn.getFullYear(), oldClockIn.getMonth(), oldClockIn.getDate()).getTime();
                            if (originalDayOffset > 0) {
                              const shiftedDate = new Date(newDate.getTime() + originalDayOffset);
                              newClockOut.setFullYear(shiftedDate.getFullYear(), shiftedDate.getMonth(), shiftedDate.getDate());
                            }
                            await onUpdateEntry(entry.id, 'clockOut', newClockOut.toISOString());
                          }
                        }}
                        style={{ padding: '4px', fontSize: '12px', width: '130px' }}
                      />
                    ) : (
                      new Date(entry.clockIn).toLocaleDateString('de-DE')
                    )}
                  </td>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <input
                          type="date"
                          defaultValue={new Date(entry.clockOut).toISOString().slice(0, 10)}
                          onBlur={async (e) => {
                            const newDate = new Date(e.target.value);
                            if (isNaN(newDate.getTime())) return;
                            const newClockOut = new Date(entry.clockOut!);
                            newClockOut.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
                            await onUpdateEntry(entry.id, 'clockOut', newClockOut.toISOString());
                          }}
                          style={{ padding: '4px', fontSize: '12px', width: '130px' }}
                        />
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
                      </div>
                    ) : (
                      entry.clockOut ? (
                        <span>
                          {new Date(entry.clockOut).toLocaleDateString('de-DE') !== new Date(entry.clockIn).toLocaleDateString('de-DE') && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {new Date(entry.clockOut).toLocaleDateString('de-DE')}{' '}
                            </span>
                          )}
                          {new Date(entry.clockOut).toLocaleTimeString('de-DE')}
                        </span>
                      ) : '-'
                    )}
                  </td>
                  <td>{entry.clockOut ? formatDuration(entry.clockIn, entry.clockOut) : 'Läuft...'}</td>
                  <td>
                    {editingEntry === entry.id && entry.clockOut ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <select
                          value={entry.projectId || ''}
                          onChange={(e) => handleProjectChange(entry.id, e.target.value)}
                          style={{ padding: '4px', fontSize: '12px', width: '100%' }}
                        >
                          <option value="">-- Kein Projekt --</option>
                          {projects.filter(p => p.isActive).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        {entry.projectId && (storiesMap[entry.projectId] || []).length > 0 && (
                          <select
                            value={entry.storyId || ''}
                            onChange={(e) => onUpdateEntry(entry.id, 'storyId', e.target.value || null)}
                            style={{ padding: '4px', fontSize: '12px', width: '100%' }}
                          >
                            <option value="">-- Keine Story --</option>
                            {(storiesMap[entry.projectId] || []).filter(s => s.isActive).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <>
                        <span>{entry.project?.name || '-'}</span>
                        {entry.story && (
                          <span style={{
                            display: 'inline-block',
                            marginLeft: '6px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: entry.story.color || '#e0e0e0',
                            color: '#fff',
                          }}>
                            {entry.story.name}
                          </span>
                        )}
                      </>
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
