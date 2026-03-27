import { prisma } from '../lib/prisma';
import { mediaService } from '../services/media.service';
import { MediaType } from '@prisma/client';

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    media: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('Media Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMedia', () => {
    it('should create media with all fields', async () => {
      const mockMedia = {
        id: 'media-1',
        filename: 'image123.jpg',
        originalFilename: 'vacation.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        mediaType: 'IMAGE' as MediaType,
        path: '/uploads/image123.jpg',
        url: 'http://localhost/uploads/image123.jpg',
        description: 'Vacation photo',
        tags: ['vacation', 'travel'],
        width: 1920,
        height: 1080,
        isPublic: true,
        uploadedById: 'user-1',
        uploadedBy: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      (prisma.media.create as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.createMedia({
        filename: 'image123.jpg',
        originalFilename: 'vacation.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        mediaType: 'IMAGE' as MediaType,
        path: '/uploads/image123.jpg',
        url: 'http://localhost/uploads/image123.jpg',
        description: 'Vacation photo',
        tags: ['vacation', 'travel'],
        width: 1920,
        height: 1080,
        isPublic: true,
        uploadedById: 'user-1',
      });

      expect(result.filename).toBe('image123.jpg');
      expect(result.mediaType).toBe('IMAGE');
      expect(result.tags).toEqual(['vacation', 'travel']);
      expect(prisma.media.create).toHaveBeenCalled();
    });

    it('should create media with minimal fields and defaults', async () => {
      const mockMedia = {
        id: 'media-2',
        filename: 'doc.pdf',
        originalFilename: 'document.pdf',
        mimeType: 'application/pdf',
        fileSize: 512000,
        mediaType: 'DOCUMENT' as MediaType,
        path: '/uploads/doc.pdf',
        tags: [],
        isPublic: false,
        uploadedById: 'user-2',
      };

      (prisma.media.create as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.createMedia({
        filename: 'doc.pdf',
        originalFilename: 'document.pdf',
        mimeType: 'application/pdf',
        fileSize: 512000,
        mediaType: 'DOCUMENT' as MediaType,
        path: '/uploads/doc.pdf',
        uploadedById: 'user-2',
      });

      expect(result.isPublic).toBe(false);
      expect(result.tags).toEqual([]);
    });

    it('should create video media with duration', async () => {
      const mockMedia = {
        id: 'media-3',
        filename: 'video.mp4',
        originalFilename: 'tutorial.mp4',
        mediaType: 'VIDEO' as MediaType,
        duration: 300,
        width: 1280,
        height: 720,
      };

      (prisma.media.create as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.createMedia({
        filename: 'video.mp4',
        originalFilename: 'tutorial.mp4',
        mimeType: 'video/mp4',
        fileSize: 5000000,
        mediaType: 'VIDEO' as MediaType,
        path: '/uploads/video.mp4',
        duration: 300,
        width: 1280,
        height: 720,
        uploadedById: 'user-1',
      });

      expect(result.duration).toBe(300);
    });
  });

  describe('getAllMedia', () => {
    it('should return all media without filters', async () => {
      const mockMedia = [
        { id: 'media-1', filename: 'image.jpg', mediaType: 'IMAGE' },
        { id: 'media-2', filename: 'doc.pdf', mediaType: 'DOCUMENT' },
      ];

      (prisma.media.findMany as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.getAllMedia();

      expect(result).toHaveLength(2);
      expect(prisma.media.findMany).toHaveBeenCalled();
    });

    it('should filter by media type', async () => {
      const mockMedia = [
        { id: 'media-1', filename: 'image1.jpg', mediaType: 'IMAGE' },
        { id: 'media-2', filename: 'image2.jpg', mediaType: 'IMAGE' },
      ];

      (prisma.media.findMany as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.getAllMedia({
        mediaType: 'IMAGE' as MediaType,
      });

      expect(result).toHaveLength(2);
      expect(result.every(m => m.mediaType === 'IMAGE')).toBe(true);
    });

    it('should filter by isPublic', async () => {
      const mockMedia = [
        { id: 'media-1', filename: 'public.jpg', isPublic: true },
      ];

      (prisma.media.findMany as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.getAllMedia({
        isPublic: true,
      });

      expect(result).toHaveLength(1);
    });

    it('should filter by search term', async () => {
      const mockMedia = [
        {
          id: 'media-1',
          originalFilename: 'vacation photo.jpg',
          description: 'Beach',
        },
      ];

      (prisma.media.findMany as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.getAllMedia({
        search: 'vacation',
      });

      expect(result).toHaveLength(1);
    });

    it('should filter by tags', async () => {
      const mockMedia = [
        { id: 'media-1', tags: ['important', 'work'] },
        { id: 'media-2', tags: ['important', 'personal'] },
      ];

      (prisma.media.findMany as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.getAllMedia({
        tags: ['important'],
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('getMediaById', () => {
    it('should return media by id', async () => {
      const mockMedia = {
        id: 'media-1',
        filename: 'test.jpg',
        uploadedBy: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      (prisma.media.findUnique as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.getMediaById('media-1');

      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.jpg');
      expect(prisma.media.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'media-1' },
        })
      );
    });

    it('should return null when media not found', async () => {
      (prisma.media.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await mediaService.getMediaById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateMedia', () => {
    it('should update media description', async () => {
      const mockMedia = {
        id: 'media-1',
        description: 'Updated description',
      };

      (prisma.media.update as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.updateMedia('media-1', {
        description: 'Updated description',
      });

      expect(result.description).toBe('Updated description');
    });

    it('should update media tags', async () => {
      const mockMedia = {
        id: 'media-1',
        tags: ['new', 'tags'],
      };

      (prisma.media.update as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.updateMedia('media-1', {
        tags: ['new', 'tags'],
      });

      expect(result.tags).toEqual(['new', 'tags']);
    });

    it('should update media public status', async () => {
      const mockMedia = {
        id: 'media-1',
        isPublic: true,
      };

      (prisma.media.update as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.updateMedia('media-1', {
        isPublic: true,
      });

      expect(result.isPublic).toBe(true);
    });
  });

  describe('deleteMedia', () => {
    it('should delete media by id', async () => {
      (prisma.media.delete as jest.Mock).mockResolvedValue({});

      await mediaService.deleteMedia('media-1');

      expect(prisma.media.delete).toHaveBeenCalledWith({
        where: { id: 'media-1' },
      });
    });
  });

  describe('getMediaByTag', () => {
    it('should return media with specific tag', async () => {
      const mockMedia = [
        { id: 'media-1', tags: ['important', 'work'] },
        { id: 'media-2', tags: ['important'] },
      ];

      (prisma.media.findMany as jest.Mock).mockResolvedValue(mockMedia);

      const result = await mediaService.getMediaByTag('important');

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no media has the tag', async () => {
      (prisma.media.findMany as jest.Mock).mockResolvedValue([]);

      const result = await mediaService.getMediaByTag('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    it('should return media statistics', async () => {
      (prisma.media.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60)  // public
        .mockResolvedValueOnce(40); // private

      (prisma.media.groupBy as jest.Mock).mockResolvedValue([
        { mediaType: 'IMAGE', _count: 50 },
        { mediaType: 'VIDEO', _count: 30 },
        { mediaType: 'DOCUMENT', _count: 20 },
      ]);

      (prisma.media.aggregate as jest.Mock).mockResolvedValue({
        _sum: { fileSize: 500000000 },
      });

      const result = await mediaService.getStatistics();

      expect(result.total).toBe(100);
      expect(result.public).toBe(60);
      expect(result.private).toBe(40);
      expect(result.totalSize).toBe(500000000);
      expect(result.byType).toBeDefined();
    });

    it('should handle zero media', async () => {
      (prisma.media.count as jest.Mock).mockResolvedValue(0);
      (prisma.media.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.media.aggregate as jest.Mock).mockResolvedValue({
        _sum: { fileSize: null },
      });

      const result = await mediaService.getStatistics();

      expect(result.total).toBe(0);
    });
  });
});
