import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import { useModules } from '../contexts/ModuleContext';
import AppNavbar from '../components/AppNavbar';
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
import { deviceService, Device } from '../services/device.service';
import { travelExpenseService } from '../services/travelExpense.service';
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
  RemindersTab,
  DevicesTab,
  TravelExpensesTab,
  OrdersTab
} from '../components/admin';
import { TimeBookingsReport } from '../components/admin/TimeBookingsReport';
import { UserTimeBookingsReport } from '../components/admin/UserTimeBookingsReport';
import WorkflowsTab from '../components/admin/WorkflowsTab';
import SystemSettingsTab from '../components/admin/SystemSettingsTab';
import ModulesPage from './ModulesPage';
import ModulePermissionsPage from './ModulePermissionsPage';
import PayrollManagement from './PayrollManagement';
import '../App.css';
import './AdminDashboard.css';

type TabType = 'users' | 'userGroups' | 'projects' | 'locations' | 'customers' | 'suppliers' | 'orders' | 'articleGroups' | 'articles' | 'invoices' | 'invoiceTemplates' | 'reminders' | 'absences' | 'timeEntries' | 'reports' | 'timeBookings' | 'userTimeBookings' | 'backup' | 'vacationPlanner' | 'holidays' | 'compliance' | 'modules' | 'modulePermissions' | 'workflows' | 'settings' | 'payroll' | 'devices' | 'travelExpenses';

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
  const [devices, setDevices] = useState<Device[]>([]);
  const [travelExpenses, setTravelExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Sicherheitsprüfung: Nur Admins oder Benutzer mit Modulzugriff
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Zusätzliche Sicherheitsebene - prüfe ob der User überhaupt Zugriff haben sollte
    if (user.role !== 'ADMIN' && !hasModuleAccess('users') && !hasModuleAccess('projects')) {
      alert('Sie haben keine Berechtigung für diesen Bereich.');
      navigate('/');
    }
  }, [user, navigate, hasModuleAccess]);

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
          const usersData = await userService.getAllUsersAdmin();
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
        case 'devices':
          const devicesData = await deviceService.getAllDevices();
          setDevices(devicesData);
          break;
        case 'travelExpenses':
          const expensesData = await travelExpenseService.getAllTravelExpenses();
          setTravelExpenses(expensesData);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadComplianceData = async () => {
    try {
      const electronBackendUrl = typeof window !== 'undefined' && (window as any).ELECTRON_BACKEND_URL;
      const API_URL = electronBackendUrl || process.env.REACT_APP_API_URL || '';
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
      const electronBackendUrl = typeof window !== 'undefined' && (window as any).ELECTRON_BACKEND_URL;
      const API_URL = electronBackendUrl || process.env.REACT_APP_API_URL || '';
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
      <AppNavbar 
        title={user?.role === 'ADMIN' ? 'Admin Panel' : 'Verwaltung'} 
        currentTime={currentTime}
        onLogout={handleLogout}
        showLogo={true}
        logoSrc={logo}
      />

      <div className="admin-container">
        <div className="admin-card">
          <div className="tab-navigation">
            {/* Benutzerverwaltung */}
            <div className="tab-group">
              <div 
                className="tab-group-label" 
                onClick={() => toggleGroup('users')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ marginRight: '6px' }}>
                  {collapsedGroups.has('users') ? '▶' : '▼'}
                </span>
                Benutzer & Teams
              </div>
              {!collapsedGroups.has('users') && (
                <>
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
                      label="👨‍👩‍👧‍👦 Gruppen"
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
                </>
              )}
            </div>

            {/* Zeiterfassung & Abwesenheit */}
            <div className="tab-group">
              <div 
                className="tab-group-label" 
                onClick={() => toggleGroup('time')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ marginRight: '6px' }}>
                  {collapsedGroups.has('time') ? '▶' : '▼'}
                </span>
                Zeit & Abwesenheit
              </div>
              {!collapsedGroups.has('time') && (
                <>
                  {(user?.role === 'ADMIN' || hasModuleAccess('time_tracking')) && (
                    <TabButton
                      active={activeTab === 'timeEntries'}
                      onClick={() => setActiveTab('timeEntries')}
                      label="⏱️ Zeiteinträge"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('absences')) && (
                    <TabButton
                      active={activeTab === 'absences'}
                      onClick={() => setActiveTab('absences')}
                      label="🏖️ Abwesenheiten"
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
                      label="🎄 Feiertage"
                    />
                  )}
                </>
              )}
            </div>

            {/* Finanzen & Rechnungen */}
            <div className="tab-group">
              <div 
                className="tab-group-label" 
                onClick={() => toggleGroup('finance')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ marginRight: '6px' }}>
                  {collapsedGroups.has('finance') ? '▶' : '▼'}
                </span>
                Finanzen
              </div>
              {!collapsedGroups.has('finance') && (
                <>
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
                      label="📋 Vorlagen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reminders')) && (
                    <TabButton
                      active={activeTab === 'reminders'}
                      onClick={() => setActiveTab('reminders')}
                      label="💰 Mahnwesen"
                    />
                  )}
                  {user?.role === 'ADMIN' && (
                    <TabButton
                      active={activeTab === 'travelExpenses'}
                      onClick={() => setActiveTab('travelExpenses')}
                      label="✈️ Reisekosten"
                    />
                  )}
                  {user?.role === 'ADMIN' && (
                    <TabButton
                      active={activeTab === 'payroll'}
                      onClick={() => setActiveTab('payroll')}
                      label="💵 Lohnabrechnung"
                    />
                  )}
                </>
              )}
            </div>

            {/* Stammdaten */}
            <div className="tab-group">
              <div 
                className="tab-group-label" 
                onClick={() => toggleGroup('master')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ marginRight: '6px' }}>
                  {collapsedGroups.has('master') ? '▶' : '▼'}
                </span>
                Stammdaten
              </div>
              {!collapsedGroups.has('master') && (
                <>
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
                  {(user?.role === 'ADMIN' || hasModuleAccess('orders')) && (
                    <TabButton
                      active={activeTab === 'orders'}
                      onClick={() => setActiveTab('orders')}
                      label="📦 Bestellungen"
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
                  {user?.role === 'ADMIN' && (
                    <TabButton
                      active={activeTab === 'devices'}
                      onClick={() => setActiveTab('devices')}
                      label="💻 Geräte"
                    />
                  )}
                </>
              )}
            </div>

            {/* Reports & Auswertungen */}
            <div className="tab-group">
              <div 
                className="tab-group-label" 
                onClick={() => toggleGroup('reports')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ marginRight: '6px' }}>
                  {collapsedGroups.has('reports') ? '▶' : '▼'}
                </span>
                Reports
              </div>
              {!collapsedGroups.has('reports') && (
                <>
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (
                    <TabButton
                      active={activeTab === 'reports'}
                      onClick={() => setActiveTab('reports')}
                      label="📊 Analytics"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (
                    <TabButton
                      active={activeTab === 'timeBookings'}
                      onClick={() => setActiveTab('timeBookings')}
                      label="📋 Stunden (Alle)"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (
                    <TabButton
                      active={activeTab === 'userTimeBookings'}
                      onClick={() => setActiveTab('userTimeBookings')}
                      label="👤 Stunden (User)"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('compliance')) && (
                    <TabButton
                      active={activeTab === 'compliance'}
                      onClick={() => setActiveTab('compliance')}
                      label="🇨🇭 Compliance"
                    />
                  )}
                </>
              )}
            </div>

            {/* System & Konfiguration */}
            <div className="tab-group">
              <div 
                className="tab-group-label" 
                onClick={() => toggleGroup('system')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ marginRight: '6px' }}>
                  {collapsedGroups.has('system') ? '▶' : '▼'}
                </span>
                System
              </div>
              {!collapsedGroups.has('system') && (
                <>
                  {(user?.role === 'ADMIN' || hasModuleAccess('workflows')) && (
                    <TabButton
                      active={activeTab === 'workflows'}
                      onClick={() => setActiveTab('workflows')}
                      label="🔄 Workflows"
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
                  {user?.role === 'ADMIN' && (
                    <TabButton
                      active={activeTab === 'settings'}
                      onClick={() => setActiveTab('settings')}
                      label="⚙️ Einstellungen"
                    />
                  )}
                  {user?.role === 'ADMIN' && (
                    <TabButton
                      active={activeTab === 'backup'}
                      onClick={() => setActiveTab('backup')}
                      label="💾 Backup"
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="tab-content">
            {activeTab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
            {activeTab === 'userGroups' && <UserGroupsTab onLoad={loadData} />}
            {activeTab === 'projects' && <ProjectsTab projects={projects} onUpdate={loadData} />}
            {activeTab === 'locations' && <LocationsTab locations={locations} onUpdate={loadData} />}
            {activeTab === 'devices' && <DevicesTab devices={devices} users={users} onUpdate={loadData} />}
            {activeTab === 'travelExpenses' && <TravelExpensesTab expenses={travelExpenses} users={users} onUpdate={loadData} />}
            {activeTab === 'customers' && <CustomersTab customers={customers} onUpdate={loadData} />}
            {activeTab === 'suppliers' && <SuppliersTab suppliers={suppliers} onUpdate={loadData} />}
            {activeTab === 'orders' && <OrdersTab suppliers={suppliers} onUpdate={loadData} />}
            {activeTab === 'articleGroups' && <ArticleGroupsTab articleGroups={articleGroups} onUpdate={loadData} />}
            {activeTab === 'articles' && <ArticlesTab articles={articles} articleGroups={articleGroups} onUpdate={loadData} />}
            {activeTab === 'invoices' && <InvoicesTab invoices={invoices} customers={customers} articles={articles} onUpdate={loadData} />}
            {activeTab === 'invoiceTemplates' && <InvoiceTemplatesTab />}
            {activeTab === 'reminders' && <RemindersTab reminders={reminders} overdueInvoices={overdueInvoices} stats={reminderStats} onUpdate={loadData} />}
            {activeTab === 'absences' && <AbsencesTab absences={absences} onUpdate={loadData} />}
            {activeTab === 'timeEntries' && <TimeEntriesTab />}
            {activeTab === 'reports' && <ReportsTab reports={reports} />}
            {activeTab === 'timeBookings' && <TimeBookingsReport />}
            {activeTab === 'userTimeBookings' && <UserTimeBookingsReport />}
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
            {activeTab === 'workflows' && <WorkflowsTab />}
            {activeTab === 'settings' && <SystemSettingsTab />}
            {activeTab === 'payroll' && <PayrollManagement />}
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
