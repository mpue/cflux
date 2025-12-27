import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const EndNode = ({ data }: any) => {
  return (
    <div className="custom-node end-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header end-header">
        <span className="node-icon">🏁</span>
        <span className="node-title">Ende</span>
      </div>
      <div className="node-content">
        <div className="node-name">Workflow-Ende</div>
        <div className="node-detail">
          Workflow abgeschlossen
        </div>
      </div>
    </div>
  );
};

export default memo(EndNode);
