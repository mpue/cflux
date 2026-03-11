import React, { useState, useEffect, useCallback } from 'react';
import {
  scheduledTaskService,
  ScheduledTask,
  ScheduledTaskExecution,
} from '../../services/scheduledTask.service';

const ScheduledTasksTab: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [executions, setExecutions] = useState<ScheduledTaskExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [editingCron, setEditingCron] = useState<string | null>(null);
  const [cronValue, setCronValue] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduledTaskService.getTasks();
      setTasks(data);
    } catch (err) {
      setError('Fehler beim Laden der geplanten Aufgaben');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const loadExecutions = async (taskId: string) => {
    try {
      const data = await scheduledTaskService.getTaskExecutions(taskId, 20);
      setExecutions(data);
    } catch (err) {
      console.error('Failed to load executions:', err);
    }
  };

  const handleSelectTask = async (task: ScheduledTask) => {
    setSelectedTask(task);
    await loadExecutions(task.id);
  };

  const handleToggleStatus = async (task: ScheduledTask) => {
    try {
      const newStatus = task.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await scheduledTaskService.updateTask(task.id, { status: newStatus });
      await loadTasks();
      if (selectedTask?.id === task.id) {
        const updated = await scheduledTaskService.getTask(task.id);
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  const handleTrigger = async (taskId: string) => {
    try {
      setTriggering(taskId);
      await scheduledTaskService.triggerTask(taskId);
      await loadTasks();
      if (selectedTask?.id === taskId) {
        const updated = await scheduledTaskService.getTask(taskId);
        setSelectedTask(updated);
        await loadExecutions(taskId);
      }
    } catch (err) {
      console.error('Failed to trigger task:', err);
    } finally {
      setTriggering(null);
    }
  };

  const handleSaveCron = async (taskId: string) => {
    try {
      await scheduledTaskService.updateTask(taskId, { cronExpression: cronValue });
      setEditingCron(null);
      await loadTasks();
      if (selectedTask?.id === taskId) {
        const updated = await scheduledTaskService.getTask(taskId);
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error('Failed to update cron:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      ACTIVE: { bg: '#e8f5e9', text: '#2e7d32' },
      PAUSED: { bg: '#fff3e0', text: '#e65100' },
      COMPLETED: { bg: '#e3f2fd', text: '#1565c0' },
      FAILED: { bg: '#ffebee', text: '#c62828' },
    };
    const c = colors[status] || { bg: '#f5f5f5', text: '#666' };
    return (
      <span
        style={{
          padding: '2px 10px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: c.bg,
          color: c.text,
        }}
      >
        {status}
      </span>
    );
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span style={{ color: '#2e7d32' }} className="material-icons" title="Erfolgreich">check_circle</span>;
      case 'FAILED':
        return <span style={{ color: '#c62828' }} className="material-icons" title="Fehlgeschlagen">error</span>;
      case 'RUNNING':
        return <span style={{ color: '#1565c0' }} className="material-icons" title="Läuft">pending</span>;
      default:
        return <span className="material-icons">help</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('de-CH');
  };

  const describeCron = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;
    const [min, hour, , , dow] = parts;
    const days = dow === '*' ? 'Täglich' : dow === '1-5' ? 'Mo–Fr' : dow === '0,6' ? 'Sa–So' : `Wochentage: ${dow}`;
    return `${days} um ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
  };

  const taskTypeLabels: Record<string, string> = {
    AUTO_CLOCK_OUT: 'Automatisches Ausstempeln',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="loading-spinner" />
        <span style={{ marginLeft: 12 }}>Lade geplante Aufgaben...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <span className="material-icons" style={{ fontSize: 32, marginRight: 12, color: '#1976d2' }}>
          schedule_send
        </span>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Geplante Aufgaben</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            Automatisierte Aufgaben und Cron-Jobs verwalten
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 8, backgroundColor: '#ffebee', color: '#c62828' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedTask ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Task-Liste */}
        <div>
          <div style={{ backgroundColor: 'var(--card-bg, #fff)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e0e0e0)', fontWeight: 600, fontSize: 16 }}>
              <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 8 }}>list</span>
              Aufgaben ({tasks.length})
            </div>
            {tasks.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                Keine geplanten Aufgaben konfiguriert.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleSelectTask(task)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color, #f0f0f0)',
                    cursor: 'pointer',
                    backgroundColor: selectedTask?.id === task.id ? 'var(--hover-bg, #f5f5f5)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTask?.id !== task.id) e.currentTarget.style.backgroundColor = 'var(--hover-bg, #fafafa)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTask?.id !== task.id) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-icons" style={{ fontSize: 20, color: task.status === 'ACTIVE' ? '#2e7d32' : '#999' }}>
                        {task.isSystemTask ? 'settings' : 'schedule'}
                      </span>
                      <strong>{task.name}</strong>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginLeft: 28 }}>
                    {taskTypeLabels[task.taskType] || task.taskType} · {describeCron(task.cronExpression)}
                  </div>
                  {task.lastRunAt && (
                    <div style={{ fontSize: 12, color: '#999', marginLeft: 28, marginTop: 2 }}>
                      Letzter Lauf: {formatDate(task.lastRunAt)}
                      {task.lastRunStatus && ` — ${task.lastRunStatus}`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail-Panel */}
        {selectedTask && (
          <div>
            <div style={{ backgroundColor: 'var(--card-bg, #fff)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e0e0e0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{selectedTask.name}</h2>
                  <span style={{ fontSize: 13, color: '#666' }}>
                    {taskTypeLabels[selectedTask.taskType] || selectedTask.taskType}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div style={{ padding: 20 }}>
                {selectedTask.description && (
                  <p style={{ margin: '0 0 16px 0', color: '#555', fontSize: 14 }}>{selectedTask.description}</p>
                )}

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-secondary, #f9f9f9)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                    {getStatusBadge(selectedTask.status)}
                  </div>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-secondary, #f9f9f9)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Ausführungen</div>
                    <strong>{selectedTask.runCount}</strong>
                  </div>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-secondary, #f9f9f9)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Zeitplan</div>
                    {editingCron === selectedTask.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          value={cronValue}
                          onChange={(e) => setCronValue(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', fontSize: 13, borderRadius: 4, border: '1px solid #ccc' }}
                          placeholder="z.B. 0 18 * * 1-5"
                        />
                        <button
                          onClick={() => handleSaveCron(selectedTask.id)}
                          style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: 4, border: '1px solid #1976d2', backgroundColor: '#1976d2', color: '#fff', fontSize: 12 }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingCron(null)}
                          style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', backgroundColor: '#fff', fontSize: 12 }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong>{describeCron(selectedTask.cronExpression)}</strong>
                        <button
                          onClick={() => {
                            setEditingCron(selectedTask.id);
                            setCronValue(selectedTask.cronExpression);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Zeitplan bearbeiten"
                        >
                          <span className="material-icons" style={{ fontSize: 16, color: '#999' }}>edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-secondary, #f9f9f9)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Letzter Lauf</div>
                    <span style={{ fontSize: 13 }}>{formatDate(selectedTask.lastRunAt)}</span>
                  </div>
                </div>

                {selectedTask.lastRunMessage && (
                  <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: selectedTask.lastRunStatus === 'FAILED' ? '#ffebee' : '#e8f5e9', fontSize: 13 }}>
                    <strong>Letzte Meldung:</strong> {selectedTask.lastRunMessage}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <button
                    onClick={() => handleToggleStatus(selectedTask)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: selectedTask.status === 'ACTIVE' ? '#fff3e0' : '#e8f5e9',
                      color: selectedTask.status === 'ACTIVE' ? '#e65100' : '#2e7d32',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: 18 }}>
                      {selectedTask.status === 'ACTIVE' ? 'pause' : 'play_arrow'}
                    </span>
                    {selectedTask.status === 'ACTIVE' ? 'Pausieren' : 'Aktivieren'}
                  </button>
                  <button
                    onClick={() => handleTrigger(selectedTask.id)}
                    disabled={triggering === selectedTask.id}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: triggering === selectedTask.id ? 'not-allowed' : 'pointer',
                      backgroundColor: '#e3f2fd',
                      color: '#1565c0',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      opacity: triggering === selectedTask.id ? 0.6 : 1,
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: 18 }}>
                      {triggering === selectedTask.id ? 'hourglass_empty' : 'play_circle'}
                    </span>
                    {triggering === selectedTask.id ? 'Wird ausgeführt...' : 'Jetzt ausführen'}
                  </button>
                </div>

                {/* Execution History */}
                <div>
                  <h3 style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-icons" style={{ fontSize: 18 }}>history</span>
                    Ausführungsverlauf
                  </h3>
                  {executions.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>
                      Noch keine Ausführungen.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color, #e0e0e0)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Gestartet</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Dauer</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Betroffen</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Meldung</th>
                          </tr>
                        </thead>
                        <tbody>
                          {executions.map((exec) => {
                            const duration =
                              exec.completedAt && exec.startedAt
                                ? Math.round(
                                    (new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000
                                  )
                                : null;
                            return (
                              <tr key={exec.id} style={{ borderBottom: '1px solid var(--border-color, #f0f0f0)' }}>
                                <td style={{ padding: '8px 12px' }}>{getExecutionStatusIcon(exec.status)}</td>
                                <td style={{ padding: '8px 12px' }}>{formatDate(exec.startedAt)}</td>
                                <td style={{ padding: '8px 12px' }}>{duration !== null ? `${duration}s` : '—'}</td>
                                <td style={{ padding: '8px 12px' }}>{exec.affectedCount}</td>
                                <td style={{ padding: '8px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exec.message || ''}>
                                  {exec.message || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledTasksTab;
