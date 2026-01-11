import api from './api';

// ========== TYPES ==========

export type ActionCategory =
  | 'AUTHENTICATION'
  | 'TIME_TRACKING'
  | 'ORDERS'
  | 'INVOICES'
  | 'USERS'
  | 'DOCUMENTS'
  | 'INCIDENTS'
  | 'COMPLIANCE'
  | 'CUSTOM';

export type ActionTriggerTiming = 'BEFORE' | 'AFTER' | 'INSTEAD';

export interface SystemAction {
  id: string;
  actionKey: string;
  displayName: string;
  description?: string;
  category: ActionCategory;
  contextSchema?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  triggers?: WorkflowTrigger[];
  _count?: {
    triggers: number;
    logs: number;
  };
}

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  actionKey: string;
  timing: ActionTriggerTiming;
  condition?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  workflow?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  action?: SystemAction;
}

export interface ActionLog {
  id: string;
  actionKey: string;
  userId?: string;
  contextData?: string;
  success: boolean;
  errorMessage?: string;
  triggeredWorkflows?: string;
  executionTime?: number;
  createdAt: string;
  action?: SystemAction;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ActionLogResponse {
  logs: ActionLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActionStatistics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  avgExecutionTime: number;
}

export interface ActionContext {
  entityType?: string;
  entityId?: string;
  entityData?: any;
  userId?: string;
  metadata?: any;
}

export interface TriggerActionResponse {
  success: boolean;
  workflows?: any[];
  executionTime?: number;
  error?: string;
  message?: string;
}

// ========== SERVICE ==========

export const actionService = {
  // ========== SYSTEM ACTIONS ==========

  /**
   * Alle System Actions abrufen
   */
  async getAllSystemActions(category?: ActionCategory, isActive?: boolean): Promise<SystemAction[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (isActive !== undefined) params.append('isActive', String(isActive));

    const response = await api.get(`/actions?${params.toString()}`);
    return response.data;
  },

  /**
   * System Action nach Key abrufen
   */
  async getSystemActionByKey(actionKey: string): Promise<SystemAction> {
    const response = await api.get(`/actions/${actionKey}`);
    return response.data;
  },

  /**
   * Neue System Action erstellen
   */
  async createSystemAction(data: Partial<SystemAction>): Promise<SystemAction> {
    const response = await api.post('/actions', data);
    return response.data;
  },

  /**
   * System Action aktualisieren
   */
  async updateSystemAction(actionKey: string, data: Partial<SystemAction>): Promise<SystemAction> {
    const response = await api.put(`/actions/${actionKey}`, data);
    return response.data;
  },

  /**
   * System Action löschen
   */
  async deleteSystemAction(actionKey: string): Promise<void> {
    await api.delete(`/actions/${actionKey}`);
  },

  // ========== WORKFLOW TRIGGERS ==========

  /**
   * Workflow Trigger erstellen
   */
  async createWorkflowTrigger(data: Partial<WorkflowTrigger>): Promise<WorkflowTrigger> {
    const response = await api.post('/actions/triggers', data);
    return response.data;
  },

  /**
   * Alle Trigger für einen Workflow
   */
  async getWorkflowTriggers(workflowId: string): Promise<WorkflowTrigger[]> {
    const response = await api.get(`/actions/workflows/${workflowId}/triggers`);
    return response.data;
  },

  /**
   * Alle Triggers für eine Action
   */
  async getActionTriggers(actionKey: string): Promise<WorkflowTrigger[]> {
    const response = await api.get(`/actions/${actionKey}/triggers`);
    return response.data;
  },

  /**
   * Workflow Trigger aktualisieren
   */
  async updateWorkflowTrigger(id: string, data: Partial<WorkflowTrigger>): Promise<WorkflowTrigger> {
    const response = await api.put(`/actions/triggers/${id}`, data);
    return response.data;
  },

  /**
   * Workflow Trigger löschen
   */
  async deleteWorkflowTrigger(id: string): Promise<void> {
    await api.delete(`/actions/triggers/${id}`);
  },

  /**
   * Workflow Trigger aktivieren/deaktivieren
   */
  async toggleWorkflowTrigger(id: string, isActive: boolean): Promise<WorkflowTrigger> {
    const response = await api.patch(`/actions/triggers/${id}/toggle`, { isActive });
    return response.data;
  },

  // ========== ACTION EXECUTION ==========

  /**
   * Action manuell triggern (für Tests)
   */
  async triggerAction(
    actionKey: string,
    context: ActionContext,
    timing: ActionTriggerTiming = 'AFTER'
  ): Promise<TriggerActionResponse> {
    const response = await api.post(`/actions/${actionKey}/trigger`, { context, timing });
    return response.data;
  },

  // ========== ACTION LOGS ==========

  /**
   * Action Logs abrufen
   */
  async getActionLogs(options: {
    actionKey?: string;
    userId?: string;
    success?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<ActionLogResponse> {
    const params = new URLSearchParams();
    if (options.actionKey) params.append('actionKey', options.actionKey);
    if (options.userId) params.append('userId', options.userId);
    if (options.success !== undefined) params.append('success', String(options.success));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));

    const response = await api.get(`/actions/logs?${params.toString()}`);
    return response.data;
  },

  /**
   * Action Statistics abrufen
   */
  async getActionStatistics(actionKey?: string): Promise<ActionStatistics> {
    const params = new URLSearchParams();
    if (actionKey) params.append('actionKey', actionKey);

    const response = await api.get(`/actions/statistics?${params.toString()}`);
    return response.data;
  },

  /**
   * Standard System Actions initialisieren
   */
  async seedSystemActions(): Promise<{ message: string; actions: SystemAction[] }> {
    const response = await api.post('/actions/seed');
    return response.data;
  },

  // ========== HELPER FUNCTIONS ==========

  /**
   * Action Category Label
   */
  getCategoryLabel(category: ActionCategory): string {
    const labels: Record<ActionCategory, string> = {
      AUTHENTICATION: 'Authentifizierung',
      TIME_TRACKING: 'Zeiterfassung',
      ORDERS: 'Bestellungen',
      INVOICES: 'Rechnungen',
      USERS: 'Benutzer',
      DOCUMENTS: 'Dokumente',
      INCIDENTS: 'Vorfälle',
      COMPLIANCE: 'Compliance',
      CUSTOM: 'Benutzerdefiniert',
    };
    return labels[category] || category;
  },

  /**
   * Timing Label
   */
  getTimingLabel(timing: ActionTriggerTiming): string {
    const labels: Record<ActionTriggerTiming, string> = {
      BEFORE: 'Vor der Aktion',
      AFTER: 'Nach der Aktion',
      INSTEAD: 'Statt der Aktion',
    };
    return labels[timing] || timing;
  },

  /**
   * Get icon for category
   */
  getCategoryIcon(category: ActionCategory): string {
    const icons: Record<ActionCategory, string> = {
      AUTHENTICATION: '🔐',
      TIME_TRACKING: '⏱️',
      ORDERS: '📦',
      INVOICES: '💰',
      USERS: '👥',
      DOCUMENTS: '📄',
      INCIDENTS: '⚠️',
      COMPLIANCE: '✅',
      CUSTOM: '⚙️',
    };
    return icons[category] || '📋';
  },
};

export default actionService;
