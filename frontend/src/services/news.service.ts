import api from './api';

export interface NewsSource {
  id: string;
  name: string;
  type: 'RSS' | 'MANUAL' | 'INTERNAL';
  url?: string;
  refreshInterval: number;
  isActive: boolean;
  displayOnDashboard: boolean;
  priority: number;
  icon?: string;
  color?: string;
  visibleToGroups?: any[];
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    items: number;
  };
}

export interface NewsItem {
  id: string;
  sourceId: string;
  source?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  title: string;
  content: string;
  excerpt?: string;
  externalUrl?: string;
  imageUrl?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isPinned: boolean;
  isActive: boolean;
  isRead?: boolean;
  publishedAt: string;
  expiresAt?: string;
  author?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface NewsSourceInput {
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
}

export interface NewsItemInput {
  sourceId: string;
  title: string;
  content: string;
  excerpt?: string;
  externalUrl?: string;
  imageUrl?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isPinned?: boolean;
  isActive?: boolean;
  publishedAt?: string;
  expiresAt?: string;
  author?: string;
  tags?: string[];
}

class NewsService {
  // ===== NEWS SOURCES =====

  async getAllSources(): Promise<NewsSource[]> {
    const response = await api.get('/news/sources');
    return response.data;
  }

  async getSourceById(id: string): Promise<NewsSource> {
    const response = await api.get(`/news/sources/${id}`);
    return response.data;
  }

  async createSource(data: NewsSourceInput): Promise<NewsSource> {
    const response = await api.post('/news/sources', data);
    return response.data;
  }

  async updateSource(id: string, data: Partial<NewsSourceInput>): Promise<NewsSource> {
    const response = await api.put(`/news/sources/${id}`, data);
    return response.data;
  }

  async deleteSource(id: string): Promise<void> {
    await api.delete(`/news/sources/${id}`);
  }

  async toggleSourceVisibility(id: string): Promise<NewsSource> {
    const response = await api.patch(`/news/sources/${id}/toggle-visibility`);
    return response.data;
  }

  // ===== NEWS ITEMS =====

  async getDashboardNews(limit?: number): Promise<NewsItem[]> {
    const response = await api.get('/news/dashboard', {
      params: { limit },
    });
    return response.data;
  }

  async getItemsBySource(sourceId: string): Promise<NewsItem[]> {
    const response = await api.get(`/news/sources/${sourceId}/items`);
    return response.data;
  }

  async getItemById(id: string): Promise<NewsItem> {
    const response = await api.get(`/news/items/${id}`);
    return response.data;
  }

  async createItem(data: NewsItemInput): Promise<NewsItem> {
    const response = await api.post('/news/items', data);
    return response.data;
  }

  async updateItem(id: string, data: Partial<NewsItemInput>): Promise<NewsItem> {
    const response = await api.put(`/news/items/${id}`, data);
    return response.data;
  }

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/news/items/${id}`);
  }

  async markAsRead(id: string): Promise<void> {
    await api.post(`/news/${id}/read`);
  }

  async togglePin(id: string): Promise<NewsItem> {
    const response = await api.patch(`/news/items/${id}/toggle-pin`);
    return response.data;
  }

  // ===== RSS FEED REFRESH =====

  async refreshRssFeeds(sourceId?: string): Promise<any> {
    const response = await api.post('/news/refresh-feeds', null, {
      params: sourceId ? { sourceId } : undefined,
    });
    return response.data;
  }
}

export default new NewsService();
