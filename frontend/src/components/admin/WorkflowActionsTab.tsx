import React, { useState, useEffect } from 'react';
import { actionService, SystemAction, WorkflowTrigger, ActionCategory, ActionTriggerTiming } from '../../services/action.service';
import { workflowService, Workflow } from '../../services/workflow.service';
import './WorkflowActionsTab.css';

const WorkflowActionsTab: React.FC = () => {
  const [actions, setActions] = useState<SystemAction[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedAction, setSelectedAction] = useState<SystemAction | null>(null);
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTrigger, setShowCreateTrigger] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'ALL'>('ALL');

  // Form state für neuen Trigger
  const [formData, setFormData] = useState({
    workflowId: '',
    timing: 'AFTER' as ActionTriggerTiming,
    priority: 100,
    conditionField: '',
    conditionOperator: 'gt',
    conditionValue: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actionsData, workflowsData] = await Promise.all([
        actionService.getAllSystemActions(
          selectedCategory === 'ALL' ? undefined : selectedCategory,
          true
        ),
        workflowService.getWorkflows(),
      ]);
      setActions(actionsData);
      setWorkflows(workflowsData.filter((w) => w.isActive));
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTriggers = async (actionKey: string) => {
    try {
      const triggersData = await actionService.getActionTriggers(actionKey);
      setTriggers(triggersData);
    } catch (error) {
      console.error('Fehler beim Laden der Triggers:', error);
    }
  };

  const handleSelectAction = async (action: SystemAction) => {
    setSelectedAction(action);
    await loadTriggers(action.actionKey);
  };

  const handleCreateTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    try {
      // Bedingung erstellen wenn Felder ausgefüllt
      let condition = undefined;
      if (formData.conditionField && formData.conditionValue) {
        condition = {
          field: formData.conditionField,
          operator: formData.conditionOperator,
          value: isNaN(Number(formData.conditionValue))
            ? formData.conditionValue
            : Number(formData.conditionValue),
        };
      }

      await actionService.createWorkflowTrigger({
        workflowId: formData.workflowId,
        actionKey: selectedAction.actionKey,
        timing: formData.timing,
        condition: condition ? JSON.stringify(condition) : undefined,
        priority: formData.priority,
      });

      // Reset form
      setFormData({
        workflowId: '',
        timing: 'AFTER',
        priority: 100,
        conditionField: '',
        conditionOperator: 'gt',
        conditionValue: '',
      });
      setShowCreateTrigger(false);

      // Reload triggers
      await loadTriggers(selectedAction.actionKey);
      await loadData(); // Update action counts
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Erstellen des Triggers');
    }
  };

  const handleDeleteTrigger = async (trigger: WorkflowTrigger) => {
    if (!window.confirm('Trigger wirklich löschen?')) return;

    try {
      await actionService.deleteWorkflowTrigger(trigger.id);
      if (selectedAction) {
        await loadTriggers(selectedAction.actionKey);
      }
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Löschen');
    }
  };

  const handleToggleTrigger = async (trigger: WorkflowTrigger) => {
    try {
      await actionService.toggleWorkflowTrigger(trigger.id, !trigger.isActive);
      if (selectedAction) {
        await loadTriggers(selectedAction.actionKey);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  const handleTestTrigger = async (action: SystemAction) => {
    const testContext = {
      entityType: 'INVOICE',
      entityId: 'test-123',
      entityData: {
        totalAmount: 5000,
        status: 'SENT',
      },
    };

    try {
      const result = await actionService.triggerAction(
        action.actionKey,
        testContext
      );

      alert(
        `Test erfolgreich!\n\nGetriggerte Workflows: ${result.workflows?.length || 0}\nAusführungszeit: ${result.executionTime}ms`
      );
    } catch (error: any) {
      alert(`Test fehlgeschlagen:\n${error.response?.data?.error || error.message}`);
    }
  };

  const categories: Array<ActionCategory | 'ALL'> = [
    'ALL',
    'AUTHENTICATION',
    'TIME_TRACKING',
    'ORDERS',
    'INVOICES',
    'USERS',
    'DOCUMENTS',
    'INCIDENTS',
    'COMPLIANCE',
    'CUSTOM',
  ];

  if (loading) {
    return <div className="workflow-actions-loading">Lade Actions...</div>;
  }

  return (
    <div className="workflow-actions-tab">
      <div className="workflow-actions-header">
        <h2>Workflow Actions & Triggers</h2>
        <button
          className="btn-secondary"
          onClick={() => window.location.href = '/admin#workflow-actions-docs'}
          title="Dokumentation öffnen"
        >
          📚 Dokumentation
        </button>
      </div>

      <div className="workflow-actions-content">
        {/* Left sidebar: Actions list */}
        <div className="actions-sidebar">
          <div className="category-filter">
            <label>Kategorie:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL'
                    ? 'Alle'
                    : actionService.getCategoryLabel(cat as ActionCategory)}
                </option>
              ))}
            </select>
          </div>

          <div className="actions-list">
            {actions.map((action) => (
              <div
                key={action.id}
                className={`action-item ${
                  selectedAction?.id === action.id ? 'selected' : ''
                } ${!action.isActive ? 'inactive' : ''}`}
                onClick={() => handleSelectAction(action)}
              >
                <div className="action-icon">
                  {actionService.getCategoryIcon(action.category)}
                </div>
                <div className="action-info">
                  <div className="action-name">{action.displayName}</div>
                  <div className="action-key">{action.actionKey}</div>
                  {action._count && (
                    <div className="action-stats">
                      {action._count.triggers} Trigger
                      {action._count.triggers !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: Trigger details */}
        <div className="triggers-panel">
          {selectedAction ? (
            <>
              <div className="selected-action-header">
                <div>
                  <h3>
                    {actionService.getCategoryIcon(selectedAction.category)}{' '}
                    {selectedAction.displayName}
                  </h3>
                  <p className="action-description">
                    {selectedAction.description}
                  </p>
                  <code className="action-key-display">
                    {selectedAction.actionKey}
                  </code>
                </div>
                <div className="action-controls">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => handleTestTrigger(selectedAction)}
                    title="Action testen"
                  >
                    🧪 Test
                  </button>
                </div>
              </div>

              <div className="triggers-section">
                <div className="triggers-header">
                  <h4>Workflow Triggers ({triggers.length})</h4>
                  <button
                    className="btn-primary"
                    onClick={() => setShowCreateTrigger(!showCreateTrigger)}
                  >
                    {showCreateTrigger ? '✖️ Abbrechen' : '➕ Trigger erstellen'}
                  </button>
                </div>

                {showCreateTrigger && (
                  <form className="trigger-form" onSubmit={handleCreateTrigger}>
                    <div className="form-group">
                      <label>Workflow *</label>
                      <select
                        value={formData.workflowId}
                        onChange={(e) =>
                          setFormData({ ...formData, workflowId: e.target.value })
                        }
                        required
                      >
                        <option value="">-- Workflow wählen --</option>
                        {workflows.map((workflow) => (
                          <option key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Timing</label>
                      <select
                        value={formData.timing}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            timing: e.target.value as ActionTriggerTiming,
                          })
                        }
                      >
                        <option value="BEFORE">BEFORE - Vor der Action</option>
                        <option value="AFTER">AFTER - Nach der Action</option>
                        <option value="INSTEAD">INSTEAD - Statt der Action</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Priorität</label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priority: parseInt(e.target.value),
                          })
                        }
                        min="1"
                        max="999"
                      />
                      <small>Niedrigere Zahl = höhere Priorität</small>
                    </div>

                    <div className="form-section">
                      <h5>Bedingung (optional)</h5>
                      <div className="form-group">
                        <label>Feld</label>
                        <input
                          type="text"
                          placeholder="z.B. entityData.totalAmount"
                          value={formData.conditionField}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              conditionField: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Operator</label>
                          <select
                            value={formData.conditionOperator}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                conditionOperator: e.target.value,
                              })
                            }
                          >
                            <option value="eq">=</option>
                            <option value="ne">≠</option>
                            <option value="gt">&gt;</option>
                            <option value="gte">≥</option>
                            <option value="lt">&lt;</option>
                            <option value="lte">≤</option>
                            <option value="contains">enthält</option>
                            <option value="startsWith">beginnt mit</option>
                            <option value="endsWith">endet mit</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Wert</label>
                          <input
                            type="text"
                            placeholder="z.B. 5000"
                            value={formData.conditionValue}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                conditionValue: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        Trigger erstellen
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowCreateTrigger(false)}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                )}

                <div className="triggers-list">
                  {triggers.length === 0 ? (
                    <div className="triggers-empty">
                      <p>Noch keine Triggers für diese Action.</p>
                    </div>
                  ) : (
                    triggers.map((trigger) => (
                      <div
                        key={trigger.id}
                        className={`trigger-item ${
                          !trigger.isActive ? 'inactive' : ''
                        }`}
                      >
                        <div className="trigger-header">
                          <div className="trigger-workflow">
                            <strong>{trigger.workflow?.name}</strong>
                            <span className="trigger-timing">
                              {actionService.getTimingLabel(trigger.timing)}
                            </span>
                          </div>
                          <div className="trigger-controls">
                            <button
                              className={`btn-toggle ${
                                trigger.isActive ? 'active' : 'inactive'
                              }`}
                              onClick={() => handleToggleTrigger(trigger)}
                              title={
                                trigger.isActive ? 'Deaktivieren' : 'Aktivieren'
                              }
                            >
                              {trigger.isActive ? '✓' : '✗'}
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteTrigger(trigger)}
                              title="Löschen"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="trigger-details">
                          <div className="trigger-detail-item">
                            <span className="label">Priorität:</span>
                            <span className="value">{trigger.priority}</span>
                          </div>
                          {trigger.condition && (
                            <div className="trigger-detail-item">
                              <span className="label">Bedingung:</span>
                              <code className="value">
                                {JSON.stringify(JSON.parse(trigger.condition), null, 2)}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-action-selected">
              <p>← Wähle eine Action aus der Liste</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowActionsTab;
