import React from 'react';
import './DocumentApprovalStatus.css';

export type ApprovalStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED';

interface DocumentApprovalStatusProps {
  status: ApprovalStatus;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const statusConfig: Record<ApprovalStatus, { label: string; icon: string; className: string }> = {
  DRAFT: {
    label: 'Entwurf',
    icon: '📝',
    className: 'status-draft'
  },
  PENDING_REVIEW: {
    label: 'Zur Freigabe',
    icon: '⏳',
    className: 'status-pending'
  },
  APPROVED: {
    label: 'Freigegeben',
    icon: '✅',
    className: 'status-approved'
  },
  REJECTED: {
    label: 'Abgelehnt',
    icon: '❌',
    className: 'status-rejected'
  },
  PUBLISHED: {
    label: 'Veröffentlicht',
    icon: '🌐',
    className: 'status-published'
  },
  ARCHIVED: {
    label: 'Archiviert',
    icon: '📦',
    className: 'status-archived'
  }
};

const DocumentApprovalStatus: React.FC<DocumentApprovalStatusProps> = ({
  status,
  showLabel = true,
  size = 'medium'
}) => {
  const config = statusConfig[status];

  return (
    <div className={`approval-status ${config.className} approval-status-${size}`}>
      <span className="approval-status-icon">{config.icon}</span>
      {showLabel && <span className="approval-status-label">{config.label}</span>}
    </div>
  );
};

export default DocumentApprovalStatus;
