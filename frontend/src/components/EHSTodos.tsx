import React, { useState, useEffect } from 'react';
import api, { getBackendURL } from '../services/api';
import CameraCapture from './CameraCapture';
import './EHSTodos.css';

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

interface Incident {
  id: string;
  title: string;
}

interface EHSTodo {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  completedAt?: string;
  projectId?: string;
  incidentId?: string;
  assignedToId?: string;
  createdById: string;
  category?: string;
  tags: string[];
  progressPercent: number;
  notes?: string;
  attachmentUrls: string[];
  createdAt: string;
  updatedAt: string;
  project?: Project;
  incident?: Incident;
  assignedTo?: User;
  createdBy?: User;
}

interface TodoStatistics {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  overdue: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

const EHSTodos: React.FC = () => {
  const [todos, setTodos] = useState<EHSTodo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<EHSTodo[]>([]);
  const [statistics, setStatistics] = useState<TodoStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<EHSTodo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'OPEN',
    dueDate: '',
    projectId: '',
    incidentId: '',
    assignedToId: '',
    category: '',
    tags: [] as string[],
    progressPercent: 0,
    notes: '',
    attachmentUrls: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [todos, filterStatus, filterPriority, filterProject, filterAssignedTo, filterCategory, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [todosRes, statsRes, projectsRes, incidentsRes, usersRes] = await Promise.all([
        api.get('/ehs-todos'),
        api.get('/ehs-todos/stats/overview'),
        api.get('/projects'),
        api.get('/incidents'),
        api.get('/users')
      ]);
      setTodos(todosRes.data);
      setStatistics(statsRes.data);
      setProjects(projectsRes.data);
      setIncidents(incidentsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...todos];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }
    if (filterProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === filterProject);
    }
    if (filterAssignedTo !== 'all') {
      filtered = filtered.filter(t => t.assignedToId === filterAssignedTo);
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    setFilteredTodos(filtered);
  };

