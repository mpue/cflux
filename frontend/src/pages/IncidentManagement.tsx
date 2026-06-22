import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../contexts/ModuleContext';
import { incidentService, Incident, IncidentStatistics, CreateIncidentDto, UpdateIncidentDto, IncidentAttachment } from '../services/incident.service';
import { userService } from '../services/user.service';
import { projectService } from '../services/project.service';
import AppNavbar from '../components/AppNavbar';
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
  const { canEdit } = useModules();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statistics, setStatistics] = useState<IncidentStatistics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user can edit incidents
  const isAdmin = user?.role === 'ADMIN';
  const canEditIncidents = isAdmin || canEdit('incidents');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<IncidentAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [formData, setFormData] = useState<CreateIncidentDto>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: '',
    affectedSystem: '',
    assignedToId: '',
    isEHSRelevant: false,
    ehsCategory: '',
    ehsSeverity: '',
    incidentDate: '',
    location: '',
  });

  // Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'CFlux - Incident Management';
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDetailModal) {
          setShowDetailModal(false);
        } else if (showCreateModal) {
          setShowCreateModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showDetailModal, showCreateModal]);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterPriority, filterProject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incidentsData, statsData, usersData, projectsData] = await Promise.all([
        incidentService.getAll(filterStatus, filterPriority, undefined, filterProject),
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
        isEHSRelevant: false,
        ehsCategory: '',
        ehsSeverity: '',
        incidentDate: '',
        location: '',
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
      loadAttachments(incident.id);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident details');
    }
  };

  const handleExportPdf = async (incident: Incident, download = false) => {
    try {
      await incidentService.exportPDF(incident.id, { download });
    } catch (err: any) {
      setError(err.message || 'PDF-Report konnte nicht erstellt werden');
    }
  };

  const handleExportSummary = async (download = false) => {
    try {
      await incidentService.exportSummaryPDF(
        {
          status: filterStatus || undefined,
          priority: filterPriority || undefined,
          projectId: filterProject || undefined,
        },
        { download }
      );
    } catch (err: any) {
      setError(err.message || 'Gesamtbericht konnte nicht erstellt werden');
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

  const loadAttachments = async (incidentId: string) => {
    try {
      const data = await incidentService.getAttachments(incidentId);
      setAttachments(data);
    } catch (err: any) {
      console.error('Failed to load attachments:', err);
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedIncident || !e.target.files?.length) return;
    const file = e.target.files[0];
    try {
      setUploadingAttachment(true);
      await incidentService.uploadAttachment(selectedIncident.id, file);
      await loadAttachments(selectedIncident.id);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Hochladen');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedIncident || !window.confirm('Anhang wirklich löschen?')) return;
    try {
      await incidentService.deleteAttachment(attachmentId);
      await loadAttachments(selectedIncident.id);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageMimeType = (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Make the row semi-transparent while dragging
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.4';
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reordered = [...incidents];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setIncidents(reordered);
    setDraggedIndex(null);

    try {
      await incidentService.reorder(reordered.map((i) => i.id));
    } catch (err: any) {
      setError(err.message || 'Fehler beim Neuordnen');
      loadData(); // Revert on error
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
    <>
      <AppNavbar title="Incident Management" />
      <div className="incident-management" style={{ paddingTop: '20px' }}>
      <div className="incident-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1>Incident Management</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleExportSummary(false)}
            className="btn-primary"
            title="Gesamtbericht (alle Vorfälle) im Browser ansehen"
          >
            📊 Gesamtbericht
          </button>
          <button
            onClick={() => handleExportSummary(true)}
            className="btn-secondary"
            title="Gesamtbericht als PDF herunterladen"
          >
            ⬇ PDF
          </button>
          <button
            onClick={() => incidentService.exportCSV(filterStatus, filterPriority, filterProject)}
            className="btn-secondary"
            title="Incidents als CSV exportieren"
          >
            CSV Export
          </button>
          {canEditIncidents && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Neuer Vorfall
            </button>
          )}
        </div>
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

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="filter-select"
        >
          <option value="">Alle Projekte</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Incidents Table */}
      <div className="incidents-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
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
            {incidents.map((incident, index) => (
              <tr
                key={incident.id}
                draggable={canEditIncidents}
                onDoubleClick={() => handleViewDetails(incident)}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={dragOverIndex === index ? 'drag-over' : ''}
                style={{ cursor: canEditIncidents ? 'grab' : 'pointer' }}
              >
                <td><code>{incident.incidentNumber || incident.id.substring(0, 8)}</code></td>
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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleViewDetails(incident)}
                      className="btn-small"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleExportPdf(incident, true)}
                      className="btn-small"
                      title="Vorfallbericht als PDF herunterladen"
                    >
                      ⬇ PDF
                    </button>
                  </div>
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

              {/* EHS Section */}
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isEHSRelevant || false}
                    onChange={(e) => setFormData({ ...formData, isEHSRelevant: e.target.checked })}
                  />
                  EHS-relevant (für EHS-Dashboard)
                </label>
              </div>
              {formData.isEHSRelevant && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>EHS-Kategorie *</label>
                      <select
                        value={formData.ehsCategory || ''}
                        onChange={(e) => setFormData({ ...formData, ehsCategory: e.target.value })}
                        required
                      >
                        <option value="">-- Kategorie wählen --</option>
                        <option value="SAFETY_OBSERVATION">Sicherheitsbeobachtung</option>
                        <option value="UNSAFE_CONDITION">Unsicherer Zustand</option>
                        <option value="UNSAFE_BEHAVIOR">Unsicheres Verhalten</option>
                        <option value="NEAR_MISS">Beinahe-Unfall</option>
                        <option value="FIRST_AID">Erste Hilfe</option>
                        <option value="RECORDABLE">Meldepflichtiger Unfall</option>
                        <option value="LTI">LTI (Lost Time Injury)</option>
                        <option value="FATALITY">Tödlicher Unfall</option>
                        <option value="PROPERTY_DAMAGE">Sachschaden</option>
                        <option value="ENVIRONMENT">Umweltvorfall</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Schweregrad</label>
                      <select
                        value={formData.ehsSeverity || ''}
                        onChange={(e) => setFormData({ ...formData, ehsSeverity: e.target.value })}
                      >
                        <option value="">-- Schweregrad wählen --</option>
                        <option value="LOW">Niedrig</option>
                        <option value="MEDIUM">Mittel</option>
                        <option value="HIGH">Hoch</option>
                        <option value="CRITICAL">Kritisch</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Vorfalldatum</label>
                      <input
                        type="date"
                        value={formData.incidentDate || ''}
                        onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ort des Vorfalls</label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="z.B. Baustelle A, Lager 3"
                      />
                    </div>
                  </div>
                </>
              )}

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleExportPdf(selectedIncident, false)}
                  className="btn-secondary"
                  title="Vorfallbericht im Browser ansehen"
                >
                  📄 Ansehen
                </button>
                <button
                  onClick={() => handleExportPdf(selectedIncident, true)}
                  className="btn-secondary"
                  title="Vorfallbericht als PDF herunterladen"
                >
                  ⬇ Download
                </button>
                <button onClick={() => setShowDetailModal(false)}>✕</button>
              </div>
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
                        disabled={!canEditIncidents}
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
                        disabled={!canEditIncidents}
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
                        disabled={!canEditIncidents}
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
                        disabled={!canEditIncidents}
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

                {/* EHS Section in Detail */}
                <div className="detail-section">
                  <h3>EHS (Arbeitssicherheit)</h3>
                  <div className="detail-grid">
                    <div>
                      <strong>EHS-relevant:</strong>{' '}
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedIncident.isEHSRelevant || false}
                          onChange={(e) =>
                            handleUpdateIncident(selectedIncident.id, { isEHSRelevant: e.target.checked } as any)
                          }
                          disabled={!canEditIncidents}
                        />
                        Ja
                      </label>
                    </div>
                    {selectedIncident.isEHSRelevant && (
                      <>
                        <div>
                          <strong>EHS-Kategorie:</strong>
                          <select
                            value={(selectedIncident as any).ehsCategory || ''}
                            onChange={(e) =>
                              handleUpdateIncident(selectedIncident.id, { ehsCategory: e.target.value } as any)
                            }
                            className="inline-select"
                            disabled={!canEditIncidents}
                          >
                            <option value="">-- Keine --</option>
                            <option value="SAFETY_OBSERVATION">Sicherheitsbeobachtung</option>
                            <option value="UNSAFE_CONDITION">Unsicherer Zustand</option>
                            <option value="UNSAFE_BEHAVIOR">Unsicheres Verhalten</option>
                            <option value="NEAR_MISS">Beinahe-Unfall</option>
                            <option value="FIRST_AID">Erste Hilfe</option>
                            <option value="RECORDABLE">Meldepflichtiger Unfall</option>
                            <option value="LTI">LTI (Lost Time Injury)</option>
                            <option value="FATALITY">Tödlicher Unfall</option>
                            <option value="PROPERTY_DAMAGE">Sachschaden</option>
                            <option value="ENVIRONMENT">Umweltvorfall</option>
                          </select>
                        </div>
                        <div>
                          <strong>Schweregrad:</strong>
                          <select
                            value={(selectedIncident as any).ehsSeverity || ''}
                            onChange={(e) =>
                              handleUpdateIncident(selectedIncident.id, { ehsSeverity: e.target.value } as any)
                            }
                            className="inline-select"
                            disabled={!canEditIncidents}
                          >
                            <option value="">-- Keine --</option>
                            <option value="LOW">Niedrig</option>
                            <option value="MEDIUM">Mittel</option>
                            <option value="HIGH">Hoch</option>
                            <option value="CRITICAL">Kritisch</option>
                          </select>
                        </div>
                        <div>
                          <strong>Ort:</strong> {(selectedIncident as any).location || '-'}
                        </div>
                        <div>
                          <strong>Vorfalldatum:</strong>{' '}
                          {(selectedIncident as any).incidentDate
                            ? new Date((selectedIncident as any).incidentDate).toLocaleDateString('de-CH')
                            : '-'}
                        </div>
                      </>
                    )}
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

                {/* Attachments Section */}
                <div className="detail-section">
                  <h3>Anhänge</h3>
                  {attachments.length > 0 ? (
                    <div className="attachments-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attachments.map((att) => (
                        <div key={att.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 12px',
                          border: '1px solid var(--border-color, #e5e7eb)',
                          borderRadius: '6px',
                          background: 'var(--bg-secondary, #f9fafb)',
                        }}>
                          {isImageMimeType(att.mimeType) ? (
                            <img
                              src={`${incidentService.getAttachmentDownloadUrl(att.id)}?token=${localStorage.getItem('token')}`}
                              alt={att.originalFilename}
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '24px' }}>📄</span>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <a
                              href={`${incidentService.getAttachmentDownloadUrl(att.id)}?token=${localStorage.getItem('token')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontWeight: 500, wordBreak: 'break-all' }}
                            >
                              {att.originalFilename}
                            </a>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {formatFileSize(att.fileSize)} · {att.uploadedBy ? `${att.uploadedBy.firstName} ${att.uploadedBy.lastName}` : ''} · {new Date(att.createdAt).toLocaleString('de-CH')}
                            </div>
                          </div>
                          {canEditIncidents && (
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="btn-small"
                              style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}
                              title="Anhang löschen"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Keine Anhänge</p>
                  )}
                  {canEditIncidents && (
                    <div style={{ marginTop: '10px' }}>
                      <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                        {uploadingAttachment ? 'Wird hochgeladen...' : 'Datei anhängen'}
                        <input
                          type="file"
                          onChange={handleUploadAttachment}
                          style={{ display: 'none' }}
                          disabled={uploadingAttachment}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Kommentare</h3>
                  <div className="comments-list">
                    {selectedIncident.comments && selectedIncident.comments.length > 0 ? (
                      selectedIncident.comments.map((comment) => (
                        <div key={comment.id} className="comment">
                          <div className="comment-header">
                            <strong>{comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unbekannt'}</strong>
                            <small>{new Date(comment.createdAt).toLocaleString('de-CH')}</small>
                          </div>
                          <p>{comment.comment}</p>
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
                      disabled={!canEditIncidents}
                    />
                    <button 
                      onClick={handleAddComment} 
                      className="btn-primary"
                      disabled={!canEditIncidents}
                    >
                      Kommentar hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              {canEditIncidents && selectedIncident.status !== 'RESOLVED' && selectedIncident.status !== 'CLOSED' && (
                <button
                  onClick={() => handleUpdateIncident(selectedIncident.id, { status: 'RESOLVED' })}
                  className="btn-primary"
                  style={{ marginRight: 'auto' }}
                >
                  ✓ Als gelöst markieren
                </button>
              )}
              {canEditIncidents && (
                <button
                  onClick={() => handleDeleteIncident(selectedIncident.id)}
                  className="btn-danger"
                >
                  Löschen
                </button>
              )}
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default IncidentManagement;
