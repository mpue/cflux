import React, { useState, useEffect } from 'react';
import { User, Project } from '../../types';
import { userService } from '../../services/user.service';
import { projectService } from '../../services/project.service';
import { timeService } from '../../services/time.service';

interface Allocation {
  id?: string;
  projectId: string;
  projectName: string;
  hours: number;
  description?: string;
}

interface SollIstEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  pauseMinutes: number;
  stampedHours: number;
  bookedHours: number;
  difference: number;
  projectId: string | null;
  projectName: string | null;
  storyId: string | null;
  storyName: string | null;
  description: string | null;
  employee: { id: string; firstName: string; lastName: string; email: string };
  allocations: Allocation[];
}

const SollIstVergleichTab: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<SollIstEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editEntry, setEditEntry] = useState<SollIstEntry | null>(null);

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, []);

  const loadUsers = async () => {
    const data = await userService.getAllUsersAdmin();
    data.sort((a: User, b: User) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    setUsers(data);
  };

  const loadProjects = async () => {
    const data = await projectService.getAllProjects();
    setProjects(data);
  };

  const loadComparison = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const data = await timeService.getSollIstComparison(userId, startDate, end.toISOString());
      setEntries(data);
    } catch (error) {
      console.error('Error loading comparison:', error);
      alert('Fehler beim Laden des Soll-Ist Vergleichs');
    }
    setLoading(false);
  };

  const getBarColor = (diff: number): string => {
    if (Math.abs(diff) < 0.1) return '#4caf50'; // green - ok
    if (diff > 0) return '#ff9800'; // orange - more stamped than booked
    return '#f44336'; // red - less stamped than booked
  };

  const getBarWidth = (stamped: number, booked: number): { stampedPct: number; bookedPct: number } => {
    const max = Math.max(stamped, booked, 0.01);
    return {
      stampedPct: (stamped / max) * 100,
      bookedPct: (booked / max) * 100,
    };
  };

  const totalStamped = entries.reduce((sum, e) => sum + e.stampedHours, 0);
  const totalBooked = entries.reduce((sum, e) => sum + e.bookedHours, 0);
  const totalDiff = parseFloat((totalStamped - totalBooked).toFixed(2));

  return (
    <div>
      <h3 style={{ marginBottom: '16px' }}>Soll-Ist Vergleich: Gestempelt vs. Projektbuchungen</h3>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        Vergleich zwischen gestempelter Arbeitszeit und der auf Projekte gebuchten Zeit.
        Doppelklick auf einen Eintrag zum Bearbeiten.
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <label>Benutzer</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Bitte wählen...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label>Von</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label>Bis</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button
          className="btn btn-primary"
          onClick={loadComparison}
          disabled={!userId || loading}
          style={{ height: '40px' }}
        >
          {loading ? 'Lädt...' : 'Laden'}
        </button>
      </div>

      {entries.length > 0 && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <SummaryCard label="Gestempelte Stunden" value={totalStamped.toFixed(2)} unit="h" color="#2196f3" />
            <SummaryCard label="Gebuchte Stunden" value={totalBooked.toFixed(2)} unit="h" color="#9c27b0" />
            <SummaryCard
              label="Differenz"
              value={(totalDiff > 0 ? '+' : '') + totalDiff.toFixed(2)}
              unit="h"
              color={getBarColor(totalDiff)}
            />
            <SummaryCard label="Einträge" value={String(entries.length)} unit="" color="#607d8b" />
          </div>

          <table className="table" style={{ marginTop: '8px' }}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Einstempeln</th>
                <th>Ausstempeln</th>
                <th>Pause</th>
                <th style={{ textAlign: 'right' }}>Gestempelt (h)</th>
                <th style={{ textAlign: 'right' }}>Gebucht (h)</th>
                <th style={{ textAlign: 'right' }}>Differenz (h)</th>
                <th style={{ width: '220px' }}>Vergleich</th>
                <th>Projekt</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const { stampedPct, bookedPct } = getBarWidth(entry.stampedHours, entry.bookedHours);
                const barColor = getBarColor(entry.difference);
                return (
                  <tr
                    key={entry.id}
                    onDoubleClick={() => setEditEntry(entry)}
                    style={{ cursor: 'pointer' }}
                    title="Doppelklick zum Bearbeiten"
                  >
                    <td>{new Date(entry.date).toLocaleDateString('de-DE')}</td>
                    <td>{new Date(entry.clockIn).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{entry.pauseMinutes || 0} min</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{entry.stampedHours.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{entry.bookedHours.toFixed(2)}</td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: barColor
                    }}>
                      {(entry.difference > 0 ? '+' : '') + entry.difference.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', width: '14px', color: '#2196f3' }}>S</span>
                          <div style={{
                            flex: 1, height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${stampedPct}%`, height: '100%', backgroundColor: '#2196f3',
                              borderRadius: '5px', transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', width: '14px', color: '#9c27b0' }}>B</span>
                          <div style={{
                            flex: 1, height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${bookedPct}%`, height: '100%', backgroundColor: '#9c27b0',
                              borderRadius: '5px', transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{entry.projectName || '-'}</span>
                      {entry.storyName && (
                        <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>{entry.storyName}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
                <td colSpan={4}>Gesamt</td>
                <td style={{ textAlign: 'right' }}>{totalStamped.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{totalBooked.toFixed(2)}</td>
                <td style={{ textAlign: 'right', color: getBarColor(totalDiff) }}>
                  {(totalDiff > 0 ? '+' : '') + totalDiff.toFixed(2)}
                </td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </>
      )}

      {entries.length === 0 && userId && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Keine abgeschlossenen Zeiteinträge im gewählten Zeitraum gefunden.
        </div>
      )}

      {editEntry && (
        <SollIstEditDialog
          entry={editEntry}
          projects={projects}
          onClose={() => setEditEntry(null)}
          onSave={async () => {
            setEditEntry(null);
            await loadComparison();
          }}
        />
      )}
    </div>
  );
};

// Summary Card
const SummaryCard: React.FC<{ label: string; value: string; unit: string; color: string }> = ({ label, value, unit, color }) => (
  <div style={{
    flex: '1 1 160px',
    padding: '16px 20px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    borderLeft: `4px solid ${color}`,
    minWidth: '160px'
  }}>
    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '24px', fontWeight: 700, color }}>
      {value}<span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '2px' }}>{unit}</span>
    </div>
  </div>
);

