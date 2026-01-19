import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Responsive } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../contexts/ModuleContext';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { timeService } from '../services/time.service';
import { projectService } from '../services/project.service';
import { absenceService } from '../services/absence.service';
import { reportService } from '../services/report.service';
import { locationService } from '../services/location.service';
import { workflowService } from '../services/workflow.service';
import projectTimeAllocationService, { AllocationInput, ProjectTimeAllocation } from '../services/projectTimeAllocation.service';
import { getUnreadCount } from '../services/message.service';
import { TimeEntry, Project, AbsenceRequest, Report, Location } from '../types';
import PDFReportModal from '../components/PDFReportModal';
import MyPayrollEntries from '../components/MyPayrollEntries';
import AppNavbar from '../components/AppNavbar';
import {
  TimeTrackingWidget,
  LoggedUsersWidget,
  RecentEntriesWidget,
  AbsenceRequestsWidget,
  SummaryWidget,
  PendingApprovalsWidget,
  MessagesWidget,
  WidgetSettingsModal,
  AddWidgetModal,
} from '../components/DashboardWidgets';
import '../components/DashboardWidgets/DashboardWidgets.css';
import '../App.css';

// Responsive component already includes width provider functionality
const ResponsiveGridLayout = Responsive;

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { modules } = useModules();
  const navigate = useNavigate();
  const { widgets, layouts, isLoading, handleLayoutChange, toggleWidget, addWidget, removeWidget, resetLayout } = useDashboardLayout(user?.id);
  
  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'classic'>('grid');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  
  // Data state
  const [activeTab, setActiveTab] = useState<'timetracking' | 'payroll'>('timetracking');
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showPauseReminderModal, setShowPauseReminderModal] = useState(false);
  const [pauseReminderMessage, setPauseReminderMessage] = useState<string>('');
  const [pauseMinutes, setPauseMinutes] = useState<number>(0);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('de-DE'));
  const [workDuration, setWorkDuration] = useState<string>('0h 0m');
  const [pauseCheckDone, setPauseCheckDone] = useState<Set<string>>(new Set());
  const [showPDFReportModal, setShowPDFReportModal] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntry | null>(null);
  const [allocations, setAllocations] = useState<AllocationInput[]>([]);
  const [existingAllocations, setExistingAllocations] = useState<ProjectTimeAllocation[]>([]);
  const [loggedInUsers, setLoggedInUsers] = useState<any[]>([]);

  useEffect(() => {
    document.title = 'CFlux - Dashboard';
    loadData();
    
    // Handle window resize for grid layout
    const handleResize = () => {
      setContainerWidth(window.innerWidth - 40); // 40px for padding
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('de-DE'));
      updateWorkDuration();
    }, 1000);
    return () => clearInterval(timer);
  }, [currentEntry]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadLoggedInUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLoggedInUsers = async () => {
    try {
      const users = await timeService.getLoggedInUsers();
      setLoggedInUsers(users);
    } catch (error) {
      console.error('Error loading logged in users:', error);
    }
  };

  const updateWorkDuration = () => {
    if (!currentEntry || currentEntry.status === 'CLOCKED_OUT') {
      setWorkDuration('0h 0m');
      return;
    }

    const start = new Date(currentEntry.clockIn);
    const now = new Date();
    let totalMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    if (currentEntry.pauseMinutes) {
      totalMinutes -= currentEntry.pauseMinutes;
    }
    
    if (currentEntry.status === 'ON_PAUSE' && currentEntry.pauseStartedAt) {
      const pauseStart = new Date(currentEntry.pauseStartedAt);
      const currentPauseMinutes = Math.floor((now.getTime() - pauseStart.getTime()) / (1000 * 60));
      totalMinutes -= currentPauseMinutes;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setWorkDuration(`${hours}h ${minutes}m`);

    checkPauseReminder(totalMinutes);
  };

  const checkPauseReminder = (workMinutes: number) => {
    if (!currentEntry || currentEntry.status !== 'CLOCKED_IN') return;
    
    const workHours = workMinutes / 60;
    const entryId = currentEntry.id;
    const totalPause = currentEntry.pauseMinutes || 0;

    if (workHours >= 5.5 && totalPause < 15 && !pauseCheckDone.has(`${entryId}-5.5`)) {
      setPauseReminderMessage('Du hast jetzt 5,5 Stunden gearbeitet. Bitte mache eine 15-minütige Pause! 🕒');
      setShowPauseReminderModal(true);
      setPauseCheckDone(prev => new Set(prev).add(`${entryId}-5.5`));
    }
    else if (workHours >= 7 && totalPause < 30 && !pauseCheckDone.has(`${entryId}-7`)) {
      setPauseReminderMessage('Du hast jetzt 7 Stunden gearbeitet. Bitte mache eine 30-minütige Pause! ⚠️');
      setShowPauseReminderModal(true);
      setPauseCheckDone(prev => new Set(prev).add(`${entryId}-7`));
    }
    else if (workHours >= 9 && totalPause < 60 && !pauseCheckDone.has(`${entryId}-9`)) {
      setPauseReminderMessage('Du hast jetzt 9 Stunden gearbeitet. Du musst jetzt eine Stunde Pause machen! 🚨');
      setShowPauseReminderModal(true);
      setPauseCheckDone(prev => new Set(prev).add(`${entryId}-9`));
    }
  };

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        timeService.getCurrentTimeEntry(),
        projectService.getAllProjects(),
        locationService.getActiveLocations(),
        absenceService.getMyAbsenceRequests(),
        timeService.getMyTimeEntries(),
        reportService.getMySummary(),
        workflowService.getMyPendingApprovals(),
        getUnreadCount(),
      ]);

      const current = results[0].status === 'fulfilled' ? results[0].value : null;
      const projectsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const locationsData = results[2].status === 'fulfilled' ? results[2].value : [];
      const absences = results[3].status === 'fulfilled' ? results[3].value : [];
      const entries = results[4].status === 'fulfilled' ? results[4].value : [];
      const reportData = results[5].status === 'fulfilled' ? results[5].value : null;
      const approvals = results[6].status === 'fulfilled' ? results[6].value : [];
      const unreadCount = results[7].status === 'fulfilled' ? results[7].value : 0;

      setCurrentEntry(current);
      setProjects(projectsData);
      setLocations(locationsData);
      setAbsenceRequests(absences);
      setTimeEntries(entries);
      setReport(reportData);
      setPendingApprovalsCount(approvals.length);
      setUnreadMessagesCount(unreadCount);

      await loadLoggedInUsers();

      if (entries.length > 0) {
        const allAllocations = await Promise.all(
          entries.slice(0, 10).map(entry => 
            projectTimeAllocationService.getAllocationsForTimeEntry(entry.id)
              .catch(() => [])
          )
        );
        setExistingAllocations(allAllocations.flat());
      }

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Request ${index} failed:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      await timeService.clockIn(
        selectedProject || undefined, 
        selectedLocation || undefined
      );
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Einstempeln fehlgeschlagen');
    }
  };

  const handleClockOut = () => {
    setShowPauseModal(true);
  };

  const confirmClockOut = async () => {
    try {
      await timeService.clockOut(pauseMinutes);
      setShowPauseModal(false);
      setPauseMinutes(0);
      setPauseCheckDone(new Set());
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ausstempeln fehlgeschlagen');
    }
  };

  const handleStartPause = async () => {
    try {
      await timeService.startPause();
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Pause starten fehlgeschlagen');
    }
  };

  const handleEndPause = async () => {
    try {
      await timeService.endPause();
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Pause beenden fehlgeschlagen');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openAllocationModal = async (entry: TimeEntry) => {
    if (!entry.clockOut) {
      alert('Bitte erst ausstempeln, bevor Sie die Zeit auf Projekte aufteilen.');
      return;
    }

    setSelectedTimeEntry(entry);
    setShowAllocationModal(true);

    try {
      const existing = await projectTimeAllocationService.getAllocationsForTimeEntry(entry.id);
      setExistingAllocations(existing);
      
      if (existing.length > 0) {
        setAllocations(existing.map(a => ({
          projectId: a.projectId,
          hours: a.hours,
          description: a.description
        })));
      } else {
        setAllocations([{ projectId: '', hours: 0, description: '' }]);
      }
    } catch (error) {
      console.error('Error loading allocations:', error);
      setAllocations([{ projectId: '', hours: 0, description: '' }]);
    }
  };

  const calculateTotalWorkedHours = (entry: TimeEntry): number => {
    if (!entry.clockOut) return 0;
    const clockInTime = new Date(entry.clockIn).getTime();
    const clockOutTime = new Date(entry.clockOut).getTime();
    const totalMinutes = (clockOutTime - clockInTime) / (1000 * 60);
    const pauseMinutes = entry.pauseMinutes || 0;
    const workedMinutes = totalMinutes - pauseMinutes;
    return parseFloat((workedMinutes / 60).toFixed(2));
  };

  const handleSaveAllocations = async () => {
    if (!selectedTimeEntry) return;

    const totalWorkedHours = calculateTotalWorkedHours(selectedTimeEntry);
    const totalAllocatedHours = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);

    const validAllocations = allocations.filter(a => a.projectId && a.hours > 0);
    if (validAllocations.length === 0) {
      alert('Bitte mindestens ein Projekt mit Stunden hinzufügen.');
      return;
    }

    if (Math.abs(totalAllocatedHours - totalWorkedHours) > 0.1) {
      alert(`Die Summe der zugeteilten Stunden (${totalAllocatedHours.toFixed(2)}h) muss der Arbeitszeit (${totalWorkedHours.toFixed(2)}h) entsprechen.`);
      return;
    }

    try {
      await projectTimeAllocationService.setAllocationsForTimeEntry(
        selectedTimeEntry.id,
        validAllocations
      );
      setShowAllocationModal(false);
      setSelectedTimeEntry(null);
      setAllocations([]);
      await loadData();
      alert('Projektzeitaufteilung erfolgreich gespeichert!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Speichern der Aufteilung');
    }
  };

  const handleUpdateEntry = async (entryId: string, field: string, value: any) => {
    try {
      await timeService.updateMyTimeEntry(entryId, { [field]: value });
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Aktualisieren');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await timeService.deleteMyTimeEntry(entryId);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Löschen');
    }
  };

  const addAllocationRow = () => {
    setAllocations([...allocations, { projectId: '', hours: 0, description: '' }]);
  };

  const removeAllocationRow = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, field: keyof AllocationInput, value: any) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const formatDuration = (clockIn: string, clockOut?: string) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSubmitAbsence = async (formData: any) => {
    try {
      await absenceService.createAbsenceRequest(formData);
      setShowAbsenceModal(false);
      await loadData();
      alert('Abwesenheitsantrag erfolgreich erstellt');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Erstellen des Antrags');
    }
  };

  const renderGridDashboard = () => {
    const visibleWidgets = widgets.filter(w => w.isVisible);
    
    // Don't render grid until layout is loaded to prevent flickering
    if (isLoading) {
      return (
        <div className="dashboard-grid-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div>Lade Dashboard...</div>
        </div>
      );
    }
    
    return (
      <div className="dashboard-grid-container">
        <div className="dashboard-toolbar">
          <h1>Dashboard</h1>
          <div className="dashboard-toolbar-actions">
            <button 
              className="btn btn-success btn-small"
              onClick={() => setShowAddWidget(true)}
              title="Widget hinzufügen"
            >
              ➕ Widget hinzufügen
            </button>
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => setViewMode('classic')}
              title="Zur klassischen Ansicht wechseln"
            >
              📋 Klassisch
            </button>
            <button 
              className="btn btn-primary btn-small"
              onClick={() => setShowSettings(true)}
            >
              ⚙️ Einstellungen
            </button>
          </div>
        </div>

        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={100}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
        >
          {visibleWidgets.map((widget) => {
            switch (widget.type) {
              case 'time-tracking':
                return (
                  <div key={widget.id}>
                    <TimeTrackingWidget
                      currentEntry={currentEntry}
                      projects={projects}
                      locations={locations}
                      selectedProject={selectedProject}
                      selectedLocation={selectedLocation}
                      currentTime={currentTime}
                      workDuration={workDuration}
                      onProjectChange={setSelectedProject}
                      onLocationChange={setSelectedLocation}
                      onClockIn={handleClockIn}
                      onClockOut={handleClockOut}
                      onStartPause={handleStartPause}
                      onEndPause={handleEndPause}
                      onRemove={() => removeWidget(widget.id)}
                    />
                  </div>
                );
              
              case 'logged-users':
                return (
                  <div key={widget.id}>
                    <LoggedUsersWidget 
                      loggedInUsers={loggedInUsers}
                      onRemove={() => removeWidget(widget.id)}
                    />
                  </div>
                );
              
              case 'recent-entries':
                return (
                  <div key={widget.id}>
                    <RecentEntriesWidget
                      timeEntries={timeEntries}
                      editingEntry={editingEntry}
                      existingAllocations={existingAllocations}
                      onEditToggle={(id) => setEditingEntry(editingEntry === id ? null : id)}
                      onUpdateEntry={handleUpdateEntry}
                      onDeleteEntry={handleDeleteEntry}
                      onOpenAllocation={openAllocationModal}
                      formatDuration={formatDuration}
                      onRemove={() => removeWidget(widget.id)}
                    />
                  </div>
                );
              
              case 'absence-requests':
                return (
                  <div key={widget.id}>
                    <AbsenceRequestsWidget
                      absenceRequests={absenceRequests}
                      onNewRequest={() => setShowAbsenceModal(true)}
                      onRemove={() => removeWidget(widget.id)}
                    />
                  </div>
                );
              
              case 'summary':
                return (
                  <div key={widget.id}>
                    <SummaryWidget
                      report={report}
                      onShowPDFReport={() => setShowPDFReportModal(true)}
                      onRemove={() => removeWidget(widget.id)}
                    />
                  </div>
                );
              
              case 'pending-approvals':
                return (
                  <div key={widget.id}>
                    <PendingApprovalsWidget 
                      pendingApprovalsCount={pendingApprovalsCount}
                      onRemove={() => removeWidget(widget.id)}
                    />
                  </div>
                );
              
              case 'messages':
                return (
                  <div key={widget.id}>
                    <MessagesWidget 
                      unreadMessagesCount={unreadMessagesCount}
                      onRemove={() => removeWidget(widget.id)}
                    />
                  </div>
                );
              
              default:
                return null;
            }
          })}
        </ResponsiveGridLayout>
      </div>
    );
  };

  // Rest of the file continues with the classic view and modals...
  // (I'll continue in the next part)

  return (
    <>
      <AppNavbar 
        title="Dashboard" 
        currentTime={currentTime} 
        onLogout={handleLogout}
        onPdfReport={() => setShowPDFReportModal(true)}
      />
      
      {viewMode === 'grid' ? (
        renderGridDashboard()
      ) : (
        // Classic view - render the original dashboard
        <div>
          <div className="container">
            <div className="dashboard-toolbar" style={{ marginBottom: '20px' }}>
              <button 
                className="btn btn-primary btn-small"
                onClick={() => setViewMode('grid')}
              >
                🎛️ Grid-Ansicht
              </button>
            </div>
            {/* Original dashboard content would go here - keeping tabs etc */}
            <div className="stats-grid">
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h3 className="stat-title">Stunden (Monat)</h3>
                <div className="value">{report?.totalHours.toFixed(1) || 0}h</div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <h3 className="stat-title">Arbeitstage</h3>
                <div className="value">{report?.totalDays || 0}</div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <h3 className="stat-title">Urlaub übrig</h3>
                <div className="value">{user?.vacationDays || 0}</div>
              </div>
              <div 
                className="stat-card" 
                style={{ 
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/my-approvals')}
              >
                <h3 className="stat-title">🔔 Genehmig.</h3>
                <div className="value">
                  {pendingApprovalsCount > 0 ? (
                    <span className="alert-count">{pendingApprovalsCount}</span>
                  ) : (
                    '0'
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-tabs">
              <button
                className={`dashboard-tab ${activeTab === 'timetracking' ? 'active' : ''}`}
                onClick={() => setActiveTab('timetracking')}
              >
                <span className="tab-label-mobile">⏰ Zeit</span>
                <span className="tab-label-desktop">⏰ Zeiterfassung</span>
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'payroll' ? 'active' : ''}`}
                onClick={() => setActiveTab('payroll')}
              >
                <span className="tab-label-mobile">💰 Lohn</span>
                <span className="tab-label-desktop">💰 Lohnabrechnungen</span>
              </button>
            </div>

            {activeTab === 'timetracking' && (
              <div>
                <LoggedUsersWidget loggedInUsers={loggedInUsers} />
                <div style={{ marginTop: '20px' }}>
                  <TimeTrackingWidget
                    currentEntry={currentEntry}
                    projects={projects}
                    locations={locations}
                    selectedProject={selectedProject}
                    selectedLocation={selectedLocation}
                    currentTime={currentTime}
                    workDuration={workDuration}
                    onProjectChange={setSelectedProject}
                    onLocationChange={setSelectedLocation}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                    onStartPause={handleStartPause}
                    onEndPause={handleEndPause}
                  />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <AbsenceRequestsWidget
                    absenceRequests={absenceRequests}
                    onNewRequest={() => setShowAbsenceModal(true)}
                  />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <RecentEntriesWidget
                    timeEntries={timeEntries}
                    editingEntry={editingEntry}
                    existingAllocations={existingAllocations}
                    onEditToggle={(id) => setEditingEntry(editingEntry === id ? null : id)}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    onOpenAllocation={openAllocationModal}
                    formatDuration={formatDuration}
                  />
                </div>
              </div>
            )}

            {activeTab === 'payroll' && (
              <MyPayrollEntries />
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddWidgetModal
        isOpen={showAddWidget}
        onClose={() => setShowAddWidget(false)}
        onAddWidget={addWidget}
        currentWidgets={widgets}
      />

      <WidgetSettingsModal
        show={showSettings}
        widgets={widgets}
        onClose={() => setShowSettings(false)}
        onToggleWidget={toggleWidget}
        onResetLayout={resetLayout}
      />

      {showPDFReportModal && user && (
        <PDFReportModal
          user={user}
          isOpen={showPDFReportModal}
          onClose={() => setShowPDFReportModal(false)}
        />
      )}

      {showAbsenceModal && (
        <AbsenceModal
          onClose={() => setShowAbsenceModal(false)}
          onSubmit={handleSubmitAbsence}
        />
      )}

      {showPauseModal && (
        <PauseModal
          onClose={() => setShowPauseModal(false)}
          onConfirm={confirmClockOut}
          pauseMinutes={pauseMinutes}
          setPauseMinutes={setPauseMinutes}
        />
      )}

      {showPauseReminderModal && (
        <PauseReminderModal
          message={pauseReminderMessage}
          onClose={() => setShowPauseReminderModal(false)}
          onStartPause={() => {
            handleStartPause();
            setShowPauseReminderModal(false);
          }}
        />
      )}

      {showAllocationModal && selectedTimeEntry && (
        <AllocationModal
          show={showAllocationModal}
          onClose={() => {
            setShowAllocationModal(false);
            setSelectedTimeEntry(null);
            setAllocations([]);
          }}
          timeEntry={selectedTimeEntry}
          projects={projects}
          allocations={allocations}
          onUpdateAllocation={updateAllocation}
          onAddRow={addAllocationRow}
          onRemoveRow={removeAllocationRow}
          onSave={handleSaveAllocations}
          totalWorkedHours={calculateTotalWorkedHours(selectedTimeEntry)}
        />
      )}
    </>
  );
};

// Modal Components (keeping from original)
const PauseReminderModal: React.FC<{
  message: string;
  onClose: () => void;
  onStartPause: () => void;
}> = ({ message, onClose, onStartPause }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <h2>⏰ Pausenzeit!</h2>
        
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
            {message}
          </p>

          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffc107',
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>📋 Gesetzliche Pausenpflicht (Art. 15 ArGV 1):</strong>
            <ul style={{ marginTop: '10px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Ab 5,5 Stunden: mindestens 15 Minuten</li>
              <li>Ab 7 Stunden: mindestens 30 Minuten</li>
              <li>Ab 9 Stunden: mindestens 60 Minuten</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => {
                onStartPause();
                onClose();
              }}
              style={{ flex: '1' }}
            >
              ⏸️ Jetzt Pause machen
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ flex: '1' }}
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PauseModal: React.FC<{
  onClose: () => void;
  onConfirm: () => void;
  pauseMinutes: number;
  setPauseMinutes: (value: number) => void;
}> = ({ onClose, onConfirm, pauseMinutes, setPauseMinutes }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Pausenzeit erfassen</h2>
        
        <div style={{ padding: '0 0 20px 0' }}>
          <p className="hint-text" style={{ marginBottom: '20px' }}>
            Wie viele Minuten Pause hattest du während deiner Arbeitszeit?
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${pauseMinutes === 0 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPauseMinutes(0)}
              style={{ flex: '1', minWidth: '100px' }}
            >
              Keine Pause
            </button>
            <button
              type="button"
              className={`btn ${pauseMinutes === 15 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPauseMinutes(15)}
              style={{ flex: '1', minWidth: '100px' }}
            >
              15 Min
            </button>
            <button
              type="button"
              className={`btn ${pauseMinutes === 30 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPauseMinutes(30)}
              style={{ flex: '1', minWidth: '100px' }}
            >
              30 Min
            </button>
            <button
              type="button"
              className={`btn ${pauseMinutes === 60 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPauseMinutes(60)}
              style={{ flex: '1', minWidth: '100px' }}
            >
              60 Min
            </button>
          </div>

          <div className="form-group">
            <label>Oder eigene Zeit eingeben (Minuten)</label>
            <input
              type="number"
              min="0"
              max="999"
              value={pauseMinutes}
              onChange={(e) => setPauseMinutes(parseInt(e.target.value) || 0)}
              placeholder="z.B. 45"
            />
          </div>

          <div style={{ 
            background: '#f0f7ff', 
            padding: '15px', 
            borderRadius: '8px', 
            marginTop: '20px',
            fontSize: '14px',
            color: '#333'
          }}>
            <strong>📋 Gesetzliche Pausenzeiten (Art. 15 ArGV 1):</strong>
            <ul style={{ marginTop: '10px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Ab 5,5 Stunden: mindestens 15 Minuten</li>
              <li>Ab 7 Stunden: mindestens 30 Minuten</li>
              <li>Ab 9 Stunden: mindestens 60 Minuten</li>
            </ul>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" onClick={onConfirm}>
              Ausstempeln ({pauseMinutes} Min Pause)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AbsenceModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'VACATION',
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Abwesenheitsantrag erstellen</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Typ</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="VACATION">Urlaub</option>
              <option value="SICK_LEAVE">Krankheit</option>
              <option value="PERSONAL_LEAVE">Persönlich</option>
              <option value="UNPAID_LEAVE">Unbezahlt</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>

          <div className="form-group">
            <label>Von</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Bis</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Tage</label>
            <input
              type="number"
              step="0.5"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Grund (optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Antrag stellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AllocationModal: React.FC<{
  show: boolean;
  onClose: () => void;
  timeEntry: TimeEntry | null;
  projects: Project[];
  allocations: AllocationInput[];
  onUpdateAllocation: (index: number, field: keyof AllocationInput, value: any) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onSave: () => void;
  totalWorkedHours: number;
}> = ({
  show,
  onClose,
  timeEntry,
  projects,
  allocations,
  onUpdateAllocation,
  onAddRow,
  onRemoveRow,
  onSave,
  totalWorkedHours
}) => {
  if (!show || !timeEntry) return null;

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);
  const remaining = totalWorkedHours - totalAllocated;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '1000px', 
          width: '90%',
          padding: '30px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Zeit auf Projekte aufteilen</h2>
        <p className="hint-text" style={{ marginBottom: '20px', fontSize: '16px' }}>
          Datum: {new Date(timeEntry.clockIn).toLocaleDateString('de-DE')} | 
          Gesamtarbeitszeit: <strong>{totalWorkedHours.toFixed(2)}h</strong>
        </p>
        
        <div style={{ 
          padding: '15px 20px', 
          background: remaining === 0 ? '#d4edda' : remaining < 0 ? '#f8d7da' : '#fff3cd',
          borderRadius: '8px',
          marginBottom: '25px',
          fontSize: '16px'
        }}>
          <strong>Zugeteilt: {totalAllocated.toFixed(2)}h</strong> | 
          Verbleibend: {remaining.toFixed(2)}h
        </div>

        <table className="table" style={{ marginBottom: '20px' }}>
          <thead>
            <tr>
              <th>Projekt</th>
              <th>Stunden</th>
              <th>Beschreibung</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc, index) => (
              <tr key={index}>
                <td style={{ padding: '12px' }}>
                  <select
                    value={alloc.projectId}
                    onChange={(e) => onUpdateAllocation(index, 'projectId', e.target.value)}
                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                  >
                    <option value="">Projekt wählen...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '12px' }}>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max={totalWorkedHours}
                    value={alloc.hours || 0}
                    onChange={(e) => onUpdateAllocation(index, 'hours', parseFloat(e.target.value) || 0)}
                    style={{ width: '100px', padding: '8px', fontSize: '14px' }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <input
                    type="text"
                    value={alloc.description || ''}
                    onChange={(e) => onUpdateAllocation(index, 'description', e.target.value)}
                    placeholder="Was wurde gemacht..."
                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => onRemoveRow(index)}
                    disabled={allocations.length === 1}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onAddRow}
          style={{ marginBottom: '25px', fontSize: '15px', padding: '10px 20px' }}
        >
          + Projekt hinzufügen
        </button>

        <div className="modal-actions" style={{ gap: '15px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontSize: '15px', padding: '10px 25px' }}>
            Abbrechen
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={onSave}
            disabled={Math.abs(remaining) > 0.1}
            style={{ fontSize: '15px', padding: '10px 25px' }}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
