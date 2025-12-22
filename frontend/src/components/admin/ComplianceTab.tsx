import React from 'react';
import { ComplianceStats, ComplianceViolation } from '../../types';

interface ComplianceTabProps {
  stats: ComplianceStats | null;
  violations: ComplianceViolation[];
  filter: 'all' | 'unresolved' | 'critical';
  onFilterChange: (filter: 'all' | 'unresolved' | 'critical') => void;
  onResolve: (id: string) => void;
}

export const ComplianceTab: React.FC<ComplianceTabProps> = ({ stats, violations, filter, onFilterChange, onResolve }) => {
  
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

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>🇨🇭 Swiss Compliance Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Überwachung der Schweizer Arbeitszeitvorschriften (ArG/ArGV 1)
      </p>

      {/* Statistiken */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.unresolvedViolations}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Offene Violations</div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '3rem' }}>🚨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.criticalViolations}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Kritische Violations</div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '3rem' }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.recentViolations}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Letzte 30 Tage</div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '3rem' }}>👥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{stats.topUsersWithViolations.length}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Betroffene User</div>
            </div>
          </div>
        </div>
      )}

      {/* Violations nach Typ */}
      {stats && stats.violationsByType.length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0 }}>Violations nach Typ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.violationsByType.map((item) => (
              <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                <span style={{ fontWeight: 500 }}>{getViolationTypeLabel(item.type)}</span>
                <span style={{ background: '#007bff', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ margin: 0 }}>Compliance Violations</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onFilterChange('all')}
          >
            Alle
          </button>
          <button 
            className={filter === 'unresolved' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onFilterChange('unresolved')}
          >
            Offen
          </button>
          <button 
            className={filter === 'critical' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onFilterChange('critical')}
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
                <tr key={violation.id} style={violation.severity === 'CRITICAL' ? { background: '#fff5f5' } : {}}>
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
                        onClick={() => onResolve(violation.id)}
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

      {/* Top User mit Violations */}
      {stats && stats.topUsersWithViolations.length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginTop: '30px' }}>
          <h3 style={{ marginTop: 0 }}>Mitarbeiter mit den meisten Violations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.topUsersWithViolations.map((user) => (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '5px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>{user.firstName} {user.lastName}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>{user.email}</span>
                </div>
                <span style={{ background: '#dc3545', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500 }}>
                  {user.violationCount} Violations
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
