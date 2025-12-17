import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { projectService } from '../services/project.service';
import { absenceService } from '../services/absence.service';
import { timeService } from '../services/time.service';
import { reportService } from '../services/report.service';
import { backupService, Backup } from '../services/backup.service';
import { locationService } from '../services/location.service';
import { User, Project, AbsenceRequest, TimeEntry, Report, Location } from '../types';
import VacationPlanner from './VacationPlanner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import '../App.css';

type TabType = 'users' | 'projects' | 'locations' | 'absences' | 'timeEntries' | 'reports' | 'backup' | 'vacationPlanner';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
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
        case 'locations':
          const locationsData = await locationService.getAllLocations();
          setLocations(locationsData);
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
          <div className="tab-navigation" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
              active={activeTab === 'locations'}
              onClick={() => setActiveTab('locations')}
              label="Standorte"
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
            <TabButton
              active={activeTab === 'backup'}
              onClick={() => setActiveTab('backup')}
              label="Backup"
            />
            <TabButton
              active={activeTab === 'vacationPlanner'}
              onClick={() => setActiveTab('vacationPlanner')}
              label="Urlaubsplaner"
            />
          </div>

          <>
            {activeTab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
            {activeTab === 'projects' && <ProjectsTab projects={projects} onUpdate={loadData} />}
            {activeTab === 'locations' && <LocationsTab locations={locations} onUpdate={loadData} />}
            {activeTab === 'absences' && <AbsencesTab absences={absences} onUpdate={loadData} />}
            {activeTab === 'timeEntries' && <TimeEntriesTab />}
            {activeTab === 'reports' && <ReportsTab reports={reports} />}
            {activeTab === 'backup' && <BackupTab />}
            {activeTab === 'vacationPlanner' && <VacationPlanner />}
          </>
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Benutzerverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Neuer Benutzer
        </button>
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

      {showCreateModal && (
        <UserCreateModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            await userService.createUser(data);
            setShowCreateModal(false);
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
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role,
      isActive: formData.isActive,
      vacationDays: formData.vacationDays,
    };
    
    // Nur Passwort hinzufügen wenn es ausgefüllt wurde
    if (formData.password && formData.password.length >= 6) {
      dataToSend.password = formData.password;
    }
    
    await onSave(dataToSend);
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

          <div className="form-group">
            <label>Neues Passwort (optional)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leer lassen um Passwort nicht zu ändern"
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Mindestens 6 Zeichen</small>
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

const UserCreateModal: React.FC<{
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER',
    isActive: true,
    vacationDays: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      alert('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    try {
      await onSave(formData);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Erstellen des Benutzers');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Neuer Benutzer</h2>
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
            <label>Passwort</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Mindestens 6 Zeichen</small>
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
              Benutzer erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LocationsTab: React.FC<{ locations: Location[]; onUpdate: () => void }> = ({ locations, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Standortverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingLocation(null);
            setShowModal(true);
          }}
        >
          Neuer Standort
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Adresse</th>
            <th>Beschreibung</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id}>
              <td>{location.name}</td>
              <td>{location.address || '-'}</td>
              <td>{location.description || '-'}</td>
              <td>{location.isActive ? 'Aktiv' : 'Inaktiv'}</td>
              <td>
                <button
                  className="btn btn-primary"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setEditingLocation(location);
                    setShowModal(true);
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={async () => {
                    if (window.confirm('Standort wirklich löschen?')) {
                      try {
                        await locationService.deleteLocation(location.id);
                        onUpdate();
                      } catch (error: any) {
                        alert(error.response?.data?.error || 'Fehler beim Löschen');
                      }
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
        <LocationModal
          location={editingLocation}
          onClose={() => {
            setShowModal(false);
            setEditingLocation(null);
          }}
          onSave={async (data) => {
            if (editingLocation) {
              await locationService.updateLocation(editingLocation.id, data);
            } else {
              await locationService.createLocation(data);
            }
            setShowModal(false);
            setEditingLocation(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const LocationModal: React.FC<{
  location: Location | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ location, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || '',
    description: location?.description || '',
    isActive: location?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{location ? 'Standort bearbeiten' : 'Neuer Standort'}</h2>
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
            <label>Adresse</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, []);

  const loadUsers = async () => {
    const usersData = await userService.getAllUsers();
    setUsers(usersData);
  };

  const loadProjects = async () => {
    const projectsData = await projectService.getAllProjects();
    setProjects(projectsData);
  };

  const loadEntries = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const entriesData = await timeService.getUserTimeEntries(userId);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading entries:', error);
      alert('Fehler beim Laden der Zeiteinträge');
    }
    setLoading(false);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Zeiteintrag wirklich löschen?')) return;
    try {
      await timeService.deleteTimeEntry(id);
      await loadEntries();
    } catch (error) {
      alert('Fehler beim Löschen');
    }
  };

  const formatDuration = (clockIn: string, clockOut?: string) => {
    if (!clockOut) return 'Läuft...';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div>
      <h2>Zeiteinträge & Korrekturen</h2>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
        <div className="form-group" style={{ flex: 1, maxWidth: '400px' }}>
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
        <button 
          className="btn btn-primary" 
          onClick={loadEntries} 
          disabled={!userId || loading}
          style={{ height: '40px', marginTop: '24px' }}
        >
          {loading ? 'Lädt...' : 'Einträge laden'}
        </button>
      </div>

      {entries.length > 0 && (
        <div>
          <h3>
            {entries.length} Einträge für {users.find(u => u.id === userId)?.firstName} {users.find(u => u.id === userId)?.lastName}
          </h3>
          <table className="table" style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Einstempeln</th>
                <th>Ausstempeln</th>
                <th>Dauer</th>
                <th>Projekt</th>
                <th>Beschreibung</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.clockIn).toLocaleDateString('de-DE')}</td>
                  <td>{new Date(entry.clockIn).toLocaleTimeString('de-DE')}</td>
                  <td>{entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('de-DE') : '-'}</td>
                  <td>{formatDuration(entry.clockIn, entry.clockOut)}</td>
                  <td>{entry.project?.name || '-'}</td>
                  <td>{entry.description || '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: entry.status === 'CLOCKED_OUT' ? '#d4edda' : '#fff3cd',
                      color: entry.status === 'CLOCKED_OUT' ? '#155724' : '#856404'
                    }}>
                      {entry.status === 'CLOCKED_OUT' ? 'Abgeschlossen' : 'Aktiv'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => {
                        setEditingEntry(entry);
                        setShowEditModal(true);
                      }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && editingEntry && (
        <TimeEntryEditModal
          entry={editingEntry}
          projects={projects}
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
          onSave={async (data) => {
            try {
              await timeService.updateTimeEntry(editingEntry.id, data);
              setShowEditModal(false);
              setEditingEntry(null);
              await loadEntries();
            } catch (error) {
              alert('Fehler beim Speichern');
            }
          }}
        />
      )}
    </div>
  );
};

const TimeEntryEditModal: React.FC<{
  entry: TimeEntry;
  projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<TimeEntry>) => Promise<void>;
}> = ({ entry, projects, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    clockIn: new Date(entry.clockIn).toISOString().slice(0, 16),
    clockOut: entry.clockOut ? new Date(entry.clockOut).toISOString().slice(0, 16) : '',
    projectId: entry.projectId || '',
    description: entry.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      clockIn: formData.clockIn,
      clockOut: formData.clockOut || undefined,
      projectId: formData.projectId || undefined,
      description: formData.description,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Zeiteintrag bearbeiten</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Einstempeln</label>
            <input
              type="datetime-local"
              value={formData.clockIn}
              onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Ausstempeln</label>
            <input
              type="datetime-local"
              value={formData.clockOut}
              onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Projekt</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">Kein Projekt</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
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

const ReportsTab: React.FC<{ reports: Report[] }> = ({ reports }) => {
  const [absenceData, setAbsenceData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any>({ year: new Date().getFullYear(), data: [] });
  const [overtimeData, setOvertimeData] = useState<any[]>([]);
  const [projectTimeData, setProjectTimeData] = useState<any>({ users: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  useEffect(() => {
    loadAnalytics();
  }, [selectedYear]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [absence, monthly, overtime, projectTime] = await Promise.all([
        reportService.getAbsenceAnalytics(),
        reportService.getAttendanceByMonth(selectedYear),
        reportService.getOvertimeReport(),
        reportService.getProjectTimeByUser()
      ]);
      
      setAbsenceData(absence);
      setMonthlyData(monthly);
      setOvertimeData(overtime);
      setProjectTimeData(projectTime);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Lade Auswertungen...</div>;
  }

  // Daten für Fehlzeiten-Diagramm vorbereiten
  const topAbsences = absenceData.slice(0, 10).map(item => ({
    name: `${item.user.firstName} ${item.user.lastName}`,
    Krankheit: item.sickDays,
    Urlaub: item.vacationDays,
    Sonstiges: item.personalDays + item.unpaidDays + item.otherDays,
    Gesamt: item.totalDays
  }));

  // Gesamtstatistik für Krankheit vs. Anwesenheit
  const totalSickDays = absenceData.reduce((sum, item) => sum + item.sickDays, 0);
  const totalVacationDays = absenceData.reduce((sum, item) => sum + item.vacationDays, 0);
  const totalOtherDays = absenceData.reduce((sum, item) => sum + (item.personalDays + item.unpaidDays + item.otherDays), 0);
  const totalWorkDays = monthlyData.data.reduce((sum: number, m: any) => sum + m.workDays, 0);

  const absenceTypeData = [
    { name: 'Krankheit', value: totalSickDays, color: '#FF8042' },
    { name: 'Urlaub', value: totalVacationDays, color: '#0088FE' },
    { name: 'Sonstiges', value: totalOtherDays, color: '#FFBB28' },
    { name: 'Anwesenheit', value: totalWorkDays, color: '#00C49F' }
  ];

  // Daten für Projektzeit-Matrix
  const projectMatrix = projectTimeData.users.slice(0, 8).map((userData: any) => ({
    name: `${userData.user.firstName} ${userData.user.lastName}`,
    ...userData.projectHours
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Erweiterte Auswertungen & Statistiken</h2>
        <div>
          <label style={{ marginRight: '10px' }}>Jahr:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button 
            className="btn btn-primary" 
            onClick={loadAnalytics}
            style={{ marginLeft: '10px', padding: '5px 15px', fontSize: '14px' }}
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Fehlzeiten - Wer fehlt am meisten */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>🏥 Fehlzeiten - Top 10 Mitarbeiter</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topAbsences}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Tage', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Krankheit" stackId="a" fill="#FF8042" />
            <Bar dataKey="Urlaub" stackId="a" fill="#0088FE" />
            <Bar dataKey="Sonstiges" stackId="a" fill="#FFBB28" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Krankheit vs. Anwesenheit */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>📊 Krankheit vs. Anwesenheit (Gesamt {selectedYear})</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <ResponsiveContainer width="50%" height={300}>
            <PieChart>
              <Pie
                data={absenceTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}d`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {absenceTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div style={{ width: '40%' }}>
            <div style={{ marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#FF8042' }}>Krankheitstage</h4>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalSickDays}</div>
            </div>
            <div style={{ marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0088FE' }}>Urlaubstage</h4>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalVacationDays}</div>
            </div>
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#00C49F' }}>Anwesenheitstage</h4>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{Math.round(totalWorkDays)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Anwesenheit nach Monat */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>📅 Anwesenheit nach Monat ({selectedYear})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="workDays" stroke="#00C49F" name="Arbeitstage" strokeWidth={2} />
            <Line type="monotone" dataKey="absenceDays" stroke="#FF8042" name="Fehltage" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Überstunden und Zeitkontingent */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>⏰ Überstunden & Zeitkontingent</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={overtimeData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={(item) => `${item.user.firstName} ${item.user.lastName}`} angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Stunden', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalHours" fill="#0088FE" name="Ist-Stunden" />
            <Bar dataKey="expectedHours" fill="#82ca9d" name="Soll-Stunden" />
            <Bar dataKey="overtime" fill="#FFBB28" name="Differenz" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Projektzeiten pro Mitarbeiter */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>📁 Projektzeiten pro Mitarbeiter (Top 8)</h3>
        {projectMatrix.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={projectMatrix}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Stunden', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {projectTimeData.projects.map((project: string, index: number) => (
                <Bar key={project} dataKey={project} fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Keine Projektzeiten verfügbar
          </p>
        )}
      </div>

      {/* Detaillierte Tabelle */}
      <div className="card">
        <h3>📋 Mitarbeiter-Übersicht</h3>
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
    </div>
  );
};

const BackupTab: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await backupService.listBackups();
      setBackups(data);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Laden der Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!window.confirm('Möchten Sie wirklich ein Backup erstellen?')) return;
    
    try {
      setLoading(true);
      const result = await backupService.createBackup();
      setMessage({ type: 'success', text: `Backup erfolgreich erstellt: ${result.filename}` });
      await loadBackups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Erstellen des Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      await backupService.downloadBackup(filename);
      setMessage({ type: 'success', text: 'Backup wird heruntergeladen' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Herunterladen des Backups' });
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(`Möchten Sie das Backup "${filename}" wirklich löschen?`)) return;
    
    try {
      setLoading(true);
      await backupService.deleteBackup(filename);
      setMessage({ type: 'success', text: 'Backup erfolgreich gelöscht' });
      await loadBackups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Löschen des Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm(
      `WARNUNG: Das Wiederherstellen des Backups "${filename}" überschreibt alle aktuellen Daten!\n\nMöchten Sie fortfahren?`
    )) return;
    
    try {
      setLoading(true);
      await backupService.restoreBackup(filename);
      setMessage({ type: 'success', text: 'Backup erfolgreich wiederhergestellt. Bitte Seite neu laden.' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Wiederherstellen des Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBackup = async () => {
    if (!uploadFile) {
      setMessage({ type: 'error', text: 'Bitte wählen Sie eine Datei aus' });
      return;
    }
    
    try {
      setLoading(true);
      const result = await backupService.uploadBackup(uploadFile);
      setMessage({ type: 'success', text: `Backup erfolgreich hochgeladen: ${result.filename}` });
      setUploadFile(null);
      await loadBackups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Hochladen des Backups' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      await backupService.exportData();
      setMessage({ type: 'success', text: 'Daten werden als JSON exportiert' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Fehler beim Exportieren der Daten' });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Backup & Restore</h2>
        
        {message && (
          <div
            style={{
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '4px',
              backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
            }}
          >
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={loading}
          >
            {loading ? 'Lädt...' : 'Neues Backup erstellen'}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={handleExportData}
            disabled={loading}
          >
            Daten als JSON exportieren
          </button>

          <button
            className="btn btn-secondary"
            onClick={loadBackups}
            disabled={loading}
          >
            Aktualisieren
          </button>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>Backup hochladen</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="file"
              accept=".sql"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={handleUploadBackup}
              disabled={loading || !uploadFile}
            >
              Hochladen
            </button>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dateiname</th>
              <th>Größe</th>
              <th>Erstellt</th>
              <th>Geändert</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {backups.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                  {loading ? 'Lade Backups...' : 'Keine Backups vorhanden'}
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.filename}>
                  <td>{backup.filename}</td>
                  <td>{formatFileSize(backup.size)}</td>
                  <td>{formatDate(backup.created)}</td>
                  <td>{formatDate(backup.modified)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleDownloadBackup(backup.filename)}
                        disabled={loading}
                      >
                        Download
                      </button>
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => handleRestoreBackup(backup.filename)}
                        disabled={loading}
                      >
                        Restore
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteBackup(backup.filename)}
                        disabled={loading}
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
