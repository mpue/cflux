import React, { useState, useEffect } from 'react';
import { Report } from '../../types';
import { reportService } from '../../services/report.service';
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

interface ReportsTabProps {
  reports: Report[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ reports }) => {
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
