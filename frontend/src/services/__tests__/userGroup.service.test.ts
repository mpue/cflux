import { userGroupService, UserGroup, CreateUserGroupDto, UpdateUserGroupDto } from '../userGroup.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('UserGroup Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - create', () => {
    it('should create user group with all fields', async () => {
      const newGroupData: CreateUserGroupDto = {
        name: 'Development Team',
        description: 'Software development team members',
        color: '#667eea',
      };

      const mockCreatedGroup: UserGroup = {
        id: 'group-123',
        name: 'Development Team',
        description: 'Software development team members',
        color: '#667eea',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        _count: {
          userGroupMemberships: 0,
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockCreatedGroup });

      const result = await userGroupService.create(newGroupData);

      expect(mockedApi.post).toHaveBeenCalledWith('/user-groups', newGroupData);
      expect(result).toEqual(mockCreatedGroup);
      expect(result.name).toBe('Development Team');
      expect(result.color).toBe('#667eea');
      expect(result.isActive).toBe(true);
    });

    it('should create user group with only required fields', async () => {
      const minimalData: CreateUserGroupDto = {
        name: 'Marketing Team',
      };

      const mockCreatedGroup: UserGroup = {
        id: 'group-456',
        name: 'Marketing Team',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCreatedGroup });

      const result = await userGroupService.create(minimalData);

      expect(result.name).toBe('Marketing Team');
      expect(result.description).toBeUndefined();
      expect(result.color).toBeUndefined();
    });

    it('should create multiple user groups with different colors', async () => {
      const groups = [
        { name: 'Sales', color: '#f56565' },
        { name: 'HR', color: '#48bb78' },
        { name: 'Finance', color: '#ed8936' },
      ];

      for (let i = 0; i < groups.length; i++) {
        mockedApi.post.mockResolvedValueOnce({
          data: {
            id: `group-${i + 1}`,
            ...groups[i],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        await userGroupService.create(groups[i]);
      }

      expect(mockedApi.post).toHaveBeenCalledTimes(3);
    });

    it('should handle duplicate group name error', async () => {
      const duplicateData: CreateUserGroupDto = {
        name: 'Existing Group',
      };

      mockedApi.post.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'Group name already exists' },
        },
      });

      await expect(userGroupService.create(duplicateData)).rejects.toMatchObject({
        response: {
          status: 409,
          data: { error: 'Group name already exists' },
        },
      });
    });

    it('should handle empty name validation error', async () => {
      const invalidData: CreateUserGroupDto = {
        name: '',
      };

      mockedApi.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Group name is required' },
        },
      });

      await expect(userGroupService.create(invalidData)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('should handle invalid color format', async () => {
      const invalidColorData: CreateUserGroupDto = {
        name: 'Test Group',
        color: 'invalid-color',
      };

      mockedApi.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid color format' },
        },
      });

      await expect(userGroupService.create(invalidColorData)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAll', () => {
    it('should fetch all active user groups', async () => {
      const mockGroups: UserGroup[] = [
        {
          id: 'group-1',
          name: 'Engineering',
          description: 'Engineering department',
          color: '#4299e1',
          isActive: true,
          createdAt: '2026-01-01T08:00:00Z',
          updatedAt: '2026-01-01T08:00:00Z',
          _count: { userGroupMemberships: 12 },
        },
        {
          id: 'group-2',
          name: 'Design',
          description: 'Design team',
          color: '#9f7aea',
          isActive: true,
          createdAt: '2026-01-01T09:00:00Z',
          updatedAt: '2026-01-01T09:00:00Z',
          _count: { userGroupMemberships: 5 },
        },
        {
          id: 'group-3',
          name: 'Management',
          color: '#ed8936',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
          _count: { userGroupMemberships: 3 },
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockGroups });

      const result = await userGroupService.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/user-groups?includeInactive=false');
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Engineering');
      expect(result[0]._count?.userGroupMemberships).toBe(12);
      expect(result[1].name).toBe('Design');
      expect(result[2].description).toBeUndefined();
    });

    it('should fetch all groups including inactive ones', async () => {
      const mockGroups: UserGroup[] = [
        {
          id: 'group-1',
          name: 'Active Group',
          isActive: true,
          createdAt: '2026-01-01T08:00:00Z',
          updatedAt: '2026-01-01T08:00:00Z',
        },
        {
          id: 'group-2',
          name: 'Inactive Group',
          isActive: false,
          createdAt: '2025-06-01T08:00:00Z',
          updatedAt: '2025-12-01T08:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockGroups });

      const result = await userGroupService.getAll(true);

      expect(mockedApi.get).toHaveBeenCalledWith('/user-groups?includeInactive=true');
      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(true);
      expect(result[1].isActive).toBe(false);
    });

    it('should return empty array when no groups exist', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await userGroupService.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle server error when fetching groups', async () => {
      mockedApi.get.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      });

      await expect(userGroupService.getAll()).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });

  describe('READ - getById', () => {
    it('should fetch specific group with members', async () => {
      const mockGroup: UserGroup = {
        id: 'group-789',
        name: 'Product Team',
        description: 'Product management and development',
        color: '#38b2ac',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        userGroupMemberships: [
          {
            user: {
              id: 'user-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              role: 'USER',
              isActive: true,
            },
          },
          {
            user: {
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              role: 'MANAGER',
              isActive: true,
            },
          },
        ],
        _count: { userGroupMemberships: 2 },
      };

      mockedApi.get.mockResolvedValue({ data: mockGroup });

      const result = await userGroupService.getById('group-789');

      expect(mockedApi.get).toHaveBeenCalledWith('/user-groups/group-789');
      expect(result.id).toBe('group-789');
      expect(result.userGroupMemberships).toHaveLength(2);
      expect(result.userGroupMemberships?.[0].user.firstName).toBe('John');
    });

    it('should handle group not found (404)', async () => {
      mockedApi.get.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'User group not found' },
        },
      });

      await expect(userGroupService.getById('non-existent')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User group not found' },
        },
      });
    });

    it('should handle unauthorized access (403)', async () => {
      mockedApi.get.mockRejectedValue({
        response: {
          status: 403,
          data: { error: 'Forbidden' },
        },
      });

      await expect(userGroupService.getById('protected-group')).rejects.toMatchObject({
        response: { status: 403 },
      });
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - update', () => {
    it('should update group name', async () => {
      const groupId = 'group-123';
      const updateData: UpdateUserGroupDto = {
        name: 'Updated Team Name',
      };

      const mockUpdatedGroup: UserGroup = {
        id: groupId,
        name: 'Updated Team Name',
        description: 'Original description',
        color: '#667eea',
        isActive: true,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await userGroupService.update(groupId, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith(`/user-groups/${groupId}`, updateData);
      expect(result.name).toBe('Updated Team Name');
    });

    it('should update group description', async () => {
      const groupId = 'group-456';
      const updateData: UpdateUserGroupDto = {
        description: 'New detailed description of the team',
      };

      const mockUpdatedGroup: UserGroup = {
        id: groupId,
        name: 'Team Name',
        description: 'New detailed description of the team',
        isActive: true,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await userGroupService.update(groupId, updateData);

      expect(result.description).toBe('New detailed description of the team');
    });

    it('should update group color', async () => {
      const groupId = 'group-789';
      const updateData: UpdateUserGroupDto = {
        color: '#f56565',
      };

      const mockUpdatedGroup: UserGroup = {
        id: groupId,
        name: 'Team Name',
        color: '#f56565',
        isActive: true,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await userGroupService.update(groupId, updateData);

      expect(result.color).toBe('#f56565');
    });

    it('should deactivate user group', async () => {
      const groupId = 'group-deactivate';
      const updateData: UpdateUserGroupDto = {
        isActive: false,
      };

      const mockUpdatedGroup: UserGroup = {
        id: groupId,
        name: 'Deactivated Group',
        isActive: false,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T15:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await userGroupService.update(groupId, updateData);

      expect(result.isActive).toBe(false);
    });

    it('should reactivate user group', async () => {
      const groupId = 'group-reactivate';
      const updateData: UpdateUserGroupDto = {
        isActive: true,
      };

      const mockUpdatedGroup: UserGroup = {
        id: groupId,
        name: 'Reactivated Group',
        isActive: true,
        createdAt: '2025-06-01T08:00:00Z',
        updatedAt: '2026-01-01T16:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await userGroupService.update(groupId, updateData);

      expect(result.isActive).toBe(true);
    });

    it('should update multiple fields simultaneously', async () => {
      const groupId = 'group-multi';
      const updateData: UpdateUserGroupDto = {
        name: 'Completely Updated Group',
        description: 'Updated description',
        color: '#9f7aea',
        isActive: true,
      };

      const mockUpdatedGroup: UserGroup = {
        id: groupId,
        name: 'Completely Updated Group',
        description: 'Updated description',
        color: '#9f7aea',
        isActive: true,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T17:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await userGroupService.update(groupId, updateData);

      expect(result.name).toBe('Completely Updated Group');
      expect(result.description).toBe('Updated description');
      expect(result.color).toBe('#9f7aea');
      expect(result.isActive).toBe(true);
    });

    it('should handle update with duplicate name', async () => {
      mockedApi.put.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'Group name already exists' },
        },
      });

      await expect(
        userGroupService.update('group-1', { name: 'Duplicate Name' })
      ).rejects.toMatchObject({
        response: { status: 409 },
      });
    });

    it('should handle update of non-existent group', async () => {
      mockedApi.put.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'User group not found' },
        },
      });

      await expect(
        userGroupService.update('non-existent', { name: 'Test' })
      ).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('should clear description by setting to empty string', async () => {
      const groupId = 'group-clear';
      const updateData: UpdateUserGroupDto = {
        description: '',
      };

      const mockUpdatedGroup: UserGroup = {
        id: groupId,
        name: 'Group Name',
        description: '',
        isActive: true,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T18:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedGroup });

      const result = await userGroupService.update(groupId, updateData);

      expect(result.description).toBe('');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - delete', () => {
    it('should delete user group successfully', async () => {
      const groupId = 'group-to-delete';

      mockedApi.delete.mockResolvedValue({
        data: { message: 'User group deleted successfully' },
      });

      await userGroupService.delete(groupId);

      expect(mockedApi.delete).toHaveBeenCalledWith(`/user-groups/${groupId}`);
      expect(mockedApi.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of non-existent group', async () => {
      mockedApi.delete.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'User group not found' },
        },
      });

      await expect(userGroupService.delete('non-existent-id')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User group not found' },
        },
      });
    });

    it('should handle unauthorized deletion (403)', async () => {
      mockedApi.delete.mockRejectedValue({
        response: {
          status: 403,
          data: { error: 'Forbidden: Cannot delete this group' },
        },
      });

      await expect(userGroupService.delete('protected-group')).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it('should handle deletion with active members (409)', async () => {
      mockedApi.delete.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'Cannot delete group with active members' },
        },
      });

      await expect(userGroupService.delete('group-with-members')).rejects.toMatchObject({
        response: { status: 409 },
      });
    });

    it('should delete multiple groups sequentially', async () => {
      const groupIds = ['group-1', 'group-2', 'group-3'];

      mockedApi.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      for (const groupId of groupIds) {
        await userGroupService.delete(groupId);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenNthCalledWith(1, '/user-groups/group-1');
      expect(mockedApi.delete).toHaveBeenNthCalledWith(2, '/user-groups/group-2');
      expect(mockedApi.delete).toHaveBeenNthCalledWith(3, '/user-groups/group-3');
    });
  });

  // ============================================
  // Group Membership Tests
  // ============================================
  describe('Group Membership - addUser & removeUser', () => {
    it('should add user to group successfully', async () => {
      const groupId = 'group-123';
      const userId = 'user-456';

      mockedApi.post.mockResolvedValue({
        data: { message: 'User added to group' },
      });

      await userGroupService.addUser(groupId, userId);

      expect(mockedApi.post).toHaveBeenCalledWith(`/user-groups/${groupId}/users`, {
        userId,
      });
    });

    it('should remove user from group successfully', async () => {
      const groupId = 'group-123';
      const userId = 'user-456';

      mockedApi.delete.mockResolvedValue({
        data: { message: 'User removed from group' },
      });

      await userGroupService.removeUser(groupId, userId);

      expect(mockedApi.delete).toHaveBeenCalledWith(
        `/user-groups/${groupId}/users/${userId}`
      );
    });

    it('should handle adding user already in group (409)', async () => {
      mockedApi.post.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'User already in group' },
        },
      });

      await expect(userGroupService.addUser('group-1', 'user-1')).rejects.toMatchObject({
        response: { status: 409 },
      });
    });

    it('should handle removing user not in group (404)', async () => {
      mockedApi.delete.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'User not found in group' },
        },
      });

      await expect(
        userGroupService.removeUser('group-1', 'user-999')
      ).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('should add multiple users to a group', async () => {
      const groupId = 'group-123';
      const userIds = ['user-1', 'user-2', 'user-3', 'user-4'];

      mockedApi.post.mockResolvedValue({ data: { message: 'Added' } });

      for (const userId of userIds) {
        await userGroupService.addUser(groupId, userId);
      }

      expect(mockedApi.post).toHaveBeenCalledTimes(4);
      userIds.forEach((userId, index) => {
        expect(mockedApi.post).toHaveBeenNthCalledWith(
          index + 1,
          `/user-groups/${groupId}/users`,
          { userId }
        );
      });
    });

    it('should remove multiple users from a group', async () => {
      const groupId = 'group-123';
      const userIds = ['user-1', 'user-2', 'user-3'];

      mockedApi.delete.mockResolvedValue({ data: { message: 'Removed' } });

      for (const userId of userIds) {
        await userGroupService.removeUser(groupId, userId);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('Group Membership - getUsers', () => {
    it('should get all users in a group', async () => {
      const groupId = 'group-123';
      const mockUsers = [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'USER',
        },
        {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'MANAGER',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockUsers });

      const result = await userGroupService.getUsers(groupId);

      expect(mockedApi.get).toHaveBeenCalledWith(`/user-groups/${groupId}/users`);
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
    });

    it('should return empty array for group with no users', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await userGroupService.getUsers('empty-group');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('User Group Association - getUserGroups', () => {
    it('should get all groups for a user', async () => {
      const userId = 'user-123';
      const mockGroups: UserGroup[] = [
        {
          id: 'group-1',
          name: 'Engineering',
          color: '#4299e1',
          isActive: true,
          createdAt: '2026-01-01T08:00:00Z',
          updatedAt: '2026-01-01T08:00:00Z',
        },
        {
          id: 'group-2',
          name: 'Management',
          color: '#ed8936',
          isActive: true,
          createdAt: '2026-01-01T09:00:00Z',
          updatedAt: '2026-01-01T09:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockGroups });

      const result = await userGroupService.getUserGroups(userId);

      expect(mockedApi.get).toHaveBeenCalledWith(`/user-groups/users/${userId}/groups`);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Engineering');
      expect(result[1].name).toBe('Management');
    });

    it('should return empty array for user with no groups', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await userGroupService.getUserGroups('user-no-groups');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('User Group Association - setUserGroups', () => {
    it('should set multiple groups for a user', async () => {
      const userId = 'user-123';
      const groupIds = ['group-1', 'group-2', 'group-3'];

      mockedApi.put.mockResolvedValue({
        data: { message: 'User groups updated' },
      });

      await userGroupService.setUserGroups(userId, groupIds);

      expect(mockedApi.put).toHaveBeenCalledWith(
        `/user-groups/users/${userId}/groups`,
        { groupIds }
      );
    });

    it('should clear all groups for a user by passing empty array', async () => {
      const userId = 'user-123';
      const groupIds: string[] = [];

      mockedApi.put.mockResolvedValue({
        data: { message: 'User groups cleared' },
      });

      await userGroupService.setUserGroups(userId, groupIds);

      expect(mockedApi.put).toHaveBeenCalledWith(
        `/user-groups/users/${userId}/groups`,
        { groupIds: [] }
      );
    });

    it('should replace existing groups with new ones', async () => {
      const userId = 'user-123';
      const newGroupIds = ['group-4', 'group-5'];

      mockedApi.put.mockResolvedValue({
        data: { message: 'User groups replaced' },
      });

      await userGroupService.setUserGroups(userId, newGroupIds);

      expect(mockedApi.put).toHaveBeenCalledWith(
        `/user-groups/users/${userId}/groups`,
        { groupIds: newGroupIds }
      );
    });
  });

  // ============================================
  // Integration & Lifecycle Tests
  // ============================================
  describe('CRUD Integration - Complete Lifecycle', () => {
    it('should perform full CRUD lifecycle', async () => {
      // 1. CREATE
      const newGroupData: CreateUserGroupDto = {
        name: 'Lifecycle Test Group',
        description: 'Test group for lifecycle',
        color: '#38b2ac',
      };

      const createdGroup: UserGroup = {
        id: 'lifecycle-group',
        name: 'Lifecycle Test Group',
        description: 'Test group for lifecycle',
        color: '#38b2ac',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdGroup });
      const created = await userGroupService.create(newGroupData);
      expect(created.id).toBe('lifecycle-group');

      // 2. READ by ID
      mockedApi.get.mockResolvedValueOnce({ data: createdGroup });
      const fetched = await userGroupService.getById('lifecycle-group');
      expect(fetched.name).toBe('Lifecycle Test Group');

      // 3. ADD USERS
      mockedApi.post.mockResolvedValue({ data: { message: 'Added' } });
      await userGroupService.addUser('lifecycle-group', 'user-1');
      await userGroupService.addUser('lifecycle-group', 'user-2');
      expect(mockedApi.post).toHaveBeenCalledTimes(3); // 1 create + 2 add users

      // 4. UPDATE
      const updatedGroup = {
        ...createdGroup,
        name: 'Updated Lifecycle Group',
        description: 'Updated description',
      };
      mockedApi.put.mockResolvedValue({ data: updatedGroup });
      const updated = await userGroupService.update('lifecycle-group', {
        name: 'Updated Lifecycle Group',
        description: 'Updated description',
      });
      expect(updated.name).toBe('Updated Lifecycle Group');

      // 5. READ all (should include updated group)
      mockedApi.get.mockResolvedValueOnce({ data: [updatedGroup] });
      const allGroups = await userGroupService.getAll();
      expect(allGroups).toHaveLength(1);
      expect(allGroups[0].name).toBe('Updated Lifecycle Group');

      // 6. REMOVE USER
      mockedApi.delete.mockResolvedValueOnce({ data: { message: 'Removed' } });
      await userGroupService.removeUser('lifecycle-group', 'user-1');

      // 7. DEACTIVATE
      const deactivatedGroup = { ...updatedGroup, isActive: false };
      mockedApi.put.mockResolvedValue({ data: deactivatedGroup });
      const deactivated = await userGroupService.update('lifecycle-group', {
        isActive: false,
      });
      expect(deactivated.isActive).toBe(false);

      // 8. DELETE
      mockedApi.delete.mockResolvedValue({ data: { message: 'Deleted' } });
      await userGroupService.delete('lifecycle-group');
      expect(mockedApi.delete).toHaveBeenCalledWith('/user-groups/lifecycle-group');
    });

    it('should handle group with full user lifecycle', async () => {
      const groupId = 'test-group';

      // Create group
      mockedApi.post.mockResolvedValueOnce({
        data: {
          id: groupId,
          name: 'Test Group',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      await userGroupService.create({ name: 'Test Group' });

      // Get initial users (empty)
      mockedApi.get.mockResolvedValueOnce({ data: [] });
      const initialUsers = await userGroupService.getUsers(groupId);
      expect(initialUsers).toHaveLength(0);

      // Add users
      mockedApi.post.mockResolvedValue({ data: { message: 'Added' } });
      await userGroupService.addUser(groupId, 'user-1');
      await userGroupService.addUser(groupId, 'user-2');
      await userGroupService.addUser(groupId, 'user-3');

      // Get users after adding
      mockedApi.get.mockResolvedValueOnce({
        data: [
          { id: 'user-1', firstName: 'User', lastName: '1' },
          { id: 'user-2', firstName: 'User', lastName: '2' },
          { id: 'user-3', firstName: 'User', lastName: '3' },
        ],
      });
      const afterAdd = await userGroupService.getUsers(groupId);
      expect(afterAdd).toHaveLength(3);

      // Remove one user
      mockedApi.delete.mockResolvedValueOnce({ data: { message: 'Removed' } });
      await userGroupService.removeUser(groupId, 'user-2');

      // Get users after removing
      mockedApi.get.mockResolvedValueOnce({
        data: [
          { id: 'user-1', firstName: 'User', lastName: '1' },
          { id: 'user-3', firstName: 'User', lastName: '3' },
        ],
      });
      const afterRemove = await userGroupService.getUsers(groupId);
      expect(afterRemove).toHaveLength(2);
    });
  });

  // ============================================
  // Edge Cases & Special Scenarios
  // ============================================
  describe('Edge Cases', () => {
    it('should handle special characters in group name', async () => {
      const groupData: CreateUserGroupDto = {
        name: 'Team "Alpha-Ω" & Co.',
        description: 'Special chars: @#$%^&*()',
      };

      const mockGroup: UserGroup = {
        id: 'special-group',
        ...groupData,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await userGroupService.create(groupData);

      expect(result.name).toBe('Team "Alpha-Ω" & Co.');
    });

    it('should handle very long group name', async () => {
      const longName = 'A'.repeat(255);
      const groupData: CreateUserGroupDto = {
        name: longName,
      };

      const mockGroup: UserGroup = {
        id: 'long-name-group',
        name: longName,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockGroup });

      const result = await userGroupService.create(groupData);

      expect(result.name).toHaveLength(255);
    });

    it('should handle all valid color formats', async () => {
      const colors = ['#fff', '#ffffff', '#FFF', '#FFFFFF', '#667eea'];

      for (const color of colors) {
        mockedApi.post.mockResolvedValueOnce({
          data: {
            id: `group-${color}`,
            name: 'Test',
            color,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        const result = await userGroupService.create({ name: 'Test', color });
        expect(result.color).toBe(color);
      }
    });

    it('should handle network timeout error', async () => {
      mockedApi.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      await expect(userGroupService.getAll()).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network error', async () => {
      mockedApi.get.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
      });

      await expect(userGroupService.getAll()).rejects.toMatchObject({
        code: 'ECONNREFUSED',
      });
    });

    it('should handle concurrent operations', async () => {
      const groupId = 'concurrent-group';

      // Simulate concurrent add operations
      mockedApi.post.mockResolvedValue({ data: { message: 'Added' } });

      const promises = [
        userGroupService.addUser(groupId, 'user-1'),
        userGroupService.addUser(groupId, 'user-2'),
        userGroupService.addUser(groupId, 'user-3'),
      ];

      await Promise.all(promises);

      expect(mockedApi.post).toHaveBeenCalledTimes(3);
    });
  });
});
