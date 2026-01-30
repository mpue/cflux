import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChecklistInstance, ChecklistStatus } from '../../types/checklist';
import api from '../../services/api';
import './DashboardWidgets.css';

interface ChecklistsWidgetProps {
  userId?: string;
}

const ChecklistsWidget: React.FC<ChecklistsWidgetProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [myInstances, setMyInstances] = useState<ChecklistInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/checklists/instances/my');
      // Filter nur aktive (nicht abgeschlossene oder abgebrochene)
      const activeInstances = response.data.filter(
        (instance: ChecklistInstance) =>
          instance.status === ChecklistStatus.IN_PROGRESS ||
          instance.status === ChecklistStatus.NOT_STARTED ||
          instance.status === ChecklistStatus.OVERDUE
      );
      setMyInstances(activeInstances.slice(0, 5)); // Max 5 anzeigen
    } catch (error: any) {
      console.error('Error loading checklists:', error);
      setError('Fehler beim Laden der Checklisten');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ChecklistStatus): string => {
    switch (status) {
      case ChecklistStatus.IN_PROGRESS:
        return '#2196f3';
      case ChecklistStatus.OVERDUE:
        return '#f44336';
      case ChecklistStatus.NOT_STARTED:
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: ChecklistStatus): string => {
    switch (status) {
      case ChecklistStatus.NOT_STARTED:
        return 'Nicht gestartet';
      case ChecklistStatus.IN_PROGRESS:
        return 'In Bearbeitung';
      case ChecklistStatus.OVERDUE:
        return 'Überfällig';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="widget-card">
        <div className="widget-header">
          <h3>📋 Meine Checklisten</h3>
        </div>
        <div className="widget-body" style={{ textAlign: 'center', padding: '20px' }}>
          Lädt...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-card">
        <div className="widget-header">
          <h3>📋 Meine Checklisten</h3>
        </div>
        <div className="widget-body" style={{ textAlign: 'center', padding: '20px', color: '#f44336' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card">
      <div className="widget-header">
        <h3>📋 Meine Checklisten</h3>
        <button
          className="widget-action-btn"
          onClick={() => navigate('/checklists')}
          title="Alle Checklisten anzeigen"
        >
          Alle anzeigen →
        </button>
      </div>
      <div className="widget-body" style={{ padding: 0 }}>
        {myInstances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Keine aktiven Checklisten
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {myInstances.map((instance) => (
              <div
                key={instance.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onClick={() => navigate(`/checklists/instances/${instance.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {instance.template?.name || 'Unbenannte Checkliste'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {instance.completedItems} / {instance.totalItems} Aufgaben
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: getStatusColor(instance.status),
                      color: 'white',
                      fontWeight: 500,
                    }}
                  >
                    {getStatusLabel(instance.status)}
                  </div>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${instance.progressPercent}%`,
                      height: '100%',
                      backgroundColor: getStatusColor(instance.status),
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistsWidget;
