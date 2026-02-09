import React, { useState, useEffect, useMemo } from 'react';
import { actionService, ActionLog } from '../../services/action.service';

interface SystemLogsTabProps {
  onUpdate?: () => void;
}

export const SystemLogsTab: React.FC<SystemLogsTabProps> = ({ onUpdate }) => {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'error'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'createdAt' | 'executionTime'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

  useEffect(() => {
    loadLogs();
  }, [successFilter, currentPage]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await actionService.getActionLogs({
        success: successFilter === 'all' ? undefined : successFilter === 'success',
        limit,
        offset: (currentPage - 1) * limit,
      });
      setLogs(response.logs);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      alert('Fehler beim Laden der Logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'createdAt' | 'executionTime') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      // Search filter
      const matchesSearch = !searchTerm || 
        log.actionKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'all' || log.action?.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (sortField === 'executionTime') {
        aValue = a.executionTime || 0;
        bValue = b.executionTime || 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [logs, searchTerm, categoryFilter, sortField, sortDirection]);

  const getUniqueCategories = () => {
    const categories = new Set(logs.map(log => log.action?.category).filter(Boolean));
    return Array.from(categories);
  };

  const parseTriggeredWorkflows = (triggeredWorkflows?: string): string[] => {
    if (!triggeredWorkflows) return [];
    try {
      return JSON.parse(triggeredWorkflows);
    } catch {
      return [];
    }
  };

  const formatExecutionTime = (time?: number): string => {
    if (!time) return '-';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const SortIcon: React.FC<{ field: 'createdAt' | 'executionTime' }> = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>System Logs</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={loadLogs}
            disabled={loading}
          >
            🔄 Aktualisieren
          </button>
        </div>
      </div>

      {/* Floating Filter */}
      <div style={{ 
        position: 'sticky',
        top: '0',
        zIndex: 100,
        background: 'var(--card-bg, #f8f9fa)', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid var(--border-color, #dee2e6)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary, #333)', fontSize: '13px' }}>
          🔍 Filter
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Suche nach Action, Benutzer oder Fehler..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              fontSize: '14px',
              minWidth: '300px'
            }}
          />
          
          <select
            value={successFilter}
            onChange={(e) => {
              setSuccessFilter(e.target.value as 'all' | 'success' | 'error');
              setCurrentPage(1);
            }}
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">Alle Status</option>
            <option value="success">✅ Erfolgreich</option>
            <option value="error">❌ Fehler</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">Alle Kategorien</option>
            {getUniqueCategories().map(cat => (
              <option key={cat} value={cat}>
                {actionService.getCategoryIcon(cat as any)} {actionService.getCategoryLabel(cat as any)}
              </option>
            ))}
          </select>

          <div style={{
            padding: '10px',
            background: 'white',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {filteredAndSortedLogs.length} / {total} Logs
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Lade Logs...
        </div>
      )}

      {!loading && (
        <>
          <div className="data-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('createdAt')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Zeitpunkt <SortIcon field="createdAt" />
                  </th>
                  <th>Status</th>
                  <th>Kategorie</th>
                  <th>Action</th>
                  <th>Benutzer</th>
                  <th>Workflows</th>
                  <th 
                    onClick={() => handleSort('executionTime')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Dauer <SortIcon field="executionTime" />
                  </th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                      Keine Logs gefunden
                    </td>
                  </tr>
                ) : null}
                {filteredAndSortedLogs.map((log) => {
                  const workflows = parseTriggeredWorkflows(log.triggeredWorkflows);
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                        <div>{new Date(log.createdAt).toLocaleDateString('de-DE')}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {new Date(log.createdAt).toLocaleTimeString('de-DE')}
                        </div>
                      </td>
                      <td>
                        {log.success ? (
                          <span style={{ color: '#28a745', fontWeight: '600' }}>✅ Erfolg</span>
                        ) : (
                          <span style={{ color: '#dc3545', fontWeight: '600' }}>❌ Fehler</span>
                        )}
                      </td>
                      <td>
                        {log.action ? (
                          <span title={actionService.getCategoryLabel(log.action.category)}>
                            {actionService.getCategoryIcon(log.action.category)}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{log.action?.displayName || log.actionKey}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{log.actionKey}</div>
                      </td>
                      <td>
                        {log.user ? (
                          <div>
                            <div>{log.user.firstName} {log.user.lastName}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{log.user.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#999' }}>System</span>
                        )}
                      </td>
                      <td>
                        {workflows.length > 0 ? (
                          <span style={{ 
                            background: '#e3f2fd', 
                            padding: '2px 8px', 
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {workflows.length} Workflow{workflows.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                        {formatExecutionTime(log.executionTime)}
                      </td>
                      <td>
                        {log.errorMessage && (
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ color: '#dc3545', fontSize: '12px' }}>
                              Fehler anzeigen
                            </summary>
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '8px', 
                              background: '#fff3cd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              maxWidth: '300px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {log.errorMessage}
                            </div>
                          </details>
                        )}
                        {log.contextData && !log.errorMessage && (
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ color: '#007bff', fontSize: '12px' }}>
                              Context anzeigen
                            </summary>
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '8px', 
                              background: '#f8f9fa',
                              borderRadius: '4px',
                              fontSize: '11px',
                              maxWidth: '300px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontFamily: 'monospace'
                            }}>
                              {log.contextData}
                            </div>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '10px',
              marginTop: '20px',
              padding: '15px'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
              >
                ← Zurück
              </button>
              <span style={{ padding: '0 15px', fontWeight: '500' }}>
                Seite {currentPage} von {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Weiter →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SystemLogsTab;
