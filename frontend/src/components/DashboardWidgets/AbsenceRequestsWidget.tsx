import React from 'react';
import WidgetHeader from './WidgetHeader';
import { AbsenceRequest } from '../../types';
import './DashboardWidgets.css';

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Urlaub',
  SICK_LEAVE: 'Krankheit',
  PERSONAL_LEAVE: 'Persönlich',
  UNPAID_LEAVE: 'Unbezahlt',
  OVERTIME_REDUCTION: 'Überstundenabbau',
  OTHER: 'Sonstiges',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ausstehend',
  APPROVED: 'Genehmigt',
  REJECTED: 'Abgelehnt',
};

interface AbsenceRequestsWidgetProps {
  absenceRequests: AbsenceRequest[];
  onNewRequest: () => void;
  onEditRequest: (request: AbsenceRequest) => void;
  onDeleteRequest: (id: string) => void;
  onRemove?: () => void;
}

const AbsenceRequestsWidget: React.FC<AbsenceRequestsWidgetProps> = ({
  absenceRequests,
  onNewRequest,
  onEditRequest,
  onDeleteRequest,
  onRemove,
}) => {
  return (
    <div className="dashboard-widget">
      <WidgetHeader 
        title="Abwesenheitsanträge" 
        icon="📋"
        onRemove={onRemove}
        actions={
          <button className="btn btn-primary btn-small" onClick={onNewRequest}>
            Neuer Antrag
          </button>
        }
      />
      <div className="widget-content">
        <div className="data-table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Von</th>
                <th>Bis</th>
                <th>Tage</th>
                <th>Grund</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {absenceRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>
                    Keine Abwesenheitsanträge vorhanden
                  </td>
                </tr>
              ) : (
                absenceRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{ABSENCE_TYPE_LABELS[request.type] || request.type}</td>
                    <td>{new Date(request.startDate).toLocaleDateString('de-DE')}</td>
                    <td>{new Date(request.endDate).toLocaleDateString('de-DE')}</td>
                    <td>{request.days}</td>
                    <td>{request.reason || '-'}</td>
                    <td>
                      <span className={`status-badge ${
                          request.status === 'APPROVED' ? 'approved' :
                          request.status === 'REJECTED' ? 'rejected' :
                          'pending'
                      }`}>
                        {STATUS_LABELS[request.status] || request.status}
                      </span>
                    </td>
                    <td>
                      {request.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className="btn btn-small"
                            onClick={() => onEditRequest(request)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            title="Antrag bearbeiten"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => {
                              if (window.confirm('Abwesenheitsantrag wirklich löschen?')) {
                                onDeleteRequest(request.id);
                              }
                            }}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            title="Antrag löschen"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AbsenceRequestsWidget;
