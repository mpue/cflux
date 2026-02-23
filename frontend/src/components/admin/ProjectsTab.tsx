import React, { useState, useEffect } from 'react';
import { Project, User, Customer, Story } from '../../types';
import { projectService } from '../../services/project.service';
import { userService } from '../../services/user.service';
import { getAllCustomers } from '../../services/customerService';
import { storyService } from '../../services/story.service';
import { BaseModal } from '../common/BaseModal';

interface ProjectsTabProps {
  projects: Project[];
  onUpdate: () => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ projects, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningProject, setAssigningProject] = useState<Project | null>(null);
  const [showStoriesModal, setShowStoriesModal] = useState(false);
  const [storiesProject, setStoriesProject] = useState<Project | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Projektverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingProject(null);
            setShowModal(true);
          }}
        >
          Neues Projekt
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Zugewiesene Benutzer</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>{project.description || '-'}</td>
              <td>
                {project.assignments && project.assignments.length > 0 ? (
                  <div>{project.assignments.map((a: any) => `${a.user.firstName} ${a.user.lastName}`).join(', ')}</div>
                ) : (
                  <span style={{ color: '#999' }}>Keine</span>
                )}
              </td>
              <td>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: 
                    project.status === 'ACTIVE' ? '#17a2b8' :
                    project.status === 'COMPLETED' ? '#28a745' :
                    project.status === 'ON_HOLD' ? '#dc3545' :
                    project.status === 'CANCELLED' ? '#6c757d' :
                    '#ffc107',
                  color: project.status === 'PLANNING' ? '#000' : '#fff'
                }}>
                  {project.status === 'PLANNING' ? 'Planung' :
                   project.status === 'ACTIVE' ? 'Aktiv' :
                   project.status === 'ON_HOLD' ? 'Pausiert' :
                   project.status === 'COMPLETED' ? 'Abgeschlossen' :
                   project.status === 'CANCELLED' ? 'Abgebrochen' :
                   'Unbekannt'}
                </span>
                {!project.isActive && (
                  <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }}>(Inaktiv)</span>
                )}
              </td>
              <td>
                <button
                  className="btn btn-primary"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setAssigningProject(project);
                    setShowAssignModal(true);
                  }}
                >
                  Zuweisen
                </button>
                <button
                  className="btn"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px', background: '#17a2b8', color: 'white' }}
                  onClick={() => {
                    setStoriesProject(project);
                    setShowStoriesModal(true);
                  }}
                >
                  Stories
                </button>
                <button
                  className="btn btn-primary"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setEditingProject(project);
                    setShowModal(true);
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={async () => {
                    if (window.confirm('Projekt wirklich löschen?')) {
                      await projectService.deleteProject(project.id);
                      onUpdate();
                    }
                  }}
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          onSave={async (data) => {
            if (editingProject) {
              await projectService.updateProject(editingProject.id, data);
            } else {
              await projectService.createProject(data);
            }
            setShowModal(false);
            setEditingProject(null);
            onUpdate();
          }}
        />
      )}

      {showAssignModal && assigningProject && (
        <ProjectAssignModal
          project={assigningProject}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningProject(null);
          }}
          onUpdate={onUpdate}
        />
      )}

      {showStoriesModal && storiesProject && (
        <ProjectStoriesModal
          project={storiesProject}
          onClose={() => {
            setShowStoriesModal(false);
            setStoriesProject(null);
          }}
        />
      )}
    </div>
  );
};

