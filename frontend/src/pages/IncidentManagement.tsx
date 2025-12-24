import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { incidentService, Incident, IncidentStatistics, CreateIncidentDto, UpdateIncidentDto } from '../services/incident.service';
import { userService } from '../services/user.service';
import { projectService } from '../services/project.service';
import '../styles/IncidentManagement.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
}

const IncidentManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statistics, setStatistics] = useState<IncidentStatistics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [newComment, setNewComment] = useState('');

  const [formData, setFormData] = useState<CreateIncidentDto>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: '',
    affectedSystem: '',
    assignedToId: '',
  });

  useEffect(() => {
    loadData();
  }, [filterStatus, filterPriority]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incidentsData, statsData, usersData, projectsData] = await Promise.all([
        incidentService.getAll(filterStatus, filterPriority),
        incidentService.getStatistics(),
        userService.getAllUsers(),
        projectService.getAllProjects(),
      ]);
      setIncidents(incidentsData);
      setStatistics(statsData);
      setUsers(usersData);
      setProjects(projectsData);
      console.log('Users loaded:', usersData.length);
      console.log('Projects loaded:', projectsData.length);
      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await incidentService.create(formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        category: '',
        affectedSystem: '',
        assignedToId: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create incident');
    }
  };

  const handleUpdateIncident = async (id: string, data: UpdateIncidentDto) => {
    try {
      await incidentService.update(id, data);
      loadData();
      if (selectedIncident?.id === id) {
        const updated = await incidentService.getById(id);
        setSelectedIncident(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update incident');
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!window.confirm('Möchten Sie diesen Vorfall wirklich löschen?')) {
      return;
    }
    try {
      await incidentService.delete(id);
      setShowDetailModal(false);
      setSelectedIncident(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete incident');
    }
  };

  const handleViewDetails = async (incident: Incident) => {
    try {
      const fullIncident = await incidentService.getById(incident.id);
      setSelectedIncident(fullIncident);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident details');
    }
  };

  const handleAddComment = async () => {
    if (!selectedIncident || !newComment.trim()) return;
    try {
      await incidentService.addComment(selectedIncident.id, newComment);
      setNewComment('');
      const updated = await incidentService.getById(selectedIncident.id);
      setSelectedIncident(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#dc2626';
      case 'IN_PROGRESS': return '#2563eb';
      case 'RESOLVED': return '#16a34a';
      case 'CLOSED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'Kritisch';
      case 'HIGH': return 'Hoch';
      case 'MEDIUM': return 'Mittel';
      case 'LOW': return 'Niedrig';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Offen';
      case 'IN_PROGRESS': return 'In Bearbeitung';
      case 'RESOLVED': return 'Gelöst';
      case 'CLOSED': return 'Geschlossen';
      default: return status;
    }
  };

  if (loading) {
    return <div className="incident-loading">Laden...</div>;
  }

  return (
    <div className="incident-management">
      <div className="incident-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/')} className="btn-secondary" title="Zurück zur Hauptseite">
            ← Zurück
          </button>
          <h1>Incident Management</h1>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          Neuer Vorfall
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="incident-statistics">
          <div className="stat-card">
            <h3>Gesamt</h3>
            <p className="stat-value">{statistics.total}</p>
          </div>
          <div className="stat-card">
            <h3>Offen</h3>
            <p className="stat-value" style={{ color: '#dc2626' }}>{statistics.open}</p>
          </div>
          <div className="stat-card">
            <h3>In Bearbeitung</h3>
            <p className="stat-value" style={{ color: '#2563eb' }}>{statistics.inProgress}</p>
          </div>
          <div className="stat-card">
            <h3>Gelöst</h3>
            <p className="stat-value" style={{ color: '#16a34a' }}>{statistics.resolved}</p>
          </div>
          <div className="stat-card">
            <h3>Kritisch</h3>
            <p className="stat-value" style={{ color: '#dc2626' }}>{statistics.critical}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="incident-filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Alle Status</option>
          <option value="OPEN">Offen</option>
          <option value="IN_PROGRESS">In Bearbeitung</option>
          <option value="RESOLVED">Gelöst</option>
          <option value="CLOSED">Geschlossen</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="filter-select"
        >
          <option value="">Alle Prioritäten</option>
          <option value="CRITICAL">Kritisch</option>
          <option value="HIGH">Hoch</option>
          <option value="MEDIUM">Mittel</option>
          <option value="LOW">Niedrig</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div className="incidents-table">
        <table>
          <thead>
            <tr>
              <th>Titel</th>
              <th>Priorität</th>
              <th>Status</th>
              <th>Kategorie</th>
              <th>Projekt</th>
              <th>Zugewiesen an</th>
              <th>Gemeldet am</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td>
                  <strong>{incident.title}</strong>
                  <br />
                  <small>{incident.description.substring(0, 50)}...</small>
                </td>
                <td>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(incident.priority) }}
                  >
                    {getPriorityLabel(incident.priority)}
                  </span>
                </td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(incident.status) }}
                  >
                    {getStatusLabel(incident.status)}
                  </span>
                </td>
                <td>{incident.category || '-'}</td>
                <td>{incident.project?.name || '-'}</td>
                <td>
                  {incident.assignedTo
                    ? `${incident.assignedTo.firstName} ${incident.assignedTo.lastName}`
                    : '-'}
                </td>
                <td>{new Date(incident.reportedAt).toLocaleString('de-CH')}</td>
                <td>
                  <button
                    onClick={() => handleViewDetails(incident)}
                    className="btn-small"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Neuer Vorfall</h2>
              <button onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateIncident}>
              <div className="form-group">
                <label>Titel *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Beschreibung *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priorität</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <option value="LOW">Niedrig</option>
                    <option value="MEDIUM">Mittel</option>
                    <option value="HIGH">Hoch</option>
                    <option value="CRITICAL">Kritisch</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Kategorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="z.B. IT, HR, Facility"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Betroffenes System</label>
                <input
                  type="text"
                  value={formData.affectedSystem}
                  onChange={(e) => setFormData({ ...formData, affectedSystem: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Zuweisen an</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  >
                    <option value="">-- Nicht zugewiesen --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Projekt</label>
                  <select
                    value={formData.projectId || ''}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  >
                    <option value="">-- Kein Projekt --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary">
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedIncident && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>{selectedIncident.title}</h2>
              <button onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="incident-details">
                <div className="detail-section">
                  <h3>Details</h3>
                  <div className="detail-grid">
                    <div>
                      <strong>Status:</strong>
                      <select
                        value={selectedIncident.status}
                        onChange={(e) =>
                          handleUpdateIncident(selectedIncident.id, { status: e.target.value as any })
                        }
                        className="inline-select"
                      >
                        <option value="OPEN">Offen</option>
                        <option value="IN_PROGRESS">In Bearbeitung</option>
                        <option value="RESOLVED">Gelöst</option>
                        <option value="CLOSED">Geschlossen</option>
                      </select>
                    </div>
                    <div>
                      <strong>Priorität:</strong>
                      <select
                        value={selectedIncident.priority}
                        onChange={(e) =>
                          handleUpdateIncident(selectedIncident.id, { priority: e.target.value as any })
                        }
                        className="inline-select"
                      >
                        <option value="LOW">Niedrig</option>
                        <option value="MEDIUM">Mittel</option>
                        <option value="HIGH">Hoch</option>
                        <option value="CRITICAL">Kritisch</option>
                      </select>
                    </div>
                    <div>
                      <strong>Kategorie:</strong> {selectedIncident.category || '-'}
                    </div>
                    <div>
                      <strong>Betroffenes System:</strong> {selectedIncident.affectedSystem || '-'}
                    </div>
                    <div>
                      <strong>Gemeldet von:</strong>{' '}
                      {selectedIncident.reportedBy
                        ? `${selectedIncident.reportedBy.firstName} ${selectedIncident.reportedBy.lastName}`
                        : '-'}
                    </div>
                    <div>
                      <strong>Zugewiesen an:</strong>
                      <select
                        value={selectedIncident.assignedToId || ''}
                        onChange={(e) =>
                          handleUpdateIncident(selectedIncident.id, { assignedToId: e.target.value })
                        }
                        className="inline-select"
                      >
                        <option value="">-- Nicht zugewiesen --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <strong>Projekt:</strong>
                      <select
                        value={selectedIncident.projectId || ''}
                        onChange={(e) =>
                          handleUpdateIncident(selectedIncident.id, { projectId: e.target.value })
                        }
                        className="inline-select"
                      >
                        <option value="">-- Kein Projekt --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Beschreibung</h3>
                  <p>{selectedIncident.description}</p>
                </div>

                {selectedIncident.solution && (
                  <div className="detail-section">
                    <h3>Lösung</h3>
                    <p>{selectedIncident.solution}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h3>Kommentare</h3>
                  <div className="comments-list">
                    {selectedIncident.comments && selectedIncident.comments.length > 0 ? (
                      selectedIncident.comments.map((comment) => (
                        <div key={comment.id} className="comment">
                          <p>{comment.comment}</p>
                          <small>{new Date(comment.createdAt).toLocaleString('de-CH')}</small>
                        </div>
                      ))
                    ) : (
                      <p>Keine Kommentare</p>
                    )}
                  </div>
                  <div className="add-comment">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Kommentar hinzufügen..."
                      rows={3}
                    />
                    <button onClick={handleAddComment} className="btn-primary">
                      Kommentar hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              {selectedIncident.status !== 'RESOLVED' && selectedIncident.status !== 'CLOSED' && (
                <button
                  onClick={() => handleUpdateIncident(selectedIncident.id, { status: 'RESOLVED' })}
                  className="btn-primary"
                  style={{ marginRight: 'auto' }}
                >
                  ✓ Als gelöst markieren
                </button>
              )}
              <button
                onClick={() => handleDeleteIncident(selectedIncident.id)}
                className="btn-danger"
              >
                Löschen
              </button>
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
