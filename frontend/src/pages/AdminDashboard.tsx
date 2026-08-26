import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import { useModules } from '../contexts/ModuleContext';
import { useShortcuts } from '../contexts/ShortcutsContext';
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
import { werkzeugeService, Tool } from '../services/werkzeuge.service';
import { contactService, Contact, ContactGroup } from '../services/contact.service';
import { userGroupService, UserGroup } from '../services/userGroup.service';
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
  ApiKeysTab,
  HolidaysTab,
  ComplianceTab,
  ArticleGroupsTab,
  ArticlesTab,
  InvoiceTemplatesTab,
  InvoicesTab,
  RemindersTab,
  DevicesTab,
  SoftwareReportTab,
  ContactsTab,
  TravelExpensesTab,
  OrdersTab,
  ELearningManagementTab,
  DepartmentsTab
} from '../components/admin';
import OnboardingTab from '../components/admin/OnboardingTab';
import OnboardingEmployeesSubTab from '../components/admin/OnboardingEmployeesSubTab';
import OrgChartTab from '../components/admin/OrgChartTab';
import ChecklistsTab from '../components/admin/ChecklistsTab';
import JobFunctionsTab from '../components/admin/JobFunctionsTab';
import NewsTab from '../components/AdminTabs/NewsTab';
import { WerkzeugeTab } from '../components/admin/WerkzeugeTab';
import HilfsmittelTab from '../components/admin/HilfsmittelTab';
import InformationenTab from '../components/admin/InformationenTab';
import IntranetPage from './Intranet/IntranetPage';
import { TimeBookingsReport } from '../components/admin/TimeBookingsReport';
import { UserTimeBookingsReport } from '../components/admin/UserTimeBookingsReport';
import BusinessReportTab from '../components/admin/BusinessReportTab';
import WorkflowsTab from '../components/admin/WorkflowsTab';
import WorkflowActionsTab from '../components/admin/WorkflowActionsTab';
import SystemLogsTab from '../components/admin/SystemLogsTab';
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

