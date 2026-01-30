import { Request, Response } from 'express';
import checklistService from '../services/checklist.service';
import { ChecklistType, ChecklistItemType, ChecklistStatus } from '@prisma/client';

class ChecklistController {
  // ==================== Templates ====================

  async createTemplate(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const template = await checklistService.createTemplate({
        ...req.body,
        createdById: userId,
      });
      res.status(201).json(template);
    } catch (error: any) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTemplates(req: Request, res: Response) {
    try {
      const { type, isActive } = req.query;
      const filters: any = {};

      if (type) filters.type = type as ChecklistType;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const templates = await checklistService.getTemplates(filters);
      res.json(templates);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await checklistService.getTemplateById(id);
      res.json(template);
    } catch (error: any) {
      console.error('Error fetching template:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await checklistService.updateTemplate(id, req.body);
      res.json(template);
    } catch (error: any) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await checklistService.deleteTemplate(id);
      res.json({ message: 'Template deactivated successfully' });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Template Items ====================

  async createTemplateItem(req: Request, res: Response) {
    try {
      const item = await checklistService.createTemplateItem(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      console.error('Error creating template item:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateTemplateItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await checklistService.updateTemplateItem(id, req.body);
      res.json(item);
    } catch (error: any) {
      console.error('Error updating template item:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTemplateItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await checklistService.deleteTemplateItem(id);
      res.json({ message: 'Template item deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting template item:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async reorderTemplateItems(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ error: 'itemIds must be an array' });
      }

      await checklistService.reorderTemplateItems(templateId, itemIds);
      res.json({ message: 'Items reordered successfully' });
    } catch (error: any) {
      console.error('Error reordering template items:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Instances ====================

  async createInstance(req: Request, res: Response) {
    try {
      const instance = await checklistService.createInstance(req.body);
      res.status(201).json(instance);
    } catch (error: any) {
      console.error('Error creating instance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getInstances(req: Request, res: Response) {
    try {
      const { userId, assignedToId, status, templateId } = req.query;
      const filters: any = {};

      if (userId) filters.userId = userId as string;
      if (assignedToId) filters.assignedToId = assignedToId as string;
      if (status) filters.status = status as ChecklistStatus;
      if (templateId) filters.templateId = templateId as string;

      const instances = await checklistService.getInstances(filters);
      res.json(instances);
    } catch (error: any) {
      console.error('Error fetching instances:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMyInstances(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const instances = await checklistService.getInstances({ userId });
      res.json(instances);
    } catch (error: any) {
      console.error('Error fetching my instances:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAssignedInstances(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const instances = await checklistService.getInstances({ assignedToId: userId });
      res.json(instances);
    } catch (error: any) {
      console.error('Error fetching assigned instances:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getInstanceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await checklistService.getInstanceById(id);
      res.json(instance);
    } catch (error: any) {
      console.error('Error fetching instance:', error);
      res.status(404).json({ error: error.message });
    }
  }

  async updateInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const instance = await checklistService.updateInstance(id, req.body);
      res.json(instance);
    } catch (error: any) {
      console.error('Error updating instance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await checklistService.deleteInstance(id);
      res.json({ message: 'Instance deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Item Completion ====================

  async completeItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const completion = await checklistService.completeItem({
        ...req.body,
        completedById: userId,
      });
      res.json(completion);
    } catch (error: any) {
      console.error('Error completing item:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Statistics ====================

  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await checklistService.getStatistics();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ChecklistController();