const ProjectModal: React.FC<{
  project: Project | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ project, onClose, onSave }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    isActive: project?.isActive ?? true,
    status: project?.status || 'PLANNING',
    customerId: project?.customerId || '',
    defaultHourlyRate: project?.defaultHourlyRate?.toString() || '',
    sollBeginn: project?.sollBeginn || '',
    sollEnde: project?.sollEnde || '',
    sollPauseDauer: project?.sollPauseDauer?.toString() || '60',
    sollArbeitszeit: project?.sollArbeitszeit?.toString() || '',
    cuttingAktiv: project?.cuttingAktiv ?? true,
    cuttingTolerance: project?.cuttingTolerance?.toString() || '0',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getAllCustomers(undefined, true);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <BaseModal isOpen={true} onClose={onClose}>
      <h2>{project ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
      <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Kunde</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
              <option value="">Kein Kunde</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="PLANNING">Planung</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="ON_HOLD">Pausiert</option>
              <option value="COMPLETED">Abgeschlossen</option>
              <option value="CANCELLED">Abgebrochen</option>
            </select>
          </div>

          <div className="form-group">
            <label>Standard-Stundensatz (CHF/h)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.defaultHourlyRate}
              onChange={(e) => setFormData({ ...formData, defaultHourlyRate: e.target.value })}
              placeholder="z.B. 120"
            />
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Wird für Kostenkalkulation in Reports verwendet
            </small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: 'auto', marginRight: '10px' }}
              />
              Aktiv
            </label>
          </div>

          <h3 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Projektsoll (Cutting)</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Soll-Beginn</label>
              <input
                type="time"
                value={formData.sollBeginn}
                onChange={(e) => setFormData({ ...formData, sollBeginn: e.target.value })}
                placeholder="06:00"
              />
            </div>

            <div className="form-group">
              <label>Soll-Ende</label>
              <input
                type="time"
                value={formData.sollEnde}
                onChange={(e) => setFormData({ ...formData, sollEnde: e.target.value })}
                placeholder="17:00"
              />
            </div>

            <div className="form-group">
              <label>Soll-Pause (Min.)</label>
              <input
                type="number"
                min="0"
                value={formData.sollPauseDauer}
                onChange={(e) => setFormData({ ...formData, sollPauseDauer: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Soll-Arbeitszeit (h)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.sollArbeitszeit}
                onChange={(e) => setFormData({ ...formData, sollArbeitszeit: e.target.value })}
                placeholder="z.B. 10.0"
              />
            </div>

            <div className="form-group">
              <label>Cutting-Toleranz (Min.)</label>
              <input
                type="number"
                min="0"
                value={formData.cuttingTolerance}
                onChange={(e) => setFormData({ ...formData, cuttingTolerance: e.target.value })}
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Minuten bevor Cutting greift
              </small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.cuttingAktiv}
                  onChange={(e) => setFormData({ ...formData, cuttingAktiv: e.target.checked })}
                  style={{ width: 'auto', marginRight: '10px' }}
                />
                Cutting aktiviert
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </BaseModal>
  );
};

