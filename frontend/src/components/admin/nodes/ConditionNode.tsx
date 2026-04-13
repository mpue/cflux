import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const ConditionNode = ({ data }: any) => {
  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      equals: '==', not_equals: '!=', contains: '∋', not_contains: '∌',
      starts_with: '^=', ends_with: '$=', is_empty: '∅', is_not_empty: '≠∅',
    };
    return labels[op] || op;
  };

  const renderCondition = () => {
    const config = data.config;
    if (!config) return <div className="node-detail" style={{ color: '#999' }}>Nicht konfiguriert</div>;

    if (config.mode === 'expression' && config.expression) {
      return (
        <div className="node-detail" style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
          {config.expression}
        </div>
      );
    }

    if (config.field) {
      const op = getOperatorLabel(config.operator || 'equals');
      const needsValue = config.operator !== 'is_empty' && config.operator !== 'is_not_empty';
      return (
        <div className="node-detail" style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
          {config.field} {op} {needsValue ? (config.value || '?') : ''}
        </div>
      );
    }

    return <div className="node-detail" style={{ color: '#999' }}>Nicht konfiguriert</div>;
  };

  return (
    <div className="custom-node condition-node general-condition-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header">
        <span className="node-icon">❓</span>
        <span className="node-title">Bedingung</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        {renderCondition()}
      </div>
      <Handle type="source" position={Position.Bottom} id="true" className="custom-handle handle-true" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" className="custom-handle handle-false" style={{ left: '70%' }} />
    </div>
  );
};

export default memo(ConditionNode);