// Edit Dialog
const SollIstEditDialog: React.FC<{
  entry: SollIstEntry;
  projects: Project[];
  onClose: () => void;
  onSave: () => Promise<void>;
}> = ({ entry, projects, onClose, onSave }) => {
  const [clockIn, setClockIn] = useState(new Date(entry.clockIn).toISOString().slice(0, 16));
  const [clockOut, setClockOut] = useState(entry.clockOut ? new Date(entry.clockOut).toISOString().slice(0, 16) : '');
  const [pauseMinutes, setPauseMinutes] = useState(entry.pauseMinutes || 0);
  const [allocations, setAllocations] = useState<{ projectId: string; hours: number; description: string }[]>(
    entry.allocations.length > 0
      ? entry.allocations.map(a => ({ projectId: a.projectId, hours: a.hours, description: a.description || '' }))
      : [{ projectId: entry.projectId || '', hours: entry.stampedHours, description: '' }]
  );
  const [saving, setSaving] = useState(false);

  const calcStamped = (): number => {
    if (!clockIn || !clockOut) return 0;
    const diff = (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / (1000 * 60);
    return parseFloat(((diff - pauseMinutes) / 60).toFixed(2));
  };

  const stamped = calcStamped();
  const totalBooked = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);
  const diff = parseFloat((stamped - totalBooked).toFixed(2));

  const addAllocation = () => {
    setAllocations([...allocations, { projectId: '', hours: 0, description: '' }]);
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, field: string, value: any) => {
    const updated = [...allocations];
    (updated[index] as any)[field] = value;
    setAllocations(updated);
  };

  const handleSave = async () => {
    const validAllocations = allocations.filter(a => a.projectId && a.hours > 0);
    setSaving(true);
    try {
      await timeService.updateTimeAllocations(entry.id, {
        clockIn,
        clockOut: clockOut || undefined,
        pauseMinutes,
        allocations: validAllocations,
      });
      await onSave();
    } catch (error) {
      alert('Fehler beim Speichern');
    }
    setSaving(false);
  };

  const barColor = Math.abs(diff) < 0.1 ? '#4caf50' : diff > 0 ? '#ff9800' : '#f44336';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%' }}>
        <h2>Zeiteintrag & Projektbuchungen bearbeiten</h2>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
          {new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Stamped time section */}
        <div style={{
          padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#2196f3' }}>Gestempelte Zeit</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
              <label>Einstempeln</label>
              <input
                type="datetime-local"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
              <label>Ausstempeln</label>
              <input
                type="datetime-local"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ minWidth: '120px' }}>
              <label>Pause (min)</label>
              <input
                type="number"
                min="0"
                value={pauseMinutes}
                onChange={(e) => setPauseMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px' }}>
            Netto-Arbeitszeit: <strong style={{ color: '#2196f3' }}>{stamped.toFixed(2)} h</strong>
          </div>
        </div>

        {/* Allocations section */}
        <div style={{
          padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#9c27b0' }}>Projektbuchungen</h4>
            <button className="btn btn-success" onClick={addAllocation} style={{ padding: '4px 12px', fontSize: '13px' }}>
              + Buchung
            </button>
          </div>

          {allocations.map((alloc, idx) => (
            <div key={idx} style={{
              display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-end', flexWrap: 'wrap'
            }}>
              <div className="form-group" style={{ flex: 2, minWidth: '180px', marginBottom: 0 }}>
                {idx === 0 && <label>Projekt</label>}
                <select
                  value={alloc.projectId}
                  onChange={(e) => updateAllocation(idx, 'projectId', e.target.value)}
                >
                  <option value="">Projekt wählen...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
                {idx === 0 && <label>Stunden</label>}
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={alloc.hours}
                  onChange={(e) => updateAllocation(idx, 'hours', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                {idx === 0 && <label>Beschreibung</label>}
                <input
                  type="text"
                  value={alloc.description}
                  onChange={(e) => updateAllocation(idx, 'description', e.target.value)}
                  placeholder="Tätigkeit..."
                />
              </div>
              <button
                className="btn btn-danger"
                onClick={() => removeAllocation(idx)}
                style={{ padding: '6px 10px', fontSize: '12px', height: '36px' }}
                disabled={allocations.length <= 1}
              >
                ×
              </button>
            </div>
          ))}

          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            Gebuchte Stunden: <strong style={{ color: '#9c27b0' }}>{totalBooked.toFixed(2)} h</strong>
          </div>
        </div>

        {/* Difference visualization */}
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          backgroundColor: barColor + '15', borderLeft: `4px solid ${barColor}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Differenz</span>
            <span style={{ fontWeight: 700, fontSize: '18px', color: barColor }}>
              {(diff > 0 ? '+' : '') + diff.toFixed(2)} h
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#2196f3', width: '60px' }}>Gestempelt</span>
              <div style={{ flex: 1, height: '14px', backgroundColor: '#e0e0e0', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{
                  width: `${stamped > 0 && Math.max(stamped, totalBooked) > 0 ? (stamped / Math.max(stamped, totalBooked)) * 100 : 0}%`,
                  height: '100%', backgroundColor: '#2196f3', borderRadius: '7px', transition: 'width 0.3s'
                }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, width: '50px', textAlign: 'right' }}>{stamped.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#9c27b0', width: '60px' }}>Gebucht</span>
              <div style={{ flex: 1, height: '14px', backgroundColor: '#e0e0e0', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{
                  width: `${totalBooked > 0 && Math.max(stamped, totalBooked) > 0 ? (totalBooked / Math.max(stamped, totalBooked)) * 100 : 0}%`,
                  height: '100%', backgroundColor: '#9c27b0', borderRadius: '7px', transition: 'width 0.3s'
                }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, width: '50px', textAlign: 'right' }}>{totalBooked.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
            {Math.abs(diff) < 0.1
              ? '✓ Zeiten stimmen überein'
              : diff > 0
                ? `⚠ ${diff.toFixed(2)}h gestempelt, aber nicht auf Projekte gebucht`
                : `⚠ ${Math.abs(diff).toFixed(2)}h mehr auf Projekte gebucht als gestempelt`}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SollIstVergleichTab;
