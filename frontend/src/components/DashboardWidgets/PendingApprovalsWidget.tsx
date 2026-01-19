import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetHeader from './WidgetHeader';
import './DashboardWidgets.css';

interface PendingApprovalsWidgetProps {
  pendingApprovalsCount: number;
  onRemove?: () => void;
}

const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({ pendingApprovalsCount, onRemove }) => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-widget">
      <WidgetHeader title="Ausstehende Genehmigungen" icon="✅" onRemove={onRemove} />
      <div className="widget-content">
        {pendingApprovalsCount > 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
              {pendingApprovalsCount}
            </div>
            <div style={{ color: '#666', marginBottom: '20px' }}>
              {pendingApprovalsCount === 1 ? 'Genehmigung' : 'Genehmigungen'} ausstehend
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/workflows')}
            >
              Genehmigungen ansehen
            </button>
          </div>
        ) : (
          <div className="widget-empty-state">
            <div className="widget-empty-state-icon">✓</div>
            <div>Keine ausstehenden Genehmigungen</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalsWidget;
