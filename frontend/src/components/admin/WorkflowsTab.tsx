import React, { useState, useEffect } from 'react';
import { workflowService, Workflow } from '../../services/workflow.service';
import WorkflowEditor from './WorkflowEditor';
import './WorkflowsTab.css';

const WorkflowsTab: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Fehler beim Laden der Workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedWorkflow(null);
    setIsEditing(true);
  };

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsEditing(true);
  };

  const handleDelete = async (workflow: Workflow) => {
    if (!window.confirm(`Workflow "${workflow.name}" wirklich löschen?`)) {
      return;
    }

    try {
      await workflowService.deleteWorkflow(workflow.id);
      await loadWorkflows();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Löschen');
    }
  };

  const handleToggleActive = async (workflow: Workflow) => {
    try {
      await workflowService.updateWorkflow(workflow.id, {
        isActive: !workflow.isActive,
      });
      await loadWorkflows();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    await loadWorkflows();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedWorkflow(null);
  };

  if (loading) {
    return <div className="workflows-loading">Lade Workflows...</div>;
  }

  if (isEditing) {
    return (
      <WorkflowEditor
        workflow={selectedWorkflow}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="workflows-tab">
      <div className="workflows-header">
        <h2>Workflows</h2>
        <button className="btn-primary" onClick={handleCreateNew}>
          ➕ Neuer Workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="workflows-empty">
          <p>Noch keine Workflows erstellt.</p>
          <button className="btn-primary" onClick={handleCreateNew}>
            Ersten Workflow erstellen
          </button>
        </div>
      ) : (
        <div className="workflows-list">
          {workflows.map((workflow) => (
            <div key={workflow.id} className={`workflow-card ${workflow.isActive ? 'active' : 'inactive'}`}>
              <div className="workflow-header">
                <h3>{workflow.name}</h3>
                <div className="workflow-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={workflow.isActive}
                      onChange={() => handleToggleActive(workflow)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(workflow)}
                    title="Bearbeiten"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(workflow)}
                    title="Löschen"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {workflow.description && (
                <p className="workflow-description">{workflow.description}</p>
              )}

              <div className="workflow-info">
                <span className="workflow-steps">
                  {workflow.steps?.length || 0} Schritte
                </span>
                <span className="workflow-templates">
                  {workflow.templateLinks?.length || 0} Vorlagen
                </span>
                <span className={`workflow-status ${workflow.isActive ? 'active' : 'inactive'}`}>
                  {workflow.isActive ? '✓ Aktiv' : '⏸ Inaktiv'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowsTab;
