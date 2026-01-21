import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DocumentApprovalStatus from '../intranet/DocumentApprovalStatus';
import WidgetHeader from './WidgetHeader';
import './DashboardWidgets.css';

interface PendingApproval {
  document: {
    id: string;
    title: string;
    type: string;
    approvalStatus: string;
    createdBy: {
      firstName: string;
      lastName: string;
    };
  };
  workflowInstance: {
    id: string;
    createdAt: string;
  };
  assignedStep: {
    dueDate: string;
  };
}

interface PendingApprovalsWidgetProps {
  onRemove?: () => void;
}

const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({ onRemove }) => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/intranet/pending-approvals');
      setApprovals(response.data);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = (documentId: string) => {
    navigate(`/intranet`);
    // TODO: Navigate to specific document when implemented
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Überfällig';
    if (diffDays === 0) return 'Heute';
    if (diffDays <= 2) return `In ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    return date.toLocaleDateString('de-CH');
  };

  return (
    <div className="dashboard-widget">
      <WidgetHeader title="Ausstehende Freigaben" icon="🔔" onRemove={onRemove} />
      <div className="widget-content" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div className="widget-empty-state">Lädt...</div>
        ) : approvals.length > 0 ? (
          <div>
            {approvals.map((approval) => (
              <div
                key={approval.document.id}
                onClick={() => handleDocumentClick(approval.document.id)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontSize: '24px' }}>
                  {approval.document.type === 'DOCUMENT' ? '📄' : '📁'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    {approval.document.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Von: {approval.document.createdBy.firstName} {approval.document.createdBy.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>
                    Fällig: {formatDueDate(approval.assignedStep.dueDate)}
                  </div>
                </div>
                <DocumentApprovalStatus
                  status={approval.document.approvalStatus as any}
                  showLabel={false}
                  size="small"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty-state">
            <div className="widget-empty-state-icon">✅</div>
            <div>Keine ausstehenden Freigaben</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalsWidget;
