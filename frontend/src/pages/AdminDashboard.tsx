import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  OrdersTab,
  ELearningManagementTab
} from '../components/admin';
import OnboardingTab from '../components/admin/OnboardingTab';
import JobFunctionsTab from '../components/admin/JobFunctionsTab';
import { TimeBookingsReport } from '../components/admin/TimeBookingsReport';
import { UserTimeBookingsReport } from '../components/admin/UserTimeBookingsReport';
import WorkflowsTab from '../components/admin/WorkflowsTab';
import WorkflowActionsTab from '../components/admin/WorkflowActionsTab';
import CostCentersTab from '../components/tabs/CostCentersTab';
import InventoryTab from '../components/tabs/InventoryTab';
import ProjectBudgetTab from '../components/tabs/ProjectBudgetTab';
import ProjectReportsTab from '../components/tabs/ProjectReportsTab';
import ProjectPlanningTab from '../components/tabs/ProjectPlanningTab';
import SystemSettingsTab from '../components/admin/SystemSettingsTab';
import ModulesPage from './ModulesPage';
import ModulePermissionsPage from './ModulePermissionsPage';
import PayrollManagement from './PayrollManagement';
import ZeitmodelleVerwaltung from './ZeitmodelleVerwaltung';
import '../App.css';
import './AdminDashboard.css';

