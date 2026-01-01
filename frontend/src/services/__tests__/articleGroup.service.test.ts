import * as articleGroupService from '../articleGroupService';
import api from '../api';
import { ArticleGroup } from '../../types';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('ArticleGroup Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createArticleGroup', () => {
    it('should create article group with all fields', async () => {
      const newGroupData: Partial<ArticleGroup> = {
        name: 'Consulting Services',
        description: 'All consulting related services',
        isActive: true,
      };

      const mockCreatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Consulting Services',
        description: 'All consulting related services',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockCreatedGroup,
      });

      const result = await articleGroupService.createArticleGroup(newGroupData);

      expect(mockedApi.post).toHaveBeenCalledWith('/article-groups', newGroupData);
      expect(result).toEqual(mockCreatedGroup);
      expect(result.id).toBe('group-123');
      expect(result.name).toBe('Consulting Services');
      expect(result.isActive).toBe(true);
    });

    it('should create article group with minimal required fields', async () => {
      const minimalData: Partial<ArticleGroup> = {
        name: 'Hardware Products',
      };

      const mockGroup: ArticleGroup = {
        id: 'group-456',
        name: 'Hardware Products',
        isActive: true,
        createdAt: '2026-01-01T10:30:00Z',
        updatedAt: '2026-01-01T10:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.createArticleGroup(minimalData);

      expect(result.name).toBe('Hardware Products');
      expect(result.isActive).toBe(true);
    });

    it('should create inactive article group', async () => {
      const inactiveGroup: Partial<ArticleGroup> = {
        name: 'Deprecated Services',
        description: 'Old services no longer offered',
        isActive: false,
      };

      const mockGroup: ArticleGroup = {
        id: 'group-789',
        name: 'Deprecated Services',
        description: 'Old services no longer offered',
        isActive: false,
        createdAt: '2026-01-01T11:00:00Z',
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.createArticleGroup(inactiveGroup);

      expect(result.isActive).toBe(false);
      expect(result.name).toBe('Deprecated Services');
    });

    it('should create article group without description', async () => {
      const groupData: Partial<ArticleGroup> = {
        name: 'Support Services',
        isActive: true,
      };

      const mockGroup: ArticleGroup = {
        id: 'group-no-desc',
        name: 'Support Services',
        isActive: true,
        createdAt: '2026-01-01T11:30:00Z',
        updatedAt: '2026-01-01T11:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.createArticleGroup(groupData);

      expect(result.description).toBeUndefined();
      expect(result.name).toBe('Support Services');
    });

    it('should handle creation error', async () => {
      const groupData: Partial<ArticleGroup> = {
        name: 'Duplicate Group',
      };

      mockedApi.post.mockRejectedValue(new Error('Article group name already exists'));

      await expect(articleGroupService.createArticleGroup(groupData))
        .rejects.toThrow('Article group name already exists');
    });

    it('should create article group with special characters', async () => {
      const groupData: Partial<ArticleGroup> = {
        name: 'IT & Software-Entwicklung',
        description: 'Über 20 Jahre Erfahrung im IT-Bereich',
        isActive: true,
      };

      const mockGroup: ArticleGroup = {
        id: 'group-special',
        name: 'IT & Software-Entwicklung',
        description: 'Über 20 Jahre Erfahrung im IT-Bereich',
        isActive: true,
        createdAt: '2026-01-01T12:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.createArticleGroup(groupData);

      expect(result.name).toBe('IT & Software-Entwicklung');
      expect(result.description).toBe('Über 20 Jahre Erfahrung im IT-Bereich');
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllArticleGroups', () => {
    it('should get all article groups without filters', async () => {
      const mockGroups: ArticleGroup[] = [
        {
          id: 'group-1',
          name: 'Consulting',
          description: 'Consulting services',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'group-2',
          name: 'Hardware',
          description: 'Hardware products',
          isActive: true,
          createdAt: '2026-01-01T10:30:00Z',
          updatedAt: '2026-01-01T10:30:00Z',
        },
        {
          id: 'group-3',
          name: 'Software',
          isActive: false,
          createdAt: '2026-01-01T11:00:00Z',
          updatedAt: '2026-01-01T11:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockGroups });

      const result = await articleGroupService.getAllArticleGroups();

      expect(mockedApi.get).toHaveBeenCalledWith('/article-groups?');
      expect(result).toEqual(mockGroups);
      expect(result).toHaveLength(3);
    });

    it('should get only active article groups', async () => {
      const mockGroups: ArticleGroup[] = [
        {
          id: 'group-1',
          name: 'Active Group 1',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'group-2',
          name: 'Active Group 2',
          isActive: true,
          createdAt: '2026-01-01T10:30:00Z',
          updatedAt: '2026-01-01T10:30:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockGroups });

      const result = await articleGroupService.getAllArticleGroups(true);

      expect(mockedApi.get).toHaveBeenCalledWith('/article-groups?isActive=true');
      expect(result.every(group => group.isActive)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should get only inactive article groups', async () => {
      const mockGroups: ArticleGroup[] = [
        {
          id: 'group-1',
          name: 'Inactive Group',
          isActive: false,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockGroups });

      const result = await articleGroupService.getAllArticleGroups(false);

      expect(mockedApi.get).toHaveBeenCalledWith('/article-groups?isActive=false');
      expect(result.every(group => !group.isActive)).toBe(true);
    });

    it('should return empty array when no groups found', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await articleGroupService.getAllArticleGroups();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should get article groups with articles relation', async () => {
      const mockGroups: ArticleGroup[] = [
        {
          id: 'group-1',
          name: 'Consulting',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
          articles: [
            {
              id: 'article-1',
              articleNumber: 'ART-001',
              name: 'Standard Consulting',
              price: 150.00,
              unit: 'hour',
              vatRate: 8.1,
              isActive: true,
              createdAt: '2026-01-01T10:05:00Z',
              updatedAt: '2026-01-01T10:05:00Z',
            },
          ],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockGroups });

      const result = await articleGroupService.getAllArticleGroups();

      expect(result[0].articles).toBeDefined();
      expect(result[0].articles).toHaveLength(1);
      expect(result[0].articles?.[0].name).toBe('Standard Consulting');
    });

    it('should handle network error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(articleGroupService.getAllArticleGroups())
        .rejects.toThrow('Network error');
    });
  });

  describe('READ - getArticleGroupById', () => {
    it('should get article group by id', async () => {
      const mockGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Test Group',
        description: 'Test description',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.getArticleGroupById('group-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/article-groups/group-123');
      expect(result).toEqual(mockGroup);
      expect(result.id).toBe('group-123');
    });

    it('should get article group with related articles', async () => {
      const mockGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Consulting',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        articles: [
          {
            id: 'article-1',
            articleNumber: 'ART-001',
            name: 'Consulting Service',
            price: 150.00,
            unit: 'hour',
            vatRate: 8.1,
            isActive: true,
            createdAt: '2026-01-01T10:05:00Z',
            updatedAt: '2026-01-01T10:05:00Z',
          },
          {
            id: 'article-2',
            articleNumber: 'ART-002',
            name: 'Advanced Consulting',
            price: 200.00,
            unit: 'hour',
            vatRate: 8.1,
            isActive: true,
            createdAt: '2026-01-01T10:10:00Z',
            updatedAt: '2026-01-01T10:10:00Z',
          },
        ],
      };

      mockedApi.get.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.getArticleGroupById('group-123');

      expect(result.articles).toBeDefined();
      expect(result.articles).toHaveLength(2);
      expect(result.articles?.[0].name).toBe('Consulting Service');
      expect(result.articles?.[1].name).toBe('Advanced Consulting');
    });

    it('should get inactive article group', async () => {
      const mockGroup: ArticleGroup = {
        id: 'group-inactive',
        name: 'Old Group',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.getArticleGroupById('group-inactive');

      expect(result.isActive).toBe(false);
    });

    it('should handle not found error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Article group not found'));

      await expect(articleGroupService.getArticleGroupById('nonexistent-id'))
        .rejects.toThrow('Article group not found');
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateArticleGroup', () => {
    it('should update article group name', async () => {
      const updates: Partial<ArticleGroup> = {
        name: 'Updated Group Name',
      };

      const mockUpdatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Updated Group Name',
        description: 'Original description',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await articleGroupService.updateArticleGroup('group-123', updates);

      expect(mockedApi.put).toHaveBeenCalledWith('/article-groups/group-123', updates);
      expect(result.name).toBe('Updated Group Name');
      expect(result.updatedAt).not.toBe(result.createdAt);
    });

    it('should update article group description', async () => {
      const updates: Partial<ArticleGroup> = {
        description: 'New description text',
      };

      const mockUpdatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Test Group',
        description: 'New description text',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await articleGroupService.updateArticleGroup('group-123', updates);

      expect(result.description).toBe('New description text');
    });

    it('should update name and description together', async () => {
      const updates: Partial<ArticleGroup> = {
        name: 'New Name',
        description: 'New Description',
      };

      const mockUpdatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'New Name',
        description: 'New Description',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await articleGroupService.updateArticleGroup('group-123', updates);

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New Description');
    });

    it('should deactivate article group', async () => {
      const updates: Partial<ArticleGroup> = {
        isActive: false,
      };

      const mockUpdatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Test Group',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await articleGroupService.updateArticleGroup('group-123', updates);

      expect(result.isActive).toBe(false);
    });

    it('should reactivate article group', async () => {
      const updates: Partial<ArticleGroup> = {
        isActive: true,
      };

      const mockUpdatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Test Group',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await articleGroupService.updateArticleGroup('group-123', updates);

      expect(result.isActive).toBe(true);
    });

    it('should clear description by setting it to undefined', async () => {
      const updates: Partial<ArticleGroup> = {
        description: undefined,
      };

      const mockUpdatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Test Group',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await articleGroupService.updateArticleGroup('group-123', updates);

      expect(result.description).toBeUndefined();
    });

    it('should update all fields at once', async () => {
      const updates: Partial<ArticleGroup> = {
        name: 'Completely New Group',
        description: 'Completely new description',
        isActive: false,
      };

      const mockUpdatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Completely New Group',
        description: 'Completely new description',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await articleGroupService.updateArticleGroup('group-123', updates);

      expect(result.name).toBe('Completely New Group');
      expect(result.description).toBe('Completely new description');
      expect(result.isActive).toBe(false);
    });

    it('should handle update error', async () => {
      const updates: Partial<ArticleGroup> = {
        name: 'Duplicate Name',
      };

      mockedApi.put.mockRejectedValue(new Error('Article group name already exists'));

      await expect(articleGroupService.updateArticleGroup('group-123', updates))
        .rejects.toThrow('Article group name already exists');
    });

    it('should handle not found error on update', async () => {
      const updates: Partial<ArticleGroup> = {
        name: 'Updated Name',
      };

      mockedApi.put.mockRejectedValue(new Error('Article group not found'));

      await expect(articleGroupService.updateArticleGroup('nonexistent-id', updates))
        .rejects.toThrow('Article group not found');
    });

    it('should update group with special characters', async () => {
      const updates: Partial<ArticleGroup> = {
        name: 'Beratung & Schulung',
        description: 'Über 15 Jahre Erfahrung',
      };

      const mockUpdatedGroup: ArticleGroup = {
        id: 'group-123',
        name: 'Beratung & Schulung',
        description: 'Über 15 Jahre Erfahrung',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await articleGroupService.updateArticleGroup('group-123', updates);

      expect(result.name).toBe('Beratung & Schulung');
      expect(result.description).toBe('Über 15 Jahre Erfahrung');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteArticleGroup', () => {
    it('should delete article group successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await articleGroupService.deleteArticleGroup('group-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/article-groups/group-123');
    });

    it('should delete multiple article groups', async () => {
      const groupIds = ['group-1', 'group-2', 'group-3'];

      mockedApi.delete.mockResolvedValue({});

      for (const id of groupIds) {
        await articleGroupService.deleteArticleGroup(id);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenCalledWith('/article-groups/group-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/article-groups/group-2');
      expect(mockedApi.delete).toHaveBeenCalledWith('/article-groups/group-3');
    });

    it('should handle delete error when group not found', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Article group not found'));

      await expect(articleGroupService.deleteArticleGroup('nonexistent-id'))
        .rejects.toThrow('Article group not found');
    });

    it('should handle delete error when group has articles', async () => {
      mockedApi.delete.mockRejectedValue(
        new Error('Cannot delete article group: it contains articles')
      );

      await expect(articleGroupService.deleteArticleGroup('group-123'))
        .rejects.toThrow('Cannot delete article group: it contains articles');
    });

    it('should handle network error on delete', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Network error'));

      await expect(articleGroupService.deleteArticleGroup('group-123'))
        .rejects.toThrow('Network error');
    });

    it('should delete inactive article group', async () => {
      mockedApi.delete.mockResolvedValue({});

      await articleGroupService.deleteArticleGroup('inactive-group');

      expect(mockedApi.delete).toHaveBeenCalledWith('/article-groups/inactive-group');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - ArticleGroup Lifecycle', () => {
    it('should complete full CRUD lifecycle', async () => {
      // CREATE
      const newGroup: Partial<ArticleGroup> = {
        name: 'Lifecycle Test Group',
        description: 'Test description',
        isActive: true,
      };

      const createdGroup: ArticleGroup = {
        id: 'group-lifecycle',
        name: 'Lifecycle Test Group',
        description: 'Test description',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdGroup });
      const created = await articleGroupService.createArticleGroup(newGroup);
      expect(created.id).toBe('group-lifecycle');

      // READ
      mockedApi.get.mockResolvedValue({ data: createdGroup });
      const fetched = await articleGroupService.getArticleGroupById('group-lifecycle');
      expect(fetched.name).toBe('Lifecycle Test Group');

      // UPDATE
      const updates: Partial<ArticleGroup> = {
        name: 'Updated Lifecycle Group',
        description: 'Updated description',
      };

      const updatedGroup: ArticleGroup = {
        ...createdGroup,
        name: 'Updated Lifecycle Group',
        description: 'Updated description',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: updatedGroup });
      const updated = await articleGroupService.updateArticleGroup('group-lifecycle', updates);
      expect(updated.name).toBe('Updated Lifecycle Group');

      // DELETE
      mockedApi.delete.mockResolvedValue({});
      await articleGroupService.deleteArticleGroup('group-lifecycle');
      expect(mockedApi.delete).toHaveBeenCalledWith('/article-groups/group-lifecycle');
    });

    it('should handle group activation/deactivation lifecycle', async () => {
      // Create active group
      const newGroup: Partial<ArticleGroup> = {
        name: 'Active Group',
        isActive: true,
      };

      const createdGroup: ArticleGroup = {
        id: 'group-active',
        name: 'Active Group',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdGroup });
      const created = await articleGroupService.createArticleGroup(newGroup);
      expect(created.isActive).toBe(true);

      // Deactivate
      const deactivated: ArticleGroup = {
        ...createdGroup,
        isActive: false,
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: deactivated });
      const updated1 = await articleGroupService.updateArticleGroup('group-active', { isActive: false });
      expect(updated1.isActive).toBe(false);

      // Reactivate
      const reactivated: ArticleGroup = {
        ...deactivated,
        isActive: true,
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: reactivated });
      const updated2 = await articleGroupService.updateArticleGroup('group-active', { isActive: true });
      expect(updated2.isActive).toBe(true);
    });

    it('should handle group with articles lifecycle', async () => {
      // Create group
      const newGroup: Partial<ArticleGroup> = {
        name: 'Group with Articles',
        isActive: true,
      };

      const createdGroup: ArticleGroup = {
        id: 'group-with-articles',
        name: 'Group with Articles',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        articles: [],
      };

      mockedApi.post.mockResolvedValue({ data: createdGroup });
      const created = await articleGroupService.createArticleGroup(newGroup);
      expect(created.articles).toHaveLength(0);

      // Fetch with articles
      const groupWithArticles: ArticleGroup = {
        ...createdGroup,
        articles: [
          {
            id: 'article-1',
            articleNumber: 'ART-001',
            name: 'Test Article',
            articleGroupId: 'group-with-articles',
            price: 100.00,
            unit: 'hour',
            vatRate: 8.1,
            isActive: true,
            createdAt: '2026-01-01T10:30:00Z',
            updatedAt: '2026-01-01T10:30:00Z',
          },
        ],
      };

      mockedApi.get.mockResolvedValue({ data: groupWithArticles });
      const fetched = await articleGroupService.getArticleGroupById('group-with-articles');
      expect(fetched.articles).toHaveLength(1);
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle empty group name', async () => {
      const groupData: Partial<ArticleGroup> = {
        name: '',
      };

      mockedApi.post.mockRejectedValue(new Error('Group name cannot be empty'));

      await expect(articleGroupService.createArticleGroup(groupData))
        .rejects.toThrow('Group name cannot be empty');
    });

    it('should handle very long group name', async () => {
      const longName = 'A'.repeat(255);
      const groupData: Partial<ArticleGroup> = {
        name: longName,
      };

      const mockGroup: ArticleGroup = {
        id: 'group-long',
        name: longName,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.createArticleGroup(groupData);

      expect(result.name.length).toBe(255);
    });

    it('should handle very long description', async () => {
      const longDescription = 'B'.repeat(1000);
      const groupData: Partial<ArticleGroup> = {
        name: 'Test Group',
        description: longDescription,
      };

      const mockGroup: ArticleGroup = {
        id: 'group-long-desc',
        name: 'Test Group',
        description: longDescription,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.createArticleGroup(groupData);

      expect(result.description?.length).toBe(1000);
    });

    it('should handle group name with only whitespace', async () => {
      const groupData: Partial<ArticleGroup> = {
        name: '   ',
      };

      mockedApi.post.mockRejectedValue(new Error('Group name cannot be only whitespace'));

      await expect(articleGroupService.createArticleGroup(groupData))
        .rejects.toThrow('Group name cannot be only whitespace');
    });

    it('should handle Unicode characters in group name', async () => {
      const groupData: Partial<ArticleGroup> = {
        name: '服务分组 🚀',
        description: 'Group with emoji and Chinese characters',
      };

      const mockGroup: ArticleGroup = {
        id: 'group-unicode',
        name: '服务分组 🚀',
        description: 'Group with emoji and Chinese characters',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await articleGroupService.createArticleGroup(groupData);

      expect(result.name).toBe('服务分组 🚀');
    });

    it('should handle simultaneous updates conflict', async () => {
      const updates: Partial<ArticleGroup> = {
        name: 'Updated Name',
      };

      mockedApi.put.mockRejectedValue(new Error('Conflict: Resource was modified'));

      await expect(articleGroupService.updateArticleGroup('group-123', updates))
        .rejects.toThrow('Conflict: Resource was modified');
    });
  });
});
