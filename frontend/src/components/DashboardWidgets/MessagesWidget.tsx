import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetHeader from './WidgetHeader';
import './DashboardWidgets.css';

interface MessagesWidgetProps {
  unreadMessagesCount: number;
}

const MessagesWidget: React.FC<MessagesWidgetProps> = ({ unreadMessagesCount }) => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-widget">
      <WidgetHeader title="Nachrichten" icon="💬" />
      <div className="widget-content">
        {unreadMessagesCount > 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📬</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
              {unreadMessagesCount}
            </div>
            <div style={{ color: '#666', marginBottom: '20px' }}>
              {unreadMessagesCount === 1 ? 'Ungelesene Nachricht' : 'Ungelesene Nachrichten'}
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/messages')}
            >
              Nachrichten öffnen
            </button>
          </div>
        ) : (
          <div className="widget-empty-state">
            <div className="widget-empty-state-icon">✉️</div>
            <div>Keine neuen Nachrichten</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesWidget;
