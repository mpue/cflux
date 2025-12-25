import { Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';

export const workflowController = {
  // Workflows
  async createWorkflow(req: Request, res: Response) {
    try {
      const workflow = await workflowService.createWorkflow(req.body);
      res.status(201).json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getAllWorkflows(req: Request, res: Response) {
    try {
      const workflows = await workflowService.getAllWorkflows();
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getWorkflowById(req: Request, res: Response) {
    try {
      const workflow = await workflowService.getWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow nicht gefunden' });
      }
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateWorkflow(req: Request, res: Response) {
    try {
      const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteWorkflow(req: Request, res: Response) {
    try {
      await workflowService.deleteWorkflow(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Workflow Steps
  async createWorkflowStep(req: Request, res: Response) {
    try {
      const step = await workflowService.createWorkflowStep(
        req.params.workflowId,
        req.body
      );
      res.status(201).json(step);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateWorkflowStep(req: Request, res: Response) {
    try {
      const step = await workflowService.updateWorkflowStep(req.params.id, req.body);
      res.json(step);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteWorkflowStep(req: Request, res: Response) {
    try {
      await workflowService.deleteWorkflowStep(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Template-Workflow Links
  async linkWorkflowToTemplate(req: Request, res: Response) {
    try {
      const { templateId, workflowId, order } = req.body;
      const link = await workflowService.linkWorkflowToTemplate(
        templateId,
        workflowId,
        order
      );
      res.status(201).json(link);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async unlinkWorkflowFromTemplate(req: Request, res: Response) {
    try {
      const { templateId, workflowId } = req.params;
      await workflowService.unlinkWorkflowFromTemplate(templateId, workflowId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getTemplateWorkflows(req: Request, res: Response) {
    try {
      const workflows = await workflowService.getTemplateWorkflows(req.params.templateId);
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Workflow Instances
  async getInvoiceWorkflowInstances(req: Request, res: Response) {
    try {
      const instances = await workflowService.getInvoiceWorkflowInstances(
        req.params.invoiceId
      );
      res.json(instances);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async approveWorkflowStep(req: Request, res: Response) {
    try {
      const { userId, comment } = req.body;
      const instanceStep = await workflowService.approveWorkflowStep(
        req.params.instanceStepId,
        userId,
        comment
      );
      res.json(instanceStep);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async rejectWorkflowStep(req: Request, res: Response) {
    try {
      const { userId, comment } = req.body;
      const instanceStep = await workflowService.rejectWorkflowStep(
        req.params.instanceStepId,
        userId,
        comment
      );
      res.json(instanceStep);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async checkInvoiceApproval(req: Request, res: Response) {
    try {
      const allCompleted = await workflowService.checkInvoiceWorkflowsCompleted(
        req.params.invoiceId
      );
      const anyRejected = await workflowService.hasAnyRejectedWorkflows(
        req.params.invoiceId
      );
      
      res.json({ 
        canApprove: allCompleted && !anyRejected,
        allCompleted,
        anyRejected 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getMyPendingApprovals(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const approvals = await workflowService.getPendingApprovalsForUser(userId);
      res.json(approvals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
