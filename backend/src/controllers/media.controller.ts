import { Request, Response } from 'express';
import { mediaService } from '../services/media.service';
import { MediaType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const mediaController = {
  async uploadMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const { description, tags, isPublic } = req.body;

      // Determine media type based on MIME type
      let mediaType: MediaType = MediaType.OTHER;
      if (file.mimetype.startsWith('image/')) {
        mediaType = MediaType.IMAGE;
      } else if (file.mimetype === 'application/pdf') {
        mediaType = MediaType.PDF;
      } else if (file.mimetype.startsWith('video/')) {
        mediaType = MediaType.VIDEO;
      } else if (file.mimetype.startsWith('audio/')) {
        mediaType = MediaType.AUDIO;
      } else if (
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.mimetype === 'application/x-rar-compressed' ||
        file.mimetype === 'application/x-7z-compressed'
      ) {
        mediaType = MediaType.ARCHIVE;
      } else if (
        file.mimetype === 'application/x-msdownload' ||
        file.mimetype === 'application/x-executable'
      ) {
        mediaType = MediaType.EXECUTABLE;
      } else if (
        file.mimetype.includes('word') ||
        file.mimetype.includes('excel') ||
        file.mimetype.includes('powerpoint') ||
        file.mimetype.includes('document')
      ) {
        mediaType = MediaType.DOCUMENT;
      }

      const media = await mediaService.createMedia({
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        mediaType,
        path: `uploads/media/${file.filename}`,
        description,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
        isPublic: isPublic === 'true' || isPublic === true,
        uploadedById: userId,
      });

      res.status(201).json(media);
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  },

  async getAllMedia(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType, isPublic, search, tags } = req.query;

      const media = await mediaService.getAllMedia({
        mediaType: mediaType as MediaType,
        isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
        search: search as string,
        tags: tags ? (tags as string).split(',') : undefined,
      });

      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  },

  async getMediaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const media = await mediaService.getMediaById(id);

      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  },

  async updateMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { description, tags, isPublic } = req.body;

      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) {
        updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim());
      }
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      const media = await mediaService.updateMedia(id, updateData);

      res.json(media);
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json({ error: 'Failed to update media' });
    }
  },

  async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const media = await mediaService.getMediaById(id);
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      // Delete physical file
      const filePath = path.join(__dirname, '../../', media.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await mediaService.deleteMedia(id);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ error: 'Failed to delete media' });
    }
  },

  async downloadMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const media = await mediaService.getMediaById(id);
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      const filePath = path.join(__dirname, '../../', media.path);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      res.download(filePath, media.originalFilename);
    } catch (error) {
      console.error('Error downloading media:', error);
      res.status(500).json({ error: 'Failed to download media' });
    }
  },

  async getMediaByTag(req: Request, res: Response): Promise<void> {
    try {
      const { tag } = req.params;

      const media = await mediaService.getMediaByTag(tag);

      res.json(media);
    } catch (error) {
      console.error('Error fetching media by tag:', error);
      res.status(500).json({ error: 'Failed to fetch media by tag' });
    }
  },

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await mediaService.getStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching media statistics:', error);
      res.status(500).json({ error: 'Failed to fetch media statistics' });
    }
  },
};
