import { PrismaClient, ActionCategory, ActionTriggerTiming } from '@prisma/client';
import { workflowService } from './workflow.service';

const prisma = new PrismaClient();

interface SystemActionData {
  actionKey: string;
  displayName: string;
  description?: string;
  category?: ActionCategory;
  contextSchema?: any;
  isSystem?: boolean;
}

interface WorkflowTriggerData {
  workflowId: string;
  actionKey: string;
  timing?: ActionTriggerTiming;
  condition?: any;
  priority?: number;
}

interface ActionContext {
  entityType?: string;
  entityId?: string;
  entityData?: any;
  userId?: string;
  metadata?: any;
  [key: string]: any; // Allow any additional fields for action-specific context
}

export const actionService = {
  // ========== SYSTEM ACTIONS ==========
  
  /**
   * System Actions erstellen
   */
  async createSystemAction(data: SystemActionData) {
    return await prisma.systemAction.create({
      data: {
        actionKey: data.actionKey,
        displayName: data.displayName,
        description: data.description,
        category: data.category || 'CUSTOM',
        contextSchema: data.contextSchema ? JSON.stringify(data.contextSchema) : null,
        isSystem: data.isSystem || false,
      },
    });
  },

  /**
   * Alle System Actions abrufen
   */
  async getAllSystemActions(category?: ActionCategory, isActive?: boolean) {
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await prisma.systemAction.findMany({
      where,
      include: {
        triggers: {
          where: { isActive: true },
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            triggers: true,
            logs: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { displayName: 'asc' },
      ],
    });
  },

  /**
   * System Action nach Key abrufen
   */
  async getSystemActionByKey(actionKey: string) {
    return await prisma.systemAction.findUnique({
      where: { actionKey },
      include: {
        triggers: {
          include: {
            workflow: true,
          },
          orderBy: {
            priority: 'asc',
          },
        },
      },
    });
  },

  /**
   * System Action aktualisieren
   */
  async updateSystemAction(actionKey: string, data: Partial<SystemActionData>) {
    const updateData: any = { ...data };
    
    if (data.contextSchema) {
      updateData.contextSchema = JSON.stringify(data.contextSchema);
    }

    return await prisma.systemAction.update({
      where: { actionKey },
      data: updateData,
    });
  },

  /**
   * System Action löschen (nur wenn nicht isSystem)
   */
  async deleteSystemAction(actionKey: string) {
    const action = await prisma.systemAction.findUnique({
      where: { actionKey },
    });

    if (action?.isSystem) {
      throw new Error('System Actions können nicht gelöscht werden');
    }

    return await prisma.systemAction.delete({
      where: { actionKey },
    });
  },

  // ========== WORKFLOW TRIGGERS ==========

  /**
   * Workflow Trigger erstellen
   */
  async createWorkflowTrigger(data: WorkflowTriggerData) {
    // Prüfen ob Workflow existiert
    const workflow = await prisma.workflow.findUnique({
      where: { id: data.workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow nicht gefunden');
    }

    // Prüfen ob Action existiert
    const action = await prisma.systemAction.findUnique({
      where: { actionKey: data.actionKey },
    });

    if (!action) {
      throw new Error('System Action nicht gefunden');
    }

    return await prisma.workflowTrigger.create({
      data: {
        workflowId: data.workflowId,
        actionKey: data.actionKey,
        timing: data.timing || 'AFTER',
        condition: data.condition ? JSON.stringify(data.condition) : null,
        priority: data.priority || 100,
      },
      include: {
        workflow: true,
        action: true,
      },
    });
  },

  /**
   * Alle Trigger für einen Workflow
   */
  async getWorkflowTriggers(workflowId: string) {
    return await prisma.workflowTrigger.findMany({
      where: { workflowId },
      include: {
        action: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });
  },

  /**
   * Alle Triggers für eine Action
   */
  async getActionTriggers(actionKey: string) {
    return await prisma.workflowTrigger.findMany({
      where: { 
        actionKey,
        isActive: true,
      },
      include: {
        workflow: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });
  },

  /**
   * Workflow Trigger aktualisieren
   */
  async updateWorkflowTrigger(id: string, data: Partial<WorkflowTriggerData>) {
    const updateData: any = {};
    
    if (data.timing) updateData.timing = data.timing;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.condition !== undefined) {
      updateData.condition = data.condition ? JSON.stringify(data.condition) : null;
    }

    return await prisma.workflowTrigger.update({
      where: { id },
      data: updateData,
      include: {
        workflow: true,
        action: true,
      },
    });
  },

  /**
   * Workflow Trigger löschen
   */
  async deleteWorkflowTrigger(id: string) {
    return await prisma.workflowTrigger.delete({
      where: { id },
    });
  },

  /**
   * Trigger aktivieren/deaktivieren
   */
  async toggleWorkflowTrigger(id: string, isActive: boolean) {
    return await prisma.workflowTrigger.update({
      where: { id },
      data: { isActive },
    });
  },

  // ========== ACTION EXECUTION ==========

  /**
   * Action ausführen und Workflows triggern
   * 
   * @param actionKey - Key der System Action (z.B. "invoice.sent")
   * @param context - Context-Daten für Workflows
   * @param timing - Wann wird getriggert (BEFORE, AFTER, INSTEAD)
   * @returns Array von gestarteten Workflow-Instanzen
   */
  async triggerAction(
    actionKey: string,
    context: ActionContext,
    timing: ActionTriggerTiming = 'AFTER'
  ) {
    const startTime = Date.now();
    const triggeredWorkflows: string[] = [];

    try {
      console.log(`[ActionService] Triggering action: ${actionKey} (timing: ${timing})`);

      // Prüfen ob Action existiert
      const action = await prisma.systemAction.findUnique({
        where: { actionKey },
      });

      if (!action) {
        console.warn(`[ActionService] Action not found: ${actionKey}`);
        return { success: false, error: 'Action nicht gefunden', workflows: [] };
      }

      if (!action.isActive) {
        console.log(`[ActionService] Action is inactive: ${actionKey}`);
        return { success: true, message: 'Action ist deaktiviert', workflows: [] };
      }

      // Alle aktiven Trigger für diese Action laden
      const triggers = await prisma.workflowTrigger.findMany({
        where: {
          actionKey,
          timing,
          isActive: true,
        },
        include: {
          workflow: true,
        },
        orderBy: {
          priority: 'asc',
        },
      });

      console.log(`[ActionService] Found ${triggers.length} triggers for ${actionKey} (timing: ${timing})`);

      // Workflows ausführen
      const workflowInstances = [];

      for (const trigger of triggers) {
        try {
          // Bedingung prüfen (wenn vorhanden)
          if (trigger.condition) {
            const conditionMet = this.evaluateCondition(
              JSON.parse(trigger.condition),
              context
            );

            if (!conditionMet) {
              console.log(`[ActionService] Condition not met for workflow ${trigger.workflow.name}`);
              continue;
            }
          }

          // Workflow starten
          console.log(`[ActionService] Starting workflow: ${trigger.workflow.name}`);

          if (!context.entityType || !context.entityId) {
            console.warn(`[ActionService] Missing entityType or entityId for workflow ${trigger.workflow.name}`);
            continue;
          }

          const instance = await workflowService.createWorkflowInstance(
            trigger.workflowId,
            context.entityId,
            context.entityType
          );

          triggeredWorkflows.push(instance.id);
          workflowInstances.push(instance);

          console.log(`[ActionService] Workflow instance created: ${instance.id}`);
        } catch (error: any) {
          console.error(`[ActionService] Error starting workflow ${trigger.workflow.name}:`, error);
        }
      }

      const executionTime = Date.now() - startTime;

      // Action Log erstellen
      await prisma.actionLog.create({
        data: {
          actionKey,
          userId: context.userId,
          contextData: JSON.stringify(context),
          success: true,
          triggeredWorkflows: JSON.stringify(triggeredWorkflows),
          executionTime,
        },
      });

      console.log(`[ActionService] Action completed in ${executionTime}ms, triggered ${triggeredWorkflows.length} workflows`);

      return {
        success: true,
        workflows: workflowInstances,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      console.error(`[ActionService] Error triggering action ${actionKey}:`, error);

      // Fehler loggen
      await prisma.actionLog.create({
        data: {
          actionKey,
          userId: context.userId,
          contextData: JSON.stringify(context),
          success: false,
          errorMessage: error.message,
          triggeredWorkflows: JSON.stringify(triggeredWorkflows),
          executionTime,
        },
      });

      return {
        success: false,
        error: error.message,
        workflows: [],
      };
    }
  },

  /**
   * Bedingung evaluieren
   */
  evaluateCondition(condition: any, context: ActionContext): boolean {
    try {
      // Einfache Bedingungslogik
      // condition = { field: 'amount', operator: 'gt', value: 1000 }
      
      if (!condition.field || !condition.operator) {
        return true; // Keine Bedingung = immer erfüllt
      }

      const value = this.getNestedValue(context, condition.field);
      const compareValue = condition.value;

      switch (condition.operator) {
        case 'eq':
          return value === compareValue;
        case 'ne':
          return value !== compareValue;
        case 'gt':
          return Number(value) > Number(compareValue);
        case 'gte':
          return Number(value) >= Number(compareValue);
        case 'lt':
          return Number(value) < Number(compareValue);
        case 'lte':
          return Number(value) <= Number(compareValue);
        case 'contains':
          return String(value).includes(String(compareValue));
        case 'startsWith':
          return String(value).startsWith(String(compareValue));
        case 'endsWith':
          return String(value).endsWith(String(compareValue));
        case 'in':
          return Array.isArray(compareValue) && compareValue.includes(value);
        default:
          return true;
      }
    } catch (error) {
      console.error('[ActionService] Error evaluating condition:', error);
      return false;
    }
  },

  /**
   * Nested value aus Object holen (z.B. "entityData.amount")
   */
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
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
  } = {}) {
    const where: any = {};
    
    if (options.actionKey) where.actionKey = options.actionKey;
    if (options.userId) where.userId = options.userId;
    if (options.success !== undefined) where.success = options.success;

    const [logs, total] = await Promise.all([
      prisma.actionLog.findMany({
        where,
        include: {
          action: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.actionLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: options.limit || 50,
      offset: options.offset || 0,
    };
  },

  /**
   * Action Log Statistics
   */
  async getActionStatistics(actionKey?: string) {
    const where: any = {};
    if (actionKey) where.actionKey = actionKey;

    const [total, successful, failed, avgExecutionTime] = await Promise.all([
      prisma.actionLog.count({ where }),
      prisma.actionLog.count({ where: { ...where, success: true } }),
      prisma.actionLog.count({ where: { ...where, success: false } }),
      prisma.actionLog.aggregate({
        where: { ...where, executionTime: { not: null } },
        _avg: { executionTime: true },
      }),
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgExecutionTime: avgExecutionTime._avg.executionTime || 0,
    };
  },

  // ========== SEEDING ==========

  /**
   * Standard System Actions initialisieren
   */
  async seedSystemActions() {
    const actions: SystemActionData[] = [
      // Authentication
      {
        actionKey: 'user.login',
        displayName: 'Benutzer meldet sich an',
        description: 'Wird ausgelöst wenn sich ein Benutzer erfolgreich anmeldet',
        category: 'AUTHENTICATION',
        isSystem: true,
        contextSchema: {
          userId: 'string',
          email: 'string',
          timestamp: 'string',
        },
      },
      {
        actionKey: 'user.logout',
        displayName: 'Benutzer meldet sich ab',
        description: 'Wird ausgelöst wenn sich ein Benutzer abmeldet',
        category: 'AUTHENTICATION',
        isSystem: true,
      },

      // Time Tracking
      {
        actionKey: 'timeentry.clockin',
        displayName: 'Benutzer stempelt sich ein',
        description: 'Wird ausgelöst wenn sich ein Benutzer einstempelt',
        category: 'TIME_TRACKING',
        isSystem: true,
        contextSchema: {
          userId: 'string',
          timeEntryId: 'string',
          clockIn: 'string',
        },
      },
      {
        actionKey: 'timeentry.clockout',
        displayName: 'Benutzer stempelt sich aus',
        description: 'Wird ausgelöst wenn sich ein Benutzer ausstempelt',
        category: 'TIME_TRACKING',
        isSystem: true,
        contextSchema: {
          userId: 'string',
          timeEntryId: 'string',
          clockOut: 'string',
          totalHours: 'number',
        },
      },

      // Orders
      {
        actionKey: 'order.created',
        displayName: 'Bestellung anlegen',
        description: 'Wird ausgelöst wenn eine neue Bestellung erstellt wird',
        category: 'ORDERS',
        isSystem: true,
        contextSchema: {
          orderId: 'string',
          orderNumber: 'string',
          requestedBy: 'string',
          totalAmount: 'number',
        },
      },
      {
        actionKey: 'order.approved',
        displayName: 'Bestellung genehmigt',
        description: 'Wird ausgelöst wenn eine Bestellung genehmigt wird',
        category: 'ORDERS',
        isSystem: true,
      },
      {
        actionKey: 'order.rejected',
        displayName: 'Bestellung abgelehnt',
        description: 'Wird ausgelöst wenn eine Bestellung abgelehnt wird',
        category: 'ORDERS',
        isSystem: true,
      },
      {
        actionKey: 'order.ordered',
        displayName: 'Bestellung bestellt',
        description: 'Wird ausgelöst wenn eine Bestellung tatsächlich bestellt wird',
        category: 'ORDERS',
        isSystem: true,
      },

      // Invoices
      {
        actionKey: 'invoice.created',
        displayName: 'Rechnung erstellt',
        description: 'Wird ausgelöst wenn eine neue Rechnung erstellt wird',
        category: 'INVOICES',
        isSystem: true,
        contextSchema: {
          invoiceId: 'string',
          invoiceNumber: 'string',
          customerId: 'string',
          totalAmount: 'number',
        },
      },
      {
        actionKey: 'invoice.sent',
        displayName: 'Rechnung auf versendet setzen',
        description: 'Wird ausgelöst wenn eine Rechnung auf Status SENT gesetzt wird',
        category: 'INVOICES',
        isSystem: true,
      },
      {
        actionKey: 'invoice.paid',
        displayName: 'Rechnung bezahlt',
        description: 'Wird ausgelöst wenn eine Rechnung als bezahlt markiert wird',
        category: 'INVOICES',
        isSystem: true,
      },
      {
        actionKey: 'invoice.cancelled',
        displayName: 'Rechnung storniert',
        description: 'Wird ausgelöst wenn eine Rechnung storniert wird',
        category: 'INVOICES',
        isSystem: true,
      },

      // Users
      {
        actionKey: 'user.created',
        displayName: 'Benutzer angelegt',
        description: 'Wird ausgelöst wenn ein neuer Benutzer angelegt wird',
        category: 'USERS',
        isSystem: true,
      },
      {
        actionKey: 'user.updated',
        displayName: 'Benutzer bearbeitet',
        description: 'Wird ausgelöst wenn ein Benutzer bearbeitet wird',
        category: 'USERS',
        isSystem: true,
      },
      {
        actionKey: 'user.deleted',
        displayName: 'Benutzer gelöscht',
        description: 'Wird ausgelöst wenn ein Benutzer gelöscht wird',
        category: 'USERS',
        isSystem: true,
      },

      // Documents
      {
        actionKey: 'document.created',
        displayName: 'Dokument erstellt',
        description: 'Wird ausgelöst wenn ein neues Dokument erstellt wird',
        category: 'DOCUMENTS',
        isSystem: true,
      },
      {
        actionKey: 'document.updated',
        displayName: 'Dokument bearbeitet',
        description: 'Wird ausgelöst wenn ein Dokument bearbeitet wird',
        category: 'DOCUMENTS',
        isSystem: true,
      },

      // Incidents
      {
        actionKey: 'incident.created',
        displayName: 'Vorfall gemeldet',
        description: 'Wird ausgelöst wenn ein neuer Vorfall gemeldet wird',
        category: 'INCIDENTS',
        isSystem: true,
      },
      {
        actionKey: 'incident.approved',
        displayName: 'Vorfall genehmigt',
        description: 'Wird ausgelöst wenn ein Vorfall genehmigt wird',
        category: 'INCIDENTS',
        isSystem: true,
      },

      // Compliance
      {
        actionKey: 'compliance.violation',
        displayName: 'Compliance-Verstoß erkannt',
        description: 'Wird ausgelöst wenn ein Compliance-Verstoß erkannt wird',
        category: 'COMPLIANCE',
        isSystem: true,
      },
    ];

    const created = [];
    
    for (const action of actions) {
      const existing = await prisma.systemAction.findUnique({
        where: { actionKey: action.actionKey },
      });

      if (!existing) {
        const newAction = await this.createSystemAction(action);
        created.push(newAction);
        console.log(`[ActionService] Created system action: ${action.actionKey}`);
      }
    }

    console.log(`[ActionService] Seeded ${created.length} system actions`);
    return created;
  },
};
