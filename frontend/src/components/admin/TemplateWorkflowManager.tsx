import React, { useState, useEffect } from 'react';
import { workflowService, Workflow } from '../../services/workflow.service';
import './TemplateWorkflowManager.css';

interface TemplateWorkflowManagerProps {
  templateId: string;
  onClose: () => void;
}

interface TemplateWorkflowLink {
  id: string;
  order: number;
  isActive: boolean;
  workflow: Workflow;
}

const TemplateWorkflowManager: React.FC<TemplateWorkflowManagerProps> = ({ templateId, onClose }) => {
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [assignedWorkflows, setAssignedWorkflows] = useState<TemplateWorkflowLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [templateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workflows, assigned] = await Promise.all([
        workflowService.getWorkflows(),
        workflowService.getTemplateWorkflows(templateId),
      ]);
      
      setAvailableWorkflows(workflows.filter(w => w.isActive));
      setAssignedWorkflows(assigned);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorkflow = async (workflowId: string) => {
    try {
      const maxOrder = assignedWorkflows.length > 0
        ? Math.max(...assignedWorkflows.map(w => w.order))
        : 0;
      
      await workflowService.linkWorkflowToTemplate(templateId, workflowId, maxOrder + 1);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Zuordnen');
    }
  };

  const handleUnassignWorkflow = async (workflowId: string) => {
    if (!window.confirm('Workflow wirklich entfernen?')) {
      return;
    }

    try {
      await workflowService.unlinkWorkflowFromTemplate(templateId, workflowId);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Entfernen');
    }
  };

  const handleMoveWorkflow = async (workflowId: string, direction: 'up' | 'down') => {
    const sorted = [...assignedWorkflows].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(w => w.workflow.id === workflowId);
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sorted.length - 1) return;

    // Swap orders
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    try {
      // Remove both
      await workflowService.unlinkWorkflowFromTemplate(templateId, sorted[index].workflow.id);
      await workflowService.unlinkWorkflowFromTemplate(templateId, sorted[targetIndex].workflow.id);
      
      // Re-add with swapped orders
      await workflowService.linkWorkflowToTemplate(
        templateId,
        sorted[index].workflow.id,
        sorted[targetIndex].order
      );
      await workflowService.linkWorkflowToTemplate(
        templateId,
        sorted[targetIndex].workflow.id,
        sorted[index].order
      );
      
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Verschieben');
    }
  };

  const isAssigned = (workflowId: string) => {
    return assignedWorkflows.some(w => w.workflow.id === workflowId);
  };

  if (loading) {
    return (
      <div className="template-workflow-modal-overlay">
        <div className="template-workflow-modal">
          <div>Lade Workflows...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="template-workflow-modal-overlay" onClick={onClose}>
      <div className="template-workflow-modal" onClick={e => e.stopPropagation()}>
        <div className="template-workflow-header">
          <h2>Workflows zuordnen</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="template-workflow-content">
          <div className="template-workflow-section">
            <h3>Zugeordnete Workflows ({assignedWorkflows.length})</h3>
            {assignedWorkflows.length === 0 ? (
              <p className="empty-message">Noch keine Workflows zugeordnet.</p>
            ) : (
              <div className="workflow-list">
                {[...assignedWorkflows]
                  .sort((a, b) => a.order - b.order)
                  .map((link, index) => (
                    <div key={link.id} className="workflow-item assigned">
                      <div className="workflow-order">{index + 1}</div>
                      <div className="workflow-info">
                        <div className="workflow-name">{link.workflow.name}</div>
                        <div className="workflow-meta">
                          {link.workflow.steps?.length || 0} Schritte
                        </div>
                      </div>
                      <div className="workflow-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleMoveWorkflow(link.workflow.id, 'up')}
                          disabled={index === 0}
                          title="Nach oben"
                        >
                          ⬆️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleMoveWorkflow(link.workflow.id, 'down')}
                          disabled={index === assignedWorkflows.length - 1}
                          title="Nach unten"
                        >
                          ⬇️
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleUnassignWorkflow(link.workflow.id)}
                          title="Entfernen"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="template-workflow-section">
            <h3>Verfügbare Workflows</h3>
            {availableWorkflows.length === 0 ? (
              <p className="empty-message">Keine aktiven Workflows vorhanden.</p>
            ) : (
              <div className="workflow-list">
                {availableWorkflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className={`workflow-item ${isAssigned(workflow.id) ? 'disabled' : ''}`}
                  >
                    <div className="workflow-info">
                      <div className="workflow-name">{workflow.name}</div>
                      <div className="workflow-meta">
                        {workflow.steps?.length || 0} Schritte
                      </div>
                    </div>
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => handleAssignWorkflow(workflow.id)}
                      disabled={isAssigned(workflow.id)}
                    >
                      {isAssigned(workflow.id) ? '✓ Zugeordnet' : '+ Zuordnen'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="template-workflow-footer">
          <button className="btn-secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateWorkflowManager;
