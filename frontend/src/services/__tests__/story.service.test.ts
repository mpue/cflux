import { storyService } from '../story.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('storyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockStory = {
    id: 'story-1',
    projectId: 'proj-1',
    name: 'User Authentication',
    description: 'Implement login flow',
    color: '#ff5733',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  describe('getStoriesByProject', () => {
    it('should fetch stories for a project', async () => {
      mockApi.get.mockResolvedValue({ data: [mockStory] });

      const result = await storyService.getStoriesByProject('proj-1');

      expect(mockApi.get).toHaveBeenCalledWith('/stories/project/proj-1', {
        params: { includeInactive: undefined },
      });
      expect(result).toEqual([mockStory]);
    });

    it('should include inactive stories when requested', async () => {
      mockApi.get.mockResolvedValue({ data: [mockStory] });

      await storyService.getStoriesByProject('proj-1', true);

      expect(mockApi.get).toHaveBeenCalledWith('/stories/project/proj-1', {
        params: { includeInactive: true },
      });
    });
  });

  describe('getStory', () => {
    it('should fetch a single story', async () => {
      mockApi.get.mockResolvedValue({ data: mockStory });

      const result = await storyService.getStory('story-1');

      expect(mockApi.get).toHaveBeenCalledWith('/stories/story-1');
      expect(result).toEqual(mockStory);
    });
  });

  describe('createStory', () => {
    it('should create a story', async () => {
      const data = { projectId: 'proj-1', name: 'New Story', description: 'Desc', color: '#000' };
      mockApi.post.mockResolvedValue({ data: mockStory });

      const result = await storyService.createStory(data);

      expect(mockApi.post).toHaveBeenCalledWith('/stories', data);
      expect(result).toEqual(mockStory);
    });
  });

  describe('updateStory', () => {
    it('should update a story', async () => {
      const data = { name: 'Updated Story' };
      const updated = { ...mockStory, ...data };
      mockApi.put.mockResolvedValue({ data: updated });

      const result = await storyService.updateStory('story-1', data);

      expect(mockApi.put).toHaveBeenCalledWith('/stories/story-1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteStory', () => {
    it('should delete a story', async () => {
      mockApi.delete.mockResolvedValue({});

      await storyService.deleteStory('story-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/stories/story-1');
    });
  });
});
