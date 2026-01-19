import React from 'react';
import './DashboardWidgets.css';

interface WidgetHeaderProps {
  title: string;
  icon?: string;
  actions?: React.ReactNode;
  onSettings?: () => void;
  onRemove?: () => void;
}

const WidgetHeader: React.FC<WidgetHeaderProps> = ({ title, icon, actions, onSettings, onRemove }) => {
  return (
    <div className="widget-header">
      <h3 className="widget-title">
        {icon && <span className="widget-icon">{icon}</span>}
        {title}
      </h3>
      <div className="widget-header-actions">
        {actions}
        {onSettings && (
          <button 
            className="widget-settings-btn" 
            onClick={onSettings}
            title="Einstellungen"
          >
            ⚙️
          </button>
        )}
        {onRemove && (
          <button 
            className="widget-remove-btn" 
            onClick={onRemove}
            title="Widget entfernen"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default WidgetHeader;
