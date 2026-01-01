import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const ConditionNode = ({ data }: any) => {
  return (
    <div className="custom-node condition-node general-condition-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header">
        <span className="node-icon">❓</span>
        <span className="node-title">Bedingung</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        {data.config?.expression ? (
          <div className="node-detail" style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
            {data.config.expression}
          </div>
        ) : data.config?.field ? (
          <div className="node-detail">
            {data.config.field} {data.config.operator} {data.config.value}
          </div>
        ) : (
          <div className="node-detail" style={{ color: '#999' }}>
            Keine Bedingung konfiguriert
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="true" className="custom-handle handle-true" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" className="custom-handle handle-false" style={{ left: '70%' }} />
    </div>
  );
};

export default memo(ConditionNode);
