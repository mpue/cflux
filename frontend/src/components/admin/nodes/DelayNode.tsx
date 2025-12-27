import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const DelayNode = ({ data }: any) => {
  const getDelayLabel = () => {
    const type = data.config?.delayType || 'hours';
    const value = data.config?.delayValue || 1;
    const labels: { [key: string]: string } = {
      minutes: 'Minute(n)',
      hours: 'Stunde(n)',
      days: 'Tag(e)',
    };
    return `${value} ${labels[type] || type}`;
  };

  return (
    <div className="custom-node delay-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header">
        <span className="node-icon">⏱️</span>
        <span className="node-title">Verzögerung</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        <div className="node-info">
          <span className="info-badge">{getDelayLabel()}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
    </div>
  );
};

export default memo(DelayNode);
