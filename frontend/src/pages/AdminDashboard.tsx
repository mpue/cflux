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
import * as customerService from '../services/customerService';
import * as supplierService from '../services/supplierService';
import * as articleGroupService from '../services/articleGroupService';
import * as articleService from '../services/articleService';
import * as invoiceService from '../services/invoiceService';
import { User, Project, AbsenceRequest, TimeEntry, Report, Location, Customer, Supplier, ArticleGroup, Article, Invoice, ComplianceViolation, ComplianceStats } from '../types';
import VacationPlanner from './VacationPlanner';
import { UserDetailModal } from '../components/UserDetailModal';
import PDFReportModal from '../components/PDFReportModal';
import InvoiceTemplateEditor from '../components/InvoiceTemplateEditor';
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

type TabType = 'users' | 'projects' | 'locations' | 'customers' | 'suppliers' | 'articleGroups' | 'articles' | 'invoices' | 'invoiceTemplates' | 'absences' | 'timeEntries' | 'reports' | 'backup' | 'vacationPlanner' | 'holidays' | 'compliance';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [articleGroups, setArticleGroups] = useState<ArticleGroup[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [absences, setAbsences] = useState<AbsenceRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [violationFilter, setViolationFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved');
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('de-DE'));

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'compliance') {
      loadComplianceData();
    }
  }, [violationFilter]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('de-DE'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        case 'customers':
          const customersData = await customerService.getAllCustomers();
          setCustomers(customersData);
          break;
        case 'suppliers':
          const suppliersData = await supplierService.getAllSuppliers();
          setSuppliers(suppliersData);
          break;
        case 'articleGroups':
          const articleGroupsData = await articleGroupService.getAllArticleGroups();
          setArticleGroups(articleGroupsData);
          break;
        case 'articles':
          const articlesData = await articleService.getAllArticles();
          setArticles(articlesData);
          break;
        case 'invoices':
          const invoicesData = await invoiceService.getAllInvoices();
          setInvoices(invoicesData);
          // Load articles and customers needed for invoice creation
          const invoiceArticles = await articleService.getAllArticles();
          setArticles(invoiceArticles);
          const invoiceCustomers = await customerService.getAllCustomers();
          setCustomers(invoiceCustomers);
          break;
        case 'absences':
          const absencesData = await absenceService.getAllAbsenceRequests();
          setAbsences(absencesData);
          break;
        case 'reports':
          const reportsData = await reportService.getAllUsersSummary();
          setReports(reportsData);
          break;
        case 'holidays':
          // Holidays werden direkt im Tab geladen
          break;
        case 'compliance':
          await loadComplianceData();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadComplianceData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      const token = localStorage.getItem('token');
      
      console.log('[COMPLIANCE FRONTEND] Loading compliance data with filter:', violationFilter);
      console.log('[COMPLIANCE FRONTEND] API_URL:', API_URL);
      
      // Stats abrufen
      const statsResponse = await fetch(`${API_URL}/api/compliance/violations/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stats = await statsResponse.json();
      console.log('[COMPLIANCE FRONTEND] Stats received:', stats);
      setComplianceStats(stats);

      // Violations abrufen
      const params = new URLSearchParams();
      if (violationFilter === 'unresolved') params.append('resolved', 'false');
      if (violationFilter === 'critical') {
        params.append('resolved', 'false');
        params.append('severity', 'CRITICAL');
      }

      const violationsUrl = `${API_URL}/api/compliance/violations?${params}`;
      console.log('[COMPLIANCE FRONTEND] Fetching violations from:', violationsUrl);
      
      const violationsResponse = await fetch(violationsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const violationsData = await violationsResponse.json();
      console.log('[COMPLIANCE FRONTEND] Violations received:', violationsData.length, 'items');
      console.log('[COMPLIANCE FRONTEND] First violation:', violationsData[0]);
      setViolations(violationsData);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    }
  };

  const resolveViolation = async (id: string) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      const token = localStorage.getItem('token');
      const notes = prompt('Notizen zur Auflösung (optional):');
      
      await fetch(`${API_URL}/api/compliance/violations/${id}/resolve`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      loadComplianceData();
    } catch (error) {
      console.error('Error resolving violation:', error);
      alert('Fehler beim Auflösen der Violation');
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
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{currentTime}</span>
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
          <div className="tab-navigation" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #ddd', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'wrap' }}>
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
              active={activeTab === 'customers'}
              onClick={() => setActiveTab('customers')}
              label="Kunden"
            />
            <TabButton
              active={activeTab === 'suppliers'}
              onClick={() => setActiveTab('suppliers')}
              label="Lieferanten"
            />
            <TabButton
              active={activeTab === 'articleGroups'}
              onClick={() => setActiveTab('articleGroups')}
              label="Artikelgruppen"
            />
            <TabButton
              active={activeTab === 'articles'}
              onClick={() => setActiveTab('articles')}
              label="Artikel"
            />
            <TabButton
              active={activeTab === 'invoices'}
              onClick={() => setActiveTab('invoices')}
              label="Rechnungen"
            />
            <TabButton
              active={activeTab === 'invoiceTemplates'}
              onClick={() => setActiveTab('invoiceTemplates')}
              label="Rechnungsvorlagen"
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
            <TabButton
              active={activeTab === 'holidays'}
              onClick={() => setActiveTab('holidays')}
              label="🗓️ Feiertage"
            />
            <TabButton
              active={activeTab === 'compliance'}
              onClick={() => setActiveTab('compliance')}
              label="🇨🇭 Compliance"
            />
          </div>

          <>
            {activeTab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
            {activeTab === 'projects' && <ProjectsTab projects={projects} onUpdate={loadData} />}
            {activeTab === 'locations' && <LocationsTab locations={locations} onUpdate={loadData} />}
            {activeTab === 'customers' && <CustomersTab customers={customers} onUpdate={loadData} />}
            {activeTab === 'suppliers' && <SuppliersTab suppliers={suppliers} onUpdate={loadData} />}
            {activeTab === 'articleGroups' && <ArticleGroupsTab articleGroups={articleGroups} onUpdate={loadData} />}
            {activeTab === 'articles' && <ArticlesTab articles={articles} articleGroups={articleGroups} onUpdate={loadData} />}
            {activeTab === 'invoices' && <InvoicesTab invoices={invoices} customers={customers} articles={articles} onUpdate={loadData} />}
            {activeTab === 'invoiceTemplates' && <InvoiceTemplatesTab />}
            {activeTab === 'absences' && <AbsencesTab absences={absences} onUpdate={loadData} />}
            {activeTab === 'timeEntries' && <TimeEntriesTab />}
            {activeTab === 'reports' && <ReportsTab reports={reports} />}
            {activeTab === 'backup' && <BackupTab />}
            {activeTab === 'vacationPlanner' && <VacationPlanner />}
            {activeTab === 'holidays' && <HolidaysTab />}
            {activeTab === 'compliance' && (
              <ComplianceTab 
                stats={complianceStats} 
                violations={violations} 
                filter={violationFilter}
                onFilterChange={(filter) => {
                  setViolationFilter(filter);
                  setTimeout(loadComplianceData, 0);
                }}
                onResolve={resolveViolation}
              />
            )}
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
  const [pdfReportUser, setPdfReportUser] = useState<User | null>(null);

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

      <div className="data-table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Personalnr.</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Telefon</th>
              <th>Ort</th>
              <th>Eintrittsdatum</th>
              <th>Rolle</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.employeeNumber || '-'}</td>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.mobile || user.phone || '-'}</td>
                <td>{user.city || '-'}</td>
                <td>{user.entryDate ? new Date(user.entryDate).toLocaleDateString('de-DE') : '-'}</td>
                <td>{user.role}</td>
                <td>{user.isActive ? 'Aktiv' : 'Inaktiv'}</td>
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
                  className="btn btn-success"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => setPdfReportUser(user)}
                >
                  PDF-Bericht
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
      </div>

      {showModal && editingUser && (
        <UserDetailModal
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

      {pdfReportUser && (
        <PDFReportModal
          user={pdfReportUser}
          isOpen={true}
          onClose={() => setPdfReportUser(null)}
          isAdmin={true}
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

const CustomersTab: React.FC<{ customers: Customer[]; onUpdate: () => void }> = ({ customers, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || customer.isActive;
    
    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Kundenverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingCustomer(null);
            setShowModal(true);
          }}
        >
          Neuer Kunde
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Name, Ansprechpartner, E-Mail oder Ort..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: 'auto', marginRight: '5px' }}
          />
          Inaktive anzeigen
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ansprechpartner</th>
            <th>Kontakt</th>
            <th>Ort</th>
            <th>Projekte</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Kunden gefunden
              </td>
            </tr>
          ) : (
            filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <strong>{customer.name}</strong>
                  {customer.taxId && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      UID: {customer.taxId}
                    </div>
                  )}
                </td>
                <td>{customer.contactPerson || '-'}</td>
                <td>
                  {customer.email && <div style={{ fontSize: '0.9em' }}>{customer.email}</div>}
                  {customer.phone && <div style={{ fontSize: '0.9em', color: '#666' }}>{customer.phone}</div>}
                  {!customer.email && !customer.phone && '-'}
                </td>
                <td>
                  {customer.city && customer.zipCode ? (
                    <div>
                      {customer.zipCode} {customer.city}
                      {customer.country && customer.country !== 'Schweiz' && (
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {customer.country}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {customer.projects && customer.projects.length > 0 ? (
                    <span>{customer.projects.length} Projekt{customer.projects.length !== 1 ? 'e' : ''}</span>
                  ) : (
                    <span style={{ color: '#999' }}>0 Projekte</span>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: customer.isActive ? '#d4edda' : '#f8d7da',
                    color: customer.isActive ? '#155724' : '#721c24'
                  }}>
                    {customer.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingCustomer(customer);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm('Kunde wirklich löschen?')) {
                        try {
                          await customerService.deleteCustomer(customer.id);
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
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
          onSave={async (data) => {
            if (editingCustomer) {
              await customerService.updateCustomer(editingCustomer.id, data);
            } else {
              await customerService.createCustomer(data);
            }
            setShowModal(false);
            setEditingCustomer(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const CustomerModal: React.FC<{
  customer: Customer | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    contactPerson: customer?.contactPerson || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    zipCode: customer?.zipCode || '',
    city: customer?.city || '',
    country: customer?.country || 'Schweiz',
    taxId: customer?.taxId || '',
    notes: customer?.notes || '',
    isActive: customer?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Bitte Kundenname eingeben');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>{customer ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Kundenname *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Ansprechpartner</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>E-Mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Straße</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <div className="form-group">
              <label>PLZ</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Ort</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Land</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Steuernummer / UID</label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

const SuppliersTab: React.FC<{ suppliers: Supplier[]; onUpdate: () => void }> = ({ suppliers, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchTerm || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || supplier.isActive;
    
    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Lieferantenverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingSupplier(null);
            setShowModal(true);
          }}
        >
          Neuer Lieferant
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Name, Ansprechpartner, E-Mail oder Ort..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: 'auto', marginRight: '5px' }}
          />
          Inaktive anzeigen
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ansprechpartner</th>
            <th>Kontakt</th>
            <th>Ort</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredSuppliers.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Lieferanten gefunden
              </td>
            </tr>
          ) : (
            filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>
                  <strong>{supplier.name}</strong>
                  {supplier.taxId && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      UID: {supplier.taxId}
                    </div>
                  )}
                </td>
                <td>{supplier.contactPerson || '-'}</td>
                <td>
                  {supplier.email && <div style={{ fontSize: '0.9em' }}>{supplier.email}</div>}
                  {supplier.phone && <div style={{ fontSize: '0.9em', color: '#666' }}>{supplier.phone}</div>}
                  {!supplier.email && !supplier.phone && '-'}
                </td>
                <td>
                  {supplier.city && supplier.zipCode ? (
                    <div>
                      {supplier.zipCode} {supplier.city}
                      {supplier.country && supplier.country !== 'Schweiz' && (
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {supplier.country}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: supplier.isActive ? '#d4edda' : '#f8d7da',
                    color: supplier.isActive ? '#155724' : '#721c24'
                  }}>
                    {supplier.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm('Lieferant wirklich löschen?')) {
                        try {
                          await supplierService.deleteSupplier(supplier.id);
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
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => {
            setShowModal(false);
            setEditingSupplier(null);
          }}
          onSave={async (data) => {
            if (editingSupplier) {
              await supplierService.updateSupplier(editingSupplier.id, data);
            } else {
              await supplierService.createSupplier(data);
            }
            setShowModal(false);
            setEditingSupplier(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const SupplierModal: React.FC<{
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ supplier, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    zipCode: supplier?.zipCode || '',
    city: supplier?.city || '',
    country: supplier?.country || 'Schweiz',
    taxId: supplier?.taxId || '',
    notes: supplier?.notes || '',
    isActive: supplier?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Bitte Lieferantenname eingeben');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>{supplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Lieferantenname *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Ansprechpartner</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>E-Mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Straße</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <div className="form-group">
              <label>PLZ</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Ort</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Land</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Steuernummer / UID</label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

// Holidays Tab Component
const HolidaysTab: React.FC = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [cantons, setCantons] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCanton, setSelectedCanton] = useState<string>('CH');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    date: '',
    name: '',
    canton: 'CH',
    percentage: 100
  });

  const API_URL = process.env.REACT_APP_API_URL || '';
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadCantons();
    loadHolidays();
  }, [selectedYear, selectedCanton]);

  const loadCantons = async () => {
    try {
      const response = await fetch(`${API_URL}/api/compliance/cantons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setCantons(data);
    } catch (error) {
      console.error('Error loading cantons:', error);
    }
  };

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      if (selectedCanton !== 'ALL') {
        params.append('canton', selectedCanton);
      }

      const response = await fetch(`${API_URL}/api/compliance/holidays?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setHolidays(data);
    } catch (error) {
      console.error('Error loading holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncHolidays = async () => {
    if (!window.confirm(`Feiertage für ${selectedYear} von API synchronisieren?\n\nDies überschreibt alle bestehenden Einträge für dieses Jahr.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/compliance/holidays/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year: selectedYear })
      });

      const result = await response.json();
      alert(`Erfolgreich! ${result.count} Feiertage synchronisiert.\n\nNationale: ${result.details?.national}\nKantonale: ${result.details?.cantonal}\nZusätzliche: ${result.details?.additional}`);
      loadHolidays();
    } catch (error) {
      console.error('Error syncing holidays:', error);
      alert('Fehler beim Synchronisieren der Feiertage');
    } finally {
      setLoading(false);
    }
  };

  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('Bitte Datum und Name eingeben');
      return;
    }

    try {
      await fetch(`${API_URL}/api/compliance/holidays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newHoliday)
      });

      setShowAddModal(false);
      setNewHoliday({ date: '', name: '', canton: 'CH', percentage: 100 });
      loadHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
      alert('Fehler beim Hinzufügen des Feiertags');
    }
  };

  const deleteHoliday = async (id: string) => {
    if (!window.confirm('Feiertag wirklich löschen?')) return;

    try {
      await fetch(`${API_URL}/api/compliance/holidays/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Fehler beim Löschen des Feiertags');
    }
  };

  const groupedHolidays = holidays.reduce((acc: any, holiday: any) => {
    const month = new Date(holiday.date).toLocaleDateString('de-DE', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🗓️ Feiertage-Verwaltung</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 1 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>

          <select
            value={selectedCanton}
            onChange={(e) => setSelectedCanton(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="ALL">Alle Kantone</option>
            {cantons.map(canton => (
              <option key={canton.code} value={canton.code}>{canton.name}</option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={syncHolidays}
            disabled={loading}
          >
            🔄 Von API synchronisieren
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Feiertag hinzufügen
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Lade Feiertage...</div>
      ) : holidays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Keine Feiertage gefunden für {selectedYear}</p>
          <button className="btn btn-primary" onClick={syncHolidays}>
            Jetzt von API synchronisieren
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>{holidays.length} Feiertage</strong> für {selectedCanton === 'ALL' ? 'alle Kantone' : cantons.find(c => c.code === selectedCanton)?.name}
          </div>

          {Object.entries(groupedHolidays).map(([month, monthHolidays]: [string, any]) => (
            <div key={month} style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                background: '#007bff', 
                color: 'white', 
                padding: '10px 15px', 
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                {month}
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Datum</th>
                    <th>Name</th>
                    <th style={{ width: '100px' }}>Kanton</th>
                    <th style={{ width: '80px' }}>%</th>
                    <th style={{ width: '100px' }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {monthHolidays.map((holiday: any) => (
                    <tr key={holiday.id}>
                      <td>{new Date(holiday.date).toLocaleDateString('de-DE', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}</td>
                      <td>{holiday.name}</td>
                      <td>
                        <span style={{ 
                          background: holiday.canton === 'CH' ? '#28a745' : '#007bff',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {holiday.canton}
                        </span>
                      </td>
                      <td>{holiday.percentage}%</td>
                      <td>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => deleteHoliday(holiday.id)}
                          title="Löschen"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Neuer Feiertag</h2>
            <div className="form-group">
              <label>Datum</label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="z.B. Neujahr"
              />
            </div>
            <div className="form-group">
              <label>Kanton</label>
              <select
                value={newHoliday.canton}
                onChange={(e) => setNewHoliday({ ...newHoliday, canton: e.target.value })}
              >
                {cantons.map(canton => (
                  <option key={canton.code} value={canton.code}>{canton.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Prozentsatz (100 = ganzer Tag)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newHoliday.percentage}
                onChange={(e) => setNewHoliday({ ...newHoliday, percentage: parseInt(e.target.value) })}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={addHoliday}>
                Erstellen
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compliance Tab Component
const ComplianceTab: React.FC<{
  stats: ComplianceStats | null;
  violations: ComplianceViolation[];
  filter: 'all' | 'unresolved' | 'critical';
  onFilterChange: (filter: 'all' | 'unresolved' | 'critical') => void;
  onResolve: (id: string) => void;
}> = ({ stats, violations, filter, onFilterChange, onResolve }) => {
  
  const getViolationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      REST_TIME: 'Ruhezeit unterschritten',
      MAX_WEEKLY_HOURS: 'Wöchentliche Höchstarbeitszeit',
      MAX_DAILY_HOURS: 'Tägliche Höchstarbeitszeit',
      MISSING_PAUSE: 'Fehlende Pause',
      OVERTIME_LIMIT: 'Überzeit-Limit',
      NIGHT_WORK: 'Nachtarbeit',
      SUNDAY_WORK: 'Sonntagsarbeit'
    };
    return labels[type] || type;
  };

  const getSeverityBadge = (severity: string) => {
    return severity === 'CRITICAL' 
      ? <span className="badge badge-critical">Kritisch</span>
      : <span className="badge badge-warning">Warnung</span>;
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>🇨🇭 Swiss Compliance Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Überwachung der Schweizer Arbeitszeitvorschriften (ArG/ArGV 1)
      </p>

      {/* Statistiken */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.unresolvedViolations}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Offene Violations</div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '3rem' }}>🚨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.criticalViolations}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Kritische Violations</div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '3rem' }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.recentViolations}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Letzte 30 Tage</div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '3rem' }}>👥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.topUsersWithViolations.length}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Betroffene User</div>
            </div>
          </div>
        </div>
      )}

      {/* Violations nach Typ */}
      {stats && stats.violationsByType.length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0 }}>Violations nach Typ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.violationsByType.map((item) => (
              <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                <span style={{ fontWeight: 500 }}>{getViolationTypeLabel(item.type)}</span>
                <span style={{ background: '#007bff', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ margin: 0 }}>Compliance Violations</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onFilterChange('all')}
          >
            Alle
          </button>
          <button 
            className={filter === 'unresolved' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onFilterChange('unresolved')}
          >
            Offen
          </button>
          <button 
            className={filter === 'critical' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onFilterChange('critical')}
          >
            Kritisch
          </button>
        </div>
      </div>

      {/* Violations Tabelle */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Mitarbeiter</th>
              <th>Typ</th>
              <th>Schwere</th>
              <th>Beschreibung</th>
              <th>Ist-Wert</th>
              <th>Soll-Wert</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {violations.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  ✅ Keine Violations gefunden
                </td>
              </tr>
            ) : (
              violations.map((violation) => (
                <tr key={violation.id} style={violation.severity === 'CRITICAL' ? { background: '#fff5f5' } : {}}>
                  <td>{new Date(violation.date).toLocaleDateString('de-CH')}</td>
                  <td>
                    {violation.user ? 
                      `${violation.user.firstName} ${violation.user.lastName}` : 
                      'Unbekannt'
                    }
                  </td>
                  <td>{getViolationTypeLabel(violation.type)}</td>
                  <td>{getSeverityBadge(violation.severity)}</td>
                  <td>{violation.description}</td>
                  <td>{violation.actualValue || '-'}</td>
                  <td>{violation.requiredValue || '-'}</td>
                  <td>
                    {violation.resolved ? (
                      <span className="badge badge-success">Gelöst</span>
                    ) : (
                      <span className="badge badge-pending">Offen</span>
                    )}
                  </td>
                  <td>
                    {!violation.resolved && (
                      <button
                        className="btn btn-small btn-success"
                        onClick={() => onResolve(violation.id)}
                      >
                        ✓ Auflösen
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Top User mit Violations */}
      {stats && stats.topUsersWithViolations.length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginTop: '30px' }}>
          <h3 style={{ marginTop: 0 }}>Mitarbeiter mit den meisten Violations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.topUsersWithViolations.map((user) => (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '5px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>{user.firstName} {user.lastName}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>{user.email}</span>
                </div>
                <span style={{ background: '#dc3545', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500 }}>
                  {user.violationCount} Violations
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ArticleGroupsTab: React.FC<{ articleGroups: ArticleGroup[]; onUpdate: () => void }> = ({ articleGroups, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ArticleGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredGroups = articleGroups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || group.isActive;
    
    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Artikelgruppen</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingGroup(null);
            setShowModal(true);
          }}
        >
          Neue Artikelgruppe
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Name oder Beschreibung..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: 'auto', marginRight: '5px' }}
          />
          Inaktive anzeigen
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Artikel</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredGroups.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Artikelgruppen gefunden
              </td>
            </tr>
          ) : (
            filteredGroups.map((group) => (
              <tr key={group.id}>
                <td><strong>{group.name}</strong></td>
                <td>{group.description || '-'}</td>
                <td>
                  {group.articles && group.articles.length > 0 ? (
                    <span>{group.articles.length} Artikel</span>
                  ) : (
                    <span style={{ color: '#999' }}>0 Artikel</span>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: group.isActive ? '#d4edda' : '#f8d7da',
                    color: group.isActive ? '#155724' : '#721c24'
                  }}>
                    {group.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingGroup(group);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm('Artikelgruppe wirklich löschen?')) {
                        try {
                          await articleGroupService.deleteArticleGroup(group.id);
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
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <ArticleGroupModal
          group={editingGroup}
          onClose={() => {
            setShowModal(false);
            setEditingGroup(null);
          }}
          onSave={async (data) => {
            if (editingGroup) {
              await articleGroupService.updateArticleGroup(editingGroup.id, data);
            } else {
              await articleGroupService.createArticleGroup(data);
            }
            setShowModal(false);
            setEditingGroup(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const ArticleGroupModal: React.FC<{
  group: ArticleGroup | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ group, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    isActive: group?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Bitte Name eingeben');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <h2>{group ? 'Artikelgruppe bearbeiten' : 'Neue Artikelgruppe'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
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

          <div className="button-group">
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ArticlesTab: React.FC<{ articles: Article[]; articleGroups: ArticleGroup[]; onUpdate: () => void }> = ({ articles, articleGroups, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string>('');

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm || 
      article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.articleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || article.isActive;
    const matchesGroup = !filterGroupId || article.articleGroupId === filterGroupId;
    
    return matchesSearch && matchesActive && matchesGroup;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Artikelverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingArticle(null);
            setShowModal(true);
          }}
        >
          Neuer Artikel
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Name, Artikelnummer oder Beschreibung..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <select
          value={filterGroupId}
          onChange={(e) => setFilterGroupId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Gruppen</option>
          {articleGroups.filter(g => g.isActive).map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: 'auto', marginRight: '5px' }}
          />
          Inaktive anzeigen
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Artikelnummer</th>
            <th>Name</th>
            <th>Gruppe</th>
            <th>Preis</th>
            <th>Einheit</th>
            <th>MwSt</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredArticles.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Artikel gefunden
              </td>
            </tr>
          ) : (
            filteredArticles.map((article) => (
              <tr key={article.id}>
                <td><strong>{article.articleNumber}</strong></td>
                <td>
                  <div>{article.name}</div>
                  {article.description && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {article.description}
                    </div>
                  )}
                </td>
                <td>{article.articleGroup?.name || '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  CHF {article.price.toFixed(2)}
                </td>
                <td>{article.unit}</td>
                <td style={{ textAlign: 'right' }}>{article.vatRate}%</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: article.isActive ? '#d4edda' : '#f8d7da',
                    color: article.isActive ? '#155724' : '#721c24'
                  }}>
                    {article.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingArticle(article);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm('Artikel wirklich löschen?')) {
                        try {
                          await articleService.deleteArticle(article.id);
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
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <ArticleModal
          article={editingArticle}
          articleGroups={articleGroups}
          onClose={() => {
            setShowModal(false);
            setEditingArticle(null);
          }}
          onSave={async (data) => {
            if (editingArticle) {
              await articleService.updateArticle(editingArticle.id, data);
            } else {
              await articleService.createArticle(data);
            }
            setShowModal(false);
            setEditingArticle(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const ArticleModal: React.FC<{
  article: Article | null;
  articleGroups: ArticleGroup[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ article, articleGroups, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    articleNumber: article?.articleNumber || '',
    name: article?.name || '',
    description: article?.description || '',
    articleGroupId: article?.articleGroupId || '',
    price: article?.price || 0,
    unit: article?.unit || 'Stück',
    vatRate: article?.vatRate || 7.7,
    notes: article?.notes || '',
    isActive: article?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.articleNumber.trim()) {
      alert('Bitte Artikelnummer eingeben');
      return;
    }
    if (!formData.name.trim()) {
      alert('Bitte Artikelname eingeben');
      return;
    }
    if (!formData.articleGroupId) {
      alert('Bitte Artikelgruppe auswählen');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>{article ? 'Artikel bearbeiten' : 'Neuer Artikel'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Artikelnummer *</label>
            <input
              type="text"
              value={formData.articleNumber}
              onChange={(e) => setFormData({ ...formData, articleNumber: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Artikelname *</label>
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
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Artikelgruppe *</label>
            <select
              value={formData.articleGroupId}
              onChange={(e) => setFormData({ ...formData, articleGroupId: e.target.value })}
              required
            >
              <option value="">Bitte wählen...</option>
              {articleGroups.filter(g => g.isActive).map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Preis (CHF) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label>Einheit *</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="z.B. Stück, Std, kg"
                required
              />
            </div>

            <div className="form-group">
              <label>MwSt-Satz (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

          <div className="button-group">
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InvoiceTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invoice-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setTemplates(data);
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplateId(undefined);
    setShowEditor(true);
  };

  const handleEdit = (id: string) => {
    setEditingTemplateId(id);
    setShowEditor(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Möchten Sie die Vorlage "${name}" wirklich löschen?`)) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/invoice-templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTemplates();
    } catch (err: any) {
      alert(err?.message || 'Fehler beim Löschen der Vorlage');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/invoice-templates/${id}/default`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTemplates();
    } catch (err: any) {
      alert(err?.message || 'Fehler beim Setzen der Standardvorlage');
    }
  };

  const handleSave = () => {
    setShowEditor(false);
    loadTemplates();
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingTemplateId(undefined);
  };

  return (
    <div>
      {showEditor && (
        <InvoiceTemplateEditor
          templateId={editingTemplateId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Rechnungsvorlagen</h2>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          + Neue Vorlage
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Lade Vorlagen...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
              <p>Noch keine Vorlagen vorhanden.</p>
              <button className="btn btn-primary" onClick={handleCreateNew}>
                Erste Vorlage erstellen
              </button>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} style={{
                background: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{template.name}</h3>
                  {template.isDefault && (
                    <span style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>Standard</span>
                  )}
                </div>
                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Firma:</strong> {template.companyName}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>E-Mail:</strong> {template.companyEmail || '-'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Telefon:</strong> {template.companyPhone || '-'}
                  </div>
                  {template.companyTaxId && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>UID:</strong> {template.companyTaxId}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                    onClick={() => handleEdit(template.id)}
                  >
                    Bearbeiten
                  </button>
                  {!template.isDefault && (
                    <>
                      <button
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '13px', background: '#f3f4f6', color: '#374151' }}
                        onClick={() => handleSetDefault(template.id)}
                      >
                        Als Standard
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => handleDelete(template.id, template.name)}
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const InvoicesTab: React.FC<{ invoices: Invoice[]; customers: Customer[]; articles: Article[]; onUpdate: () => void }> = ({ invoices, customers, articles, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || invoice.status === filterStatus;
    const matchesCustomer = !filterCustomerId || invoice.customerId === filterCustomerId;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return { bg: '#e3f2fd', color: '#1565c0' };
      case 'SENT': return { bg: '#fff3e0', color: '#e65100' };
      case 'PAID': return { bg: '#d4edda', color: '#155724' };
      case 'OVERDUE': return { bg: '#f8d7da', color: '#721c24' };
      case 'CANCELLED': return { bg: '#f5f5f5', color: '#616161' };
      default: return { bg: '#f5f5f5', color: '#000' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'SENT': return 'Versendet';
      case 'PAID': return 'Bezahlt';
      case 'OVERDUE': return 'Überfällig';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Rechnungsverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingInvoice(null);
            setShowModal(true);
          }}
        >
          Neue Rechnung
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Rechnungsnummer, Kunde oder Notizen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <select
          value={filterCustomerId}
          onChange={(e) => setFilterCustomerId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Kunden</option>
          {customers.filter(c => c.isActive).map(customer => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="SENT">Versendet</option>
          <option value="PAID">Bezahlt</option>
          <option value="OVERDUE">Überfällig</option>
          <option value="CANCELLED">Storniert</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Rechnungsnr.</th>
            <th>Kunde</th>
            <th>Datum</th>
            <th>Fällig</th>
            <th>Betrag</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Rechnungen gefunden
              </td>
            </tr>
          ) : (
            filteredInvoices.map((invoice) => {
              const statusStyle = getStatusColor(invoice.status);
              return (
                <tr key={invoice.id}>
                  <td><strong>{invoice.invoiceNumber}</strong></td>
                  <td>{invoice.customer?.name || '-'}</td>
                  <td>{new Date(invoice.invoiceDate).toLocaleDateString('de-CH')}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString('de-CH')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <strong>CHF {invoice.totalAmount.toFixed(2)}</strong>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      Netto: CHF {invoice.subtotal.toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color
                    }}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn"
                      style={{ 
                        marginRight: '5px', 
                        padding: '5px 10px', 
                        fontSize: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none'
                      }}
                      onClick={() => {
                        const API_URL = process.env.REACT_APP_API_URL || '';
                        const token = localStorage.getItem('token');
                        const url = `${API_URL}/api/invoices/${invoice.id}/pdf`;
                        
                        fetch(url, {
                          headers: { Authorization: `Bearer ${token}` }
                        })
                        .then(response => response.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Rechnung_${invoice.invoiceNumber}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        })
                        .catch(error => {
                          console.error('Error downloading PDF:', error);
                          alert('Fehler beim Download der PDF');
                        });
                      }}
                    >
                      📄 PDF
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => {
                        setEditingInvoice(invoice);
                        setShowModal(true);
                      }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={async () => {
                        if (window.confirm('Rechnung wirklich löschen?')) {
                          try {
                            await invoiceService.deleteInvoice(invoice.id);
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
              );
            })
          )}
        </tbody>
      </table>

      {showModal && (
        <InvoiceModal
          invoice={editingInvoice}
          customers={customers}
          articles={articles}
          onClose={() => {
            setShowModal(false);
            setEditingInvoice(null);
          }}
          onSave={async (data) => {
            if (editingInvoice) {
              await invoiceService.updateInvoice(editingInvoice.id, data);
            } else {
              await invoiceService.createInvoice(data);
            }
            setShowModal(false);
            setEditingInvoice(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const InvoiceModal: React.FC<{
  invoice: Invoice | null;
  customers: Customer[];
  articles: Article[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ invoice, customers, articles, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || '',
    invoiceDate: invoice?.invoiceDate ? invoice.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate ? invoice.dueDate.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerId: invoice?.customerId || '',
    status: invoice?.status || 'DRAFT',
    notes: invoice?.notes || '',
    items: invoice?.items || [],
    templateId: invoice?.templateId || '',
  });

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    // Load templates
    const loadTemplates = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/invoice-templates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setTemplates(data);
        
        // Set default template if creating new invoice
        if (!invoice && data.length > 0) {
          const defaultTemplate = data.find((t: any) => t.isDefault) || data[0];
          setFormData(prev => ({ ...prev, templateId: defaultTemplate.id }));
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    
    loadTemplates();
    
    // Generate invoice number for new invoices
    if (!invoice) {
      invoiceService.getNextInvoiceNumber().then(num => {
        setFormData(prev => ({ ...prev, invoiceNumber: num }));
      });
    }
  }, [invoice]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: '',
        invoiceId: '',
        position: prev.items.length + 1,
        description: '',
        quantity: 1,
        unitPrice: 0,
        unit: 'Stück',
        vatRate: 7.7,
        totalPrice: 0,
        createdAt: '',
        updatedAt: '',
      } as any],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        
        const updated = { ...item, [field]: value };
        
        // If article is selected, populate fields
        if (field === 'articleId' && value) {
          const article = articles.find(a => a.id === value);
          if (article) {
            updated.description = article.name;
            updated.unitPrice = article.price;
            updated.unit = article.unit;
            updated.vatRate = article.vatRate;
          }
        }
        
        // Recalculate total
        updated.totalPrice = updated.quantity * updated.unitPrice;
        
        return updated;
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invoiceNumber.trim()) {
      alert('Bitte Rechnungsnummer eingeben');
      return;
    }
    if (!formData.customerId) {
      alert('Bitte Kunde auswählen');
      return;
    }
    if (formData.items.length === 0) {
      alert('Bitte mindestens eine Position hinzufügen');
      return;
    }

    setLoading(true);
    try {
      // Clean items data - remove metadata fields that shouldn't be sent
      const cleanedData = {
        ...formData,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          vatRate: item.vatRate,
          totalPrice: item.totalPrice,
          position: item.position,
          articleId: item.articleId || undefined
        }))
      };
      
      await onSave(cleanedData);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Fehler beim Speichern der Rechnung');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vatAmount = formData.items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice * item.vatRate) / 100), 0);
  const totalAmount = subtotal + vatAmount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>{invoice ? 'Rechnung bearbeiten' : 'Neue Rechnung'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Rechnungsnummer *</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Kunde *</label>
              {invoice ? (
                <input
                  type="text"
                  value={invoice.customer?.name || 'Unbekannt'}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              ) : (
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                >
                  <option value="">Bitte wählen...</option>
                  {customers && customers.length > 0 ? (
                    customers.filter(c => c.isActive).map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>Keine aktiven Kunden verfügbar</option>
                  )}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Rechnungsdatum *</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Fälligkeitsdatum *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="DRAFT">Entwurf</option>
                <option value="SENT">Versendet</option>
                <option value="PAID">Bezahlt</option>
                <option value="OVERDUE">Überfällig</option>
                <option value="CANCELLED">Storniert</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rechnungsvorlage</label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              >
                <option value="">Standard</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.isDefault ? '(Standard)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div style={{ marginTop: '20px', marginBottom: '10px' }}>
            <h3 style={{ display: 'inline', marginRight: '15px' }}>Positionen</h3>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '5px 15px', fontSize: '14px' }}
              onClick={addItem}
            >
              + Position hinzufügen
            </button>
          </div>

          <table className="table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>#</th>
                <th style={{ width: '150px' }}>Artikel</th>
                <th>Beschreibung</th>
                <th style={{ width: '80px' }}>Menge</th>
                <th style={{ width: '100px' }}>Preis</th>
                <th style={{ width: '80px' }}>Einheit</th>
                <th style={{ width: '80px' }}>MwSt %</th>
                <th style={{ width: '100px' }}>Total</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>
                    Keine Positionen vorhanden
                  </td>
                </tr>
              ) : (
                formData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <select
                        value={item.articleId || ''}
                        onChange={(e) => updateItem(index, 'articleId', e.target.value)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                      >
                        <option value="">Manuell</option>
                        {articles && articles.length > 0 ? (
                          articles.filter(a => a.isActive).map(article => (
                            <option key={article.id} value={article.id}>{article.articleNumber}</option>
                          ))
                        ) : (
                          <option value="" disabled>Keine Artikel verfügbar</option>
                        )}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={item.vatRate}
                        onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '5px', fontSize: '12px' }}
                        required
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '12px' }}>
                      CHF {item.totalPrice.toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => removeItem(index)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', marginBottom: '20px', paddingRight: '20px' }}>
            <div style={{ marginBottom: '5px' }}>
              <strong>Zwischensumme:</strong> <span style={{ display: 'inline-block', width: '120px', textAlign: 'right' }}>CHF {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <strong>MwSt:</strong> <span style={{ display: 'inline-block', width: '120px', textAlign: 'right' }}>CHF {vatAmount.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '1.2em', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #333' }}>
              <strong>Gesamtbetrag:</strong> <span style={{ display: 'inline-block', width: '140px', textAlign: 'right' }}>CHF {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
