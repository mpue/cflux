import React, { useState, useEffect } from 'react';
import { User, Project } from '../../types';
import { reportService } from '../../services/report.service';
import { userService } from '../../services/user.service';
import { projectService } from '../../services/project.service';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import '../../styles/TimeBookingsReport.css';

interface TimeBookingEntry {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  projectId?: string;
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  location?: {
    id: string;
    name: string;
  };
  clockIn: string;
  clockOut: string;
  description?: string;
  pauseMinutes?: number;
  hours: number;
  pauseHours: number;
  netHours: number;
  createdAt: string;
  updatedAt: string;
}

interface TimeBookingsData {
  entries: TimeBookingEntry[];
  summary: {
    totalHours: number;
    totalEntries: number;
    totalDays: number;
    byUser: Array<{
      user: any;
      totalHours: number;
      entriesCount: number;
    }>;
    byProject: Array<{
      project: any;
      totalHours: number;
      entriesCount: number;
    }>;
  };
}

export const TimeBookingsReport: React.FC = () => {
  const [data, setData] = useState<TimeBookingsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [viewMode, setViewMode] = useState<'entries' | 'byUser' | 'byProject'>('entries');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d0ed57'];

  useEffect(() => {
    loadInitialData();
    setDefaultDates();
  }, []);

  const loadInitialData = async () => {
    try {
      const [usersData, projectsData] = await Promise.all([
        userService.getAllUsersAdmin(),
        projectService.getAllProjects()
      ]);
      setUsers(usersData.filter((u: User) => u.isActive));
      setProjects(projectsData.filter((p: Project) => p.isActive));
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Fehler beim Laden der Daten');
    }
  };

  const setDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const loadReport = async () => {
    if (!startDate || !endDate) {
      setError('Bitte wählen Sie einen Zeitraum aus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reportData = await reportService.getDetailedTimeBookings(
        startDate,
        endDate,
        selectedUserId || undefined,
        selectedProjectId || undefined
      );
      setData(reportData);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Fehler beim Laden des Reports');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleExportPDF = async () => {
    if (!startDate || !endDate) {
      setError('Bitte wählen Sie einen Zeitraum aus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userIds = selectedUserId ? [selectedUserId] : undefined;
      const projectIds = selectedProjectId ? [selectedProjectId] : undefined;
      
      await reportService.downloadTimeBookingsPDF(
        startDate,
        endDate,
        userIds,
        projectIds
      );
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Fehler beim Exportieren des PDFs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Prepare chart data
  const getProjectChartData = () => {
    if (!data) return [];
    return data.summary.byProject
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10)
      .map(item => ({
        name: item.project.name,
        hours: Math.round(item.totalHours * 10) / 10,
        entries: item.entriesCount
      }));
  };

  const getUserChartData = () => {
    if (!data) return [];
    return data.summary.byUser
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10)
      .map(item => ({
        name: `${item.user.firstName} ${item.user.lastName}`,
        hours: Math.round(item.totalHours * 10) / 10,
        entries: item.entriesCount
      }));
  };

  const getTimelineData = () => {
    if (!data || !data.entries.length) return [];
    
    const dailyMap: Record<string, number> = {};
    data.entries.forEach(entry => {
      const date = entry.clockIn.split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = 0;
      }
      dailyMap[date] += entry.netHours;
    });

    return Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, hours]) => ({
        date: new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' }),
        hours: Math.round(hours * 10) / 10
      }));
  };

  const getMonthlyProjectData = () => {
    if (!data || !data.entries.length) return [];
    
    const monthlyProjectMap: Record<string, Record<string, number>> = {};
    
    data.entries.forEach(entry => {
      if (!entry.project) return;
      
      const date = new Date(entry.clockIn);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyProjectMap[monthKey]) {
        monthlyProjectMap[monthKey] = {};
      }
      
      if (!monthlyProjectMap[monthKey][entry.project.name]) {
        monthlyProjectMap[monthKey][entry.project.name] = 0;
      }
      
      monthlyProjectMap[monthKey][entry.project.name] += entry.netHours;
    });

    const topProjects = data.summary.byProject
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5)
      .map(p => p.project.name);

    return Object.entries(monthlyProjectMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, projects]) => {
        const monthData: any = {
          month: new Date(month + '-01').toLocaleDateString('de-CH', { month: 'short', year: '2-digit' })
        };
        
        topProjects.forEach(projectName => {
          monthData[projectName] = Math.round((projects[projectName] || 0) * 10) / 10;
        });
        
        return monthData;
      });
  };

  return (
    <div className="time-bookings-report">
      <div className="report-header">
        <h2>📊 Stundenbuchungs-Report</h2>
        <p className="report-description">
          Umfassende Übersicht über alle Stundenbuchungen mit detaillierten Auswertungen
        </p>
      </div>

      {/* Filters */}
      <div className="card filter-section">
        <h3>Filter</h3>
        
        <div className="filter-grid">
          <div className="filter-group">
            <label>Zeitraum</label>
            <div className="date-range">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>bis</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="quick-select-buttons">
              <button onClick={() => handleQuickSelect(1)}>Letzter Monat</button>
              <button onClick={() => handleQuickSelect(3)}>Letzte 3 Monate</button>
              <button onClick={() => handleQuickSelect(6)}>Letzte 6 Monate</button>
              <button onClick={() => handleQuickSelect(12)}>Letztes Jahr</button>
            </div>
          </div>

          <div className="filter-group">
            <label>Mitarbeiter</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Alle Mitarbeiter</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Projekt</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Alle Projekte</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button 
            className="btn btn-primary" 
            onClick={loadReport}
            disabled={loading}
          >
            {loading ? 'Wird geladen...' : '🔍 Report laden'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportPDF}
            disabled={loading || !data}
          >
            📄 PDF exportieren
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Results */}
      {data && (
        <>
          {/* Summary */}
          <div className="card summary-section">
            <h3>Zusammenfassung</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Gesamtstunden</div>
                <div className="summary-value">{formatHours(data.summary.totalHours)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Arbeitstage (à 8h)</div>
                <div className="summary-value">{data.summary.totalDays.toFixed(1)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Anzahl Buchungen</div>
                <div className="summary-value">{data.summary.totalEntries}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Mitarbeiter</div>
                <div className="summary-value">{data.summary.byUser.length}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Projekte</div>
                <div className="summary-value">{data.summary.byProject.length}</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            {/* Projects Pie Chart */}
            <div className="card chart-card">
              <h3>📊 Gesamtzeit pro Projekt (Top 10)</h3>
              {data && data.summary.byProject.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={getProjectChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {getProjectChartData().map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatHours(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Keine Projektdaten verfügbar
                </p>
              )}
            </div>

            {/* Monthly Project Trend */}
            <div className="card chart-card">
              <h3>📈 Projektzeit über Monate (Top 5)</h3>
              {getMonthlyProjectData().length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getMonthlyProjectData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: 'Stunden', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: any) => formatHours(value)} />
                    <Legend />
                    {data && data.summary.byProject
                      .sort((a, b) => b.totalHours - a.totalHours)
                      .slice(0, 5)
                      .map((item, index) => (
                        <Bar 
                          key={item.project.name} 
                          dataKey={item.project.name} 
                          fill={COLORS[index % COLORS.length]}
                          stackId="a"
                        />
                      ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Keine Monatsdaten verfügbar
                </p>
              )}
            </div>

            {/* Users Bar Chart */}
            <div className="card chart-card">
              <h3>👥 Stunden pro Mitarbeiter (Top 10)</h3>
              {data && data.summary.byUser.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getUserChartData()} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: 'Stunden', position: 'insideBottom', offset: -5 }} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value: any) => formatHours(value)} />
                    <Bar dataKey="hours" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Keine Mitarbeiterdaten verfügbar
                </p>
              )}
            </div>

            {/* Timeline Chart */}
            <div className="card chart-card">
              <h3>📅 Zeitverlauf (Tägliche Stunden)</h3>
              {getTimelineData().length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getTimelineData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Stunden', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: any) => formatHours(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Stunden"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Keine Zeitverlaufsdaten verfügbar
                </p>
              )}
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="view-mode-selector">
            <button
              className={viewMode === 'entries' ? 'active' : ''}
              onClick={() => setViewMode('entries')}
            >
              📋 Alle Buchungen ({data.entries.length})
            </button>
            <button
              className={viewMode === 'byUser' ? 'active' : ''}
              onClick={() => setViewMode('byUser')}
            >
              👤 Nach Mitarbeiter ({data.summary.byUser.length})
            </button>
            <button
              className={viewMode === 'byProject' ? 'active' : ''}
              onClick={() => setViewMode('byProject')}
            >
              📁 Nach Projekt ({data.summary.byProject.length})
            </button>
          </div>

          {/* All Entries View */}
          {viewMode === 'entries' && (
            <div className="card">
              <h3>Alle Buchungen</h3>
              <div className="table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Mitarbeiter</th>
                      <th>Von</th>
                      <th>Bis</th>
                      <th>Pause</th>
                      <th>Netto Std.</th>
                      <th>Projekt</th>
                      <th>Standort</th>
                      <th>Beschreibung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map(entry => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.clockIn)}</td>
                        <td>
                          {entry.user.firstName} {entry.user.lastName}
                        </td>
                        <td>{formatTime(entry.clockIn)}</td>
                        <td>{formatTime(entry.clockOut)}</td>
                        <td>{entry.pauseMinutes ? `${entry.pauseMinutes}m` : '-'}</td>
                        <td className="hours-cell">{formatHours(entry.netHours)}</td>
                        <td>{entry.project?.name || '-'}</td>
                        <td>{entry.location?.name || '-'}</td>
                        <td className="description-cell">{entry.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* By User View */}
          {viewMode === 'byUser' && (
            <div className="card">
              <h3>Stunden nach Mitarbeiter</h3>
              <div className="table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Mitarbeiter</th>
                      <th>E-Mail</th>
                      <th>Gesamtstunden</th>
                      <th>Anzahl Buchungen</th>
                      <th>Ø Std. / Buchung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summary.byUser
                      .sort((a, b) => b.totalHours - a.totalHours)
                      .map((item, index) => (
                        <tr key={index}>
                          <td>
                            {item.user.firstName} {item.user.lastName}
                          </td>
                          <td>{item.user.email}</td>
                          <td className="hours-cell">{formatHours(item.totalHours)}</td>
                          <td>{item.entriesCount}</td>
                          <td className="hours-cell">
                            {formatHours(item.totalHours / item.entriesCount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* By Project View */}
          {viewMode === 'byProject' && (
            <div className="card">
              <h3>Stunden nach Projekt</h3>
              <div className="table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Projekt</th>
                      <th>Beschreibung</th>
                      <th>Gesamtstunden</th>
                      <th>Anzahl Buchungen</th>
                      <th>Ø Std. / Buchung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summary.byProject
                      .sort((a, b) => b.totalHours - a.totalHours)
                      .map((item, index) => (
                        <tr key={index}>
                          <td>{item.project.name}</td>
                          <td className="description-cell">
                            {item.project.description || '-'}
                          </td>
                          <td className="hours-cell">{formatHours(item.totalHours)}</td>
                          <td>{item.entriesCount}</td>
                          <td className="hours-cell">
                            {formatHours(item.totalHours / item.entriesCount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && (
        <div className="card empty-state">
          <p>Wählen Sie Filter aus und klicken Sie auf "Report laden", um Daten anzuzeigen.</p>
        </div>
      )}
    </div>
  );
};
