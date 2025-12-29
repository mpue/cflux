import React, { useState, useEffect } from 'react';
import { workflowService } from '../services/workflow.service';
import { useAuth } from '../contexts/AuthContext';
import './MyApprovals.css';

interface PendingApproval {
  id: string;
  status: string;
  step: {
    id: string;
    name: string;
    type: string;
    requireAllApprovers: boolean;
  };
  instance: {
    id: string;
    status: string;
    startedAt: string;
    workflow: {
      id: string;
      name: string;
    };
    invoice: {
      id: string;
      invoiceNumber: string;
      totalAmount: number;
      customer: {
        id: string;
        name: string;
      };
    };
  };
}

const MyApprovals: React.FC = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadApprovals();
    // Refresh every 30 seconds
    const interval = setInterval(loadApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedApproval) {
        setSelectedApproval(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedApproval]);

  const loadApprovals = async () => {
    try {
      const data = await workflowService.getMyPendingApprovals();
      setApprovals(data);
    } catch (error) {
      console.error('Fehler beim Laden der Genehmigungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval: PendingApproval) => {
    if (!user) return;

    setActionLoading(true);
    try {
      await workflowService.approveWorkflowStep(approval.id, user.id, comment);
      setSelectedApproval(null);
      setComment('');
      await loadApprovals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Genehmigen');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (approval: PendingApproval) => {
    if (!user) return;
    if (!comment.trim()) {
      alert('Bitte geben Sie einen Grund für die Ablehnung an');
      return;
    }

    setActionLoading(true);
    try {
      await workflowService.rejectWorkflowStep(approval.id, user.id, comment);
      setSelectedApproval(null);
      setComment('');
      await loadApprovals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Ablehnen');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="my-approvals-page">
        <div className="loading">Lade Genehmigungen...</div>
      </div>
    );
  }

  return (
    <div className="my-approvals-page">
      <div className="my-approvals-header">
        <h1>Meine Genehmigungen</h1>
        <div className="approval-count">
          {approvals.length > 0 && (
            <span className="badge">{approvals.length}</span>
          )}
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="no-approvals">
          <div className="icon">✓</div>
          <h2>Keine ausstehenden Genehmigungen</h2>
          <p>Sie haben momentan keine Rechnungen zu genehmigen.</p>
        </div>
      ) : (
        <div className="approvals-grid">
          {approvals.map(approval => (
            <div key={approval.id} className="approval-card">
              <div className="approval-card-header">
                <div className="workflow-badge">{approval.instance.workflow.name}</div>
                <div className="approval-date">
                  {formatDate(approval.instance.startedAt)}
                </div>
              </div>

              <div className="approval-card-body">
                <div className="approval-step">
                  <span className="step-icon">📋</span>
                  <span className="step-name">{approval.step.name}</span>
                </div>

                <div className="invoice-info">
                  <div className="invoice-number">
                    Rechnung #{approval.instance.invoice.invoiceNumber}
                  </div>
                  <div className="customer-name">
                    {approval.instance.invoice.customer.name}
                  </div>
                  <div className="invoice-amount">
                    {formatCurrency(approval.instance.invoice.totalAmount)}
                  </div>
                </div>
              </div>

              <div className="approval-card-actions">
                <button
                  className="btn-approve"
                  onClick={() => setSelectedApproval(approval)}
                >
                  Bearbeiten
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedApproval && (
        <div className="approval-modal-overlay" onClick={() => setSelectedApproval(null)}>
          <div className="approval-modal" onClick={e => e.stopPropagation()}>
            <div className="approval-modal-header">
              <h2>Genehmigung bearbeiten</h2>
              <button className="btn-close" onClick={() => setSelectedApproval(null)}>✕</button>
            </div>

            <div className="approval-modal-body">
              <div className="approval-details">
                <div className="detail-row">
                  <span className="label">Workflow:</span>
                  <span className="value">{selectedApproval.instance.workflow.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Schritt:</span>
                  <span className="value">{selectedApproval.step.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Rechnung:</span>
                  <span className="value">#{selectedApproval.instance.invoice.invoiceNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Kunde:</span>
                  <span className="value">{selectedApproval.instance.invoice.customer.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Betrag:</span>
                  <span className="value">{formatCurrency(selectedApproval.instance.invoice.totalAmount)}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Kommentar (optional für Genehmigung, erforderlich für Ablehnung):</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ihr Kommentar..."
                  rows={4}
                />
              </div>
            </div>

            <div className="approval-modal-actions">
              <button
                className="btn-reject"
                onClick={() => handleReject(selectedApproval)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Bitte warten...' : '✕ Ablehnen'}
              </button>
              <button
                className="btn-approve"
                onClick={() => handleApprove(selectedApproval)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Bitte warten...' : '✓ Genehmigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApprovals;
