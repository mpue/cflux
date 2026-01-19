import React from 'react';
import WidgetHeader from './WidgetHeader';
import { AbsenceRequest } from '../../types';
import './DashboardWidgets.css';

interface AbsenceRequestsWidgetProps {
  absenceRequests: AbsenceRequest[];
  onNewRequest: () => void;
}

const AbsenceRequestsWidget: React.FC<AbsenceRequestsWidgetProps> = ({
  absenceRequests,
  onNewRequest,
}) => {
  return (
    <div className="dashboard-widget">
      <WidgetHeader 
        title="Abwesenheitsanträge" 
        icon="📋"
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {absenceRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>
                    Keine Abwesenheitsanträge vorhanden
                  </td>
                </tr>
              ) : (
                absenceRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.type}</td>
                    <td>{new Date(request.startDate).toLocaleDateString('de-DE')}</td>
                    <td>{new Date(request.endDate).toLocaleDateString('de-DE')}</td>
                    <td>{request.days}</td>
                    <td>
                      <span className={`status-badge ${
                          request.status === 'APPROVED' ? 'approved' :
                          request.status === 'REJECTED' ? 'rejected' :
                          'pending'
                      }`}>
                        {request.status}
                      </span>
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
