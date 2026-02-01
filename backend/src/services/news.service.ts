import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';

const prisma = new PrismaClient();
const rssParser = new Parser();

interface NewsSourceInput {
  name: string;
  type: 'RSS' | 'MANUAL' | 'INTERNAL';
  url?: string;
  refreshInterval?: number;
  isActive?: boolean;
  displayOnDashboard?: boolean;
  priority?: number;
  icon?: string;
  color?: string;
  visibleToGroupIds?: string[];
  createdById: string;
}

interface NewsItemInput {
  sourceId: string;
  title: string;
  content: string;
  excerpt?: string;
  externalUrl?: string;
  imageUrl?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isPinned?: boolean;
  isActive?: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  author?: string;
  tags?: string[];
  createdById: string;
}

class NewsService {
  // ===== NEWS SOURCES =====

  async getAllSources(userId: string) {
    // Get user's groups
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userGroupMemberships: {
          include: {
            userGroup: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userGroupIds = user.userGroupMemberships.map((m) => m.userGroupId);

    // Get sources visible to user's groups or without restrictions
    const sources = await prisma.newsSource.findMany({
      where: {
        isActive: true,
        OR: [
          {
            visibleToGroups: {
              none: {}, // No restrictions
            },
          },
          {
            visibleToGroups: {
              some: {
                id: {
                  in: userGroupIds,
                },
              },
            },
          },
        ],
      },
      include: {
        visibleToGroups: true,
        _count: {
          select: {
            items: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' },
      ],
    });

    return sources;
  }

  async getSourceById(id: string) {
    return await prisma.newsSource.findUnique({
      where: { id },
      include: {
        visibleToGroups: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async createSource(data: NewsSourceInput) {
    const { visibleToGroupIds, ...sourceData } = data;

    return await prisma.newsSource.create({
      data: {
        ...sourceData,
        visibleToGroups: visibleToGroupIds?.length
          ? {
              connect: visibleToGroupIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        visibleToGroups: true,
      },
    });
  }

  async updateSource(id: string, data: Partial<NewsSourceInput>) {
    const { visibleToGroupIds, ...sourceData } = data;

    return await prisma.newsSource.update({
      where: { id },
      data: {
        ...sourceData,
        visibleToGroups: visibleToGroupIds
          ? {
              set: visibleToGroupIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        visibleToGroups: true,
      },
    });
  }

  async deleteSource(id: string) {
    // This will cascade delete all related items
    return await prisma.newsSource.delete({
      where: { id },
    });
  }

  async toggleSourceVisibility(id: string) {
    const source = await prisma.newsSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new Error('Source not found');
    }

    return await prisma.newsSource.update({
      where: { id },
      data: {
        displayOnDashboard: !source.displayOnDashboard,
      },
    });
  }

  // ===== NEWS ITEMS =====

  async getDashboardNews(userId: string, limit: number = 10) {
    // Get user's groups
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userGroupMemberships: {
          include: {
            userGroup: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userGroupIds = user.userGroupMemberships.map((m) => m.userGroupId);

    // Get news from sources visible to user
    const items = await prisma.newsItem.findMany({
      where: {
        isActive: true,
        publishedAt: {
          lte: new Date(),
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
        source: {
          isActive: true,
          displayOnDashboard: true,
          OR: [
            {
              visibleToGroups: {
                none: {},
              },
            },
            {
              visibleToGroups: {
                some: {
                  id: {
                    in: userGroupIds,
                  },
                },
              },
            },
          ],
        },
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        readBy: {
          where: {
            id: userId,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
    });

    return items.map((item) => ({
      ...item,
      isRead: item.readBy.length > 0,
      readBy: undefined,
    }));
  }

  async getItemsBySource(sourceId: string) {
    return await prisma.newsItem.findMany({
      where: {
        sourceId,
        isActive: true,
      },
      include: {
        source: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
    });
  }

  async getItemById(id: string) {
    return await prisma.newsItem.findUnique({
      where: { id },
      include: {
        source: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async createItem(data: NewsItemInput) {
    return await prisma.newsItem.create({
      data,
      include: {
        source: true,
      },
    });
  }

  async updateItem(id: string, data: Partial<NewsItemInput>) {
    return await prisma.newsItem.update({
      where: { id },
      data,
      include: {
        source: true,
      },
    });
  }

  async deleteItem(id: string) {
    return await prisma.newsItem.delete({
      where: { id },
    });
  }

  async markAsRead(itemId: string, userId: string) {
    return await prisma.newsItem.update({
      where: { id: itemId },
      data: {
        readBy: {
          connect: { id: userId },
        },
      },
    });
  }

  async togglePin(id: string) {
    const item = await prisma.newsItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    return await prisma.newsItem.update({
      where: { id },
      data: {
        isPinned: !item.isPinned,
      },
    });
  }

  // ===== RSS FEED REFRESH =====

  async refreshRssFeeds(sourceId?: string) {
    const sources = await prisma.newsSource.findMany({
      where: {
        type: 'RSS',
        isActive: true,
        ...(sourceId && { id: sourceId }),
      },
    });

    const results = [];

    for (const source of sources) {
      if (!source.url) continue;

      try {
        const feed = await rssParser.parseURL(source.url);
        let newItemsCount = 0;

        for (const item of feed.items) {
          if (!item.title || !item.contentSnippet) continue;

          // Check if item already exists
          const existingItem = await prisma.newsItem.findFirst({
            where: {
              sourceId: source.id,
              externalUrl: item.link,
            },
          });

          if (!existingItem) {
            await prisma.newsItem.create({
              data: {
                sourceId: source.id,
                title: item.title,
                content: item.content || item.contentSnippet,
                excerpt: item.contentSnippet?.substring(0, 200),
                externalUrl: item.link,
                imageUrl: item.enclosure?.url,
                author: item.creator || item.author,
                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                tags: item.categories || [],
              },
            });
            newItemsCount++;
          }
        }

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          success: true,
          newItemsCount,
        });
      } catch (error: any) {
        results.push({
          sourceId: source.id,
          sourceName: source.name,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

export default new NewsService();
