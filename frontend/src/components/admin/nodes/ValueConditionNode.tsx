import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNodes.css';

const ValueConditionNode = ({ data }: any) => {
  const getOperatorLabel = (operator: string) => {
    const labels: { [key: string]: string } = {
      greater: '>',
      less: '<',
      equals: '=',
      greaterOrEqual: '≥',
      lessOrEqual: '≤',
      between: '↔',
    };
    return labels[operator] || operator;
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      totalAmount: 'Gesamtbetrag',
      netAmount: 'Nettobetrag',
      taxAmount: 'Steuerbetrag',
      discountAmount: 'Rabatt',
    };
    return labels[field] || field;
  };

  return (
    <div className="custom-node condition-node value-condition-node">
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-header">
        <span className="node-icon">💰</span>
        <span className="node-title">Wertbedingung</span>
      </div>
      <div className="node-content">
        <div className="node-name">{data.config?.name || 'Unbenannt'}</div>
        <div className="condition-expression">
          <span className="condition-field">
            {getFieldLabel(data.config?.field || 'totalAmount')}
          </span>
          <span className="condition-operator">
            {getOperatorLabel(data.config?.operator || 'greater')}
          </span>
          <span className="condition-value">
            CHF {data.config?.value?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" className="custom-handle handle-true" />
      <Handle type="source" position={Position.Bottom} id="false" className="custom-handle handle-false" style={{ left: '70%' }} />
    </div>
  );
};

export default memo(ValueConditionNode);
