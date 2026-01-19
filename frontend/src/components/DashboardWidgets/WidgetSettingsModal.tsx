import React from 'react';
import { DashboardWidget } from './types';
import './DashboardWidgets.css';

interface WidgetSettingsModalProps {
  show: boolean;
  widgets: DashboardWidget[];
  onClose: () => void;
  onToggleWidget: (widgetId: string) => void;
  onResetLayout: () => void;
}

const WidgetSettingsModal: React.FC<WidgetSettingsModalProps> = ({
  show,
  widgets,
  onClose,
  onToggleWidget,
  onResetLayout,
}) => {
  if (!show) return null;

  return (
    <div className="widget-settings-modal" onClick={onClose}>
      <div className="widget-settings-content" onClick={(e) => e.stopPropagation()}>
        <h2>⚙️ Dashboard Einstellungen</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Widgets anzeigen</h3>
          <p className="hint-text">Wählen Sie aus, welche Widgets auf Ihrem Dashboard angezeigt werden sollen.</p>
        </div>

        <ul className="widget-settings-list">
          {widgets.map((widget) => (
            <li key={widget.id} className="widget-settings-item">
              <div>
                <strong>{widget.title}</strong>
              </div>
              <label className="widget-toggle">
                <input
                  type="checkbox"
                  checked={widget.isVisible}
                  onChange={() => onToggleWidget(widget.id)}
                />
                <span className="widget-toggle-slider"></span>
              </label>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onResetLayout}
            style={{ marginRight: '10px' }}
          >
            🔄 Layout zurücksetzen
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettingsModal;
