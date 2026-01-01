import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  MiniMap,
  NodeTypes,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './NodeBasedWorkflowEditor.css';

// Custom Node Components
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import ApprovalNode from './nodes/ApprovalNode';
import EmailNode from './nodes/EmailNode';
import ConditionNode from './nodes/ConditionNode';
import DateConditionNode from './nodes/DateConditionNode';
import ValueConditionNode from './nodes/ValueConditionNode';
import DelayNode from './nodes/DelayNode';
import NotificationNode from './nodes/NotificationNode';
import LogicNode from './nodes/LogicNode';
import WorkflowTestDialog from './WorkflowTestDialog';
import { workflowService, Workflow } from '../../services/workflow.service';
import { userService } from '../../services/user.service';

interface NodeBasedWorkflowEditorProps {
  workflow: Workflow | null;
  onSave: () => void;
  onCancel: () => void;
}

// Node Types für React Flow
const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  approval: ApprovalNode,
  email: EmailNode,
  condition: ConditionNode,
  dateCondition: DateConditionNode,
  valueCondition: ValueConditionNode,
  delay: DelayNode,
  notification: NotificationNode,
  logic: LogicNode,
};

// Verfügbare Node-Typen für Drag & Drop
const availableNodes = [
  { type: 'approval', label: '✅ Genehmigung', icon: '✅', description: 'Genehmigung durch Benutzer' },
  { type: 'email', label: '📧 E-Mail', icon: '📧', description: 'E-Mail versenden' },
  { type: 'dateCondition', label: '📅 Datumsbedingung', icon: '📅', description: 'Datumsvergleich' },
  { type: 'valueCondition', label: '💰 Wertbedingung', icon: '💰', description: 'Wert-/Zahlenvergleich' },
  { type: 'condition', label: '❓ Bedingung', icon: '❓', description: 'Allgemeine Bedingung' },
  { type: 'logic', label: '🔀 Logik', icon: '🔀', description: 'UND/ODER-Verknüpfung' },
  { type: 'delay', label: '⏱️ Verzögerung', icon: '⏱️', description: 'Zeitverzögerung' },
  { type: 'notification', label: '🔔 Benachrichtigung', icon: '🔔', description: 'Benachrichtigung senden' },
  { type: 'end', label: '🏁 Ende', icon: '🏁', description: 'Workflow-Ende' },
];

