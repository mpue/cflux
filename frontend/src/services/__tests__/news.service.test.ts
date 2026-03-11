import newsService from '../news.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('newsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSource = {
    id: 'src-1',
    name: 'Company News',
    type: 'INTERNAL' as const,
    refreshInterval: 3600,
    isActive: true,
    displayOnDashboard: true,
    priority: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockItem = {
    id: 'item-1',
    sourceId: 'src-1',
    title: 'New Feature Released',
    content: 'We released a new feature.',
    priority: 'NORMAL' as const,
    isPinned: false,
    isActive: true,
    publishedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  // ===== NEWS SOURCES =====

  describe('getAllSources', () => {
    it('should fetch all sources', async () => {
      mockApi.get.mockResolvedValue({ data: [mockSource] });

      const result = await newsService.getAllSources();

      expect(mockApi.get).toHaveBeenCalledWith('/news/sources');
      expect(result).toEqual([mockSource]);
    });
  });

  describe('getSourceById', () => {
    it('should fetch a source by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockSource });

      const result = await newsService.getSourceById('src-1');

      expect(mockApi.get).toHaveBeenCalledWith('/news/sources/src-1');
      expect(result).toEqual(mockSource);
    });
  });

  describe('createSource', () => {
    it('should create a source', async () => {
      const data = { name: 'New Source', type: 'MANUAL' as const };
      mockApi.post.mockResolvedValue({ data: mockSource });

      const result = await newsService.createSource(data);

      expect(mockApi.post).toHaveBeenCalledWith('/news/sources', data);
      expect(result).toEqual(mockSource);
    });
  });

  describe('updateSource', () => {
    it('should update a source', async () => {
      const data = { name: 'Updated Source' };
      mockApi.put.mockResolvedValue({ data: { ...mockSource, ...data } });

      const result = await newsService.updateSource('src-1', data);

      expect(mockApi.put).toHaveBeenCalledWith('/news/sources/src-1', data);
      expect(result.name).toBe('Updated Source');
    });
  });

  describe('deleteSource', () => {
    it('should delete a source', async () => {
      mockApi.delete.mockResolvedValue({});

      await newsService.deleteSource('src-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/news/sources/src-1');
    });
  });

  describe('toggleSourceVisibility', () => {
    it('should toggle source visibility', async () => {
      mockApi.patch.mockResolvedValue({ data: { ...mockSource, isActive: false } });

      const result = await newsService.toggleSourceVisibility('src-1');

      expect(mockApi.patch).toHaveBeenCalledWith('/news/sources/src-1/toggle-visibility');
      expect(result.isActive).toBe(false);
    });
  });

  // ===== NEWS ITEMS =====

  describe('getDashboardNews', () => {
    it('should fetch dashboard news', async () => {
      mockApi.get.mockResolvedValue({ data: [mockItem] });

      const result = await newsService.getDashboardNews();

      expect(mockApi.get).toHaveBeenCalledWith('/news/dashboard', { params: { limit: undefined } });
      expect(result).toEqual([mockItem]);
    });

    it('should fetch dashboard news with limit', async () => {
      mockApi.get.mockResolvedValue({ data: [mockItem] });

      await newsService.getDashboardNews(5);

      expect(mockApi.get).toHaveBeenCalledWith('/news/dashboard', { params: { limit: 5 } });
    });
  });

  describe('getItemsBySource', () => {
    it('should fetch items by source', async () => {
      mockApi.get.mockResolvedValue({ data: [mockItem] });

      const result = await newsService.getItemsBySource('src-1');

      expect(mockApi.get).toHaveBeenCalledWith('/news/sources/src-1/items');
      expect(result).toEqual([mockItem]);
    });
  });

  describe('getItemById', () => {
    it('should fetch an item by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockItem });

      const result = await newsService.getItemById('item-1');

      expect(mockApi.get).toHaveBeenCalledWith('/news/items/item-1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('createItem', () => {
    it('should create an item', async () => {
      const data = { sourceId: 'src-1', title: 'Test', content: 'Test content' };
      mockApi.post.mockResolvedValue({ data: mockItem });

      const result = await newsService.createItem(data);

      expect(mockApi.post).toHaveBeenCalledWith('/news/items', data);
      expect(result).toEqual(mockItem);
    });
  });

  describe('updateItem', () => {
    it('should update an item', async () => {
      const data = { title: 'Updated' };
      mockApi.put.mockResolvedValue({ data: { ...mockItem, ...data } });

      const result = await newsService.updateItem('item-1', data);

      expect(mockApi.put).toHaveBeenCalledWith('/news/items/item-1', data);
      expect(result.title).toBe('Updated');
    });
  });

  describe('deleteItem', () => {
    it('should delete an item', async () => {
      mockApi.delete.mockResolvedValue({});

      await newsService.deleteItem('item-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/news/items/item-1');
    });
  });

  describe('markAsRead', () => {
    it('should mark an item as read', async () => {
      mockApi.post.mockResolvedValue({});

      await newsService.markAsRead('item-1');

      expect(mockApi.post).toHaveBeenCalledWith('/news/item-1/read');
    });
  });

  describe('togglePin', () => {
    it('should toggle pin status', async () => {
      mockApi.patch.mockResolvedValue({ data: { ...mockItem, isPinned: true } });

      const result = await newsService.togglePin('item-1');

      expect(mockApi.patch).toHaveBeenCalledWith('/news/items/item-1/toggle-pin');
      expect(result.isPinned).toBe(true);
    });
  });

  describe('refreshRssFeeds', () => {
    it('should refresh all feeds', async () => {
      mockApi.post.mockResolvedValue({ data: { refreshed: 3 } });

      const result = await newsService.refreshRssFeeds();

      expect(mockApi.post).toHaveBeenCalledWith('/news/refresh-feeds', null, { params: undefined });
      expect(result).toEqual({ refreshed: 3 });
    });

    it('should refresh a specific source feed', async () => {
      mockApi.post.mockResolvedValue({ data: { refreshed: 1 } });

      await newsService.refreshRssFeeds('src-1');

      expect(mockApi.post).toHaveBeenCalledWith('/news/refresh-feeds', null, {
        params: { sourceId: 'src-1' },
      });
    });
  });
});
