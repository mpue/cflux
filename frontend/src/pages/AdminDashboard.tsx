import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../contexts/ModuleContext';
import { userService } from '../services/user.service';
import { projectService } from '../services/project.service';
import { absenceService } from '../services/absence.service';
import { reportService } from '../services/report.service';
import { locationService } from '../services/location.service';
import * as customerService from '../services/customerService';
import * as supplierService from '../services/supplierService';
import * as articleGroupService from '../services/articleGroupService';
import * as articleService from '../services/articleService';
import * as invoiceService from '../services/invoiceService';
import { reminderService } from '../services/reminder.service';
import { User, Project, AbsenceRequest, Report, Location, Customer, Supplier, ArticleGroup, Article, Invoice, ComplianceViolation, ComplianceStats } from '../types';
import { Reminder, OverdueInvoice, ReminderStats } from '../types/reminder.types';
import VacationPlanner from './VacationPlanner';
import {
  UsersTab,
  UserGroupsTab,
  LocationsTab,
  CustomersTab,
  SuppliersTab,
  ProjectsTab,
  AbsencesTab,
  TimeEntriesTab,
  ReportsTab,
  BackupTab,
  HolidaysTab,
  ComplianceTab,
  ArticleGroupsTab,
  ArticlesTab,
  InvoiceTemplatesTab,
  InvoicesTab,
  RemindersTab
} from '../components/admin';
import ModulesPage from './ModulesPage';
import ModulePermissionsPage from './ModulePermissionsPage';
import '../App.css';
import './AdminDashboard.css';

