import React from 'react';
import './DashboardWidgets.css';

interface WidgetHeaderProps {
  title: string;
  icon?: string;
  actions?: React.ReactNode;
  onSettings?: () => void;
}

const WidgetHeader: React.FC<WidgetHeaderProps> = ({ title, icon, actions, onSettings }) => {
  return (
    <div className="widget-header">
      <h3 className="widget-title">
        {icon && <span className="widget-icon">{icon}</span>}
        {title}
      </h3>
      <div className="widget-actions">
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
      </div>
    </div>
  );
};

export default WidgetHeader;
