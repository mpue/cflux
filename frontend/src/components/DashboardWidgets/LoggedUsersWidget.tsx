import React from 'react';
import WidgetHeader from './WidgetHeader';
import './DashboardWidgets.css';

interface LoggedUser {
  userId: string;
  firstName: string;
  lastName: string;
  status: string;
  clockIn: string;
  pauseMinutes: number;
  project?: { name: string };
  location?: { name: string };
}

interface LoggedUsersWidgetProps {
  loggedInUsers: LoggedUser[];
  onRemove?: () => void;
}

const LoggedUsersWidget: React.FC<LoggedUsersWidgetProps> = ({ loggedInUsers, onRemove }) => {
  return (
    <div className="dashboard-widget">
      <WidgetHeader title="Angemeldete Mitarbeiter" icon="👥" onRemove={onRemove} />
      <div className="widget-content">
        <div className="data-table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Seit</th>
                <th>Dauer</th>
                <th>Projekt</th>
                <th>Standort</th>
              </tr>
            </thead>
            <tbody>
              {loggedInUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>
                    Aktuell ist niemand angemeldet
                  </td>
                </tr>
              ) : (
                loggedInUsers.map((loggedUser) => {
                  const clockInTime = new Date(loggedUser.clockIn);
                  const now = new Date();
                  const durationMinutes = Math.floor((now.getTime() - clockInTime.getTime()) / (1000 * 60)) - (loggedUser.pauseMinutes || 0);
                  const hours = Math.floor(durationMinutes / 60);
                  const minutes = durationMinutes % 60;
                  
                  return (
                    <tr key={loggedUser.userId}>
                      <td>
                        <strong>{loggedUser.firstName} {loggedUser.lastName}</strong>
                      </td>
                      <td>
                        <span className={`status-badge ${loggedUser.status === 'ON_PAUSE' ? 'pending' : 'approved'}`}>
                          {loggedUser.status === 'ON_PAUSE' ? '⏸️ Pause' : '✅ Aktiv'}
                        </span>
                      </td>
                      <td>{clockInTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{hours}h {minutes}m</td>
                      <td>{loggedUser.project?.name || '-'}</td>
                      <td>{loggedUser.location?.name || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoggedUsersWidget;
