import React from 'react';
import { DashboardWidget, DEFAULT_WIDGETS } from './types';
import './DashboardWidgets.css';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widgetId: string) => void;
  currentWidgets: DashboardWidget[];
}

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddWidget, 
  currentWidgets 
}) => {
  if (!isOpen) return null;

  // Filter out already visible widgets
  const availableWidgets = DEFAULT_WIDGETS.filter(widget => {
    const currentWidget = currentWidgets.find(w => w.id === widget.id);
    return !currentWidget?.isVisible;
  });

  const handleAddWidget = (widgetId: string) => {
    onAddWidget(widgetId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Widget hinzufügen</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {availableWidgets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>Alle verfügbaren Widgets wurden bereits hinzugefügt.</p>
            </div>
          ) : (
            <div className="widget-selection-grid">
              {availableWidgets.map((widget) => (
                <div 
                  key={widget.id}
                  className="widget-selection-card"
                  onClick={() => handleAddWidget(widget.id)}
                >
                  <div className="widget-selection-icon">
                    {widget.title.split(' ')[0]}
                  </div>
                  <div className="widget-selection-title">
                    {widget.title.split(' ').slice(1).join(' ')}
                  </div>
                  <div className="widget-selection-action">
                    <button className="btn btn-primary btn-small">
                      Hinzufügen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;
