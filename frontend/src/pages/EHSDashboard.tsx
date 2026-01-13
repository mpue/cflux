import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { getBackendURL } from '../services/api';
import './EHSDashboard.css';

interface Project {
  id: string;
  name: string;
  code: string;
}

interface EHSPyramid {
  fatalities: number;
  ltis: number;
  recordables: number;
  firstAids: number;
  nearMisses: number;
  unsafeBehaviors: number;
  unsafeConditions: number;
  propertyDamages: number;
  environmentIncidents: number;
  safetyObservations: number;
}

interface EHSKPIs {
  ltifr: number;
  trir: number;
  ytdLTIFR: number;
  ytdTRIR: number;
  totalHours: number;
  ytdTotalHours: number;
}

interface MonthlyData {
  id: string;
  year: number;
  month: number;
  workingDays: number;
  workersPerDay: number;
  hoursPerDay: number;
  totalEmployees: number;
  totalHours: number;
  ltifr: number | null;
  trir: number | null;
  highlights: string | null;
  achievements: string | null;
  hotTopics: string | null;
  safetyAward: string | null;
  closingRate: number | null;
}

interface DashboardData {
  monthlyData: MonthlyData | null;
  incidents: any[];
  pyramid: EHSPyramid;
  kpis: EHSKPIs;
  ytdData: MonthlyData[];
}

interface CategoryMonthMatrix {
  [category: string]: {
    [month: number]: number;
  };
}

const EHSDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [yearlyIncidents, setYearlyIncidents] = useState<any[]>([]);
  const [workData, setWorkData] = useState({
    workingDays: 0,
    workersPerDay: 0,
    hoursPerDay: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadYearlyIncidents();
  }, [selectedYear, selectedMonth, selectedProjectId]);

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getBackendURL()}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setProjects(result);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const projectParam = selectedProjectId !== 'all' ? `&projectId=${selectedProjectId}` : '';
      const response = await fetch(
        `${getBackendURL()}/api/ehs/dashboard?year=${selectedYear}&month=${selectedMonth}${projectParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
        if (result.monthlyData) {
          setWorkData({
            workingDays: result.monthlyData.workingDays,
            workersPerDay: result.monthlyData.workersPerDay,
            hoursPerDay: result.monthlyData.hoursPerDay,
          });
        }
      }
    } catch (error) {
      console.error('Error loading EHS dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyIncidents = async () => {
    try {
      const token = localStorage.getItem('token');
      const projectParam = selectedProjectId !== 'all' ? `&projectId=${selectedProjectId}` : '';
      const response = await fetch(
        `${getBackendURL()}/api/incidents?year=${selectedYear}${projectParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        // Filter nur Incidents mit ehsCategory
        const ehsIncidents = result.filter((inc: any) => inc.ehsCategory != null);
        console.log('Loaded yearly incidents:', ehsIncidents.length, 'of', result.length);
        console.log('Sample incident:', ehsIncidents[0]);
        setYearlyIncidents(ehsIncidents);
      }
    } catch (error) {
      console.error('Error loading yearly incidents:', error);
    }
  };

  const saveWorkData = async () => {
    try {
      const token = localStorage.getItem('token');
      const totalHours = workData.workingDays * workData.workersPerDay * workData.hoursPerDay;
      const totalEmployees = workData.workersPerDay;

      await fetch(`${getBackendURL()}/api/ehs/monthly-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          projectId: selectedProjectId !== 'all' ? selectedProjectId : null,
          workingDays: workData.workingDays,
          workersPerDay: workData.workersPerDay,
          hoursPerDay: workData.hoursPerDay,
          totalEmployees,
          totalHours,
        }),
      });

      // Recalculate KPIs
      await fetch(`${getBackendURL()}/api/ehs/calculate-kpis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          projectId: selectedProjectId !== 'all' ? selectedProjectId : null,
        }),
      });

      setEditMode(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error saving work data:', error);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const projectParam = selectedProjectId !== 'all' ? `&projectId=${selectedProjectId}` : '';
      const response = await fetch(
        `${getBackendURL()}/api/ehs/pdf-report?year=${selectedYear}&month=${selectedMonth}${projectParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Fehler beim Generieren des PDF-Berichts');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EHS_Bericht_${monthNames[selectedMonth - 1]}_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Fehler beim Generieren des PDF-Berichts');
    }
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const categoryNames: { [key: string]: string } = {
    'FATALITY': 'Tödlicher Unfall',
    'LTI': 'LTI (Lost Time Injury)',
    'RECORDABLE': 'Meldepflichtiger Unfall',
    'FIRST_AID': 'Erste Hilfe',
    'NEAR_MISS': 'Beinahe-Unfall',
    'UNSAFE_BEHAVIOR': 'Unsicheres Verhalten',
    'UNSAFE_CONDITION': 'Unsicherer Zustand',
    'PROPERTY_DAMAGE': 'Sachschaden',
    'ENVIRONMENT': 'Umweltvorfall',
    'SAFETY_OBSERVATION': 'Sicherheitsbeobachtung'
  };

  // Build category-month matrix with useMemo
  const categoryMatrix = useMemo(() => {
    const matrix: CategoryMonthMatrix = {};
    
    // Initialize matrix with all categories and months
    Object.keys(categoryNames).forEach(category => {
      matrix[category] = {};
      for (let month = 1; month <= 12; month++) {
        matrix[category][month] = 0;
      }
    });

    // Fill matrix with incident counts
    yearlyIncidents.forEach(incident => {
      const incidentDate = new Date(incident.incidentDate);
      const month = incidentDate.getMonth() + 1;
      const category = incident.ehsCategory;
      
      if (matrix[category]) {
        matrix[category][month]++;
      }
    });

    return matrix;
  }, [yearlyIncidents]);
  
  // Calculate totals
  const getMonthTotal = (month: number): number => {
    return Object.keys(categoryMatrix).reduce((sum, category) => {
      return sum + (categoryMatrix[category][month] || 0);
    }, 0);
  };

  const getCategoryTotal = (category: string): number => {
    return Object.values(categoryMatrix[category] || {}).reduce((sum, count) => sum + count, 0);
  };

  const grandTotal = yearlyIncidents.length;

  if (loading) {
    return <div className="loading">Lade EHS-Dashboard...</div>;
  }

  if (!data) {
    return <div className="error">Fehler beim Laden der Daten</div>;
  }

  return (
    <>
      <AppNavbar title="EHS KPI Dashboard" />
      <div className="ehs-dashboard">
        <div className="dashboard-header">
          <div className="header-controls">
            <button onClick={handleGeneratePDF} className="btn-pdf">
              📄 PDF-Bericht erstellen
            </button>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="project-selector"
            >
              <option value="all">Alle Projekte</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="month-selector"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-selector"
            >
              {[2022, 2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

      {/* Work Data Input */}
      <div className="work-data-card">
        <div className="card-header">
          <h2>Arbeitsdaten für {monthNames[selectedMonth - 1]} {selectedYear}</h2>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="btn-edit">
              Bearbeiten
            </button>
          )}
        </div>
        {editMode ? (
          <div className="work-data-form">
            <div className="form-group">
              <label>Arbeitstage</label>
              <input
                type="number"
                value={workData.workingDays}
                onChange={(e) => setWorkData({ ...workData, workingDays: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Arbeiter pro Tag</label>
              <input
                type="number"
                value={workData.workersPerDay}
                onChange={(e) => setWorkData({ ...workData, workersPerDay: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Stunden pro Tag</label>
              <input
                type="number"
                step="0.5"
                value={workData.hoursPerDay}
                onChange={(e) => setWorkData({ ...workData, hoursPerDay: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-actions">
              <button onClick={saveWorkData} className="btn-save">Speichern</button>
              <button onClick={() => setEditMode(false)} className="btn-cancel">Abbrechen</button>
            </div>
          </div>
        ) : (
          <div className="work-data-display">
            <div className="data-item">
              <span className="label">Arbeitstage:</span>
              <span className="value">{workData.workingDays}</span>
            </div>
            <div className="data-item">
              <span className="label">Arbeiter pro Tag:</span>
              <span className="value">{workData.workersPerDay}</span>
            </div>
            <div className="data-item">
              <span className="label">Stunden pro Tag:</span>
              <span className="value">{workData.hoursPerDay}</span>
            </div>
            <div className="data-item">
              <span className="label">Gesamtstunden:</span>
              <span className="value">{data.kpis.totalHours.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Category-Month Matrix */}
      <div className="matrix-card">
        <h2>Jahresübersicht {selectedYear} - Vorfälle nach Kategorie und Monat</h2>
        <div className="matrix-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="category-header">Kategorie</th>
                {monthNames.map((month, index) => (
                  <th key={index} className="month-header">{month.substring(0, 3)}</th>
                ))}
                <th className="total-header">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(categoryNames).map((category) => {
                const total = getCategoryTotal(category);
                return (
                  <tr key={category} className={total > 0 ? 'has-incidents' : ''}>
                    <td className="category-cell">{categoryNames[category]}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                      const count = categoryMatrix[category][month];
                      return (
                        <td key={month} className={`count-cell ${count > 0 ? 'has-count' : ''}`}>
                          {count > 0 ? count : '-'}
                        </td>
                      );
                    })}
                    <td className="total-cell">{total > 0 ? total : '-'}</td>
                  </tr>
                );
              })}
              <tr className="totals-row">
                <td className="category-cell"><strong>Summe</strong></td>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                  const total = getMonthTotal(month);
                  return (
                    <td key={month} className="total-cell">
                      <strong>{total > 0 ? total : '-'}</strong>
                    </td>
                  );
                })}
                <td className="grand-total-cell">
                  <strong>{grandTotal}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <h3>LTIFR (Monat)</h3>
          <div className="kpi-value">{data.kpis.ltifr.toFixed(2)}</div>
          <div className="kpi-label">Lost Time Injury Frequency Rate</div>
        </div>
        <div className="kpi-card">
          <h3>TRIR (Monat)</h3>
          <div className="kpi-value">{data.kpis.trir.toFixed(2)}</div>
          <div className="kpi-label">Total Recordable Injury Rate</div>
        </div>
        <div className="kpi-card">
          <h3>LTIFR (YTD)</h3>
          <div className="kpi-value">{data.kpis.ytdLTIFR.toFixed(2)}</div>
          <div className="kpi-label">Jahr bis heute</div>
        </div>
        <div className="kpi-card">
          <h3>TRIR (YTD)</h3>
          <div className="kpi-value">{data.kpis.ytdTRIR.toFixed(2)}</div>
          <div className="kpi-label">Jahr bis heute</div>
        </div>
      </div>

      {/* EHS Pyramid */}
      <div className="pyramid-card">
        <h2>EHS Pyramide</h2>
        <div className="pyramid">
          <div className="pyramid-level level-fatalities level-1">
            <span className="level-label">Todesfälle</span>
            <span className="level-count">{data.pyramid.fatalities}</span>
          </div>
          <div className="pyramid-level level-ltis level-2">
            <span className="level-label">LTI (Lost Time Injuries)</span>
            <span className="level-count">{data.pyramid.ltis}</span>
          </div>
          <div className="pyramid-level level-recordables level-3">
            <span className="level-label">Meldepflichtige Unfälle</span>
            <span className="level-count">{data.pyramid.recordables}</span>
          </div>
          <div className="pyramid-level level-firstaid level-4">
            <span className="level-label">Erste Hilfe</span>
            <span className="level-count">{data.pyramid.firstAids}</span>
          </div>
          <div className="pyramid-level level-nearmiss level-5">
            <span className="level-label">Beinahe-Unfälle</span>
            <span className="level-count">{data.pyramid.nearMisses}</span>
          </div>
          <div className="pyramid-level level-unsafe-behavior level-6">
            <span className="level-label">Unsicheres Verhalten</span>
            <span className="level-count">{data.pyramid.unsafeBehaviors}</span>
          </div>
          <div className="pyramid-level level-unsafe-condition level-7">
            <span className="level-label">Unsichere Zustände</span>
            <span className="level-count">{data.pyramid.unsafeConditions}</span>
          </div>
          <div className="pyramid-level level-property level-8">
            <span className="level-label">Sachschäden</span>
            <span className="level-count">{data.pyramid.propertyDamages}</span>
          </div>
          <div className="pyramid-level level-environment level-9">
            <span className="level-label">Umweltvorfälle</span>
            <span className="level-count">{data.pyramid.environmentIncidents}</span>
          </div>
          <div className="pyramid-level level-observations level-10">
            <span className="level-label">Sicherheitsbeobachtungen</span>
            <span className="level-count">{data.pyramid.safetyObservations}</span>
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="incidents-card">
        <h2>Vorfälle in diesem Monat ({data.incidents.length})</h2>
        <div className="incidents-list">
          {data.incidents.length === 0 ? (
            <p className="no-data">Keine Vorfälle in diesem Monat</p>
          ) : (
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Kategorie</th>
                  <th>Beschreibung</th>
                  <th>Schweregrad</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.incidents.map((incident) => (
                  <tr key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)}>
                    <td>{new Date(incident.incidentDate).toLocaleDateString('de-DE')}</td>
                    <td>{incident.ehsCategory}</td>
                    <td>{incident.description}</td>
                    <td>
                      <span className={`severity-badge severity-${incident.ehsSeverity?.toLowerCase()}`}>
                        {incident.ehsSeverity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${incident.status.toLowerCase()}`}>
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default EHSDashboard;
