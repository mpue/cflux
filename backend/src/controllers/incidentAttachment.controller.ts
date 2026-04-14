import { Response } from 'express';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import { checkModulePermission } from '../services/module.service';
import { incidentAttachmentService } from '../services/incidentAttachment.service';

export const incidentAttachmentController = {
  async getAttachments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const hasPermission = await checkModulePermission(userId, 'incidents', 'READ');
      if (!hasPermission) {
        res.status(403).json({ error: 'No permission to view incidents' });
        return;
      }

      const { incidentId } = req.params;
      const attachments = await incidentAttachmentService.getAttachments(incidentId);
      res.json(attachments);
    } catch (error) {
      console.error('Error getting attachments:', error);
      res.status(500).json({ error: 'Failed to get attachments' });
    }
  },

  async uploadAttachment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const hasPermission = await checkModulePermission(userId, 'incidents', 'WRITE');
      if (!hasPermission) {
        res.status(403).json({ error: 'No permission to modify incidents' });
        return;
      }

      const { incidentId } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const attachment = await incidentAttachmentService.createAttachment({
        incidentId,
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedById: userId,
      });

      res.status(201).json(attachment);
    } catch (error) {
      console.error('Error uploading attachment:', error);
      res.status(500).json({ error: 'Failed to upload attachment' });
    }
  },

  async downloadAttachment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const hasPermission = await checkModulePermission(userId, 'incidents', 'READ');
      if (!hasPermission) {
        res.status(403).json({ error: 'No permission to view incidents' });
        return;
      }

      const { attachmentId } = req.params;
      const attachment = await incidentAttachmentService.getAttachmentById(attachmentId);

      if (!attachment) {
        res.status(404).json({ error: 'Attachment not found' });
        return;
      }

      const filePath = path.join(incidentAttachmentService.getUploadDir(), attachment.filename);
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalFilename)}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ error: 'Failed to download attachment' });
    }
  },

  async deleteAttachment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const hasPermission = await checkModulePermission(userId, 'incidents', 'WRITE');
      if (!hasPermission) {
        res.status(403).json({ error: 'No permission to modify incidents' });
        return;
      }

      const { attachmentId } = req.params;
      const result = await incidentAttachmentService.deleteAttachment(attachmentId);

      if (!result) {
        res.status(404).json({ error: 'Attachment not found' });
        return;
      }

      res.json({ message: 'Attachment deleted' });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ error: 'Failed to delete attachment' });
    }
  },
};
