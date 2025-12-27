import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const EmailNode = ({ data }: any) => {
  const recipientCount = data.config?.recipients?.length || 0;
  
  return (
    <div className="custom-node email-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header">
        <span className="node-icon">📧</span>
        <span className="node-title">E-Mail</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        <div className="node-info">
          <span className="info-badge">{recipientCount} Empfänger</span>
        </div>
        {data.config?.subject && (
          <div className="node-detail">{data.config.subject}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
    </div>
  );
};

export default memo(EmailNode);