type TabType = 'users' | 'userGroups' | 'projects' | 'locations' | 'customers' | 'suppliers' | 'departments' | 'orgChart' | 'orders' | 'articleGroups' | 'articles' | 'invoices' | 'invoiceTemplates' | 'reminders' | 'absences' | 'timeEntries' | 'reports' | 'timeBookings' | 'userTimeBookings' | 'businessReport' | 'backup' | 'vacationPlanner' | 'holidays' | 'compliance' | 'modules' | 'modulePermissions' | 'workflows' | 'workflowActions' | 'systemLogs' | 'settings' | 'payroll' | 'devices' | 'softwareReport' | 'travelExpenses' | 'costCenters' | 'inventory' | 'projectBudget' | 'projectReports' | 'projectPlanning' | 'zeitmodelle' | 'elearning' | 'onboarding' | 'onboardingEmployees' | 'jobFunctions' | 'checklists' | 'news' | 'dokumente' | 'werkzeuge' | 'hilfsmittel' | 'informationen' | 'contacts' | 'apiKeys';

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [travelExpenses, setTravelExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

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
      departments: 'Abteilungen',
      orgChart: 'Organigramm',
      reports: 'Berichte',
      compliance: 'Compliance',
      devices: 'Geräte',
      softwareReport: 'Software',
      inventory: 'Inventar',
      workflows: 'Workflows',
      settings: 'Einstellungen',
      travelExpenses: 'Reisespesen',
      orders: 'Bestellungen',
      reminders: 'Mahnungen',
      timeBookings: 'Zeitbuchungen',
      userTimeBookings: 'Benutzer-Zeitbuchungen',
      businessReport: 'Geschäftsbericht',
      backup: 'Backup',
      modules: 'Module',
      modulePermissions: 'Modulberechtigungen',
      workflowActions: 'Workflow-Aktionen',
      systemLogs: 'System Logs',
      payroll: 'Lohnabrechnung',
      costCenters: 'Kostenstellen',
      projectBudget: 'Projektbudget',
      projectReports: 'Projektberichte',
      projectPlanning: 'Projektplanung',
      zeitmodelle: 'Zeitmodelle',
      elearning: 'E-Learning',
      onboarding: 'Onboarding',
      onboardingEmployees: 'Mitarbeiterliste',
      jobFunctions: 'Funktionen',
      checklists: 'Checklisten',
      news: 'News',
      dokumente: 'Dokumente',
      werkzeuge: 'Werkzeuge',
      hilfsmittel: 'Hilfsmittel',
      informationen: 'Informationen',
      contacts: 'Kontakte',
      apiKeys: 'API-Schlüssel'
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
        'zeitmodelle', 'incidents', 'media', 'intranet', 'checklists'
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
          usersData.sort((a: User, b: User) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
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
          // Load users needed for device assignment
          const deviceUsers = await userService.getAllUsersAdmin();
          deviceUsers.sort((a: User, b: User) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
          setUsers(deviceUsers);
          break;
        case 'contacts':
          const [contactsData, contactGroupsData] = await Promise.all([
            contactService.getAllContacts(),
            contactService.getAllContactGroups(),
          ]);
          setContacts(contactsData);
          setContactGroups(contactGroupsData);
          // Benutzergruppen werden nur für die (Admin-)Gruppenverwaltung benötigt.
          // Endpunkt ist Admin-only, daher Fehler bei normalen Benutzern tolerieren.
          try {
            setUserGroups(await userGroupService.getAll());
          } catch {
            setUserGroups([]);
          }
          break;
        case 'werkzeuge':
          const toolsData = await werkzeugeService.getAllTools();
          setTools(toolsData);
          // Load users needed for tool assignment
          const toolUsers = await userService.getAllUsersAdmin();
          toolUsers.sort((a: User, b: User) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
          setUsers(toolUsers);
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
          <div className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            {/* Sidebar Toggle Button */}
            <div className="sidebar-toggle-area">
              <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Seitenleiste einblenden' : 'Seitenleiste ausblenden'}
              >
                {sidebarCollapsed ? '▶' : '◀'}
              </button>
            </div>

            {/* Search Filter */}
            {!sidebarCollapsed && (
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
            )}

            {!sidebarCollapsed && (
            <div className="tab-navigation">
            {/* Benutzerverwaltung */}
            {(() => {
              const groupCheck = shouldShowGroup('Benutzer Teams', ['Benutzer', 'Gruppen', 'Standorte', 'Organigramm']);
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
                      tabId="users"
                      label="👥 Benutzer"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('user_groups')) && (groupCheck.showAll || matchesSearch('Gruppen')) && (
                    <TabButton
                      active={activeTab === 'userGroups'}
                      onClick={() => changeTab('userGroups')}
                      tabId="userGroups"
                      label="👨‍👩‍👧‍👦 Gruppen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('locations')) && (groupCheck.showAll || matchesSearch('Standorte')) && (
                    <TabButton
                      active={activeTab === 'locations'}
                      onClick={() => changeTab('locations')}
                      tabId="locations"
                      label="📍 Standorte"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('departments')) && (groupCheck.showAll || matchesSearch('Organigramm')) && (
                    <TabButton
                      active={activeTab === 'orgChart'}
                      onClick={() => changeTab('orgChart')}
                      tabId="orgChart"
                      label="🏗️ Organigramm"
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
                      tabId="timeEntries"
                      label="⏱️ Zeiteinträge"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('absences')) && (groupCheck.showAll || matchesSearch('Abwesenheiten')) && (
                    <TabButton
                      active={activeTab === 'absences'}
                      onClick={() => changeTab('absences')}
                      tabId="absences"
                      label="🏖️ Abwesenheiten"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('absences')) && (groupCheck.showAll || matchesSearch('Urlaubsplaner')) && (
                    <TabButton
                      active={activeTab === 'vacationPlanner'}
                      onClick={() => changeTab('vacationPlanner')}
                      tabId="vacationPlanner"
                      label="🗓️ Urlaubsplaner"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Feiertage')) && (
                    <TabButton
                      active={activeTab === 'holidays'}
                      onClick={() => changeTab('holidays')}
                      tabId="holidays"
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
                      tabId="invoices"
                      label="📄 Rechnungen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('invoices')) && (groupCheck.showAll || matchesSearch('Vorlagen')) && (
                    <TabButton
                      active={activeTab === 'invoiceTemplates'}
                      onClick={() => changeTab('invoiceTemplates')}
                      tabId="invoiceTemplates"
                      label="📋 Vorlagen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reminders')) && (groupCheck.showAll || matchesSearch('Mahnwesen')) && (
                    <TabButton
                      active={activeTab === 'reminders'}
                      onClick={() => changeTab('reminders')}
                      tabId="reminders"
                      label="💰 Mahnwesen"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Reisekosten')) && (
                    <TabButton
                      active={activeTab === 'travelExpenses'}
                      onClick={() => changeTab('travelExpenses')}
                      tabId="travelExpenses"
                      label="✈️ Reisekosten"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Lohnabrechnung')) && (
                    <TabButton
                      active={activeTab === 'payroll'}
                      onClick={() => changeTab('payroll')}
                      tabId="payroll"
                      label="💵 Lohnabrechnung"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('zeitmodelle')) && (groupCheck.showAll || matchesSearch('Zeitmodelle')) && (
                    <TabButton
                      active={activeTab === 'zeitmodelle'}
                      onClick={() => changeTab('zeitmodelle')}
                      tabId="zeitmodelle"
                      label="🕒 Zeitmodelle"
                    />
                  )}
                </>
              )}
            </div>
            );})()}

            {/* Stammdaten */}
            {(() => {
              const groupCheck = shouldShowGroup('Stammdaten', ['Kunden', 'Lieferanten', 'Abteilungen', 'Bestellungen', 'Artikelgruppen', 'Artikel', 'Geräte', 'Kontakte', 'Werkzeuge', 'Kostenstellen', 'Lagerbestand', 'Inventar']);
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
                      tabId="customers"
                      label="🤝 Kunden"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('suppliers')) && (groupCheck.showAll || matchesSearch('Lieferanten')) && (
                    <TabButton
                      active={activeTab === 'suppliers'}
                      onClick={() => changeTab('suppliers')}
                      tabId="suppliers"
                      label="🚚 Lieferanten"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('departments')) && (groupCheck.showAll || matchesSearch('Abteilungen')) && (
                    <TabButton
                      active={activeTab === 'departments'}
                      onClick={() => changeTab('departments')}
                      tabId="departments"
                      label="🏢 Abteilungen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('orders')) && (groupCheck.showAll || matchesSearch('Bestellungen')) && (
                    <TabButton
                      active={activeTab === 'orders'}
                      onClick={() => changeTab('orders')}
                      tabId="orders"
                      label="📦 Bestellungen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('articles')) && (groupCheck.showAll || matchesSearch('Artikelgruppen')) && (
                    <TabButton
                      active={activeTab === 'articleGroups'}
                      onClick={() => changeTab('articleGroups')}
                      tabId="articleGroups"
                      label="📦 Artikelgruppen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('articles')) && (groupCheck.showAll || matchesSearch('Artikel')) && (
                    <TabButton
                      active={activeTab === 'articles'}
                      onClick={() => changeTab('articles')}
                      tabId="articles"
                      label="🏷️ Artikel"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Geräte')) && (
                    <TabButton
                      active={activeTab === 'devices'}
                      onClick={() => changeTab('devices')}
                      tabId="devices"
                      label="💻 Geräte"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Software')) && (
                    <TabButton
                      active={activeTab === 'softwareReport'}
                      onClick={() => changeTab('softwareReport')}
                      tabId="softwareReport"
                      label="📦 Software"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('contacts')) && (groupCheck.showAll || matchesSearch('Kontakte')) && (
                    <TabButton
                      active={activeTab === 'contacts'}
                      onClick={() => changeTab('contacts')}
                      tabId="contacts"
                      label="📇 Kontakte"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('tools')) && (groupCheck.showAll || matchesSearch('Werkzeuge')) && (
                    <TabButton
                      active={activeTab === 'werkzeuge'}
                      onClick={() => changeTab('werkzeuge')}
                      tabId="werkzeuge"
                      label="🔧 Werkzeuge"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('cost_centers')) && (groupCheck.showAll || matchesSearch('Kostenstellen')) && (
                    <TabButton
                      active={activeTab === 'costCenters'}
                      onClick={() => changeTab('costCenters')}
                      tabId="costCenters"
                      label="💰 Kostenstellen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('inventory')) && (groupCheck.showAll || matchesSearch('Lagerbestand Inventar')) && (
                    <TabButton
                      active={activeTab === 'inventory'}
                      onClick={() => changeTab('inventory')}
                      tabId="inventory"
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
                      tabId="projects"
                      label="📁 Projekte"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('project_budget')) && (groupCheck.showAll || matchesSearch('Projekt Budget')) && (
                    <TabButton
                      active={activeTab === 'projectBudget'}
                      onClick={() => changeTab('projectBudget')}
                      tabId="projectBudget"
                      label="💼 Projekt-Budget"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('project_reports')) && (groupCheck.showAll || matchesSearch('Projekt Reports')) && (
                    <TabButton
                      active={activeTab === 'projectReports'}
                      onClick={() => changeTab('projectReports')}
                      tabId="projectReports"
                      label="📊 Projekt-Reports"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('project_planning')) && (groupCheck.showAll || matchesSearch('Projektplanung')) && (
                    <TabButton
                      active={activeTab === 'projectPlanning'}
                      onClick={() => changeTab('projectPlanning')}
                      tabId="projectPlanning"
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
                      tabId="reports"
                      label="📊 Analytics"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (groupCheck.showAll || matchesSearch('Stunden Alle')) && (
                    <TabButton
                      active={activeTab === 'timeBookings'}
                      onClick={() => changeTab('timeBookings')}
                      tabId="timeBookings"
                      label="📋 Stunden (Alle)"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (groupCheck.showAll || matchesSearch('Stunden User')) && (
                    <TabButton
                      active={activeTab === 'userTimeBookings'}
                      onClick={() => changeTab('userTimeBookings')}
                      tabId="userTimeBookings"
                      label="👤 Stunden (User)"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('reports')) && (groupCheck.showAll || matchesSearch('Geschäftsbericht')) && (
                    <TabButton
                      active={activeTab === 'businessReport'}
                      onClick={() => changeTab('businessReport')}
                      tabId="businessReport"
                      label="📈 Geschäftsbericht"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('compliance')) && (groupCheck.showAll || matchesSearch('Compliance')) && (
                    <TabButton
                      active={activeTab === 'compliance'}
                      onClick={() => changeTab('compliance')}
                      tabId="compliance"
                      label="🇨🇭 Compliance"
                    />
                  )}
                </>
              )}
            </div>
            );})()}

            {/* System & Konfiguration */}
            {(() => {
              const groupCheck = shouldShowGroup('System Konfiguration', ['Workflows', 'Module', 'Berechtigungen', 'Einstellungen', 'E-Learning', 'Onboarding', 'Mitarbeiterliste', 'Funktionen', 'Checklisten', 'News', 'Dokumente', 'Hilfsmittel', 'Backup']);
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
                      tabId="workflows"
                      label="🔄 Workflows"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Workflow Actions')) && (
                    <TabButton
                      active={activeTab === 'workflowActions'}
                      onClick={() => changeTab('workflowActions')}
                      tabId="workflowActions"
                      label="⚡ Workflow Actions"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('System Logs')) && (
                    <TabButton
                      active={activeTab === 'systemLogs'}
                      onClick={() => changeTab('systemLogs')}
                      tabId="systemLogs"
                      label="📋 System Logs"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Module')) && (
                    <TabButton                      active={activeTab === 'modules'}
                      onClick={() => changeTab('modules')}
                      tabId="modules"
                      label="🧩 Module"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Berechtigungen')) && (
                    <TabButton
                      active={activeTab === 'modulePermissions'}
                      onClick={() => changeTab('modulePermissions')}
                      tabId="modulePermissions"
                      label="🔐 Berechtigungen"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Einstellungen')) && (
                    <TabButton
                      active={activeTab === 'settings'}
                      onClick={() => changeTab('settings')}
                      tabId="settings"
                      label="⚙️ Einstellungen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('elearning')) && (groupCheck.showAll || matchesSearch('E-Learning')) && (
                    <TabButton
                      active={activeTab === 'elearning'}
                      onClick={() => changeTab('elearning')}
                      tabId="elearning"
                      label="🎓 E-Learning"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('onboarding')) && (groupCheck.showAll || matchesSearch('Onboarding')) && (
                    <TabButton
                      active={activeTab === 'onboarding'}
                      onClick={() => changeTab('onboarding')}
                      tabId="onboarding"
                      label="👤 Onboarding"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('onboarding')) && (groupCheck.showAll || matchesSearch('Mitarbeiterliste')) && (
                    <TabButton
                      active={activeTab === 'onboardingEmployees'}
                      onClick={() => changeTab('onboardingEmployees')}
                      tabId="onboardingEmployees"
                      label="👥 Mitarbeiterliste"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('job_functions')) && (groupCheck.showAll || matchesSearch('Funktionen')) && (
                    <TabButton
                      active={activeTab === 'jobFunctions'}
                      onClick={() => changeTab('jobFunctions')}
                      tabId="jobFunctions"
                      label="💼 Funktionen"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('checklists')) && (groupCheck.showAll || matchesSearch('Checklisten')) && (
                    <TabButton
                      active={activeTab === 'checklists'}
                      onClick={() => changeTab('checklists')}
                      tabId="checklists"
                      label="✅ Checklisten"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('News')) && (
                    <TabButton
                      active={activeTab === 'news'}
                      onClick={() => changeTab('news')}
                      tabId="news"
                      label="📰 News"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('intranet')) && (groupCheck.showAll || matchesSearch('Dokumente')) && (
                    <TabButton
                      active={activeTab === 'dokumente'}
                      onClick={() => changeTab('dokumente')}
                      tabId="dokumente"
                      label="📄 Dokumente"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('Backup')) && (
                    <TabButton
                      active={activeTab === 'backup'}
                      onClick={() => changeTab('backup')}
                      tabId="backup"
                      label="💾 Backup"
                    />
                  )}
                  {user?.role === 'ADMIN' && (groupCheck.showAll || matchesSearch('API-Schlüssel')) && (
                    <TabButton
                      active={activeTab === 'apiKeys'}
                      onClick={() => changeTab('apiKeys')}
                      tabId="apiKeys"
                      label="🔌 API-Schlüssel"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('hilfsmittel')) && (groupCheck.showAll || matchesSearch('Hilfsmittel')) && (
                    <TabButton
                      active={activeTab === 'hilfsmittel'}
                      onClick={() => changeTab('hilfsmittel')}
                      tabId="hilfsmittel"
                      label="🛠️ Hilfsmittel"
                    />
                  )}
                  {(user?.role === 'ADMIN' || hasModuleAccess('informationen')) && (groupCheck.showAll || matchesSearch('Informationen')) && (
                    <TabButton
                      active={activeTab === 'informationen'}
                      onClick={() => changeTab('informationen')}
                      tabId="informationen"
                      label="ℹ️ Informationen"
                    />
                  )}
                </>
              )}
            </div>
            );})()}
          </div>
          )}
          </div>

          <div className="tab-content">
            {activeTab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
            {activeTab === 'userGroups' && <UserGroupsTab onLoad={loadData} />}
            {activeTab === 'projects' && <ProjectsTab projects={projects} onUpdate={loadData} />}
            {activeTab === 'locations' && <LocationsTab locations={locations} onUpdate={loadData} />}
            {activeTab === 'devices' && <DevicesTab devices={devices} users={users} onUpdate={loadData} />}
            {activeTab === 'softwareReport' && <SoftwareReportTab />}
            {activeTab === 'contacts' && <ContactsTab contacts={contacts} contactGroups={contactGroups} userGroups={userGroups} onUpdate={loadData} />}
            {activeTab === 'werkzeuge' && <WerkzeugeTab tools={tools} users={users} onUpdate={loadData} />}
            {activeTab === 'travelExpenses' && <TravelExpensesTab expenses={travelExpenses} users={users} onUpdate={loadData} />}
            {activeTab === 'costCenters' && <CostCentersTab onUpdate={loadData} />}
            {activeTab === 'inventory' && <InventoryTab onUpdate={loadData} />}
            {activeTab === 'projectBudget' && <ProjectBudgetTab />}
            {activeTab === 'projectReports' && <ProjectReportsTab />}
            {activeTab === 'projectPlanning' && <ProjectPlanningTab onUpdate={loadData} />}
            {activeTab === 'elearning' && <ELearningManagementTab onUpdate={loadData} />}
            {activeTab === 'onboarding' && <OnboardingTab onUpdate={loadData} />}
            {activeTab === 'onboardingEmployees' && <OnboardingEmployeesSubTab onUpdate={loadData} />}
            {activeTab === 'jobFunctions' && <JobFunctionsTab onUpdate={loadData} />}
            {activeTab === 'checklists' && <ChecklistsTab onUpdate={loadData} />}
            {activeTab === 'news' && <NewsTab onUpdate={loadData} />}
            {activeTab === 'customers' && <CustomersTab customers={customers} onUpdate={loadData} />}
            {activeTab === 'suppliers' && <SuppliersTab suppliers={suppliers} onUpdate={loadData} />}
            {activeTab === 'departments' && <DepartmentsTab onUpdate={loadData} />}
            {activeTab === 'orgChart' && <OrgChartTab onUpdate={loadData} />}
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
            {activeTab === 'businessReport' && <BusinessReportTab />}
            {activeTab === 'backup' && <BackupTab />}
            {activeTab === 'apiKeys' && <ApiKeysTab />}
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
            {activeTab === 'systemLogs' && <SystemLogsTab />}
            {activeTab === 'settings' && <SystemSettingsTab />}
            {activeTab === 'payroll' && <PayrollManagement />}
            {activeTab === 'zeitmodelle' && <ZeitmodelleVerwaltung />}
            {activeTab === 'dokumente' && <IntranetPage embedded />}
            {activeTab === 'hilfsmittel' && <HilfsmittelTab onUpdate={loadData} />}
            {activeTab === 'informationen' && <InformationenTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string; tabId?: string }> = ({
  active,
  onClick,
  label,
  tabId,
}) => {
  const { openPinMenu } = useShortcuts();
  // Rechtsklick: diesen Navigations-Eintrag als Shortcut oben anheften.
  // Das Emoji am Labelanfang wird als Shortcut-Icon verwendet.
  const handleContextMenu = tabId
    ? (e: React.MouseEvent) => {
        const trimmed = label.trim();
        const sp = trimmed.indexOf(' ');
        const emoji = sp > 0 ? trimmed.slice(0, sp) : '';
        const name = sp > 0 ? trimmed.slice(sp + 1) : trimmed;
        openPinMenu(e, {
          key: tabId,
          label: name || trimmed,
          route: `/admin?tab=${tabId}`,
          icon: emoji || '⚙️',
          source: 'admin',
        });
      }
    : undefined;
  return (
    <button
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`tab-button ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  );
};

export default AdminDashboard;
