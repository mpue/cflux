import React, { useState, useEffect } from 'react';
import { Project, User } from '../../types';
import { projectService } from '../../services/project.service';
import { userService } from '../../services/user.service';
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
              <td>{project.isActive ? 'Aktiv' : 'Inaktiv'}</td>
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
    </div>
  );
};

const ProjectModal: React.FC<{
  project: Project | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    isActive: project?.isActive ?? true,
  });

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
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const usersData = await userService.getAllUsers();
    setUsers(usersData);
    setLoading(false);
  };

  const isAssigned = (userId: string) => {
    return project.assignments?.some((a: any) => a.user.id === userId);
  };

  const handleToggleAssignment = async (userId: string) => {
    try {
      if (isAssigned(userId)) {
        await projectService.unassignUser(project.id, userId);
      } else {
        await projectService.assignUser(project.id, userId);
      }
      await onUpdate();
    } catch (error) {
      console.error('Toggle assignment error:', error);
      alert('Fehler beim Zuweisen/Entfernen');
    }
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="700px">
      <h2>Benutzer zu "{project.name}" zuweisen</h2>
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