  const handleCreate = () => {
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'OPEN',
      dueDate: '',
      projectId: '',
      incidentId: '',
      assignedToId: '',
      category: '',
      tags: [],
      progressPercent: 0,
      notes: '',
      attachmentUrls: []
    });
    setShowModal(true);
  };

  const handleEdit = (todo: EHSTodo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      status: todo.status,
      dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
      projectId: todo.projectId || '',
      incidentId: todo.incidentId || '',
      assignedToId: todo.assignedToId || '',
      category: todo.category || '',
      tags: todo.tags,
      progressPercent: todo.progressPercent,
      notes: todo.notes || '',
      attachmentUrls: todo.attachmentUrls
    });
    setShowModal(true);
  };

  const handleCameraCapture = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const fileUrl = response.data.url;
      setFormData(prev => ({
        ...prev,
        attachmentUrls: [...prev.attachmentUrls, fileUrl]
      }));

      setShowCamera(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Fehler beim Hochladen des Fotos');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachmentUrls: prev.attachmentUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        projectId: formData.projectId || null,
        incidentId: formData.incidentId || null,
        assignedToId: formData.assignedToId || null,
        dueDate: formData.dueDate || null
      };

      if (editingTodo) {
        await api.put(`/ehs-todos/${editingTodo.id}`, payload);
      } else {
        await api.post('/ehs-todos', payload);
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving todo:', error);
      alert('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Todo wirklich löschen?')) return;

    try {
      await api.delete(`/ehs-todos/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Fehler beim Löschen');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/ehs-todos/${id}/status`, { status });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const handleProgressChange = async (id: string, progressPercent: number) => {
    try {
      await api.patch(`/ehs-todos/${id}/progress`, { progressPercent });
      loadData();
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Fehler beim Aktualisieren des Fortschritts');
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'badge-urgent';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return '';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'badge-completed';
      case 'IN_PROGRESS': return 'badge-in-progress';
      case 'OPEN': return 'badge-open';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-CH');
  };

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate || status === 'COMPLETED' || status === 'CANCELLED') return false;
    return new Date(dueDate) < new Date();
  };

  const categories = Array.from(new Set(todos.map(t => t.category).filter(Boolean))) as string[];

  return (
    <div className="ehs-todos-container">
      <div className="ehs-todos-header">
        <h1>EHS Todos</h1>
        <button className="btn-primary" onClick={handleCreate}>
          + Neues Todo
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="statistics-grid">
          <div className="stat-card">
            <h3>Gesamt</h3>
            <div className="stat-value">{statistics.total}</div>
          </div>
          <div className="stat-card">
            <h3>Offen</h3>
            <div className="stat-value">{statistics.byStatus.open}</div>
          </div>
          <div className="stat-card">
            <h3>In Bearbeitung</h3>
            <div className="stat-value">{statistics.byStatus.inProgress}</div>
          </div>
          <div className="stat-card">
            <h3>Abgeschlossen</h3>
            <div className="stat-value">{statistics.byStatus.completed}</div>
          </div>
          <div className="stat-card stat-card-warning">
            <h3>Überfällig</h3>
            <div className="stat-value">{statistics.overdue}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Alle Status</option>
          <option value="OPEN">Offen</option>
          <option value="IN_PROGRESS">In Bearbeitung</option>
          <option value="COMPLETED">Abgeschlossen</option>
          <option value="CANCELLED">Abgebrochen</option>
        </select>

        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="all">Alle Prioritäten</option>
          <option value="URGENT">Dringend</option>
          <option value="HIGH">Hoch</option>
          <option value="MEDIUM">Mittel</option>
          <option value="LOW">Niedrig</option>
        </select>

        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="all">Alle Projekte</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select value={filterAssignedTo} onChange={(e) => setFilterAssignedTo(e.target.value)}>
          <option value="all">Alle Zugewiesen</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
          ))}
        </select>

        {categories.length > 0 && (
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">Alle Kategorien</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Todos List */}
      <div className="todos-list">
        {loading ? (
          <div className="loading">Lädt...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="no-todos">Keine Todos gefunden</div>
        ) : (
          filteredTodos.map(todo => (
            <div key={todo.id} className={`todo-card ${isOverdue(todo.dueDate, todo.status) ? 'todo-overdue' : ''}`}>
              <div className="todo-header">
                <div className="todo-title-section">
                  <h3>{todo.title}</h3>
                  <div className="todo-badges">
                    <span className={`badge ${getStatusBadgeClass(todo.status)}`}>
                      {todo.status}
                    </span>
                    <span className={`badge ${getPriorityBadgeClass(todo.priority)}`}>
                      {todo.priority}
                    </span>
                    {todo.category && <span className="badge badge-category">{todo.category}</span>}
                  </div>
                </div>
                <div className="todo-actions">
                  <button onClick={() => handleEdit(todo)} className="btn-icon">✏️</button>
                  <button onClick={() => handleDelete(todo.id)} className="btn-icon">🗑️</button>
                </div>
              </div>

              {todo.description && (
                <p className="todo-description">{todo.description}</p>
              )}

              <div className="todo-meta">
                {todo.project && <span>📁 {todo.project.name}</span>}
                {todo.incident && <span>⚠️ {todo.incident.title}</span>}
                {todo.assignedTo && (
                  <span>👤 {todo.assignedTo.firstName} {todo.assignedTo.lastName}</span>
                )}
                {todo.dueDate && (
                  <span className={isOverdue(todo.dueDate, todo.status) ? 'overdue-date' : ''}>
                    📅 {formatDate(todo.dueDate)}
                  </span>
                )}
              </div>

              <div className="todo-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${todo.progressPercent}%` }}
                  />
                </div>
                <span className="progress-text">{todo.progressPercent}%</span>
              </div>

              <div className="todo-controls">
                <select
                  value={todo.status}
                  onChange={(e) => handleStatusChange(todo.id, e.target.value)}
                  className="status-select"
                >
                  <option value="OPEN">Offen</option>
                  <option value="IN_PROGRESS">In Bearbeitung</option>
                  <option value="COMPLETED">Abgeschlossen</option>
                  <option value="CANCELLED">Abgebrochen</option>
                </select>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={todo.progressPercent}
                  onChange={(e) => handleProgressChange(todo.id, parseInt(e.target.value))}
                  className="progress-slider"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTodo ? 'Todo bearbeiten' : 'Neues Todo erstellen'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Titel *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priorität</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">Niedrig</option>
                    <option value="MEDIUM">Mittel</option>
                    <option value="HIGH">Hoch</option>
                    <option value="URGENT">Dringend</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="OPEN">Offen</option>
                    <option value="IN_PROGRESS">In Bearbeitung</option>
                    <option value="COMPLETED">Abgeschlossen</option>
                    <option value="CANCELLED">Abgebrochen</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fälligkeitsdatum</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Kategorie</label>
                  <input
                    type="text"
                    placeholder="z.B. Training, Inspection"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Projekt</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  >
                    <option value="">Kein Projekt</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Vorfall</label>
                  <select
                    value={formData.incidentId}
                    onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                  >
                    <option value="">Kein Vorfall</option>
                    {incidents.map(i => (
                      <option key={i.id} value={i.id}>{i.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Zugewiesen an</label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                >
                  <option value="">Nicht zugewiesen</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Fortschritt (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progressPercent}
                  onChange={(e) => setFormData({ ...formData, progressPercent: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Notizen</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Fotos / Anhänge</label>
                <div className="attachments-section">
                  <button 
                    type="button" 
                    className="btn-camera" 
                    onClick={() => setShowCamera(true)}
                    disabled={uploadingPhoto}
                  >
                    📷 {uploadingPhoto ? 'Lädt...' : 'Foto aufnehmen'}
                  </button>
                  
                  {formData.attachmentUrls.length > 0 && (
                    <div className="attachments-list">
                      {formData.attachmentUrls.map((url, index) => (
                        <div key={index} className="attachment-item">
                          <img 
                            src={url.startsWith('http') ? url : `${getBackendURL()}${url}`} 
                            alt={`Attachment ${index + 1}`}
                            className="attachment-thumbnail"
                          />
                          <button
                            type="button"
                            className="btn-remove-attachment"
                            onClick={() => removeAttachment(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Speichert...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default EHSTodos;