type TabType = 'users' | 'userGroups' | 'projects' | 'locations' | 'customers' | 'suppliers' | 'orders' | 'articleGroups' | 'articles' | 'invoices' | 'invoiceTemplates' | 'reminders' | 'absences' | 'timeEntries' | 'reports' | 'timeBookings' | 'userTimeBookings' | 'backup' | 'vacationPlanner' | 'holidays' | 'compliance' | 'modules' | 'modulePermissions' | 'workflows' | 'workflowActions' | 'settings' | 'payroll' | 'devices' | 'travelExpenses' | 'costCenters' | 'inventory' | 'projectBudget' | 'projectReports' | 'projectPlanning' | 'zeitmodelle' | 'elearning' | 'onboarding' | 'jobFunctions';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasModuleAccess } = useModules();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'users');
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
  const [searchFilter, setSearchFilter] = useState<string>('');

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

  // Funktion zum Wechseln des Tabs mit URL-Update
  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Filterfunktion für Tabs und Gruppen
  const matchesSearch = (text: string): boolean => {
    if (!searchFilter) return true;
    return text.toLowerCase().includes(searchFilter.toLowerCase());
  };

  const shouldShowGroup = (groupName: string, itemLabels: string[]): { show: boolean; showAll: boolean } => {
    if (!searchFilter) return { show: true, showAll: true };
    
    // Prüfe ob Gruppenname matched
    const groupMatched = matchesSearch(groupName);
    if (groupMatched) return { show: true, showAll: true };
    
    // Prüfe ob mindestens ein Item matched
    const itemMatched = itemLabels.some(label => matchesSearch(label));
    return { show: itemMatched, showAll: false };
  };

  // Synchronisiere activeTab mit URL
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Tab-Namen Mapping für den Titel
  const getTabTitle = (tab: TabType): string => {
    const titles: Record<TabType, string> = {
      users: 'Benutzer',
      userGroups: 'Benutzergruppen',
      projects: 'Projekte',
      locations: 'Standorte',
      timeEntries: 'Zeiteinträge',
      absences: 'Abwesenheiten',
      vacationPlanner: 'Urlaubsplaner',
      holidays: 'Feiertage',
      invoices: 'Rechnungen',
      invoiceTemplates: 'Rechnungsvorlagen',
      articles: 'Artikel',
      articleGroups: 'Artikelgruppen',
      customers: 'Kunden',
      suppliers: 'Lieferanten',
      reports: 'Berichte',
      compliance: 'Compliance',
      devices: 'Geräte',
      inventory: 'Inventar',
      workflows: 'Workflows',
      settings: 'Einstellungen',
      travelExpenses: 'Reisespesen',
      orders: 'Bestellungen',
      reminders: 'Mahnungen',
      timeBookings: 'Zeitbuchungen',
      userTimeBookings: 'Benutzer-Zeitbuchungen',
      backup: 'Backup',
      modules: 'Module',
      modulePermissions: 'Modulberechtigungen',
      workflowActions: 'Workflow-Aktionen',
      payroll: 'Lohnabrechnung',
      costCenters: 'Kostenstellen',
      projectBudget: 'Projektbudget',
      projectReports: 'Projektberichte',
      projectPlanning: 'Projektplanung',
      zeitmodelle: 'Zeitmodelle',
      elearning: 'E-Learning',
      onboarding: 'Onboarding',
      jobFunctions: 'Funktionen'
    };
    return titles[tab] || tab;
  };

  // Update Browser-Titel bei Tab-Wechsel
  useEffect(() => {
    const tabTitle = getTabTitle(activeTab);
    document.title = `${tabTitle} - Admin Panel`;
  }, [activeTab]);

  // Sicherheitsprüfung: Nur Admins oder Benutzer mit Modulzugriff
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Prüfe ob User Admin ist oder mindestens ein Admin-Modul hat
    if (user.role !== 'ADMIN') {
      const adminModules = [
        'users', 'user_groups', 'locations', 'departments',
        'time_tracking', 'absences', 'projects', 'invoices',
        'customers', 'suppliers', 'orders', 'articles',
        'inventory', 'devices', 'cost_centers', 'reminders',
        'zeitmodelle', 'incidents', 'media', 'intranet'
      ];
      
      const hasAnyAdminAccess = adminModules.some(moduleKey => hasModuleAccess(moduleKey));
      
      if (!hasAnyAdminAccess) {
        alert('Sie haben keine Berechtigung für diesen Bereich.');
        navigate('/');
        return;
      }
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
        case 'orders':
          // Load suppliers needed for orders
          const orderSuppliers = await supplierService.getAllSuppliers();
          setSuppliers(orderSuppliers);
          break;
        case 'costCenters':
          // Cost centers load their own data
          break;
        case 'inventory':
          // Inventory loads its own data
          break;
        case 'projectBudget':
          // Project budget loads its own data
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
        title={`${user?.role === 'ADMIN' ? 'Admin Panel' : 'Verwaltung'} - ${getTabTitle(activeTab)}`} 
        currentTime={currentTime}
        onLogout={handleLogout}
        showLogo={true}
        logoSrc={logo}
      />

      <div className="admin-container">
        <div className="admin-card">
          {/* Left sidebar with search and navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '280px', flexShrink: 0, background: 'var(--bg-secondary)' }}>
            {/* Search Filter */}
            <div style={{ padding: '16px 16px 12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <input
                type="text"
                placeholder="Nach Kategorie oder Modul suchen..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div className="tab-navigation">
            {/* Benutzerverwaltung */}
            {(() => {
              const groupCheck = shouldShowGroup('Benutzer Teams', ['Benutzer', 'Gruppen', 'Standorte']);
              return groupCheck.show && (
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
                  {(user?.role === 'ADMIN' || hasModuleAccess('users')) && (groupCheck.showAll || matchesSearch('Benutzer')) && (
                    <TabButton
                      active={activeTab === 'users'}
                      onClick={() => changeTab('users')}
                      label="👥 Benutzer"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('user_groups')) && (groupCheck.showAll || matchesSearch('Gruppen')) && (
                    <TabButton
                      active={activeTab === 'userGroups'}
                      onClick={() => changeTab('userGroups')}
                      label="👨‍👩‍👧‍👦 Gruppen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('locations')) && (groupCheck.showAll || matchesSearch('Standorte')) && (
                    <TabButton
                      active={activeTab === 'locations'}
                      onClick={() => changeTab('locations')}
                      label="📍 Standorte"
                    />
                  )}
                </>
              )}
            </div>
            );})()}

            {/* Zeiterfassung & Abwesenheit */}
            {(() => {
              const groupCheck = shouldShowGroup('Zeit Abwesenheit', ['Zeiteinträge', 'Abwesenheiten', 'Urlaubsplaner', 'Feiertage']);
              return groupCheck.show && (
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
                  {(user?.role === 'ADMIN' || hasModuleAccess('time_tracking')) && (groupCheck.showAll || matchesSearch('Zeiteinträge')) && (
                    <TabButton
                      active={activeTab === 'timeEntries'}
                      onClick={() => changeTab('timeEntries')}
                      label="⏱️ Zeiteinträge"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('absences')) && (groupCheck.showAll || matchesSearch('Abwesenheiten')) && (
                    <TabButton
                      active={activeTab === 'absences'}
                      onClick={() => changeTab('absences')}
                      label="🏖️ Abwesenheiten"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('absences')) && (groupCheck.showAll || matchesSearch('Urlaubsplaner')) && (
                    <TabButton
                      active={activeTab === 'vacationPlanner'}
                      onClick={() => changeTab('vacationPlanner')}
                      label="🗓️ Urlaubsplaner"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Feiertage')) && (
                    <TabButton
                      active={activeTab === 'holidays'}
                      onClick={() => changeTab('holidays')}
                      label="🎄 Feiertage"
                    />
                  )}
                </>
              )}
            </div>
            );})()}

            {/* Finanzen & Rechnungen */}
            {(() => {
              const groupCheck = shouldShowGroup('Finanzen', ['Rechnungen', 'Vorlagen', 'Mahnwesen', 'Reisekosten', 'Lohnabrechnung', 'Zeitmodelle']);
              return groupCheck.show && (
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
                  {(user?.role === 'ADMIN' || hasModuleAccess('invoices')) && (groupCheck.showAll || matchesSearch('Rechnungen')) && (
                    <TabButton
                      active={activeTab === 'invoices'}
                      onClick={() => changeTab('invoices')}
                      label="📄 Rechnungen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('invoices')) && (groupCheck.showAll || matchesSearch('Vorlagen')) && (
                    <TabButton
                      active={activeTab === 'invoiceTemplates'}
                      onClick={() => changeTab('invoiceTemplates')}
                      label="📋 Vorlagen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reminders')) && (groupCheck.showAll || matchesSearch('Mahnwesen')) && (
                    <TabButton
                      active={activeTab === 'reminders'}
                      onClick={() => changeTab('reminders')}
                      label="💰 Mahnwesen"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Reisekosten')) && (
                    <TabButton
                      active={activeTab === 'travelExpenses'}
                      onClick={() => changeTab('travelExpenses')}
                      label="✈️ Reisekosten"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Lohnabrechnung')) && (
                    <TabButton
                      active={activeTab === 'payroll'}
                      onClick={() => changeTab('payroll')}
                      label="💵 Lohnabrechnung"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('zeitmodelle')) && (groupCheck.showAll || matchesSearch('Zeitmodelle')) && (
                    <TabButton
                      active={activeTab === 'zeitmodelle'}
                      onClick={() => changeTab('zeitmodelle')}
                      label="🕒 Zeitmodelle"
                    />
                  )}
                </>
              )}
            </div>
            );})()}

            {/* Stammdaten */}
            {(() => {
              const groupCheck = shouldShowGroup('Stammdaten', ['Kunden', 'Lieferanten', 'Bestellungen', 'Artikelgruppen', 'Artikel', 'Geräte', 'Kostenstellen', 'Lagerbestand', 'Inventar']);
              return groupCheck.show && (
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
                  {(user?.role === 'ADMIN' || hasModuleAccess('customers')) && (groupCheck.showAll || matchesSearch('Kunden')) && (
                    <TabButton
                      active={activeTab === 'customers'}
                      onClick={() => changeTab('customers')}
                      label="🤝 Kunden"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('suppliers')) && (groupCheck.showAll || matchesSearch('Lieferanten')) && (
                    <TabButton
                      active={activeTab === 'suppliers'}
                      onClick={() => changeTab('suppliers')}
                      label="🚚 Lieferanten"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('orders')) && (groupCheck.showAll || matchesSearch('Bestellungen')) && (
                    <TabButton
                      active={activeTab === 'orders'}
                      onClick={() => changeTab('orders')}
                      label="📦 Bestellungen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('articles')) && (groupCheck.showAll || matchesSearch('Artikelgruppen')) && (
                    <TabButton
                      active={activeTab === 'articleGroups'}
                      onClick={() => changeTab('articleGroups')}
                      label="📦 Artikelgruppen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('articles')) && (groupCheck.showAll || matchesSearch('Artikel')) && (
                    <TabButton
                      active={activeTab === 'articles'}
                      onClick={() => changeTab('articles')}
                      label="🏷️ Artikel"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Geräte')) && (
                    <TabButton
                      active={activeTab === 'devices'}
                      onClick={() => changeTab('devices')}
                      label="💻 Geräte"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('cost_centers')) && (groupCheck.showAll || matchesSearch('Kostenstellen')) && (
                    <TabButton
                      active={activeTab === 'costCenters'}
                      onClick={() => changeTab('costCenters')}
                      label="💰 Kostenstellen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('inventory')) && (groupCheck.showAll || matchesSearch('Lagerbestand Inventar')) && (
                    <TabButton
                      active={activeTab === 'inventory'}
                      onClick={() => changeTab('inventory')}
                      label="📦 Lagerbestand"
                    />
                  )}
                </>
              )}
            </div>
            );})()}

            {/* Projektmanagement */}
            {(() => {
              const groupCheck = shouldShowGroup('Projektmanagement Projekt', ['Projekte', 'Budget', 'Reports', 'Planung']);
              return groupCheck.show && (
            <div className="tab-group">
              <div 
                className="tab-group-label" 
                onClick={() => toggleGroup('projects')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ marginRight: '6px' }}>
                  {collapsedGroups.has('projects') ? '▶' : '▼'}
                </span>
                Projektmanagement
              </div>
              {!collapsedGroups.has('projects') && (
                <>
                  {(user?.role === 'ADMIN' || hasModuleAccess('projects')) && (groupCheck.showAll || matchesSearch('Projekte')) && (
                    <TabButton
                      active={activeTab === 'projects'}
                      onClick={() => changeTab('projects')}
                      label="📁 Projekte"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('project_budget')) && (groupCheck.showAll || matchesSearch('Projekt Budget')) && (
                    <TabButton
                      active={activeTab === 'projectBudget'}
                      onClick={() => changeTab('projectBudget')}
                      label="💼 Projekt-Budget"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('project_reports')) && (groupCheck.showAll || matchesSearch('Projekt Reports')) && (
                    <TabButton
                      active={activeTab === 'projectReports'}
                      onClick={() => changeTab('projectReports')}
                      label="📊 Projekt-Reports"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('project_planning')) && (groupCheck.showAll || matchesSearch('Projektplanung')) && (
                    <TabButton
                      active={activeTab === 'projectPlanning'}
                      onClick={() => changeTab('projectPlanning')}
                      label="📅 Projektplanung"
                    />
                  )}
                </>
              )}
            </div>
            );})()}

            {/* Reports & Auswertungen */}
            {(() => {
              const groupCheck = shouldShowGroup('Reports Auswertungen', ['Analytics', 'Stunden', 'Compliance']);
              return groupCheck.show && (
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
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (groupCheck.showAll || matchesSearch('Analytics')) && (
                    <TabButton
                      active={activeTab === 'reports'}
                      onClick={() => changeTab('reports')}
                      label="📊 Analytics"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (groupCheck.showAll || matchesSearch('Stunden Alle')) && (
                    <TabButton
                      active={activeTab === 'timeBookings'}
                      onClick={() => changeTab('timeBookings')}
                      label="📋 Stunden (Alle)"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (groupCheck.showAll || matchesSearch('Stunden User')) && (
                    <TabButton
                      active={activeTab === 'userTimeBookings'}
                      onClick={() => changeTab('userTimeBookings')}
                      label="👤 Stunden (User)"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('compliance')) && (groupCheck.showAll || matchesSearch('Compliance')) && (
                    <TabButton
                      active={activeTab === 'compliance'}
                      onClick={() => changeTab('compliance')}
                      label="🇨🇭 Compliance"
                    />
                  )}
                </>
              )}
            </div>
            );})()}

            {/* System & Konfiguration */}
            {(() => {
              const groupCheck = shouldShowGroup('System Konfiguration', ['Workflows', 'Module', 'Berechtigungen', 'Einstellungen', 'E-Learning', 'Onboarding', 'Funktionen', 'Backup']);
              return groupCheck.show && (
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
                  {(user?.role === 'ADMIN' || hasModuleAccess('workflows')) && (groupCheck.showAll || matchesSearch('Workflows')) && (
                    <TabButton
                      active={activeTab === 'workflows'}
                      onClick={() => changeTab('workflows')}
                      label="🔄 Workflows"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Workflow Actions')) && (
                    <TabButton                      active={activeTab === 'workflowActions'}
                      onClick={() => changeTab('workflowActions')}
                      label="⚡ Workflow Actions"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Module')) && (
                    <TabButton                      active={activeTab === 'modules'}
                      onClick={() => changeTab('modules')}
                      label="🧩 Module"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Berechtigungen')) && (
                    <TabButton
                      active={activeTab === 'modulePermissions'}
                      onClick={() => changeTab('modulePermissions')}
                      label="🔐 Berechtigungen"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Einstellungen')) && (
                    <TabButton
                      active={activeTab === 'settings'}
                      onClick={() => changeTab('settings')}
                      label="⚙️ Einstellungen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('elearning')) && (groupCheck.showAll || matchesSearch('E-Learning')) && (
                    <TabButton
                      active={activeTab === 'elearning'}
                      onClick={() => changeTab('elearning')}
                      label="🎓 E-Learning"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('onboarding')) && (groupCheck.showAll || matchesSearch('Onboarding')) && (
                    <TabButton
                      active={activeTab === 'onboarding'}
                      onClick={() => changeTab('onboarding')}
                      label="👤 Onboarding"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('job_functions')) && (groupCheck.showAll || matchesSearch('Funktionen')) && (
                    <TabButton
                      active={activeTab === 'jobFunctions'}
                      onClick={() => changeTab('jobFunctions')}
                      label="💼 Funktionen"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Backup')) && (
                    <TabButton
                      active={activeTab === 'backup'}
                      onClick={() => changeTab('backup')}
                      label="💾 Backup"
                    />
                  )}
                </>
              )}
            </div>
            );})()}
          </div>
          </div>

          <div className="tab-content">
            {activeTab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
            {activeTab === 'userGroups' && <UserGroupsTab onLoad={loadData} />}
            {activeTab === 'projects' && <ProjectsTab projects={projects} onUpdate={loadData} />}
            {activeTab === 'locations' && <LocationsTab locations={locations} onUpdate={loadData} />}
            {activeTab === 'devices' && <DevicesTab devices={devices} users={users} onUpdate={loadData} />}
            {activeTab === 'travelExpenses' && <TravelExpensesTab expenses={travelExpenses} users={users} onUpdate={loadData} />}
            {activeTab === 'costCenters' && <CostCentersTab onUpdate={loadData} />}
            {activeTab === 'inventory' && <InventoryTab onUpdate={loadData} />}
            {activeTab === 'projectBudget' && <ProjectBudgetTab />}
            {activeTab === 'projectReports' && <ProjectReportsTab />}
            {activeTab === 'projectPlanning' && <ProjectPlanningTab onUpdate={loadData} />}
            {activeTab === 'elearning' && <ELearningManagementTab onUpdate={loadData} />}
            {activeTab === 'onboarding' && <OnboardingTab onUpdate={loadData} />}
            {activeTab === 'jobFunctions' && <JobFunctionsTab onUpdate={loadData} />}
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
            {activeTab === 'workflowActions' && <WorkflowActionsTab />}
            {activeTab === 'settings' && <SystemSettingsTab />}
            {activeTab === 'payroll' && <PayrollManagement />}
            {activeTab === 'zeitmodelle' && <ZeitmodelleVerwaltung />}
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
