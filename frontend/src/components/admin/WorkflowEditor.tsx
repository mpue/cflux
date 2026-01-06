import React, { useState, useEffect } from 'react';
import { workflowService, Workflow, WorkflowStep } from '../../services/workflow.service';
import { userService } from '../../services/user.service';
import './WorkflowEditor.css';

interface WorkflowEditorProps {
  workflow: Workflow | null;
  onSave: () => void;
  onCancel: () => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflow, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<Partial<WorkflowStep>[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setIsActive(workflow.isActive);
      setSteps(workflow.steps || []);
    }
  }, [workflow]);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsersAdmin();
      setUsers(data);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    }
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        name: '',
        type: 'APPROVAL',
        order: steps.length + 1,
        approverUserIds: '[]',
        requireAllApprovers: false,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder
    const reordered = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
    setSteps(reordered);
  };

  const handleUpdateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];

    // Reorder
    const reordered = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
    setSteps(reordered);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }

    if (steps.length === 0) {
      alert('Bitte fügen Sie mindestens einen Schritt hinzu');
      return;
    }

    setLoading(true);
    try {
      const definition = JSON.stringify({ steps });

      // Prepare steps data for backend
      const stepsForBackend = steps.map(step => ({
        name: step.name!,
        type: step.type!,
        order: step.order!,
        approverUserIds: step.approverUserIds || '[]',
        approverGroupIds: step.approverGroupIds || '[]',
        requireAllApprovers: step.requireAllApprovers || false,
        config: step.config,
      }));

      if (workflow) {
        await workflowService.updateWorkflow(workflow.id, {
          name,
          description,
          isActive,
          definition,
          steps: stepsForBackend as any,
        });
      } else {
        await workflowService.createWorkflow({
          name,
          description,
          isActive,
          definition,
          steps: stepsForBackend as any,
        });
      }

      onSave();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApprover = (stepIndex: number, userId: string) => {
    const step = steps[stepIndex];
    const approverIds = JSON.parse(step.approverUserIds || '[]');
    const index = approverIds.indexOf(userId);

    if (index >= 0) {
      approverIds.splice(index, 1);
    } else {
      approverIds.push(userId);
    }

    handleUpdateStep(stepIndex, 'approverUserIds', JSON.stringify(approverIds));
  };

  const isApproverSelected = (stepIndex: number, userId: string): boolean => {
    const step = steps[stepIndex];
    const approverIds = JSON.parse(step.approverUserIds || '[]');
    return approverIds.includes(userId);
  };

  return (
    <div className="workflow-editor">
      <div className="workflow-editor-header">
        <h2>{workflow ? 'Workflow bearbeiten' : 'Neuer Workflow'}</h2>
        <div className="workflow-editor-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Abbrechen
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>

      <div className="workflow-editor-content">
        <div className="workflow-basic-info">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Standard Genehmigung"
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung des Workflows..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Workflow aktiv
            </label>
          </div>
        </div>

        <div className="workflow-steps-section">
          <div className="workflow-steps-header">
            <h3>Workflow-Schritte</h3>
            <button className="btn-sm btn-primary" onClick={handleAddStep}>
              ➕ Schritt hinzufügen
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="workflow-steps-empty">
              <p>Noch keine Schritte definiert</p>
              <button className="btn-primary" onClick={handleAddStep}>
                Ersten Schritt hinzufügen
              </button>
            </div>
          ) : (
            <div className="workflow-steps-list">
              {steps.map((step, index) => (
                <div key={index} className="workflow-step-card">
                  <div className="workflow-step-header">
                    <span className="workflow-step-number">{index + 1}</span>
                    <div className="workflow-step-controls">
                      <button
                        className="btn-icon"
                        onClick={() => handleMoveStep(index, 'up')}
                        disabled={index === 0}
                        title="Nach oben"
                      >
                        ⬆️
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleMoveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                        title="Nach unten"
                      >
                        ⬇️
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleRemoveStep(index)}
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Schritt-Name *</label>
                    <input
                      type="text"
                      value={step.name || ''}
                      onChange={(e) => handleUpdateStep(index, 'name', e.target.value)}
                      placeholder="z.B. Manager Genehmigung"
                    />
                  </div>

                  <div className="form-group">
                    <label>Typ *</label>
                    <select
                      value={step.type || 'APPROVAL'}
                      onChange={(e) => handleUpdateStep(index, 'type', e.target.value)}
                    >
                      <option value="APPROVAL">Genehmigung</option>
                      <option value="NOTIFICATION">Benachrichtigung</option>
                      <option value="CONDITION">Bedingung</option>
                      <option value="DELAY">Verzögerung</option>
                    </select>
                  </div>

                  {step.type === 'APPROVAL' && (
                    <>
                      <div className="form-group">
                        <label>Genehmiger auswählen</label>
                        <div className="approvers-list">
                          {users.map((user) => (
                            <label key={user.id} className="approver-checkbox">
                              <input
                                type="checkbox"
                                checked={isApproverSelected(index, user.id)}
                                onChange={() => handleToggleApprover(index, user.id)}
                              />
                              <span>
                                {user.firstName} {user.lastName} ({user.email})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={step.requireAllApprovers || false}
                            onChange={(e) =>
                              handleUpdateStep(index, 'requireAllApprovers', e.target.checked)
                            }
                          />
                          Alle Genehmiger erforderlich
                        </label>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
