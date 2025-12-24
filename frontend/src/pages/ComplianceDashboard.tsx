import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ComplianceViolation, ComplianceStats } from '../types';
import '../styles/ComplianceDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ComplianceDashboard: React.FC = () => {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved');

  useEffect(() => {
    document.title = 'CFlux - Compliance';
  }, []);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Stats abrufen
      const statsResponse = await axios.get(`${API_URL}/api/compliance/violations/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data);

      // Violations abrufen
      const params: any = {};
      if (filter === 'unresolved') params.resolved = 'false';
      if (filter === 'critical') {
        params.resolved = 'false';
        params.severity = 'CRITICAL';
      }

      const violationsResponse = await axios.get(`${API_URL}/api/compliance/violations`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setViolations(violationsResponse.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      setLoading(false);
    }
  };

  const resolveViolation = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const notes = prompt('Notizen zur Auflösung (optional):');
      
      await axios.patch(
        `${API_URL}/api/compliance/violations/${id}/resolve`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchData();
    } catch (error) {
      console.error('Error resolving violation:', error);
      alert('Fehler beim Auflösen der Violation');
    }
  };

  const getViolationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      REST_TIME: 'Ruhezeit unterschritten',
      MAX_WEEKLY_HOURS: 'Wöchentliche Höchstarbeitszeit',
      MAX_DAILY_HOURS: 'Tägliche Höchstarbeitszeit',
      MISSING_PAUSE: 'Fehlende Pause',
      OVERTIME_LIMIT: 'Überzeit-Limit',
      NIGHT_WORK: 'Nachtarbeit',
      SUNDAY_WORK: 'Sonntagsarbeit'
    };
    return labels[type] || type;
  };

  const getSeverityBadge = (severity: string) => {
    return severity === 'CRITICAL' 
      ? <span className="badge badge-critical">Kritisch</span>
      : <span className="badge badge-warning">Warnung</span>;
  };

  if (loading) {
    return <div className="loading">Lade Compliance-Daten...</div>;
  }

  return (
    <div className="compliance-dashboard">
      <div className="dashboard-header">
        <h1>🇨🇭 Swiss Compliance Dashboard</h1>
        <p>Überwachung der Schweizer Arbeitszeitvorschriften (ArG/ArGV 1)</p>
      </div>

      {/* Statistiken */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.unresolvedViolations}</div>
              <div className="stat-label">Offene Violations</div>
            </div>
          </div>

          <div className="stat-card critical">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-value">{stats.criticalViolations}</div>
              <div className="stat-label">Kritische Violations</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.recentViolations}</div>
              <div className="stat-label">Letzte 30 Tage</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.topUsersWithViolations.length}</div>
              <div className="stat-label">Betroffene User</div>
            </div>
          </div>
        </div>
      )}

      {/* Violations nach Typ */}
      {stats && stats.violationsByType.length > 0 && (
        <div className="violations-by-type">
          <h2>Violations nach Typ</h2>
          <div className="type-list">
            {stats.violationsByType.map((item) => (
              <div key={item.type} className="type-item">
                <span className="type-label">{getViolationTypeLabel(item.type)}</span>
                <span className="type-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="violations-section">
        <div className="section-header">
          <h2>Compliance Violations</h2>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Alle
            </button>
            <button 
              className={filter === 'unresolved' ? 'active' : ''}
              onClick={() => setFilter('unresolved')}
            >
              Offen
            </button>
            <button 
              className={filter === 'critical' ? 'active' : ''}
              onClick={() => setFilter('critical')}
            >
              Kritisch
            </button>
          </div>
        </div>

        {/* Violations Tabelle */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Mitarbeiter</th>
                <th>Typ</th>
                <th>Schwere</th>
                <th>Beschreibung</th>
                <th>Ist-Wert</th>
                <th>Soll-Wert</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {violations.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    ✅ Keine Violations gefunden
                  </td>
                </tr>
              ) : (
                violations.map((violation) => (
                  <tr key={violation.id} className={violation.severity === 'CRITICAL' ? 'row-critical' : ''}>
                    <td>{new Date(violation.date).toLocaleDateString('de-CH')}</td>
                    <td>
                      {violation.user ? 
                        `${violation.user.firstName} ${violation.user.lastName}` : 
                        'Unbekannt'
                      }
                    </td>
                    <td>{getViolationTypeLabel(violation.type)}</td>
                    <td>{getSeverityBadge(violation.severity)}</td>
                    <td>{violation.description}</td>
                    <td>{violation.actualValue || '-'}</td>
                    <td>{violation.requiredValue || '-'}</td>
                    <td>
                      {violation.resolved ? (
                        <span className="badge badge-success">Gelöst</span>
                      ) : (
                        <span className="badge badge-pending">Offen</span>
                      )}
                    </td>
                    <td>
                      {!violation.resolved && (
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => resolveViolation(violation.id)}
                        >
                          ✓ Auflösen
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top User mit Violations */}
      {stats && stats.topUsersWithViolations.length > 0 && (
        <div className="top-users-section">
          <h2>Mitarbeiter mit den meisten Violations</h2>
          <div className="users-list">
            {stats.topUsersWithViolations.map((user) => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <strong>{user.firstName} {user.lastName}</strong>
                  <span className="user-email">{user.email}</span>
                </div>
                <span className="user-violations">{user.violationCount} Violations</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceDashboard;
