import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const ApprovalNode = ({ data }: any) => {
  const approverCount = data.config?.approverUserIds?.length || 0;
  
  return (
    <div className="custom-node approval-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header">
        <span className="node-icon">✅</span>
        <span className="node-title">Genehmigung</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        <div className="node-info">
          <span className="info-badge">{approverCount} Genehmiger</span>
          {data.config?.requireAllApprovers && (
            <span className="info-badge">Alle erforderlich</span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
    </div>
  );
};

export default memo(ApprovalNode);
