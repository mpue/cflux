import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import api from '../../services/api';
import './ProjectReportsTab.css';

interface ProjectOverviewData {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  customer: {
    id: string;
    name: string;
  } | null;
  budget: {
    totalBudget: number;
    plannedCosts: number;
    actualCosts: number;
    remainingBudget: number;
    utilization: number;
    status: string;
  } | null;
  timeTracking: {
    totalHours: number;
    userCount: number;
    topUsers: Array<{
      userId: string;
      name: string;
      hours: number;
    }>;
  };
  teamSize: number;
}

interface OverviewResponse {
  projects: ProjectOverviewData[];
  summary: {
    totalProjects: number;
    activeProjects: number;
    totalBudget: number;
    totalActualCosts: number;
    totalHours: number;
  };
}

interface TimeTrackingEntry {
  id: string;
  date: string;
  user: string;
  clockIn: string;
  clockOut: string;
  hours: number;
  description: string | null;
}

interface TimeTrackingGroupedData {
  key: string;
  userName?: string;
  userId?: string;
  hours: number;
  cost: number;
  entries: number;
}

interface TimeTrackingResponse {
  project: {
    id: string;
    name: string;
    customer: string | null;
    budget: {
      total: number;
      planned: number;
      actual: number;
    } | null;
  };
  summary: {
    totalHours: number;
    totalCost: number;
    entryCount: number;
    period: {
      from: string;
      to: string;
    };
  };
  groupedData: TimeTrackingGroupedData[];
  entries: TimeTrackingEntry[];
}

const ProjectReportsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'time'>('overview');
  
  // Overview State
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  
  // Time Tracking State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [timeTrackingData, setTimeTrackingData] = useState<TimeTrackingResponse | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'user' | 'day' | 'week' | 'month'>('user');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Projekt-Übersicht laden
  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/project-reports/overview', { params });
      setOverviewData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Projekt-Übersicht');
    } finally {
      setLoading(false);
    }
  };

  // Zeiterfassung Report laden
  const loadTimeTracking = async () => {
    if (!selectedProjectId) {
      setError('Bitte wählen Sie ein Projekt aus');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params: any = { projectId: selectedProjectId, groupBy };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/project-reports/time-tracking', { params });
      setTimeTrackingData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden des Zeiterfassung-Reports');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview();
    }
  }, [activeTab, statusFilter]);

  // Export als CSV
  const exportToCSV = () => {
    if (activeTab === 'overview' && overviewData) {
      const rows = [
        ['Projekt', 'Kunde', 'Status', 'Budget', 'Kosten', 'Restbudget', 'Auslastung %', 'Stunden', 'Team'],
        ...overviewData.projects.map(p => [
          p.name,
          p.customer?.name || '-',
          p.isActive ? 'Aktiv' : 'Inaktiv',
          p.budget?.totalBudget.toFixed(2) || '0',
          p.budget?.actualCosts.toFixed(2) || '0',
          p.budget?.remainingBudget.toFixed(2) || '0',
          p.budget?.utilization.toFixed(1) || '0',
          p.timeTracking.totalHours.toFixed(2),
          p.teamSize.toString(),
        ]),
      ];
      downloadCSV(rows, 'projekt-uebersicht.csv');
    } else if (activeTab === 'time' && timeTrackingData) {
      const rows = [
        ['Gruppierung', 'Stunden', 'Kosten', 'Einträge'],
        ...timeTrackingData.groupedData.map(g => [
          g.userName || g.key,
          g.hours.toFixed(2),
          g.cost.toFixed(2),
          g.entries.toString(),
        ]),
      ];
      downloadCSV(rows, 'zeiterfassung-report.csv');
    }
  };

  const downloadCSV = (rows: string[][], filename: string) => {
    const csv = rows.map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="project-reports-tab">
      <div className="reports-header">
        <h2>Projekt Reports</h2>
        <div className="header-actions">
          <button onClick={exportToCSV} className="btn-export" disabled={!overviewData && !timeTrackingData}>
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={activeTab === 'overview' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={18} />
          Projekt-Übersicht
        </button>
        <button
          className={activeTab === 'time' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('time')}
        >
          <Calendar size={18} />
          Zeiterfassung
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Projekt-Übersicht Tab */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                <option value="all">Alle</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Von</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Bis</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button onClick={loadOverview} className="btn-primary" disabled={loading}>
              {loading ? 'Lädt...' : 'Aktualisieren'}
            </button>
          </div>

          {overviewData && (
            <>
              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon">
                    <TrendingUp />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Projekte</div>
                    <div className="card-value">{overviewData.summary.activeProjects} / {overviewData.summary.totalProjects}</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon">
                    <DollarSign />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Gesamtbudget</div>
                    <div className="card-value">CHF {overviewData.summary.totalBudget.toLocaleString('de-CH')}</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon">
                    <DollarSign />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Kosten</div>
                    <div className="card-value">CHF {overviewData.summary.totalActualCosts.toLocaleString('de-CH')}</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon">
                    <Calendar />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Stunden</div>
                    <div className="card-value">{overviewData.summary.totalHours.toFixed(1)} h</div>
                  </div>
                </div>
              </div>

              {/* Projects Table */}
              <div className="projects-table-container">
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th>Projekt</th>
                      <th>Kunde</th>
                      <th>Status</th>
                      <th>Budget</th>
                      <th>Kosten</th>
                      <th>Rest</th>
                      <th>Auslastung</th>
                      <th>Stunden</th>
                      <th>Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewData.projects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <strong>{project.name}</strong>
                          {!project.isActive && <span className="badge-inactive">Inaktiv</span>}
                        </td>
                        <td>{project.customer?.name || '-'}</td>
                        <td>
                          <span className={`status-badge status-${project.budget?.status?.toLowerCase() || 'unknown'}`}>
                            {project.budget?.status || 'Kein Budget'}
                          </span>
                        </td>
                        <td>CHF {project.budget?.totalBudget.toLocaleString('de-CH') || '0'}</td>
                        <td>CHF {project.budget?.actualCosts.toLocaleString('de-CH') || '0'}</td>
                        <td>CHF {project.budget?.remainingBudget.toLocaleString('de-CH') || '0'}</td>
                        <td>
                          <div className="utilization-bar">
                            <div
                              className="utilization-fill"
                              style={{
                                width: `${Math.min(project.budget?.utilization || 0, 100)}%`,
                                backgroundColor:
                                  (project.budget?.utilization || 0) > 90
                                    ? '#dc3545'
                                    : (project.budget?.utilization || 0) > 75
                                    ? '#ffc107'
                                    : '#28a745',
                              }}
                            />
                            <span className="utilization-text">{project.budget?.utilization.toFixed(1) || '0'}%</span>
                          </div>
                        </td>
                        <td>{project.timeTracking.totalHours.toFixed(1)} h</td>
                        <td>
                          <Users size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          {project.teamSize}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Zeiterfassung Tab */}
      {activeTab === 'time' && (
        <div className="time-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Projekt</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">-- Projekt wählen --</option>
                {overviewData?.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Von</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Bis</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Gruppierung</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
                <option value="user">Benutzer</option>
                <option value="day">Tag</option>
                <option value="week">Woche</option>
                <option value="month">Monat</option>
              </select>
            </div>
            <button onClick={loadTimeTracking} className="btn-primary" disabled={loading || !selectedProjectId}>
              {loading ? 'Lädt...' : 'Report laden'}
            </button>
          </div>

          {timeTrackingData && (
            <>
              {/* Project Info */}
              <div className="project-info-card">
                <h3>{timeTrackingData.project.name}</h3>
                {timeTrackingData.project.customer && <p>Kunde: {timeTrackingData.project.customer}</p>}
                {timeTrackingData.project.budget && (
                  <div className="budget-info">
                    <span>Budget: CHF {timeTrackingData.project.budget.total.toLocaleString('de-CH')}</span>
                    <span>Kosten: CHF {timeTrackingData.project.budget.actual.toLocaleString('de-CH')}</span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon">
                    <Calendar />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Stunden</div>
                    <div className="card-value">{timeTrackingData.summary.totalHours.toFixed(1)} h</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon">
                    <DollarSign />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Kosten</div>
                    <div className="card-value">CHF {timeTrackingData.summary.totalCost.toLocaleString('de-CH')}</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon">
                    <Users />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Einträge</div>
                    <div className="card-value">{timeTrackingData.summary.entryCount}</div>
                  </div>
                </div>
              </div>

              {/* Grouped Data */}
              <div className="grouped-data-container">
                <h4>Gruppierte Daten</h4>
                <table className="grouped-table">
                  <thead>
                    <tr>
                      <th>{groupBy === 'user' ? 'Benutzer' : 'Zeitraum'}</th>
                      <th>Stunden</th>
                      <th>Kosten</th>
                      <th>Einträge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeTrackingData.groupedData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.userName || row.key}</td>
                        <td>{row.hours.toFixed(2)} h</td>
                        <td>CHF {row.cost.toLocaleString('de-CH')}</td>
                        <td>{row.entries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detailed Entries */}
              <div className="entries-container">
                <h4>Detaillierte Einträge</h4>
                <table className="entries-table">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Benutzer</th>
                      <th>Von</th>
                      <th>Bis</th>
                      <th>Stunden</th>
                      <th>Beschreibung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeTrackingData.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.date}</td>
                        <td>{entry.user}</td>
                        <td>{new Date(entry.clockIn).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{new Date(entry.clockOut).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{entry.hours.toFixed(2)} h</td>
                        <td>{entry.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectReportsTab;
