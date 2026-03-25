import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const NotificationNode = ({ data }: any) => {
  const recipientCount = data.config?.recipients?.length || 0;
  const sendToTriggerUser = data.config?.sendToTriggerUser || false;

  return (
    <div className="custom-node notification-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header">
        <span className="node-icon">🔔</span>
        <span className="node-title">Benachrichtigung</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        <div className="node-info">
          <span className="info-badge">{recipientCount} Empfänger</span>
          {sendToTriggerUser && <span className="info-badge">+ Auslöser</span>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
    </div>
  );
};

export default memo(NotificationNode);
