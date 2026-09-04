import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DocumentApprovalStatus, { ApprovalStatus } from './DocumentApprovalStatus';
import './DocumentApprovalPanel.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface DocumentApprovalPanelProps {
  documentId: string;
  currentStatus: ApprovalStatus;
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  rejectedAt?: string | null;
  rejectedBy?: { id: string; firstName: string; lastName: string } | null;
  rejectionReason?: string | null;
  publishedAt?: string | null;
  onStatusChange?: () => void;
  canSubmit?: boolean;
  canApprove?: boolean;
  canPublish?: boolean;
}

const DocumentApprovalPanel: React.FC<DocumentApprovalPanelProps> = ({
  documentId,
  currentStatus,
  submittedAt,
  approvedAt,
  approvedBy,
  rejectedAt,
  rejectedBy,
  rejectionReason,
  publishedAt,
  onStatusChange,
  canSubmit = false,
  canApprove = false,
  canPublish = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');
  const [approvers, setApprovers] = useState<User[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);

  // Load potential approvers (admins and users with admin permissions)
  useEffect(() => {
    const loadApprovers = async () => {
      setLoadingApprovers(true);
      try {
        const response = await api.get('/users');
        const users = response.data as User[];
        // Filter for admins or users with appropriate permissions
        const adminUsers = users.filter((u: User) => 
          u.role === 'ADMIN' && u.id !== documentId
        );
        setApprovers(adminUsers);
      } catch (err) {
        console.error('Failed to load approvers:', err);
      } finally {
        setLoadingApprovers(false);
      }
    };

    if (currentStatus === 'DRAFT' && canSubmit) {
      loadApprovers();
    }
  }, [currentStatus, canSubmit, documentId]);

  const handleSubmitForApproval = async () => {
    if (!selectedApproverId) {
      setError('Bitte wählen Sie einen Genehmiger aus');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/intranet/${documentId}/submit`, {
        approverUserId: selectedApproverId
      });
      setShowSubmitDialog(false);
      setSelectedApproverId('');
      onStatusChange?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Einreichen des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Möchten Sie dieses Dokument freigeben?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/intranet/${documentId}/approve`);
      onStatusChange?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Freigeben des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Bitte geben Sie einen Ablehnungsgrund an');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/intranet/${documentId}/reject`, { reason: rejectReason });
      setShowRejectDialog(false);
      setRejectReason('');
      onStatusChange?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Ablehnen des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Möchten Sie dieses Dokument veröffentlichen?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/intranet/${documentId}/publish`);
      onStatusChange?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Veröffentlichen des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToDraft = async () => {
    if (!window.confirm('Möchten Sie dieses Dokument zurück in den Entwurfsmodus setzen?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/intranet/${documentId}/return-to-draft`);
      onStatusChange?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Zurücksetzen des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="document-approval-panel">
      <div className="approval-header">
        <strong>Freigabestatus</strong>
        <DocumentApprovalStatus status={currentStatus} />
      </div>

      {error && (
        <div className="approval-error">
          {error}
        </div>
      )}

      {/* Status History */}
      <div className="approval-history">
        {submittedAt && (
          <div className="approval-history-item">
            <span className="history-icon">📤</span>
            <div className="history-details">
              <div className="history-label">Eingereicht am</div>
              <div className="history-value">{formatDateTime(submittedAt)}</div>
            </div>
          </div>
        )}

        {approvedAt && approvedBy && (
          <div className="approval-history-item">
            <span className="history-icon">✅</span>
            <div className="history-details">
              <div className="history-label">Freigegeben</div>
              <div className="history-value">
                {formatDateTime(approvedAt)} von {approvedBy.firstName} {approvedBy.lastName}
              </div>
            </div>
          </div>
        )}

        {rejectedAt && rejectedBy && (
          <div className="approval-history-item">
            <span className="history-icon">❌</span>
            <div className="history-details">
              <div className="history-label">Abgelehnt</div>
              <div className="history-value">
                {formatDateTime(rejectedAt)} von {rejectedBy.firstName} {rejectedBy.lastName}
              </div>
              {rejectionReason && (
                <div className="rejection-reason">
                  <strong>Grund:</strong> {rejectionReason}
                </div>
              )}
            </div>
          </div>
        )}

        {publishedAt && (
          <div className="approval-history-item">
            <span className="history-icon">🌐</span>
            <div className="history-details">
              <div className="history-label">Veröffentlicht am</div>
              <div className="history-value">{formatDateTime(publishedAt)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="approval-actions">
        {currentStatus === 'DRAFT' && canSubmit && (
          <button
            onClick={() => setShowSubmitDialog(true)}
            disabled={loading || loadingApprovers}
            className="btn btn-primary"
          >
            {loadingApprovers ? 'Lädt...' : 'Zur Freigabe einreichen'}
          </button>
        )}

        {currentStatus === 'PENDING_REVIEW' && canApprove && (
          <>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? 'Wird freigegeben...' : 'Freigeben'}
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={loading}
              className="btn btn-danger"
            >
              Ablehnen
            </button>
          </>
        )}

        {currentStatus === 'APPROVED' && canPublish && (
          <button
            onClick={handlePublish}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Wird veröffentlicht...' : 'Veröffentlichen'}
          </button>
        )}

        {(currentStatus === 'REJECTED' || currentStatus === 'PENDING_REVIEW') && canSubmit && (
          <button
            onClick={handleReturnToDraft}
            disabled={loading}
            className="btn btn-secondary"
          >
            Zurück zu Entwurf
          </button>
        )}
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="modal-overlay" onClick={() => setShowRejectDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dokument ablehnen</h3>
              <button
                onClick={() => setShowRejectDialog(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Bitte geben Sie einen Grund für die Ablehnung an:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ablehnungsgrund..."
                rows={4}
                className="form-control"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Abbrechen
              </button>
              <button
                onClick={handleReject}
                className="btn btn-danger"
                disabled={loading || !rejectReason.trim()}
              >
                {loading ? 'Wird abgelehnt...' : 'Ablehnen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit for Approval Dialog */}
      {showSubmitDialog && (
        <div className="modal-overlay" onClick={() => setShowSubmitDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Zur Freigabe einreichen</h3>
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Wählen Sie einen Genehmiger für dieses Dokument:</p>
              {error && (
                <div className="approval-error" style={{ marginBottom: '12px' }}>
                  {error}
                </div>
              )}
              <select
                value={selectedApproverId}
                onChange={(e) => setSelectedApproverId(e.target.value)}
                className="form-control"
                autoFocus
                disabled={loadingApprovers}
              >
                <option value="">-- Genehmiger auswählen --</option>
                {approvers.map(approver => (
                  <option key={approver.id} value={approver.id}>
                    {approver.firstName} {approver.lastName} ({approver.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowSubmitDialog(false);
                  setSelectedApproverId('');
                  setError(null);
                }}
                className="btn btn-secondary"
                disabled={loading}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmitForApproval}
                className="btn btn-primary"
                disabled={loading || !selectedApproverId}
              >
                {loading ? 'Wird eingereicht...' : 'Einreichen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentApprovalPanel;
