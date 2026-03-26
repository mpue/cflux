import { PrismaClient } from '@prisma/client';
import newsService from '../services/news.service';

// The factory is hoisted by Jest and runs before any variable initializations.
// We attach the shared mock to the constructor so tests can access it via jest.requireMock().
jest.mock('rss-parser', () => {
  const parseURLFn = jest.fn();
  const MockParser = jest.fn(() => ({ parseURL: parseURLFn }));
  (MockParser as any).__parseURL = parseURLFn;
  return MockParser;
});

/** Helper to get the shared parseURL mock from the rss-parser mock constructor */
const getRssParseURL = (): jest.Mock =>
  (jest.requireMock('rss-parser') as any).__parseURL;

const prisma = new PrismaClient();

const makeSource = (overrides: Partial<any> = {}) => ({
  id: 'source-1',
  name: 'Company News',
  type: 'INTERNAL',
  url: null,
  isActive: true,
  displayOnDashboard: true,
  priority: 0,
  visibleToGroups: [],
  createdById: 'user-1',
  ...overrides,
});

const makeItem = (overrides: Partial<any> = {}) => ({
  id: 'item-1',
  sourceId: 'source-1',
  title: 'Test News',
  content: 'Content of the news item',
  excerpt: 'Short excerpt',
  isActive: true,
  isPinned: false,
  priority: 'NORMAL',
  publishedAt: new Date('2024-01-15'),
  createdById: 'user-1',
  readBy: [],
  ...overrides,
});

const makeUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  role: 'USER',
  userGroupMemberships: [],
  userGroupId: null,
  ...overrides,
});