type TabType = 'users' | 'userGroups' | 'projects' | 'locations' | 'customers' | 'suppliers' | 'articleGroups' | 'articles' | 'invoices' | 'invoiceTemplates' | 'reminders' | 'absences' | 'timeEntries' | 'reports' | 'backup' | 'vacationPlanner' | 'holidays' | 'compliance' | 'modules' | 'modulePermissions';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasModuleAccess } = useModules();
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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [reminderStats, setReminderStats] = useState<ReminderStats | null>(null);
  const [absences, setAbsences] = useState<AbsenceRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [violationFilter, setViolationFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved');
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('de-DE'));

  useEffect(() => {
    document.title = user?.role === 'ADMIN' ? 'CFlux - Administration' : 'CFlux - Verwaltung';
  }, [user]);

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
          // Load article groups for article management
          const articleGroupsForArticles = await articleGroupService.getAllArticleGroups();
          setArticleGroups(articleGroupsForArticles);
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
        case 'reminders':
          const remindersData = await reminderService.getAllReminders();
          setReminders(remindersData);
          const overdueData = await reminderService.getOverdueInvoices();
          setOverdueInvoices(overdueData);
          const statsData = await reminderService.getReminderStats();
          setReminderStats(statsData);
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
      
      // Stats abrufen
      const statsResponse = await fetch(`${API_URL}/api/compliance/violations/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stats = await statsResponse.json();
      setComplianceStats(stats);

      // Violations abrufen
      const params = new URLSearchParams();
      if (violationFilter === 'unresolved') params.append('resolved', 'false');
      if (violationFilter === 'critical') {
        params.append('resolved', 'false');
        params.append('severity', 'CRITICAL');
      }

      const violationsUrl = `${API_URL}/api/compliance/violations?${params}`;
      const violationsResponse = await fetch(violationsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const violationsData = await violationsResponse.json();
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
    <div className="admin-dashboard">
      <nav className="navbar">
        <div className="navbar-left">
          <img src="/images/logo.png" alt="CFlux" className="navbar-logo" />
          <h1>{user?.role === 'ADMIN' ? 'Admin Panel' : 'Verwaltung'}</h1>
        </div>
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

      <div className="admin-container">
        <div className="admin-card">
          <div className="tab-navigation">
            {(user?.role === 'ADMIN' || hasModuleAccess('users')) && (
              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                label="👥 Benutzer"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('user_groups')) && (
              <TabButton
                active={activeTab === 'userGroups'}
                onClick={() => setActiveTab('userGroups')}
                label="👨‍👩‍👧‍👦 Benutzergruppen"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('projects')) && (
              <TabButton
                active={activeTab === 'projects'}
                onClick={() => setActiveTab('projects')}
                label="📁 Projekte"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('locations')) && (
              <TabButton
                active={activeTab === 'locations'}
                onClick={() => setActiveTab('locations')}
                label="📍 Standorte"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('customers')) && (
              <TabButton
                active={activeTab === 'customers'}
                onClick={() => setActiveTab('customers')}
                label="🤝 Kunden"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('suppliers')) && (
              <TabButton
                active={activeTab === 'suppliers'}
                onClick={() => setActiveTab('suppliers')}
                label="🚚 Lieferanten"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('articles')) && (
              <TabButton
                active={activeTab === 'articleGroups'}
                onClick={() => setActiveTab('articleGroups')}
                label="📦 Artikelgruppen"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('articles')) && (
              <TabButton
                active={activeTab === 'articles'}
                onClick={() => setActiveTab('articles')}
                label="🏷️ Artikel"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('invoices')) && (
              <TabButton
                active={activeTab === 'invoices'}
                onClick={() => setActiveTab('invoices')}
                label="📄 Rechnungen"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('invoices')) && (
              <TabButton
                active={activeTab === 'invoiceTemplates'}
                onClick={() => setActiveTab('invoiceTemplates')}
                label="📋 Rechnungsvorlagen"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('reminders')) && (
              <TabButton
                active={activeTab === 'reminders'}
                onClick={() => setActiveTab('reminders')}
                label="💰 Mahnwesen"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('absences')) && (
              <TabButton
                active={activeTab === 'absences'}
                onClick={() => setActiveTab('absences')}
                label="🏖️ Abwesenheiten"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('time_tracking')) && (
              <TabButton
                active={activeTab === 'timeEntries'}
                onClick={() => setActiveTab('timeEntries')}
                label="⏱️ Zeiteinträge"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (
              <TabButton
                active={activeTab === 'reports'}
                onClick={() => setActiveTab('reports')}
                label="📊 Reports"
              />
            )}
            {user?.role === 'ADMIN' && (
              <TabButton
                active={activeTab === 'backup'}
                onClick={() => setActiveTab('backup')}
                label="💾 Backup"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('absences')) && (
              <TabButton
                active={activeTab === 'vacationPlanner'}
                onClick={() => setActiveTab('vacationPlanner')}
                label="🗓️ Urlaubsplaner"
              />
            )}
            {user?.role === 'ADMIN' && (
              <TabButton
                active={activeTab === 'holidays'}
                onClick={() => setActiveTab('holidays')}
                label="🗓️ Feiertage"
              />
            )}
            {(user?.role === 'ADMIN' || hasModuleAccess('compliance')) && (
              <TabButton
                active={activeTab === 'compliance'}
                onClick={() => setActiveTab('compliance')}
                label="🇨🇭 Compliance"
              />
            )}
            {user?.role === 'ADMIN' && (
              <TabButton
                active={activeTab === 'modules'}
                onClick={() => setActiveTab('modules')}
                label="🧩 Module"
              />
            )}
            {user?.role === 'ADMIN' && (
              <TabButton
                active={activeTab === 'modulePermissions'}
                onClick={() => setActiveTab('modulePermissions')}
                label="🔐 Berechtigungen"
              />
            )}
          </div>

          <div className="tab-content">
            {activeTab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
            {activeTab === 'userGroups' && <UserGroupsTab onLoad={loadData} />}
            {activeTab === 'projects' && <ProjectsTab projects={projects} onUpdate={loadData} />}
            {activeTab === 'locations' && <LocationsTab locations={locations} onUpdate={loadData} />}
            {activeTab === 'customers' && <CustomersTab customers={customers} onUpdate={loadData} />}
            {activeTab === 'suppliers' && <SuppliersTab suppliers={suppliers} onUpdate={loadData} />}
            {activeTab === 'articleGroups' && <ArticleGroupsTab articleGroups={articleGroups} onUpdate={loadData} />}
            {activeTab === 'articles' && <ArticlesTab articles={articles} articleGroups={articleGroups} onUpdate={loadData} />}
            {activeTab === 'invoices' && <InvoicesTab invoices={invoices} customers={customers} articles={articles} onUpdate={loadData} />}
            {activeTab === 'invoiceTemplates' && <InvoiceTemplatesTab />}
            {activeTab === 'reminders' && <RemindersTab reminders={reminders} overdueInvoices={overdueInvoices} stats={reminderStats} onUpdate={loadData} />}
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
            {activeTab === 'modules' && <ModulesPage embedded />}
            {activeTab === 'modulePermissions' && <ModulePermissionsPage embedded />}
          </div>
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
    className={`tab-button ${active ? 'active' : ''}`}
  >
    {label}
  </button>
);

export default AdminDashboard;
