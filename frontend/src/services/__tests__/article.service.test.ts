import * as articleService from '../articleService';
import api from '../api';
import { Article } from '../../types';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Article Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createArticle', () => {
    it('should create article with all fields', async () => {
      const newArticleData: Partial<Article> = {
        articleNumber: 'ART-001',
        name: 'Standard Service',
        description: 'Standard consulting service',
        articleGroupId: 'group-123',
        price: 150.00,
        unit: 'hour',
        vatRate: 8.1,
        notes: 'Hourly rate for consulting',
        isActive: true,
      };

      const mockCreatedArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Standard Service',
        description: 'Standard consulting service',
        articleGroupId: 'group-123',
        price: 150.00,
        unit: 'hour',
        vatRate: 8.1,
        notes: 'Hourly rate for consulting',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockCreatedArticle,
      });

      const result = await articleService.createArticle(newArticleData);

      expect(mockedApi.post).toHaveBeenCalledWith('/articles', newArticleData);
      expect(result).toEqual(mockCreatedArticle);
      expect(result.id).toBe('article-123');
      expect(result.articleNumber).toBe('ART-001');
      expect(result.name).toBe('Standard Service');
      expect(result.price).toBe(150.00);
      expect(result.vatRate).toBe(8.1);
    });

    it('should create article with minimal required fields', async () => {
      const minimalData: Partial<Article> = {
        articleNumber: 'ART-002',
        name: 'Basic Service',
        price: 100.00,
        unit: 'piece',
        vatRate: 8.1,
      };

      const mockArticle: Article = {
        id: 'article-456',
        articleNumber: 'ART-002',
        name: 'Basic Service',
        price: 100.00,
        unit: 'piece',
        vatRate: 8.1,
        isActive: true,
        createdAt: '2026-01-01T10:30:00Z',
        updatedAt: '2026-01-01T10:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockArticle });

      const result = await articleService.createArticle(minimalData);

      expect(result.articleNumber).toBe('ART-002');
      expect(result.name).toBe('Basic Service');
      expect(result.price).toBe(100.00);
      expect(result.isActive).toBe(true);
    });

    it('should create inactive article', async () => {
      const inactiveArticle: Partial<Article> = {
        articleNumber: 'ART-003',
        name: 'Deprecated Service',
        price: 50.00,
        unit: 'hour',
        vatRate: 8.1,
        isActive: false,
      };

      const mockArticle: Article = {
        id: 'article-789',
        ...inactiveArticle as Article,
        createdAt: '2026-01-01T11:00:00Z',
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockArticle });

      const result = await articleService.createArticle(inactiveArticle);

      expect(result.isActive).toBe(false);
      expect(result.name).toBe('Deprecated Service');
    });

    it('should handle creation error', async () => {
      const articleData: Partial<Article> = {
        articleNumber: 'ART-999',
        name: 'Test Article',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
      };

      mockedApi.post.mockRejectedValue(new Error('Article number already exists'));

      await expect(articleService.createArticle(articleData))
        .rejects.toThrow('Article number already exists');
    });

    it('should create article with Swiss VAT rates', async () => {
      const articleWithVAT: Partial<Article> = {
        articleNumber: 'ART-004',
        name: 'Service with reduced VAT',
        price: 200.00,
        unit: 'hour',
        vatRate: 2.6, // Reduced Swiss VAT rate
      };

      const mockArticle: Article = {
        id: 'article-vat',
        ...articleWithVAT as Article,
        isActive: true,
        createdAt: '2026-01-01T11:30:00Z',
        updatedAt: '2026-01-01T11:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockArticle });

      const result = await articleService.createArticle(articleWithVAT);

      expect(result.vatRate).toBe(2.6);
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllArticles', () => {
    it('should get all articles without filters', async () => {
      const mockArticles: Article[] = [
        {
          id: 'article-1',
          articleNumber: 'ART-001',
          name: 'Service A',
          price: 100.00,
          unit: 'hour',
          vatRate: 8.1,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'article-2',
          articleNumber: 'ART-002',
          name: 'Service B',
          price: 150.00,
          unit: 'hour',
          vatRate: 8.1,
          isActive: true,
          createdAt: '2026-01-01T10:30:00Z',
          updatedAt: '2026-01-01T10:30:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockArticles });

      const result = await articleService.getAllArticles();

      expect(mockedApi.get).toHaveBeenCalledWith('/articles?');
      expect(result).toEqual(mockArticles);
      expect(result).toHaveLength(2);
    });

    it('should get articles with search filter', async () => {
      const mockArticles: Article[] = [
        {
          id: 'article-1',
          articleNumber: 'ART-001',
          name: 'Consulting Service',
          price: 150.00,
          unit: 'hour',
          vatRate: 8.1,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockArticles });

      const result = await articleService.getAllArticles('Consulting');

      expect(mockedApi.get).toHaveBeenCalledWith('/articles?search=Consulting');
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Consulting');
    });

    it('should get only active articles', async () => {
      const mockArticles: Article[] = [
        {
          id: 'article-1',
          articleNumber: 'ART-001',
          name: 'Active Service',
          price: 100.00,
          unit: 'hour',
          vatRate: 8.1,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockArticles });

      const result = await articleService.getAllArticles(undefined, true);

      expect(mockedApi.get).toHaveBeenCalledWith('/articles?isActive=true');
      expect(result.every(article => article.isActive)).toBe(true);
    });

    it('should get articles by article group', async () => {
      const mockArticles: Article[] = [
        {
          id: 'article-1',
          articleNumber: 'ART-001',
          name: 'Service in Group',
          articleGroupId: 'group-123',
          price: 100.00,
          unit: 'hour',
          vatRate: 8.1,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockArticles });

      const result = await articleService.getAllArticles(undefined, undefined, 'group-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/articles?articleGroupId=group-123');
      expect(result[0].articleGroupId).toBe('group-123');
    });

    it('should get articles with combined filters', async () => {
      const mockArticles: Article[] = [
        {
          id: 'article-1',
          articleNumber: 'ART-001',
          name: 'Active Consulting in Group',
          articleGroupId: 'group-123',
          price: 150.00,
          unit: 'hour',
          vatRate: 8.1,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockArticles });

      const result = await articleService.getAllArticles('Consulting', true, 'group-123');

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/articles?search=Consulting&isActive=true&articleGroupId=group-123'
      );
      expect(result[0].isActive).toBe(true);
      expect(result[0].articleGroupId).toBe('group-123');
    });

    it('should return empty array when no articles found', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await articleService.getAllArticles('nonexistent');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('READ - getArticleById', () => {
    it('should get article by id', async () => {
      const mockArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Test Service',
        description: 'Test description',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockArticle });

      const result = await articleService.getArticleById('article-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/articles/article-123');
      expect(result).toEqual(mockArticle);
      expect(result.id).toBe('article-123');
    });

    it('should get article with article group relation', async () => {
      const mockArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Service with Group',
        articleGroupId: 'group-123',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        articleGroup: {
          id: 'group-123',
          name: 'Consulting Services',
          isActive: true,
          createdAt: '2026-01-01T09:00:00Z',
          updatedAt: '2026-01-01T09:00:00Z',
        },
      };

      mockedApi.get.mockResolvedValue({ data: mockArticle });

      const result = await articleService.getArticleById('article-123');

      expect(result.articleGroup).toBeDefined();
      expect(result.articleGroup?.name).toBe('Consulting Services');
    });

    it('should handle not found error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Article not found'));

      await expect(articleService.getArticleById('nonexistent-id'))
        .rejects.toThrow('Article not found');
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateArticle', () => {
    it('should update article name and description', async () => {
      const updates: Partial<Article> = {
        name: 'Updated Service Name',
        description: 'Updated description',
      };

      const mockUpdatedArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Updated Service Name',
        description: 'Updated description',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedArticle });

      const result = await articleService.updateArticle('article-123', updates);

      expect(mockedApi.put).toHaveBeenCalledWith('/articles/article-123', updates);
      expect(result.name).toBe('Updated Service Name');
      expect(result.description).toBe('Updated description');
      expect(result.updatedAt).not.toBe(result.createdAt);
    });

    it('should update article price and VAT rate', async () => {
      const updates: Partial<Article> = {
        price: 200.00,
        vatRate: 7.7,
      };

      const mockUpdatedArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Test Service',
        price: 200.00,
        unit: 'hour',
        vatRate: 7.7,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedArticle });

      const result = await articleService.updateArticle('article-123', updates);

      expect(result.price).toBe(200.00);
      expect(result.vatRate).toBe(7.7);
    });

    it('should deactivate article', async () => {
      const updates: Partial<Article> = {
        isActive: false,
      };

      const mockUpdatedArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Test Service',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedArticle });

      const result = await articleService.updateArticle('article-123', updates);

      expect(result.isActive).toBe(false);
    });

    it('should reactivate article', async () => {
      const updates: Partial<Article> = {
        isActive: true,
      };

      const mockUpdatedArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Test Service',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedArticle });

      const result = await articleService.updateArticle('article-123', updates);

      expect(result.isActive).toBe(true);
    });

    it('should update article group assignment', async () => {
      const updates: Partial<Article> = {
        articleGroupId: 'new-group-456',
      };

      const mockUpdatedArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Test Service',
        articleGroupId: 'new-group-456',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedArticle });

      const result = await articleService.updateArticle('article-123', updates);

      expect(result.articleGroupId).toBe('new-group-456');
    });

    it('should update unit of measurement', async () => {
      const updates: Partial<Article> = {
        unit: 'day',
        price: 800.00,
      };

      const mockUpdatedArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-001',
        name: 'Test Service',
        price: 800.00,
        unit: 'day',
        vatRate: 8.1,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedArticle });

      const result = await articleService.updateArticle('article-123', updates);

      expect(result.unit).toBe('day');
      expect(result.price).toBe(800.00);
    });

    it('should update all fields at once', async () => {
      const updates: Partial<Article> = {
        articleNumber: 'ART-999',
        name: 'Completely Updated Service',
        description: 'New description',
        articleGroupId: 'group-999',
        price: 500.00,
        unit: 'project',
        vatRate: 2.6,
        notes: 'Special pricing',
        isActive: false,
      };

      const mockUpdatedArticle: Article = {
        id: 'article-123',
        articleNumber: 'ART-999',
        name: 'Completely Updated Service',
        description: 'New description',
        articleGroupId: 'group-999',
        price: 500.00,
        unit: 'project',
        vatRate: 2.6,
        notes: 'Special pricing',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedArticle });

      const result = await articleService.updateArticle('article-123', updates);

      expect(result).toMatchObject(updates);
    });

    it('should handle update error', async () => {
      const updates: Partial<Article> = {
        articleNumber: 'EXISTING-001',
      };

      mockedApi.put.mockRejectedValue(new Error('Article number already in use'));

      await expect(articleService.updateArticle('article-123', updates))
        .rejects.toThrow('Article number already in use');
    });

    it('should handle not found error on update', async () => {
      const updates: Partial<Article> = {
        name: 'Updated Name',
      };

      mockedApi.put.mockRejectedValue(new Error('Article not found'));

      await expect(articleService.updateArticle('nonexistent-id', updates))
        .rejects.toThrow('Article not found');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteArticle', () => {
    it('should delete article successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await articleService.deleteArticle('article-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/articles/article-123');
    });

    it('should delete multiple articles', async () => {
      const articleIds = ['article-1', 'article-2', 'article-3'];

      mockedApi.delete.mockResolvedValue({});

      for (const id of articleIds) {
        await articleService.deleteArticle(id);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenCalledWith('/articles/article-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/articles/article-2');
      expect(mockedApi.delete).toHaveBeenCalledWith('/articles/article-3');
    });

    it('should handle delete error when article not found', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Article not found'));

      await expect(articleService.deleteArticle('nonexistent-id'))
        .rejects.toThrow('Article not found');
    });

    it('should handle delete error when article is in use', async () => {
      mockedApi.delete.mockRejectedValue(
        new Error('Cannot delete article: it is referenced in invoices')
      );

      await expect(articleService.deleteArticle('article-123'))
        .rejects.toThrow('Cannot delete article: it is referenced in invoices');
    });

    it('should handle network error on delete', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Network error'));

      await expect(articleService.deleteArticle('article-123'))
        .rejects.toThrow('Network error');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Article Lifecycle', () => {
    it('should complete full CRUD lifecycle', async () => {
      // CREATE
      const newArticle: Partial<Article> = {
        articleNumber: 'ART-LIFECYCLE',
        name: 'Lifecycle Test Article',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
        isActive: true,
      };

      const createdArticle: Article = {
        id: 'article-lifecycle',
        ...newArticle as Article,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdArticle });
      const created = await articleService.createArticle(newArticle);
      expect(created.id).toBe('article-lifecycle');

      // READ
      mockedApi.get.mockResolvedValue({ data: createdArticle });
      const fetched = await articleService.getArticleById('article-lifecycle');
      expect(fetched.name).toBe('Lifecycle Test Article');

      // UPDATE
      const updates: Partial<Article> = {
        name: 'Updated Lifecycle Article',
        price: 150.00,
      };

      const updatedArticle: Article = {
        ...createdArticle,
        ...updates,
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: updatedArticle });
      const updated = await articleService.updateArticle('article-lifecycle', updates);
      expect(updated.name).toBe('Updated Lifecycle Article');
      expect(updated.price).toBe(150.00);

      // DELETE
      mockedApi.delete.mockResolvedValue({});
      await articleService.deleteArticle('article-lifecycle');
      expect(mockedApi.delete).toHaveBeenCalledWith('/articles/article-lifecycle');
    });

    it('should handle article with article group throughout lifecycle', async () => {
      // Create article with group
      const newArticle: Partial<Article> = {
        articleNumber: 'ART-GROUP',
        name: 'Article in Group',
        articleGroupId: 'group-123',
        price: 200.00,
        unit: 'hour',
        vatRate: 8.1,
      };

      const createdArticle: Article = {
        id: 'article-group',
        ...newArticle as Article,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        articleGroup: {
          id: 'group-123',
          name: 'Test Group',
          isActive: true,
          createdAt: '2026-01-01T09:00:00Z',
          updatedAt: '2026-01-01T09:00:00Z',
        },
      };

      mockedApi.post.mockResolvedValue({ data: createdArticle });
      const created = await articleService.createArticle(newArticle);
      expect(created.articleGroup).toBeDefined();

      // Update to different group
      const updates: Partial<Article> = {
        articleGroupId: 'group-456',
      };

      const updatedArticle: Article = {
        ...createdArticle,
        articleGroupId: 'group-456',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: updatedArticle });
      const updated = await articleService.updateArticle('article-group', updates);
      expect(updated.articleGroupId).toBe('group-456');
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle article with zero price', async () => {
      const freeArticle: Partial<Article> = {
        articleNumber: 'ART-FREE',
        name: 'Free Service',
        price: 0.00,
        unit: 'piece',
        vatRate: 8.1,
      };

      const mockArticle: Article = {
        id: 'article-free',
        ...freeArticle as Article,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockArticle });

      const result = await articleService.createArticle(freeArticle);

      expect(result.price).toBe(0.00);
    });

    it('should handle article with very high price', async () => {
      const expensiveArticle: Partial<Article> = {
        articleNumber: 'ART-EXPENSIVE',
        name: 'Premium Service',
        price: 99999.99,
        unit: 'project',
        vatRate: 8.1,
      };

      const mockArticle: Article = {
        id: 'article-expensive',
        ...expensiveArticle as Article,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockArticle });

      const result = await articleService.createArticle(expensiveArticle);

      expect(result.price).toBe(99999.99);
    });

    it('should handle article with special characters in name', async () => {
      const specialArticle: Partial<Article> = {
        articleNumber: 'ART-SPECIAL',
        name: 'Service & Support (50% Rabatt)',
        description: 'Über 10 Jahre Erfahrung - Täglich 24/7',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
      };

      const mockArticle: Article = {
        id: 'article-special',
        ...specialArticle as Article,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockArticle });

      const result = await articleService.createArticle(specialArticle);

      expect(result.name).toBe('Service & Support (50% Rabatt)');
      expect(result.description).toBe('Über 10 Jahre Erfahrung - Täglich 24/7');
    });

    it('should handle article with long notes', async () => {
      const longNotes = 'A'.repeat(1000);
      const articleWithNotes: Partial<Article> = {
        articleNumber: 'ART-NOTES',
        name: 'Service with Notes',
        price: 100.00,
        unit: 'hour',
        vatRate: 8.1,
        notes: longNotes,
      };

      const mockArticle: Article = {
        id: 'article-notes',
        ...articleWithNotes as Article,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockArticle });

      const result = await articleService.createArticle(articleWithNotes);

      expect(result.notes?.length).toBe(1000);
    });
  });
});