const ProjectAssignModal: React.FC<{
  project: Project;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ project, onClose, onUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const usersData = await userService.getAllUsersAdmin();
    setUsers(usersData);
    setLoading(false);
  };

  const loadCurrentProject = async () => {
    try {
      const projects = await projectService.getAllProjects();
      const updatedProject = projects.find(p => p.id === project.id);
      if (updatedProject) {
        setCurrentProject(updatedProject);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const isAssigned = (userId: string) => {
    return currentProject.assignments?.some((a: any) => a.user.id === userId);
  };

  const handleToggleAssignment = async (userId: string) => {
    try {
      if (isAssigned(userId)) {
        await projectService.unassignUser(currentProject.id, userId);
      } else {
        await projectService.assignUser(currentProject.id, userId);
      }
      await onUpdate();
      await loadCurrentProject();
    } catch (error) {
      console.error('Toggle assignment error:', error);
      alert('Fehler beim Zuweisen/Entfernen');
    }
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="700px">
      <h2>Benutzer zu "{currentProject.name}" zuweisen</h2>
      {loading ? (
          <p>Lädt...</p>
        ) : (
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Zugewiesen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>
                      <button
                        className={isAssigned(user.id) ? 'btn btn-danger' : 'btn btn-success'}
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => handleToggleAssignment(user.id)}
                      >
                        {isAssigned(user.id) ? 'Entfernen' : 'Zuweisen'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Schließen
              </button>
            </div>
          </div>
        )}
      </BaseModal>
  );
};

const ProjectStoriesModal: React.FC<{
  project: Project;
  onClose: () => void;
}> = ({ project, onClose }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStoryName, setNewStoryName] = useState('');
  const [newStoryColor, setNewStoryColor] = useState('#3b82f6');
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await storyService.getStoriesByProject(project.id, true);
      setStories(data);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryName.trim()) return;

    try {
      await storyService.createStory({
        projectId: project.id,
        name: newStoryName.trim(),
        color: newStoryColor,
      });
      setNewStoryName('');
      setNewStoryColor('#3b82f6');
      await loadStories();
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Fehler beim Erstellen der Story');
    }
  };

  const handleUpdateStory = async () => {
    if (!editingStory || !editName.trim()) return;

    try {
      await storyService.updateStory(editingStory.id, {
        name: editName.trim(),
        color: editColor,
      });
      setEditingStory(null);
      await loadStories();
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Fehler beim Aktualisieren der Story');
    }
  };

  const handleDeleteStory = async (story: Story) => {
    const msg = story._count && story._count.timeEntries > 0
      ? `Story "${story.name}" hat ${story._count.timeEntries} Zeitbuchungen und wird deaktiviert. Fortfahren?`
      : `Story "${story.name}" wirklich löschen?`;

    if (!window.confirm(msg)) return;

    try {
      await storyService.deleteStory(story.id);
      await loadStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Fehler beim Löschen der Story');
    }
  };

  const handleToggleActive = async (story: Story) => {
    try {
      await storyService.updateStory(story.id, { isActive: !story.isActive });
      await loadStories();
    } catch (error) {
      console.error('Error toggling story:', error);
    }
  };

  const PRESET_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="700px">
      <h2>Stories für "{project.name}"</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
        Stories sind Tags, auf die Stunden gebucht werden können.
      </p>

      {/* New Story Form */}
      <form onSubmit={handleCreateStory} style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Neue Story</label>
          <input
            type="text"
            value={newStoryName}
            onChange={(e) => setNewStoryName(e.target.value)}
            placeholder="Story-Name eingeben..."
            required
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0, width: '50px' }}>
          <label>Farbe</label>
          <input
            type="color"
            value={newStoryColor}
            onChange={(e) => setNewStoryColor(e.target.value)}
            style={{ width: '40px', height: '36px', padding: '2px', cursor: 'pointer' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: '36px' }}>
          Hinzufügen
        </button>
      </form>

      {/* Stories List */}
      {loading ? (
        <p>Lädt...</p>
      ) : stories.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
          Keine Stories vorhanden. Erstellen Sie die erste Story oben.
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '8px' }}></th>
              <th>Name</th>
              <th>Buchungen</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => (
              <tr key={story.id} style={{ opacity: story.isActive ? 1 : 0.5 }}>
                <td>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: story.color || '#999',
                  }} />
                </td>
                <td>
                  {editingStory?.id === story.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ flex: 1, padding: '4px 8px', fontSize: '13px' }}
                      />
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        style={{ width: '30px', height: '28px', padding: '1px', cursor: 'pointer' }}
                      />
                      <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={handleUpdateStory}>
                        ✓
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setEditingStory(null)}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    story.name
                  )}
                </td>
                <td>{story._count?.timeEntries || 0}</td>
                <td>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: story.isActive ? '#d4edda' : '#f8d7da',
                    color: story.isActive ? '#155724' : '#721c24',
                  }}>
                    {story.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn"
                    style={{ marginRight: '4px', padding: '3px 8px', fontSize: '11px', background: '#6c757d', color: 'white' }}
                    onClick={() => {
                      setEditingStory(story);
                      setEditName(story.name);
                      setEditColor(story.color || '#3b82f6');
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn"
                    style={{ marginRight: '4px', padding: '3px 8px', fontSize: '11px', background: story.isActive ? '#ffc107' : '#28a745', color: story.isActive ? '#000' : '#fff' }}
                    onClick={() => handleToggleActive(story)}
                  >
                    {story.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={() => handleDeleteStory(story)}
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Schließen
        </button>
      </div>
    </BaseModal>
  );
};
