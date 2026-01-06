import { Request, Response } from 'express';
import { incidentService } from '../services/incident.service';
import { IncidentPriority, IncidentStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { checkModulePermission } from '../services/module.service';

export const incidentController = {
  async createIncident(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check if user has WRITE permission for incidents module
      const hasWritePermission = await checkModulePermission(userId, 'incidents', 'WRITE');
      if (!hasWritePermission) {
        res.status(403).json({ error: 'No permission to create incidents' });
        return;
      }

      const { title, description, priority, assignedToId, category, affectedSystem, dueDate, tags } = req.body;
      const reportedById = userId;

      if (!title || !description) {
        res.status(400).json({ error: 'Title and description are required' });
        return;
      }

      const incident = await incidentService.createIncident({
        title,
        description,
        priority: priority as IncidentPriority,
        reportedById,
        assignedToId,
        category,
        affectedSystem,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags,
      });

      res.status(201).json(incident);
    } catch (error) {
      console.error('Error creating incident:', error);
      res.status(500).json({ error: 'Failed to create incident' });
    }
  },

  async getAllIncidents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check if user has READ permission for incidents module
      const hasReadPermission = await checkModulePermission(userId, 'incidents', 'READ');
      if (!hasReadPermission) {
        res.status(403).json({ error: 'No permission to read incidents' });
        return;
      }

      const { status, priority, assignedToId } = req.query;

      const incidents = await incidentService.getAllIncidents(
        status as IncidentStatus,
        priority as IncidentPriority,
        assignedToId as string
      );

      res.json(incidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  },

  async getIncidentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check if user has READ permission for incidents module
      const hasReadPermission = await checkModulePermission(userId, 'incidents', 'READ');
      if (!hasReadPermission) {
        res.status(403).json({ error: 'No permission to read incidents' });
        return;
      }

      const { id } = req.params;

      const incident = await incidentService.getIncidentById(id);

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      res.json(incident);
    } catch (error) {
      console.error('Error fetching incident:', error);
      res.status(500).json({ error: 'Failed to fetch incident' });
    }
  },

  async updateIncident(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check if user has WRITE permission for incidents module
      const hasWritePermission = await checkModulePermission(userId, 'incidents', 'WRITE');
      if (!hasWritePermission) {
        res.status(403).json({ error: 'No permission to update incidents' });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const incident = await incidentService.updateIncident(id, updateData);

      res.json(incident);
    } catch (error) {
      console.error('Error updating incident:', error);
      res.status(500).json({ error: 'Failed to update incident' });
    }
  },

  async deleteIncident(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check if user has WRITE permission for incidents module
      const hasWritePermission = await checkModulePermission(userId, 'incidents', 'WRITE');
      if (!hasWritePermission) {
        res.status(403).json({ error: 'No permission to delete incidents' });
        return;
      }

      const { id } = req.params;

      await incidentService.deleteIncident(id);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting incident:', error);
      res.status(500).json({ error: 'Failed to delete incident' });
    }
  },

  async addComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check if user has WRITE permission for incidents module
      const hasWritePermission = await checkModulePermission(userId, 'incidents', 'WRITE');
      if (!hasWritePermission) {
        res.status(403).json({ error: 'No permission to add comments to incidents' });
        return;
      }

      const { id } = req.params;
      const { comment } = req.body;

      if (!comment) {
        res.status(400).json({ error: 'Comment is required' });
        return;
      }

      const newComment = await incidentService.addComment(id, {
        comment,
        userId,
      });

      res.status(201).json(newComment);
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  },

  async getComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check if user has READ permission for incidents module
      const hasReadPermission = await checkModulePermission(userId, 'incidents', 'READ');
      if (!hasReadPermission) {
        res.status(403).json({ error: 'No permission to read incident comments' });
        return;
      }

      const { id } = req.params;

      const comments = await incidentService.getComments(id);

      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  },

  async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check if user has READ permission for incidents module
      const hasReadPermission = await checkModulePermission(userId, 'incidents', 'READ');
      if (!hasReadPermission) {
        res.status(403).json({ error: 'No permission to read incident statistics' });
        return;
      }

      const stats = await incidentService.getStatistics();

      res.json(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },
};