const NodeBasedWorkflowEditor: React.FC<NodeBasedWorkflowEditorProps> = ({
  workflow,
  onSave,
  onCancel,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useEffect(() => {
    loadUsers();
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setIsActive(workflow.isActive);
      
      // Parse workflow definition
      try {
        const definition = JSON.parse(workflow.definition || '{}');
        if (definition.nodes) setNodes(definition.nodes);
        if (definition.edges) setEdges(definition.edges);
      } catch (error) {
        console.error('Fehler beim Parsen der Workflow-Definition:', error);
      }
    } else {
      // Neuer Workflow: Start-Node automatisch hinzufügen
      const startNode: Node = {
        id: 'start_node',
        type: 'start',
        position: { x: 250, y: 50 },
        data: {
          label: '🚀 Start',
        },
        draggable: true,
      };
      setNodes([startNode]);
    }
  }, [workflow]);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeConfig = availableNodes.find(n => n.type === type);
      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
          label: nodeConfig?.label || type,
          config: getDefaultNodeConfig(type),
          users: users,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, users, setNodes]
  );

  const getDefaultNodeConfig = (type: string) => {
    switch (type) {
      case 'start':
        return {};
      case 'end':
        return {};
      case 'approval':
        return {
          name: 'Neue Genehmigung',
          approverUserIds: [],
          requireAllApprovers: false,
        };
      case 'email':
        return {
          name: 'Neue E-Mail',
          recipients: [],
          subject: '',
          body: '',
          template: 'default',
        };
      case 'dateCondition':
        return {
          name: 'Datumsbedingung',
          field: 'invoiceDate',
          operator: 'greater',
          compareType: 'relative',
          relativeDays: 0,
          absoluteDate: null,
        };
      case 'valueCondition':
        return {
          name: 'Wertbedingung',
          field: 'totalAmount',
          operator: 'greater',
          value: 0,
        };
      case 'condition':
        return {
          name: 'Bedingung',
          field: 'status',
          operator: 'equals',
          value: '',
        };
      case 'logic':
        return {
          name: 'Logik-Verknüpfung',
          logicType: 'AND',
        };
      case 'delay':
        return {
          name: 'Verzögerung',
          delayType: 'hours',
          delayValue: 1,
        };
      case 'notification':
        return {
          name: 'Benachrichtigung',
          recipients: [],
          message: '',
        };
      default:
        return {};
    }
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleUpdateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updatedNode = { 
              ...node, 
              data: { 
                ...node.data, 
                config: { ...node.data.config, ...newData } 
              } 
            };
            // Aktualisiere auch den selectedNode wenn es derselbe ist
            if (selectedNode?.id === nodeId) {
              setSelectedNode(updatedNode);
            }
            return updatedNode;
          }
          return node;
        })
      );
    },
    [setNodes, selectedNode]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      // Start-Node kann nicht gelöscht werden
      if (nodeId === 'start_node') {
        alert('Der Start-Node kann nicht gelöscht werden.');
        return;
      }
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }

    if (nodes.length === 0) {
      alert('Bitte fügen Sie mindestens einen Node hinzu');
      return;
    }

    setLoading(true);
    try {
      // Create workflow definition with nodes and edges
      const definition = JSON.stringify({
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      });

      // Convert nodes to workflow steps for backward compatibility
      // Filter out start and end nodes as they are not actual workflow steps
      const steps = nodes
        .filter(node => node.type !== 'start' && node.type !== 'end')
        .map((node, index) => ({
          name: node.data.config?.name || node.data.label,
          type: mapNodeTypeToStepType(node.type || 'approval'),
          order: index + 1,
          approverUserIds: JSON.stringify(node.data.config?.approverUserIds || []),
          approverGroupIds: JSON.stringify([]),
          requireAllApprovers: node.data.config?.requireAllApprovers || false,
          config: JSON.stringify({
            ...node.data.config,
            nodeId: node.id, // Store node ID for reliable mapping
          }),
        }));

      if (workflow) {
        await workflowService.updateWorkflow(workflow.id, {
          name,
          description,
          isActive,
          definition,
          steps: steps as any,
        });
      } else {
        await workflowService.createWorkflow({
          name,
          description,
          isActive,
          definition,
          steps: steps as any,
        });
      }

      onSave();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const mapNodeTypeToStepType = (nodeType: string): string => {
    const mapping: { [key: string]: string } = {
      approval: 'APPROVAL',
      email: 'EMAIL',
      dateCondition: 'DATE_CONDITION',
      valueCondition: 'VALUE_CONDITION',
      condition: 'CONDITION',
      logic: nodeType.includes('AND') ? 'LOGIC_AND' : 'LOGIC_OR',
      delay: 'DELAY',
      notification: 'NOTIFICATION',
    };
    return mapping[nodeType] || 'APPROVAL';
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-workflow-editor">
      <div className="workflow-editor-header">
        <div className="workflow-header-info">
          <h2>{workflow ? 'Workflow bearbeiten' : 'Neuer Workflow'}</h2>
          <div className="workflow-basic-inputs">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow-Name..."
              className="workflow-name-input"
            />
            <label className="workflow-active-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Aktiv</span>
            </label>
          </div>
        </div>
        <div className="workflow-editor-actions">
          {workflow && (
            <button 
              className="btn-info" 
              onClick={() => setShowTestDialog(true)} 
              disabled={loading}
              style={{ marginRight: '10px' }}
            >
              🧪 Workflow testen
            </button>
          )}
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Abbrechen
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>

      <div className="workflow-editor-content">
        <div className="workflow-sidebar">
          <h3>Workflow-Nodes</h3>
          <div className="node-palette">
            {availableNodes.map((node) => (
              <div
                key={node.type}
                className="palette-node"
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
              >
                <span className="node-icon">{node.icon}</span>
                <div className="node-info">
                  <div className="node-label">{node.label}</div>
                  <div className="node-description">{node.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="workflow-description">
            <h3>Beschreibung</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workflow-Beschreibung..."
              rows={5}
            />
          </div>
        </div>

        <div className="workflow-canvas-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div className="node-properties-panel">
            <div className="panel-header">
              <h3>Node-Eigenschaften</h3>
              <button
                className="btn-close"
                onClick={() => setSelectedNode(null)}
              >
                ✕
              </button>
            </div>
            <div className="panel-content">
              <NodePropertiesEditor
                node={selectedNode}
                users={users}
                onUpdate={handleUpdateNodeData}
                onDelete={handleDeleteNode}
              />
            </div>
          </div>
        )}
      </div>

      {showTestDialog && workflow && (
        <WorkflowTestDialog
          workflowId={workflow.id}
          workflowName={workflow.name}
          onClose={() => setShowTestDialog(false)}
        />
      )}
    </div>
  );
};

// Node Properties Editor Component
interface NodePropertiesEditorProps {
  node: Node;
  users: any[];
  onUpdate: (nodeId: string, data: any) => void;
  onDelete: (nodeId: string) => void;
}

const NodePropertiesEditor: React.FC<NodePropertiesEditorProps> = ({
  node,
  users,
  onUpdate,
  onDelete,
}) => {
  const config = node.data.config || {};

  const handleChange = (field: string, value: any) => {
    onUpdate(node.id, { [field]: value });
  };

  const renderPropertiesForType = () => {
    switch (node.type) {
      case 'approval':
        return (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Genehmiger</label>
              <div className="user-selection">
                {users.map((user) => (
                  <label key={user.id} className="user-checkbox">
                    <input
                      type="checkbox"
                      checked={config.approverUserIds?.includes(user.id) || false}
                      onChange={(e) => {
                        const currentIds = config.approverUserIds || [];
                        const newIds = e.target.checked
                          ? [...currentIds, user.id]
                          : currentIds.filter((id: string) => id !== user.id);
                        handleChange('approverUserIds', newIds);
                      }}
                    />
                    {user.firstName} {user.lastName}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.requireAllApprovers || false}
                  onChange={(e) => handleChange('requireAllApprovers', e.target.checked)}
                />
                Alle Genehmiger erforderlich
              </label>
            </div>
          </>
        );

      case 'email':
        return (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Empfänger</label>
              <div className="user-selection">
                {users.map((user) => (
                  <label key={user.id} className="user-checkbox">
                    <input
                      type="checkbox"
                      checked={config.recipients?.includes(user.email) || false}
                      onChange={(e) => {
                        const currentRecipients = config.recipients || [];
                        const newRecipients = e.target.checked
                          ? [...currentRecipients, user.email]
                          : currentRecipients.filter((email: string) => email !== user.email);
                        handleChange('recipients', newRecipients);
                      }}
                    />
                    {user.firstName} {user.lastName} ({user.email})
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Betreff</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => handleChange('subject', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Nachricht</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => handleChange('body', e.target.value)}
                rows={5}
              />
            </div>
          </>
        );

      case 'dateCondition':
        return (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Datumsfeld</label>
              <select
                value={config.field || 'invoiceDate'}
                onChange={(e) => handleChange('field', e.target.value)}
              >
                <option value="invoiceDate">Rechnungsdatum</option>
                <option value="dueDate">Fälligkeitsdatum</option>
                <option value="createdAt">Erstellungsdatum</option>
              </select>
            </div>
            <div className="form-group">
              <label>Operator</label>
              <select
                value={config.operator || 'greater'}
                onChange={(e) => handleChange('operator', e.target.value)}
              >
                <option value="greater">größer als</option>
                <option value="less">kleiner als</option>
                <option value="equals">gleich</option>
                <option value="between">zwischen</option>
              </select>
            </div>
            <div className="form-group">
              <label>Vergleichstyp</label>
              <select
                value={config.compareType || 'relative'}
                onChange={(e) => handleChange('compareType', e.target.value)}
              >
                <option value="relative">Relativ (Tage)</option>
                <option value="absolute">Absolut (Datum)</option>
              </select>
            </div>
            {config.compareType === 'relative' ? (
              <div className="form-group">
                <label>Tage</label>
                <input
                  type="number"
                  value={config.relativeDays || 0}
                  onChange={(e) => handleChange('relativeDays', parseInt(e.target.value))}
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Datum</label>
                <input
                  type="date"
                  value={config.absoluteDate || ''}
                  onChange={(e) => handleChange('absoluteDate', e.target.value)}
                />
              </div>
            )}
          </>
        );

      case 'valueCondition':
        return (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Feld</label>
              <select
                value={config.field || 'totalAmount'}
                onChange={(e) => handleChange('field', e.target.value)}
              >
                <option value="totalAmount">Gesamtbetrag</option>
                <option value="netAmount">Nettobetrag</option>
                <option value="taxAmount">Steuerbetrag</option>
                <option value="discountAmount">Rabattbetrag</option>
              </select>
            </div>
            <div className="form-group">
              <label>Operator</label>
              <select
                value={config.operator || 'greater'}
                onChange={(e) => handleChange('operator', e.target.value)}
              >
                <option value="greater">größer als</option>
                <option value="less">kleiner als</option>
                <option value="equals">gleich</option>
                <option value="greaterOrEqual">größer oder gleich</option>
                <option value="lessOrEqual">kleiner oder gleich</option>
                <option value="between">zwischen</option>
              </select>
            </div>
            <div className="form-group">
              <label>Wert (CHF)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={config.value ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('value', val === '' ? 0 : parseFloat(val));
                }}
              />
            </div>
          </>
        );

      case 'delay':
        return (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Einheit</label>
              <select
                value={config.delayType || 'hours'}
                onChange={(e) => handleChange('delayType', e.target.value)}
              >
                <option value="minutes">Minuten</option>
                <option value="hours">Stunden</option>
                <option value="days">Tage</option>
              </select>
            </div>
            <div className="form-group">
              <label>Dauer</label>
              <input
                type="number"
                value={config.delayValue || 1}
                onChange={(e) => handleChange('delayValue', parseInt(e.target.value))}
              />
            </div>
          </>
        );

      case 'logic':
        return (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Logik-Typ</label>
              <select
                value={config.logicType || 'AND'}
                onChange={(e) => handleChange('logicType', e.target.value)}
              >
                <option value="AND">UND (alle Bedingungen)</option>
                <option value="OR">ODER (eine Bedingung)</option>
              </select>
            </div>
          </>
        );

      case 'notification':
        return (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Empfänger</label>
              <select
                multiple
                value={config.recipients || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  handleChange('recipients', selected);
                }}
                style={{ minHeight: '120px' }}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '4px' }}>
                Halten Sie Strg (Windows) oder Cmd (Mac) gedrückt, um mehrere Empfänger auszuwählen
              </small>
            </div>
            <div className="form-group">
              <label>Nachricht</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Benachrichtigungstext eingeben..."
                rows={4}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Ausdruck (x = Input-Wert)</label>
              <input
                type="text"
                value={config.expression || ''}
                onChange={(e) => handleChange('expression', e.target.value)}
                placeholder="z.B. x > 1000"
                style={{ fontFamily: 'monospace' }}
              />
              <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '4px' }}>
                Beispiele: x {'>'} 1000, x {'<'}= 500, x == 0, x != 100<br/>
                Ausgänge: A (true) wenn Ausdruck wahr, sonst B (false)
              </small>
            </div>
          </>
        );

      default:
        return (
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="node-properties">
      <div className="node-type-badge">{node.data.label}</div>
      {renderPropertiesForType()}
      <div className="node-actions">
        <button
          className="btn-danger btn-block"
          onClick={() => {
            if (window.confirm('Möchten Sie diesen Node wirklich löschen?')) {
              onDelete(node.id);
            }
          }}
        >
          🗑️ Node löschen
        </button>
      </div>
    </div>
  );
};

export default NodeBasedWorkflowEditor;
