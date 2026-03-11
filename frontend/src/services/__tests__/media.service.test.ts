import { mediaService } from '../media.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('mediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMedia = {
    id: 'media-1',
    filename: 'abc123.jpg',
    originalFilename: 'photo.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024000,
    mediaType: 'IMAGE' as const,
    path: '/uploads/abc123.jpg',
    description: 'A photo',
    tags: ['test'],
    width: 800,
    height: 600,
    isPublic: true,
    uploadedById: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    uploadedBy: {
      id: 'user-1',
      firstName: 'Max',
      lastName: 'Muster',
      email: 'max@example.com',
    },
  };

  describe('getAllMedia', () => {
    it('should fetch all media without filters', async () => {
      mockApi.get.mockResolvedValue({ data: [mockMedia] });

      const result = await mediaService.getAllMedia();

      expect(mockApi.get).toHaveBeenCalledWith('/media?');
      expect(result).toEqual([mockMedia]);
    });

    it('should fetch media with filters', async () => {
      mockApi.get.mockResolvedValue({ data: [mockMedia] });

      await mediaService.getAllMedia({ mediaType: 'IMAGE', search: 'photo' });

      const call = mockApi.get.mock.calls[0][0] as string;
      expect(call).toContain('mediaType=IMAGE');
      expect(call).toContain('search=photo');
    });
  });

  describe('getMediaById', () => {
    it('should fetch media by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockMedia });

      const result = await mediaService.getMediaById('media-1');

      expect(mockApi.get).toHaveBeenCalledWith('/media/media-1');
      expect(result).toEqual(mockMedia);
    });
  });

  describe('uploadMedia', () => {
    it('should upload media with file and data', async () => {
      mockApi.post.mockResolvedValue({ data: mockMedia });
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const result = await mediaService.uploadMedia(file, { description: 'Test' });

      expect(mockApi.post).toHaveBeenCalledWith('/media', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockMedia);
    });
  });

  describe('updateMedia', () => {
    it('should update media metadata', async () => {
      const data = { description: 'Updated', tags: ['new'] };
      mockApi.put.mockResolvedValue({ data: { ...mockMedia, ...data } });

      const result = await mediaService.updateMedia('media-1', data);

      expect(mockApi.put).toHaveBeenCalledWith('/media/media-1', data);
      expect(result.description).toBe('Updated');
    });
  });

  describe('deleteMedia', () => {
    it('should delete media', async () => {
      mockApi.delete.mockResolvedValue({});

      await mediaService.deleteMedia('media-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/media/media-1');
    });
  });

  describe('getMediaByTag', () => {
    it('should fetch media by tag', async () => {
      mockApi.get.mockResolvedValue({ data: [mockMedia] });

      const result = await mediaService.getMediaByTag('test');

      expect(mockApi.get).toHaveBeenCalledWith('/media/tags/test');
      expect(result).toEqual([mockMedia]);
    });
  });

  describe('getStatistics', () => {
    it('should fetch media statistics', async () => {
      const stats = { total: 10, byType: { IMAGE: 5 }, totalSize: 1024000, public: 8, private: 2 };
      mockApi.get.mockResolvedValue({ data: stats });

      const result = await mediaService.getStatistics();

      expect(mockApi.get).toHaveBeenCalledWith('/media/statistics');
      expect(result).toEqual(stats);
    });
  });
});
