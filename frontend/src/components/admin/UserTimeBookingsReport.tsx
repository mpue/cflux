import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { reportService } from '../../services/report.service';
import { userService } from '../../services/user.service';
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
import '../../styles/UserTimeBookingsReport.css';

interface DailyEntry {
  date: string;
  hours: number;
  entries: Array<{
    id: string;
    clockIn: string;
    clockOut: string;
    hours: number;
    project?: {
      id: string;
      name: string;
    };
    location?: {
      id: string;
      name: string;
    };
    description?: string;
  }>;
}

interface ProjectBreakdown {
  project: {
    id: string;
    name: string;
  };
  hours: number;
  entries: number;
}

interface UserTimeBookingsData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber?: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalHours: number;
    totalDays: number;
    totalEntries: number;
  };
  dailyBreakdown: DailyEntry[];
  projectBreakdown: ProjectBreakdown[];
}

export const UserTimeBookingsReport: React.FC = () => {
  const [data, setData] = useState<UserTimeBookingsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'projects'>('daily');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d0ed57'];

  useEffect(() => {
    loadUsers();
    setDefaultDates();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await userService.getAllUsers();
      setUsers(usersData.filter((u: User) => u.isActive));
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Fehler beim Laden der Benutzer');
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
    if (!selectedUserId) {
      setError('Bitte wählen Sie einen Mitarbeiter aus');
      return;
    }

    if (!startDate || !endDate) {
      setError('Bitte wählen Sie einen Zeitraum aus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reportData = await reportService.getUserTimeBookingsReport(
        selectedUserId,
        startDate,
        endDate
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
    if (!selectedUserId || !startDate || !endDate) {
      setError('Bitte wählen Sie einen Mitarbeiter und Zeitraum aus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await reportService.downloadUserTimeBookingsPDF(
        selectedUserId,
        startDate,
        endDate
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
  const getProjectPieData = () => {
    if (!data) return [];
    return data.projectBreakdown.map(item => ({
      name: item.project.name,
      value: Math.round(item.hours * 10) / 10,
      entries: item.entries
    }));
  };

  const getDailyTimelineData = () => {
    if (!data) return [];
    return data.dailyBreakdown.map(day => ({
      date: formatDate(day.date),
      hours: Math.round(day.hours * 10) / 10
    }));
  };

  const getProjectBarData = () => {
    if (!data) return [];
    return data.projectBreakdown
      .sort((a, b) => b.hours - a.hours)
      .map(item => ({
        name: item.project.name,
        hours: Math.round(item.hours * 10) / 10,
        entries: item.entries
      }));
  };

  const getWeeklyData = () => {
    if (!data || !data.dailyBreakdown.length) return [];
    
    const weeklyMap: Record<string, number> = {};
    data.dailyBreakdown.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = 0;
      }
      weeklyMap[weekKey] += day.hours;
    });

    return Object.entries(weeklyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, hours]) => ({
        week: `KW ${new Date(week).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}`,
        hours: Math.round(hours * 10) / 10,
        days: Math.round((hours / 8) * 10) / 10
      }));
  };

  return (
    <div className="user-time-bookings-report">
      <div className="report-header">
        <h2>👤 Mitarbeiter Stundenbuchungs-Report</h2>
        <p className="report-description">
          Detaillierter Report über Stundenbuchungen eines einzelnen Mitarbeiters
        </p>
      </div>

      {/* Filters */}
      <div className="card filter-section">
        <h3>Filter</h3>
        
        <div className="filter-grid">
          <div className="filter-group">
            <label>Mitarbeiter *</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Bitte wählen...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Zeitraum *</label>
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
        </div>

        <div className="filter-actions">
          <button 
            className="btn btn-primary" 
            onClick={loadReport}
            disabled={loading || !selectedUserId}
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

      {/* Charts Section */}
      {data && (
        <div className="charts-section">
            {/* Projects Pie Chart */}
            <div className="card chart-card">
              <h3>📊 Zeitverteilung nach Projekt</h3>
              {data.projectBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={getProjectPieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getProjectPieData().map((entry, index) => (
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

            {/* Daily Timeline */}
            <div className="card chart-card">
              <h3>📅 Tägliche Arbeitszeit</h3>
              {data.dailyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getDailyTimelineData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
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

            {/* Projects Bar Chart */}
            <div className="card chart-card">
              <h3>📁 Stunden pro Projekt</h3>
              {data.projectBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getProjectBarData()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: 'Stunden', position: 'insideBottom', offset: -5 }} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value: any) => formatHours(value)} />
                    <Bar dataKey="hours" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Keine Projektdaten verfügbar
                </p>
              )}
            </div>

            {/* Weekly Overview */}
            <div className="card chart-card">
              <h3>📊 Wochenübersicht</h3>
              {getWeeklyData().length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getWeeklyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis label={{ value: 'Stunden', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: any, name?: string) => {
                      if (name === 'hours') return formatHours(value);
                      if (name === 'days') return `${value} Tage`;
                      return value;
                    }} />
                    <Legend />
                    <Bar dataKey="hours" fill="#667eea" name="Stunden" />
                    <Bar dataKey="days" fill="#f093fb" name="Arbeitstage" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Keine Wochendaten verfügbar
                </p>
              )}
            </div>
          </div>
        )}

      {/* Results */}
      {data && (
        <>
          {/* User Info */}
          <div className="card user-info-section">
            <h3>Mitarbeiter-Information</h3>
            <div className="user-info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">
                  {data.user.firstName} {data.user.lastName}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">E-Mail:</span>
                <span className="info-value">{data.user.email}</span>
              </div>
              {data.user.employeeNumber && (
                <div className="info-item">
                  <span className="info-label">Personalnummer:</span>
                  <span className="info-value">{data.user.employeeNumber}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Zeitraum:</span>
                <span className="info-value">
                  {formatDate(data.period.startDate)} - {formatDate(data.period.endDate)}
                </span>
              </div>
            </div>
          </div>

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
                <div className="summary-label">Projekte</div>
                <div className="summary-value">{data.projectBreakdown.length}</div>
              </div>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="view-mode-selector">
            <button
              className={viewMode === 'daily' ? 'active' : ''}
              onClick={() => setViewMode('daily')}
            >
              📅 Tagesübersicht ({data.dailyBreakdown.length} Tage)
            </button>
            <button
              className={viewMode === 'projects' ? 'active' : ''}
              onClick={() => setViewMode('projects')}
            >
              📁 Projektübersicht ({data.projectBreakdown.length} Projekte)
            </button>
          </div>

          {/* Daily Breakdown View */}
          {viewMode === 'daily' && (
            <div className="card">
              <h3>Tagesübersicht</h3>
              {data.dailyBreakdown.map((day, index) => (
                <div key={index} className="daily-breakdown-item">
                  <div className="daily-header">
                    <span className="daily-date">{formatDate(day.date)}</span>
                    <span className="daily-hours">{formatHours(day.hours)}</span>
                  </div>
                  <div className="daily-entries">
                    <table className="entries-table">
                      <thead>
                        <tr>
                          <th>Von</th>
                          <th>Bis</th>
                          <th>Stunden</th>
                          <th>Projekt</th>
                          <th>Standort</th>
                          <th>Beschreibung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.entries.map(entry => (
                          <tr key={entry.id}>
                            <td>{formatTime(entry.clockIn)}</td>
                            <td>{formatTime(entry.clockOut)}</td>
                            <td className="hours-cell">{formatHours(entry.hours)}</td>
                            <td>{entry.project?.name || '-'}</td>
                            <td>{entry.location?.name || '-'}</td>
                            <td className="description-cell">{entry.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project Breakdown View */}
          {viewMode === 'projects' && (
            <div className="card">
              <h3>Projektübersicht</h3>
              <div className="table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Projekt</th>
                      <th>Gesamtstunden</th>
                      <th>Anzahl Buchungen</th>
                      <th>Ø Std. / Buchung</th>
                      <th>Anteil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projectBreakdown
                      .sort((a, b) => b.hours - a.hours)
                      .map((item, index) => {
                        const percentage = (item.hours / data.summary.totalHours) * 100;
                        return (
                          <tr key={index}>
                            <td>{item.project.name}</td>
                            <td className="hours-cell">{formatHours(item.hours)}</td>
                            <td>{item.entries}</td>
                            <td className="hours-cell">
                              {formatHours(item.hours / item.entries)}
                            </td>
                            <td>
                              <div className="percentage-bar">
                                <div 
                                  className="percentage-fill" 
                                  style={{ width: `${percentage}%` }}
                                />
                                <span className="percentage-text">{percentage.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && (
        <div className="card empty-state">
          <p>Wählen Sie einen Mitarbeiter und Zeitraum aus und klicken Sie auf "Report laden".</p>
        </div>
      )}
    </div>
  );
};
