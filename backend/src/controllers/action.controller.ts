import { Request, Response } from 'express';
import { actionService } from '../services/action.service';
import { AuthRequest } from '../types/auth';

export const actionController = {
  // ========== SYSTEM ACTIONS ==========

  /**
   * GET /api/actions
   * Alle System Actions abrufen
   */
  async getAllSystemActions(req: Request, res: Response) {
    try {
      const { category, isActive } = req.query;
      
      const actions = await actionService.getAllSystemActions(
        category as any,
        isActive ? isActive === 'true' : undefined
      );
      
      res.json(actions);
    } catch (error: any) {
      console.error('Error fetching system actions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/actions/:actionKey
   * System Action nach Key abrufen
   */
  async getSystemActionByKey(req: Request, res: Response) {
    try {
      const { actionKey } = req.params;
      
      const action = await actionService.getSystemActionByKey(actionKey);
      
      if (!action) {
        return res.status(404).json({ error: 'System Action nicht gefunden' });
      }
      
      res.json(action);
    } catch (error: any) {
      console.error('Error fetching system action:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/actions
   * Neue System Action erstellen
   */
  async createSystemAction(req: Request, res: Response) {
    try {
      const action = await actionService.createSystemAction(req.body);
      res.status(201).json(action);
    } catch (error: any) {
      console.error('Error creating system action:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * PUT /api/actions/:actionKey
   * System Action aktualisieren
   */
  async updateSystemAction(req: Request, res: Response) {
    try {
      const { actionKey } = req.params;
      
      const action = await actionService.updateSystemAction(actionKey, req.body);
      res.json(action);
    } catch (error: any) {
      console.error('Error updating system action:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * DELETE /api/actions/:actionKey
   * System Action löschen
   */
  async deleteSystemAction(req: Request, res: Response) {
    try {
      const { actionKey } = req.params;
      
      await actionService.deleteSystemAction(actionKey);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting system action:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ========== WORKFLOW TRIGGERS ==========

  /**
   * POST /api/actions/triggers
   * Workflow Trigger erstellen
   */
  async createWorkflowTrigger(req: Request, res: Response) {
    try {
      const trigger = await actionService.createWorkflowTrigger(req.body);
      res.status(201).json(trigger);
    } catch (error: any) {
      console.error('Error creating workflow trigger:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/actions/workflows/:workflowId/triggers
   * Alle Trigger für einen Workflow
   */
  async getWorkflowTriggers(req: Request, res: Response) {
    try {
      const { workflowId } = req.params;
      
      const triggers = await actionService.getWorkflowTriggers(workflowId);
      res.json(triggers);
    } catch (error: any) {
      console.error('Error fetching workflow triggers:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/actions/:actionKey/triggers
   * Alle Triggers für eine Action
   */
  async getActionTriggers(req: Request, res: Response) {
    try {
      const { actionKey } = req.params;
      
      const triggers = await actionService.getActionTriggers(actionKey);
      res.json(triggers);
    } catch (error: any) {
      console.error('Error fetching action triggers:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * PUT /api/actions/triggers/:id
   * Workflow Trigger aktualisieren
   */
  async updateWorkflowTrigger(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const trigger = await actionService.updateWorkflowTrigger(id, req.body);
      res.json(trigger);
    } catch (error: any) {
      console.error('Error updating workflow trigger:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * DELETE /api/actions/triggers/:id
   * Workflow Trigger löschen
   */
  async deleteWorkflowTrigger(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await actionService.deleteWorkflowTrigger(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting workflow trigger:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * PATCH /api/actions/triggers/:id/toggle
   * Workflow Trigger aktivieren/deaktivieren
   */
  async toggleWorkflowTrigger(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const trigger = await actionService.toggleWorkflowTrigger(id, isActive);
      res.json(trigger);
    } catch (error: any) {
      console.error('Error toggling workflow trigger:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ========== ACTION EXECUTION ==========

  /**
   * POST /api/actions/:actionKey/trigger
   * Action manuell triggern
   */
  async triggerAction(req: AuthRequest, res: Response) {
    try {
      const { actionKey } = req.params;
      const { context, timing } = req.body;
      
      // User ID aus Auth hinzufügen
      const fullContext = {
        ...context,
        userId: req.user?.id,
      };
      
      const result = await actionService.triggerAction(
        actionKey,
        fullContext,
        timing || 'AFTER'
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error triggering action:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ========== ACTION LOGS ==========

  /**
   * GET /api/actions/logs
   * Action Logs abrufen
   */
  async getActionLogs(req: Request, res: Response) {
    try {
      const { actionKey, userId, success, limit, offset } = req.query;
      
      const logs = await actionService.getActionLogs({
        actionKey: actionKey as string,
        userId: userId as string,
        success: success ? success === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      
      res.json(logs);
    } catch (error: any) {
      console.error('Error fetching action logs:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/actions/statistics
   * Action Statistics abrufen
   */
  async getActionStatistics(req: Request, res: Response) {
    try {
      const { actionKey } = req.query;
      
      const statistics = await actionService.getActionStatistics(
        actionKey as string
      );
      
      res.json(statistics);
    } catch (error: any) {
      console.error('Error fetching action statistics:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/actions/seed
   * Standard System Actions initialisieren
   */
  async seedSystemActions(req: Request, res: Response) {
    try {
      const actions = await actionService.seedSystemActions();
      res.json({
        message: `${actions.length} System Actions erstellt`,
        actions,
      });
    } catch (error: any) {
      console.error('Error seeding system actions:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
