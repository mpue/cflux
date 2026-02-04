import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const MessageDialogNode = ({ data }: any) => {
  const hasMessage = data.config?.message && data.config.message.length > 0;

  return (
    <div className="custom-node message-dialog-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header">
        <span className="node-icon">💬</span>
        <span className="node-title">Nachricht</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        <div className="node-info">
          <span className="info-badge">{hasMessage ? 'Konfiguriert' : 'Nicht konfiguriert'}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
    </div>
  );
};

export default memo(MessageDialogNode);
