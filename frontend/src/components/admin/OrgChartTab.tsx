import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';

// ---- Types ----

interface OrgUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  supervisorId: string | null;
  jobFunction?: {
    id: string;
    title: string;
    department?: string;
  };
  employeeProfile?: {
    id: string;
    position?: string;
    department?: string;
    departmentId?: string;
    departmentRef?: {
      id: string;
      name: string;
    };
  };
}

interface OrgDepartment {
  id: string;
  name: string;
  description?: string;
}

interface DragData {
  userId: string;
  type: 'employee';
}

// ---- Component ----

const OrgChartTab: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/org-chart');
      setUsers(response.data.users);
      setDepartments(response.data.departments);
      // Expand all departments by default
      setExpandedDepts(new Set(response.data.departments.map((d: OrgDepartment) => d.id)));
    } catch (error) {
      console.error('Failed to load org chart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Data helpers ---

  const getDepartmentForUser = (user: OrgUser): OrgDepartment | null => {
    const deptId = user.employeeProfile?.departmentId;
    if (deptId) {
      return departments.find(d => d.id === deptId) || null;
    }
    return null;
  };

  const getUsersByDepartment = (deptId: string) =>
    users.filter(u => u.employeeProfile?.departmentId === deptId);

  const getUnassignedUsers = () =>
    users.filter(u => !u.employeeProfile?.departmentId);

  const getSubordinates = (userId: string) =>
    users.filter(u => u.supervisorId === userId);

  const getTopLevelUsers = (deptUsers: OrgUser[]) =>
    deptUsers.filter(u => {
      if (!u.supervisorId) return true;
      // Top-level if supervisor is not in same department
      const supervisor = users.find(s => s.id === u.supervisorId);
      if (!supervisor) return true;
      return supervisor.employeeProfile?.departmentId !== u.employeeProfile?.departmentId;
    });

  // --- Drag & Drop ---

  const handleDragStart = (e: React.DragEvent, userId: string) => {
    const data: DragData = { userId, type: 'employee' };
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDropOnUser = async (e: React.DragEvent, targetUserId: string) => {
    e.preventDefault();
    setDragOverTarget(null);

    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type !== 'employee' || data.userId === targetUserId) return;

      // Prevent circular: can't drop a user onto their own subordinate
      const isDescendant = (parentId: string, childId: string): boolean => {
        const subs = users.filter(u => u.supervisorId === parentId);
        return subs.some(s => s.id === childId || isDescendant(s.id, childId));
      };
      if (isDescendant(data.userId, targetUserId)) {
        alert('Kann nicht einem eigenen Untergebenen zugewiesen werden (zirkuläre Referenz).');
        return;
      }

      setSaving(true);
      // Set supervisor
      await api.put(`/users/${data.userId}`, { supervisorId: targetUserId });
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to update supervisor:', error);
      alert('Fehler beim Aktualisieren des Vorgesetzten');
    } finally {
      setSaving(false);
    }
  };

  const handleDropOnDepartment = async (e: React.DragEvent, deptId: string) => {
    e.preventDefault();
    setDragOverTarget(null);

    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type !== 'employee') return;

      const user = users.find(u => u.id === data.userId);
      if (!user) return;

      // Already in this department?
      if (user.employeeProfile?.departmentId === deptId) return;

      setSaving(true);
      const employeeId = user.employeeProfile?.id;
      if (employeeId) {
        // Move to new department
        await api.post(`/departments/${deptId}/employees`, { employeeId });
      }
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to move to department:', error);
      alert('Fehler beim Verschieben in die Abteilung');
    } finally {
      setSaving(false);
    }
  };

  const handleDropOnUnassigned = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);

    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type !== 'employee') return;

      const user = users.find(u => u.id === data.userId);
      if (!user || !user.employeeProfile?.departmentId) return;

      setSaving(true);
      const employeeId = user.employeeProfile?.id;
      const deptId = user.employeeProfile?.departmentId;
      if (employeeId && deptId) {
        await api.delete(`/departments/${deptId}/employees/${employeeId}`);
      }
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove from department:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSupervisor = async (userId: string) => {
    setSaving(true);
    try {
      await api.put(`/users/${userId}`, { supervisorId: null });
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove supervisor:', error);
    } finally {
      setSaving(false);
    }
  };

  // --- Pan & Zoom ---

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // --- Render helpers ---

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleUser = (id: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderUserCard = (user: OrgUser, depth: number = 0) => {
    const subs = getSubordinates(user.id);
    const hasSubs = subs.length > 0;
    const isExpanded = expandedUsers.has(user.id);
    const isDragOver = dragOverTarget === `user-${user.id}`;
    const position = user.employeeProfile?.position || user.jobFunction?.title || '';

    return (
      <div key={user.id} style={{ marginLeft: depth > 0 ? 24 : 0 }}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, user.id)}
          onDragOver={(e) => handleDragOver(e, `user-${user.id}`)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDropOnUser(e, user.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            margin: '4px 0',
            borderRadius: '8px',
            border: isDragOver ? '2px dashed #007bff' : '1px solid var(--border-color, #dee2e6)',
            background: isDragOver
              ? 'rgba(0, 123, 255, 0.08)'
              : user.role === 'ADMIN'
                ? 'linear-gradient(135deg, rgba(255,193,7,0.08), rgba(255,193,7,0.02))'
                : 'var(--card-bg, #fff)',
            cursor: 'grab',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            position: 'relative',
          }}
        >
          {/* Connector line */}
          {depth > 0 && (
            <div style={{
              position: 'absolute',
              left: -16,
              top: '50%',
              width: 12,
              height: 1,
              background: '#ccc',
            }} />
          )}

          {/* Expand/collapse for subordinates */}
          {hasSubs ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleUser(user.id); }}
              style={{
                width: 20, height: 20, border: 'none', borderRadius: '50%',
                background: '#e9ecef', cursor: 'pointer', fontSize: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div style={{ width: 20, flexShrink: 0 }} />
          )}

          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: user.role === 'ADMIN' ? '#ffc107' : '#007bff',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '13px', flexShrink: 0,
          }}>
            {user.firstName[0]}{user.lastName[0]}
          </div>

          {/* Name & info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {position || user.email}
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
            {user.role === 'ADMIN' && (
              <span style={{ fontSize: '9px', background: '#ffc107', color: '#000', padding: '2px 5px', borderRadius: 3, fontWeight: 600 }}>
                ADMIN
              </span>
            )}
            {hasSubs && (
              <span style={{ fontSize: '9px', background: '#17a2b8', color: '#fff', padding: '2px 5px', borderRadius: 3 }}>
                {subs.length}
              </span>
            )}
            {user.supervisorId && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveSupervisor(user.id); }}
                title="Vorgesetzten entfernen"
                style={{
                  width: 18, height: 18, border: 'none', borderRadius: '50%',
                  background: '#dc3545', color: '#fff', cursor: 'pointer',
                  fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Subordinates */}
        {hasSubs && isExpanded && (
          <div style={{ borderLeft: '2px solid #dee2e6', marginLeft: 18, paddingLeft: 6 }}>
            {subs.map(sub => renderUserCard(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Lade Organigramm...</div>;
  }

  const unassigned = getUnassignedUsers();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Organigramm</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#888' }}>
            {users.length} Mitarbeiter · {departments.length} Abteilungen
          </span>
          <button className="btn btn-sm btn-secondary" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
          <span style={{ fontSize: '12px', minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>−</button>
          <button className="btn btn-sm btn-secondary" onClick={resetView}>⟲ Reset</button>
          <button className="btn btn-sm btn-primary" onClick={loadData} disabled={saving}>↻ Aktualisieren</button>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '10px 14px', marginBottom: '16px', borderRadius: '6px',
        background: 'var(--card-bg, #f8f9fa)', border: '1px solid var(--border-color, #dee2e6)',
        fontSize: '12px', color: '#666',
      }}>
        <strong>Bedienung:</strong> Mitarbeiter per Drag & Drop auf einen anderen Mitarbeiter ziehen = Vorgesetzten zuweisen.
        Auf eine Abteilung ziehen = Abteilung wechseln. Alt+Maus = Verschieben · Strg/⌘+Scroll = Zoom
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          overflow: 'hidden',
          border: '1px solid var(--border-color, #dee2e6)',
          borderRadius: '8px',
          background: 'var(--bg-secondary, #fafafa)',
          minHeight: '60vh',
          cursor: isPanning ? 'grabbing' : 'default',
          position: 'relative',
        }}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          alignItems: 'flex-start',
        }}>
          {/* Department columns */}
          {departments.map(dept => {
            const deptUsers = getUsersByDepartment(dept.id);
            const topLevel = getTopLevelUsers(deptUsers);
            const isExpanded = expandedDepts.has(dept.id);
            const isDragOver = dragOverTarget === `dept-${dept.id}`;

            return (
              <div
                key={dept.id}
                onDragOver={(e) => handleDragOver(e, `dept-${dept.id}`)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropOnDepartment(e, dept.id)}
                style={{
                  minWidth: 300,
                  maxWidth: 420,
                  flex: '1 1 300px',
                  borderRadius: '10px',
                  border: isDragOver ? '2px dashed #28a745' : '1px solid var(--border-color, #dee2e6)',
                  background: isDragOver ? 'rgba(40,167,69,0.06)' : 'var(--card-bg, #fff)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'border 0.15s',
                }}
              >
                {/* Department header */}
                <div
                  onClick={() => toggleDept(dept.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 16px', cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid var(--border-color, #dee2e6)' : 'none',
                    borderRadius: isExpanded ? '10px 10px 0 0' : '10px',
                    background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🏢</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{dept.name}</div>
                    {dept.description && (
                      <div style={{ fontSize: '11px', color: '#888' }}>{dept.description}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px', background: '#e3f2fd', color: '#1976d2',
                    padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                  }}>
                    {deptUsers.length}
                  </span>
                  <span style={{ fontSize: '10px' }}>{isExpanded ? '▼' : '▶'}</span>
                </div>

                {/* Department employees */}
                {isExpanded && (
                  <div style={{ padding: '8px 12px', minHeight: 40 }}>
                    {topLevel.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#aaa', fontSize: '12px', fontStyle: 'italic' }}>
                        Keine Mitarbeiter zugeordnet – hierher ziehen
                      </div>
                    ) : (
                      topLevel.map(u => renderUserCard(u))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned */}
          <div
            onDragOver={(e) => handleDragOver(e, 'unassigned')}
            onDragLeave={handleDragLeave}
            onDrop={handleDropOnUnassigned}
            style={{
              minWidth: 300,
              maxWidth: 420,
              flex: '1 1 300px',
              borderRadius: '10px',
              border: dragOverTarget === 'unassigned' ? '2px dashed #dc3545' : '1px dashed #ccc',
              background: dragOverTarget === 'unassigned' ? 'rgba(220,53,69,0.06)' : 'var(--card-bg, #fff)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color, #dee2e6)',
              borderRadius: '10px 10px 0 0',
              background: 'linear-gradient(135deg, #fff3cd, #ffeeba)',
            }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Ohne Abteilung</div>
              </div>
              <span style={{
                fontSize: '11px', background: '#fff3cd', color: '#856404',
                padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
              }}>
                {unassigned.length}
              </span>
            </div>
            <div style={{ padding: '8px 12px', minHeight: 40 }}>
              {unassigned.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#aaa', fontSize: '12px', fontStyle: 'italic' }}>
                  Alle Mitarbeiter sind zugeordnet
                </div>
              ) : (
                unassigned
                  .filter(u => !u.supervisorId || !users.some(s => s.id === u.supervisorId && !s.employeeProfile?.departmentId))
                  .map(u => renderUserCard(u))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgChartTab;
