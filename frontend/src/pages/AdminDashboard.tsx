import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { projectService } from '../services/project.service';
import { absenceService } from '../services/absence.service';
import { timeService } from '../services/time.service';
import { reportService } from '../services/report.service';
import { User, Project, AbsenceRequest, TimeEntry, Report } from '../types';
import '../App.css';

type TabType = 'users' | 'projects' | 'absences' | 'timeEntries' | 'reports';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [absences, setAbsences] = useState<AbsenceRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      switch (activeTab) {
        case 'users':
          const usersData = await userService.getAllUsers();
          setUsers(usersData);
          break;
        case 'projects':
          const projectsData = await projectService.getAllProjects();
          setProjects(projectsData);
          break;
        case 'absences':
          const absencesData = await absenceService.getAllAbsenceRequests();
          setAbsences(absencesData);
          break;
        case 'reports':
          const reportsData = await reportService.getAllUsersSummary();
          setReports(reportsData);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <h1>Admin Panel</h1>
        <div className="navbar-right">
          <span>{user?.firstName} {user?.lastName}</span>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Benutzer Ansicht
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Abmelden
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
            <TabButton
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
              label="Benutzer"
            />
            <TabButton
              active={activeTab === 'projects'}
              onClick={() => setActiveTab('projects')}
              label="Projekte"
            />
            <TabButton
              active={activeTab === 'absences'}
              onClick={() => setActiveTab('absences')}
              label="Abwesenheiten"
            />
            <TabButton
              active={activeTab === 'timeEntries'}
              onClick={() => setActiveTab('timeEntries')}
              label="Zeiteinträge"
            />
            <TabButton
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              label="Reports"
            />
          </div>

          {activeTab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
          {activeTab === 'projects' && <ProjectsTab projects={projects} onUpdate={loadData} />}
          {activeTab === 'absences' && <AbsencesTab absences={absences} onUpdate={loadData} />}
          {activeTab === 'timeEntries' && <TimeEntriesTab />}
          {activeTab === 'reports' && <ReportsTab reports={reports} />}
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({
  active,
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px',
      border: 'none',
      background: 'none',
      borderBottom: active ? '3px solid #007bff' : 'none',
      color: active ? '#007bff' : '#666',
      fontWeight: active ? 'bold' : 'normal',
      cursor: 'pointer',
    }}
  >
    {label}
  </button>
);

const UsersTab: React.FC<{ users: User[]; onUpdate: () => void }> = ({ users, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Benutzerverwaltung</h2>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>E-Mail</th>
            <th>Rolle</th>
            <th>Status</th>
            <th>Urlaubstage</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Aktiv' : 'Inaktiv'}</td>
              <td>{user.vacationDays}</td>
              <td>
                <button
                  className="btn btn-primary"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setEditingUser(user);
                    setShowModal(true);
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={async () => {
                    if (window.confirm('Benutzer wirklich löschen?')) {
                      await userService.deleteUser(user.id);
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

      {showModal && editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={async (data) => {
            await userService.updateUser(editingUser.id, data);
            setShowModal(false);
            setEditingUser(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const UserEditModal: React.FC<{
  user: User;
  onClose: () => void;
  onSave: (data: Partial<User>) => Promise<void>;
}> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    vacationDays: user.vacationDays,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Benutzer bearbeiten</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vorname</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Nachname</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>E-Mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Rolle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
            >
              <option value="USER">Benutzer</option>
              <option value="ADMIN">Administrator</option>
            </select>
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

          <div className="form-group">
            <label>Urlaubstage</label>
            <input
              type="number"
              step="0.5"
              value={formData.vacationDays}
              onChange={(e) => setFormData({ ...formData, vacationDays: parseFloat(e.target.value) })}
              required
            />
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
      </div>
    </div>
  );
};

const ProjectsTab: React.FC<{ projects: Project[]; onUpdate: () => void }> = ({ projects, onUpdate }) => {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
};

const AbsencesTab: React.FC<{ absences: AbsenceRequest[]; onUpdate: () => void }> = ({
  absences,
  onUpdate,
}) => {
  const pending = absences.filter((a) => a.status === 'PENDING');
  const processed = absences.filter((a) => a.status !== 'PENDING');

  const handleApprove = async (id: string) => {
    await absenceService.approveAbsenceRequest(id);
    onUpdate();
  };

  const handleReject = async (id: string) => {
    await absenceService.rejectAbsenceRequest(id);
    onUpdate();
  };

  return (
    <div>
      <h2>Abwesenheitsanträge</h2>

      <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Ausstehend</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Benutzer</th>
            <th>Typ</th>
            <th>Von</th>
            <th>Bis</th>
            <th>Tage</th>
            <th>Grund</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((request) => (
            <tr key={request.id}>
              <td>{request.user?.firstName} {request.user?.lastName}</td>
              <td>{request.type}</td>
              <td>{new Date(request.startDate).toLocaleDateString('de-DE')}</td>
              <td>{new Date(request.endDate).toLocaleDateString('de-DE')}</td>
              <td>{request.days}</td>
              <td>{request.reason || '-'}</td>
              <td>
                <button
                  className="btn btn-success"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => handleApprove(request.id)}
                >
                  Genehmigen
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => handleReject(request.id)}
                >
                  Ablehnen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>Bearbeitet</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Benutzer</th>
            <th>Typ</th>
            <th>Von</th>
            <th>Bis</th>
            <th>Tage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {processed.slice(0, 20).map((request) => (
            <tr key={request.id}>
              <td>{request.user?.firstName} {request.user?.lastName}</td>
              <td>{request.type}</td>
              <td>{new Date(request.startDate).toLocaleDateString('de-DE')}</td>
              <td>{new Date(request.endDate).toLocaleDateString('de-DE')}</td>
              <td>{request.days}</td>
              <td>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: request.status === 'APPROVED' ? '#d4edda' : '#f8d7da',
                    color: request.status === 'APPROVED' ? '#155724' : '#721c24',
                  }}
                >
                  {request.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TimeEntriesTab: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const usersData = await userService.getAllUsers();
    setUsers(usersData);
  };

  const loadEntries = async () => {
    if (!userId) return;
    // This would need a new endpoint in the backend
    // For now we'll show a message
    alert('Zeiteinträge für Benutzer anzeigen - Funktion in Arbeit');
  };

  return (
    <div>
      <h2>Zeiteinträge & Korrekturen</h2>
      <div className="form-group" style={{ maxWidth: '400px', marginTop: '20px' }}>
        <label>Benutzer auswählen</label>
        <select value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Bitte wählen...</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" onClick={loadEntries} disabled={!userId}>
        Einträge laden
      </button>
    </div>
  );
};

const ReportsTab: React.FC<{ reports: Report[] }> = ({ reports }) => {
  return (
    <div>
      <h2>Übersicht aller Mitarbeiter</h2>
      <table className="table" style={{ marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Benutzer</th>
            <th>E-Mail</th>
            <th>Gesamtstunden</th>
            <th>Gesamttage</th>
            <th>Einträge</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => (
            <tr key={index}>
              <td>{report.user?.firstName} {report.user?.lastName}</td>
              <td>{report.user?.email}</td>
              <td>{report.totalHours.toFixed(1)}h</td>
              <td>{report.totalDays}</td>
              <td>{report.entries}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
