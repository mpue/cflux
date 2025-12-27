import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const LogicNode = ({ data }: any) => {
  const logicType = data.config?.logicType || 'AND';

  return (
    <div className="custom-node logic-node">
      <Handle type="target" position={Position.Top} id="input1" className="custom-handle" style={{ left: '30%' }} />
      <Handle type="target" position={Position.Top} id="input2" className="custom-handle" style={{ left: '70%' }} />
      <div className="node-header">
        <span className="node-icon">🔀</span>
        <span className="node-title">Logik</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        <div className="logic-type">
          <span className={`logic-badge logic-${logicType.toLowerCase()}`}>
            {logicType}
          </span>
        </div>
        <div className="node-detail">
          {logicType === 'AND' ? 'Alle Bedingungen müssen erfüllt sein' : 'Eine Bedingung muss erfüllt sein'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
    </div>
  );
};

export default memo(LogicNode);