describe('News Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== getAllSources =====
  describe('getAllSources', () => {
    it('should throw when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(newsService.getAllSources('user-1')).rejects.toThrow('User not found');
    });

    it('should return active sources visible to user groups', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(
        makeUser({ userGroupMemberships: [{ userGroupId: 'group-1' }] })
      );
      const sources = [makeSource(), makeSource({ id: 'source-2', name: 'External' })];
      (prisma.newsSource.findMany as jest.Mock).mockResolvedValue(sources);

      const result = await newsService.getAllSources('user-1');

      expect(prisma.newsSource.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return sources for user without group memberships', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser());
      const sources = [makeSource()];
      (prisma.newsSource.findMany as jest.Mock).mockResolvedValue(sources);

      const result = await newsService.getAllSources('user-1');

      expect(result).toHaveLength(1);
    });
  });

  // ===== getSourceById =====
  describe('getSourceById', () => {
    it('should return a news source by id', async () => {
      (prisma.newsSource.findUnique as jest.Mock).mockResolvedValue(makeSource());

      const result = await newsService.getSourceById('source-1');

      expect(prisma.newsSource.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'source-1' } })
      );
      expect(result?.id).toBe('source-1');
    });

    it('should return null when source does not exist', async () => {
      (prisma.newsSource.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await newsService.getSourceById('non-existent');

      expect(result).toBeNull();
    });
  });

  // ===== createSource =====
  describe('createSource', () => {
    it('should create a news source without group restrictions', async () => {
      const created = makeSource({ type: 'INTERNAL' as const });
      (prisma.newsSource.create as jest.Mock).mockResolvedValue(created);

      const result = await newsService.createSource({
        name: 'Company News',
        type: 'INTERNAL',
        createdById: 'user-1',
      });

      expect(prisma.newsSource.create).toHaveBeenCalled();
      expect(result.name).toBe('Company News');
    });

    it('should create a source with group visibility restriction', async () => {
      const created = makeSource({ visibleToGroups: [{ id: 'group-1' }] });
      (prisma.newsSource.create as jest.Mock).mockResolvedValue(created);

      await newsService.createSource({
        name: 'Internal Only',
        type: 'INTERNAL',
        visibleToGroupIds: ['group-1'],
        createdById: 'user-1',
      });

      const createCall = (prisma.newsSource.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.visibleToGroups).toBeDefined();
    });
  });

  // ===== updateSource =====
  describe('updateSource', () => {
    it('should update a news source', async () => {
      const updated = makeSource({ name: 'Updated Source' });
      (prisma.newsSource.update as jest.Mock).mockResolvedValue(updated);

      const result = await newsService.updateSource('source-1', { name: 'Updated Source' });

      expect(prisma.newsSource.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'source-1' } })
      );
      expect(result.name).toBe('Updated Source');
    });
  });

  // ===== deleteSource =====
  describe('deleteSource', () => {
    it('should delete a news source', async () => {
      (prisma.newsSource.delete as jest.Mock).mockResolvedValue(makeSource());

      await newsService.deleteSource('source-1');

      expect(prisma.newsSource.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'source-1' } })
      );
    });
  });

  // ===== toggleSourceVisibility =====
  describe('toggleSourceVisibility', () => {
    it('should toggle displayOnDashboard to false', async () => {
      (prisma.newsSource.findUnique as jest.Mock).mockResolvedValue(
        makeSource({ displayOnDashboard: true })
      );
      (prisma.newsSource.update as jest.Mock).mockResolvedValue(
        makeSource({ displayOnDashboard: false })
      );

      const result = await newsService.toggleSourceVisibility('source-1');

      expect(prisma.newsSource.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'source-1' },
          data: { displayOnDashboard: false },
        })
      );
      expect(result.displayOnDashboard).toBe(false);
    });

    it('should throw when source is not found', async () => {
      (prisma.newsSource.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(newsService.toggleSourceVisibility('missing')).rejects.toThrow(
        'Source not found'
      );
    });
  });

  // ===== getDashboardNews =====
  describe('getDashboardNews', () => {
    it('should throw when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(newsService.getDashboardNews('user-1')).rejects.toThrow('User not found');
    });

    it('should map readBy array to isRead true/false', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(
        makeUser({ userGroupMemberships: [{ userGroupId: 'group-1' }] })
      );
      (prisma.newsItem.findMany as jest.Mock).mockResolvedValue([
        makeItem({ id: 'item-1', readBy: [{ id: 'user-1' }] }),
        makeItem({ id: 'item-2', readBy: [] }),
      ]);

      const result = await newsService.getDashboardNews('user-1', 5);

      expect(prisma.newsItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          where: expect.objectContaining({ isActive: true }),
        })
      );
      expect(result[0].isRead).toBe(true);
      expect(result[1].isRead).toBe(false);
      expect(result[0].readBy).toBeUndefined();
    });
  });

  // ===== getItemsBySource =====
  describe('getItemsBySource', () => {
    it('should return active items for a source', async () => {
      const items = [makeItem(), makeItem({ id: 'item-2', title: 'Second News' })];
      (prisma.newsItem.findMany as jest.Mock).mockResolvedValue(items);

      const result = await newsService.getItemsBySource('source-1');

      expect(prisma.newsItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sourceId: 'source-1', isActive: true }),
        })
      );
      expect(result).toHaveLength(2);
    });
  });

  // ===== getItemById =====
  describe('getItemById', () => {
    it('should return a news item by id', async () => {
      (prisma.newsItem.findUnique as jest.Mock).mockResolvedValue(makeItem());

      const result = await newsService.getItemById('item-1');

      expect(result?.id).toBe('item-1');
    });

    it('should return null when item does not exist', async () => {
      (prisma.newsItem.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await newsService.getItemById('none');

      expect(result).toBeNull();
    });
  });

  // ===== createItem =====
  describe('createItem', () => {
    it('should create a news item', async () => {
      const created = makeItem({ title: 'Breaking News' });
      (prisma.newsItem.create as jest.Mock).mockResolvedValue(created);

      const result = await newsService.createItem({
        sourceId: 'source-1',
        title: 'Breaking News',
        content: 'Full content here',
        createdById: 'user-1',
      });

      expect(prisma.newsItem.create).toHaveBeenCalled();
      expect(result.title).toBe('Breaking News');
    });
  });

  // ===== updateItem =====
  describe('updateItem', () => {
    it('should update a news item', async () => {
      const updated = makeItem({ title: 'Updated Title' });
      (prisma.newsItem.update as jest.Mock).mockResolvedValue(updated);

      const result = await newsService.updateItem('item-1', { title: 'Updated Title' });

      expect(prisma.newsItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'item-1' } })
      );
      expect(result.title).toBe('Updated Title');
    });
  });

  // ===== deleteItem =====
  describe('deleteItem', () => {
    it('should delete a news item', async () => {
      (prisma.newsItem.delete as jest.Mock).mockResolvedValue(makeItem());

      await newsService.deleteItem('item-1');

      expect(prisma.newsItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'item-1' } })
      );
    });
  });

  // ===== markAsRead =====
  describe('markAsRead', () => {
    it('should mark item as read by a user', async () => {
      (prisma.newsItem.update as jest.Mock).mockResolvedValue(makeItem());

      await newsService.markAsRead('item-1', 'user-1');

      expect(prisma.newsItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: {
            readBy: { connect: { id: 'user-1' } },
          },
        })
      );
    });
  });

  // ===== togglePin =====
  describe('togglePin', () => {
    it('should pin an unpinned item', async () => {
      (prisma.newsItem.findUnique as jest.Mock).mockResolvedValue(makeItem({ isPinned: false }));
      (prisma.newsItem.update as jest.Mock).mockResolvedValue(makeItem({ isPinned: true }));

      const result = await newsService.togglePin('item-1');

      expect(prisma.newsItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: { isPinned: true },
        })
      );
    });

    it('should unpin a pinned item', async () => {
      (prisma.newsItem.findUnique as jest.Mock).mockResolvedValue(makeItem({ isPinned: true }));
      (prisma.newsItem.update as jest.Mock).mockResolvedValue(makeItem({ isPinned: false }));

      const result = await newsService.togglePin('item-1');

      expect(prisma.newsItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isPinned: false },
        })
      );
    });

    it('should throw when item not found', async () => {
      (prisma.newsItem.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(newsService.togglePin('non-existent')).rejects.toThrow('Item not found');
    });
  });

  // ===== refreshRssFeeds =====
  describe('refreshRssFeeds', () => {
    it('should skip sources without a URL', async () => {
      const sources = [makeSource({ type: 'RSS', url: null })];
      (prisma.newsSource.findMany as jest.Mock).mockResolvedValue(sources);

      const results = await newsService.refreshRssFeeds();

      // Should not attempt to parse or create items
      expect(prisma.newsItem.create).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });

    it('should create new items from RSS feed', async () => {
      getRssParseURL().mockResolvedValue({
        items: [
          {
            title: 'RSS Article',
            content: 'Full article content',
            contentSnippet: 'Snippet',
            link: 'https://example.com/article',
            pubDate: '2024-01-15',
          },
        ],
      });

      const sources = [makeSource({ type: 'RSS', url: 'https://example.com/feed.rss' })];
      (prisma.newsSource.findMany as jest.Mock).mockResolvedValue(sources);
      (prisma.newsItem.findFirst as jest.Mock).mockResolvedValue(null); // Not existing
      (prisma.newsItem.create as jest.Mock).mockResolvedValue(makeItem({ title: 'RSS Article' }));

      const results = await newsService.refreshRssFeeds();

      expect(results[0].success).toBe(true);
    });

    it('should handle RSS parse failures gracefully', async () => {
      getRssParseURL().mockRejectedValue(new Error('Network error'));

      const sources = [makeSource({ type: 'RSS', url: 'https://broken.example.com/feed.rss' })];
      (prisma.newsSource.findMany as jest.Mock).mockResolvedValue(sources);

      const results = await newsService.refreshRssFeeds();

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Network error');
    });

    it('should filter by sourceId when provided', async () => {
      (prisma.newsSource.findMany as jest.Mock).mockResolvedValue([]);

      await newsService.refreshRssFeeds('source-1');

      expect(prisma.newsSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'source-1' }),
        })
      );
    });
  });
});
