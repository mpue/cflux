import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const StartNode = ({ data }: any) => {
  return (
    <div className="custom-node start-node">
      <div className="node-header start-header">
        <span className="node-icon">🚀</span>
        <span className="node-title">Start</span>
      </div>
      <div className="node-content">
        <div className="node-name">Workflow-Beginn</div>
        <div className="node-detail">
          Alle Workflows starten hier
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
    </div>
  );
};

export default memo(StartNode);
