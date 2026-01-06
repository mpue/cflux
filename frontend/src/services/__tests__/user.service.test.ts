import { userService } from '../user.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('User Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createUser', () => {
    it('should create user with all fields', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        vacationDays: 25,
        isActive: true,
      };

      const mockCreatedUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER' as const,
        vacationDays: 25,
        isActive: true,
        createdAt: new Date('2026-01-01T10:00:00Z'),
        updatedAt: new Date('2026-01-01T10:00:00Z'),
      };

      mockedApi.post.mockResolvedValue({
        data: { user: mockCreatedUser, token: 'jwt-token' },
      });

      const result = await userService.createUser(newUserData);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', newUserData);
      expect(result).toEqual(mockCreatedUser);
      expect(result.email).toBe('newuser@example.com');
      expect(result.vacationDays).toBe(25);
    });

    it('should create user with minimal required fields', async () => {
      const minimalData = {
        email: 'minimal@example.com',
        password: 'pass123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockUser = {
        id: 'user-456',
        email: 'minimal@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'USER' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.post.mockResolvedValue({ data: { user: mockUser } });

      const result = await userService.createUser(minimalData);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('should create ADMIN user', async () => {
      const adminData = {
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      };

      const mockAdmin = {
        id: 'admin-1',
        ...adminData,
        role: 'ADMIN' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.post.mockResolvedValue({ data: { user: mockAdmin } });

      const result = await userService.createUser(adminData);

      expect(result.role).toBe('ADMIN');
    });

    it('should handle email already exists error', async () => {
      const duplicateData = {
        email: 'existing@example.com',
        password: 'pass123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockedApi.post.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'Email already exists' },
        },
      });

      await expect(userService.createUser(duplicateData)).rejects.toMatchObject({
        response: {
          status: 409,
          data: { error: 'Email already exists' },
        },
      });
    });

    it('should handle invalid email format error', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'pass123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockedApi.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid email format' },
        },
      });

      await expect(userService.createUser(invalidData)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('should handle weak password error', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockedApi.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Password must be at least 6 characters' },
        },
      });

      await expect(userService.createUser(weakPasswordData)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllUsers', () => {
    it('should fetch all users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'Alice',
          lastName: 'Anderson',
          role: 'USER' as const,
          vacationDays: 25,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'Bob',
          lastName: 'Brown',
          role: 'ADMIN' as const,
          vacationDays: 30,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-3',
          email: 'user3@example.com',
          firstName: 'Charlie',
          lastName: 'Clark',
          role: 'MANAGER' as const,
          vacationDays: 28,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockUsers });

      const result = await userService.getAllUsers();

      expect(mockedApi.get).toHaveBeenCalledWith('/users/list');
      expect(result).toHaveLength(3);
      expect(result[0].firstName).toBe('Alice');
      expect(result[1].role).toBe('ADMIN');
      expect(result[2].isActive).toBe(false);
    });

    it('should return empty array when no users exist', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await userService.getAllUsers();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle server error', async () => {
      mockedApi.get.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      });

      await expect(userService.getAllUsers()).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });

  describe('READ - getAllUsersAdmin', () => {
    it('should fetch all users with full details for admin', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'Alice',
          lastName: 'Anderson',
          role: 'USER' as const,
          vacationDays: 25,
          isActive: true,
          phone: '+41 79 123 45 67',
          address: 'Street 1',
          city: 'Zurich',
          postalCode: '8000',
          country: 'Switzerland',
          ahvNumber: '756.1234.5678.90',
          iban: 'CH93 0076 2011 6238 5295 7',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'user-2',
          email: 'admin@example.com',
          firstName: 'Bob',
          lastName: 'Brown',
          role: 'ADMIN' as const,
          vacationDays: 30,
          isActive: true,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockUsers });

      const result = await userService.getAllUsersAdmin();

      expect(mockedApi.get).toHaveBeenCalledWith('/users');
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('Alice');
      expect(result[0].ahvNumber).toBe('756.1234.5678.90');
      expect(result[0].iban).toBe('CH93 0076 2011 6238 5295 7');
      expect(result[1].role).toBe('ADMIN');
    });

    it('should return empty array when no users exist', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await userService.getAllUsersAdmin();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle unauthorized access (403)', async () => {
      mockedApi.get.mockRejectedValue({
        response: {
          status: 403,
          data: { error: 'Forbidden - Admin access required' },
        },
      });

      await expect(userService.getAllUsersAdmin()).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it('should handle server error', async () => {
      mockedApi.get.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      });

      await expect(userService.getAllUsersAdmin()).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });

  describe('READ - getUserById', () => {
    it('should fetch specific user with all details', async () => {
      const mockUser = {
        id: 'user-789',
        email: 'detailed@example.com',
        firstName: 'David',
        lastName: 'Davis',
        role: 'MANAGER' as const,
        vacationDays: 27,
        isActive: true,
        employeeNumber: 'EMP-001',
        phone: '+41 79 123 45 67',
        mobile: '+41 78 987 65 43',
        street: 'Hauptstrasse',
        streetNumber: '123',
        zipCode: '8000',
        city: 'Zürich',
        country: 'Schweiz',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await userService.getUserById('user-789');

      expect(mockedApi.get).toHaveBeenCalledWith('/users/user-789');
      expect(result.id).toBe('user-789');
      expect(result.employeeNumber).toBe('EMP-001');
      expect(result.city).toBe('Zürich');
    });

    it('should handle user not found (404)', async () => {
      mockedApi.get.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'User not found' },
        },
      });

      await expect(userService.getUserById('non-existent')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User not found' },
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

      await expect(userService.getUserById('protected-user')).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it('should fetch user by different valid IDs', async () => {
      const userIds = ['user-1', 'user-abc-123', 'uuid-12345'];

      for (const userId of userIds) {
        mockedApi.get.mockResolvedValueOnce({
          data: {
            id: userId,
            email: `user${userId}@example.com`,
            firstName: 'Test',
            lastName: 'User',
            role: 'USER' as const,
            vacationDays: 30,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        const result = await userService.getUserById(userId);
        expect(result.id).toBe(userId);
      }

      expect(mockedApi.get).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateUser', () => {
    it('should update user basic information', async () => {
      const userId = 'user-123';
      const updateData = {
        firstName: 'UpdatedName',
        lastName: 'UpdatedLastName',
        phone: '+41 79 999 88 77',
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'UpdatedName',
        lastName: 'UpdatedLastName',
        phone: '+41 79 999 88 77',
        role: 'USER' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await userService.updateUser(userId, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith(`/users/${userId}`, updateData);
      expect(result.firstName).toBe('UpdatedName');
      expect(result.phone).toBe('+41 79 999 88 77');
    });

    it('should update user role to ADMIN', async () => {
      const userId = 'user-456';
      const mockUpdatedUser = {
        id: userId,
        email: 'promoted@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await userService.updateUser(userId, { role: 'ADMIN' as const });

      expect(result.role).toBe('ADMIN');
    });

    it('should update user role to MANAGER', async () => {
      const userId = 'user-789';
      const mockUpdatedUser = {
        id: userId,
        email: 'manager@example.com',
        firstName: 'Jane',
        lastName: 'Manager',
        role: 'MANAGER' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await userService.updateUser(userId, { role: 'MANAGER' as const });

      expect(result.role).toBe('MANAGER');
    });

    it('should deactivate user', async () => {
      const userId = 'user-deactivate';
      const mockUpdatedUser = {
        id: userId,
        email: 'deactivated@example.com',
        firstName: 'Inactive',
        lastName: 'User',
        role: 'USER' as const,
        vacationDays: 30,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await userService.updateUser(userId, { isActive: false });

      expect(result.isActive).toBe(false);
    });

    it('should reactivate user', async () => {
      const userId = 'user-reactivate';
      const mockUpdatedUser = {
        id: userId,
        email: 'reactivated@example.com',
        firstName: 'Active',
        lastName: 'User',
        role: 'USER' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await userService.updateUser(userId, { isActive: true });

      expect(result.isActive).toBe(true);
    });

    it('should update vacation days', async () => {
      const userId = 'user-vacation';
      const mockUpdatedUser = {
        id: userId,
        email: 'vacation@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER' as const,
        vacationDays: 35,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await userService.updateUser(userId, { vacationDays: 35 });

      expect(result.vacationDays).toBe(35);
    });

    it('should update multiple fields simultaneously', async () => {
      const userId = 'user-multi';
      const updateData = {
        firstName: 'Multi',
        lastName: 'Update',
        email: 'multiupdate@example.com',
        vacationDays: 35,
        phone: '+41 79 111 22 33',
        employeeNumber: 'EMP-999',
      };

      const mockUpdatedUser = {
        id: userId,
        ...updateData,
        role: 'USER' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await userService.updateUser(userId, updateData);

      expect(result.firstName).toBe('Multi');
      expect(result.email).toBe('multiupdate@example.com');
      expect(result.employeeNumber).toBe('EMP-999');
      expect(result.vacationDays).toBe(35);
    });

    it('should update address fields', async () => {
      const userId = 'user-address';
      const addressData = {
        street: 'Bahnhofstrasse',
        streetNumber: '42',
        zipCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'address@example.com',
        firstName: 'Test',
        lastName: 'User',
        ...addressData,
        role: 'USER' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await userService.updateUser(userId, addressData);

      expect(result.street).toBe('Bahnhofstrasse');
      expect(result.zipCode).toBe('8001');
      expect(result.city).toBe('Zürich');
    });

    it('should handle update with invalid email', async () => {
      mockedApi.put.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid email format' },
        },
      });

      await expect(
        userService.updateUser('user-1', { email: 'invalid-email' })
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('should handle update of non-existent user', async () => {
      mockedApi.put.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'User not found' },
        },
      });

      await expect(
        userService.updateUser('non-existent', { firstName: 'Test' })
      ).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('should handle unauthorized update attempt', async () => {
      mockedApi.put.mockRejectedValue({
        response: {
          status: 403,
          data: { error: 'Forbidden' },
        },
      });

      await expect(
        userService.updateUser('protected-user', { role: 'ADMIN' as const })
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-to-delete';

      mockedApi.delete.mockResolvedValue({
        data: { message: 'User deleted successfully' },
      });

      await userService.deleteUser(userId);

      expect(mockedApi.delete).toHaveBeenCalledWith(`/users/${userId}`);
      expect(mockedApi.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of non-existent user', async () => {
      mockedApi.delete.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'User not found' },
        },
      });

      await expect(userService.deleteUser('non-existent-id')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User not found' },
        },
      });
    });

    it('should handle unauthorized deletion (403)', async () => {
      mockedApi.delete.mockRejectedValue({
        response: {
          status: 403,
          data: { error: 'Forbidden: Cannot delete this user' },
        },
      });

      await expect(userService.deleteUser('protected-user')).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it('should handle deletion with dependencies (409)', async () => {
      mockedApi.delete.mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'Cannot delete user with active time entries' },
        },
      });

      await expect(userService.deleteUser('user-with-data')).rejects.toMatchObject({
        response: { status: 409 },
      });
    });

    it('should delete multiple users sequentially', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      mockedApi.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      for (const userId of userIds) {
        await userService.deleteUser(userId);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenNthCalledWith(1, '/users/user-1');
      expect(mockedApi.delete).toHaveBeenNthCalledWith(2, '/users/user-2');
      expect(mockedApi.delete).toHaveBeenNthCalledWith(3, '/users/user-3');
    });
  });

  // ============================================
  // Integration & Lifecycle Tests
  // ============================================
  describe('CRUD Integration - Complete Lifecycle', () => {
    it('should perform full CRUD lifecycle', async () => {
      // 1. CREATE
      const newUserData = {
        email: 'lifecycle@example.com',
        password: 'pass123',
        firstName: 'Lifecycle',
        lastName: 'Test',
      };

      const createdUser = {
        id: 'lifecycle-user',
        email: 'lifecycle@example.com',
        firstName: 'Lifecycle',
        lastName: 'Test',
        role: 'USER' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.post.mockResolvedValue({ data: { user: createdUser } });
      const created = await userService.createUser(newUserData);
      expect(created.id).toBe('lifecycle-user');

      // 2. READ by ID
      mockedApi.get.mockResolvedValueOnce({ data: createdUser });
      const fetched = await userService.getUserById('lifecycle-user');
      expect(fetched.email).toBe('lifecycle@example.com');

      // 3. UPDATE
      const updatedUser = { ...createdUser, firstName: 'Updated', vacationDays: 35 };
      mockedApi.put.mockResolvedValue({ data: updatedUser });
      const updated = await userService.updateUser('lifecycle-user', {
        firstName: 'Updated',
        vacationDays: 35,
      });
      expect(updated.firstName).toBe('Updated');
      expect(updated.vacationDays).toBe(35);

      // 4. READ all (should include updated user)
      mockedApi.get.mockResolvedValueOnce({ data: [updatedUser] });
      const allUsers = await userService.getAllUsers();
      expect(allUsers).toHaveLength(1);
      expect(allUsers[0].firstName).toBe('Updated');

      // 5. DELETE
      mockedApi.delete.mockResolvedValue({ data: { message: 'Deleted' } });
      await userService.deleteUser('lifecycle-user');
      expect(mockedApi.delete).toHaveBeenCalledWith('/users/lifecycle-user');

      // Verify all operations were called
      expect(mockedApi.post).toHaveBeenCalledTimes(1);
      expect(mockedApi.get).toHaveBeenCalledTimes(2);
      expect(mockedApi.put).toHaveBeenCalledTimes(1);
      expect(mockedApi.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle bulk user creation', async () => {
      const users = [
        { email: 'user1@test.com', password: 'pass1', firstName: 'User', lastName: 'One' },
        { email: 'user2@test.com', password: 'pass2', firstName: 'User', lastName: 'Two' },
        { email: 'user3@test.com', password: 'pass3', firstName: 'User', lastName: 'Three' },
      ];

      for (let i = 0; i < users.length; i++) {
        mockedApi.post.mockResolvedValueOnce({
          data: {
            user: {
              id: `user-${i + 1}`,
              ...users[i],
              role: 'USER' as const,
              vacationDays: 30,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        });

        await userService.createUser(users[i]);
      }

      expect(mockedApi.post).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================
  // Edge Cases & Special Scenarios
  // ============================================
  describe('Edge Cases', () => {
    it('should handle special characters in names', async () => {
      const userData = {
        email: 'special@example.com',
        password: 'pass123',
        firstName: 'François',
        lastName: "O'Brien-Müller",
      };

      const mockUser = {
        id: 'special-user',
        ...userData,
        role: 'USER' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.post.mockResolvedValue({ data: { user: mockUser } });

      const result = await userService.createUser(userData);

      expect(result.firstName).toBe('François');
      expect(result.lastName).toBe("O'Brien-Müller");
    });

    it('should handle empty phone update', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '',
        mobile: '',
        role: 'USER' as const,
        vacationDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUser });

      const result = await userService.updateUser('user-1', { phone: '', mobile: '' });

      expect(result.phone).toBe('');
      expect(result.mobile).toBe('');
    });

    it('should handle maximum vacation days', async () => {
      const mockUser = {
        id: 'user-max',
        email: 'max@example.com',
        firstName: 'Max',
        lastName: 'Vacation',
        role: 'USER' as const,
        vacationDays: 365,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUser });

      const result = await userService.updateUser('user-max', { vacationDays: 365 });

      expect(result.vacationDays).toBe(365);
    });

    it('should handle zero vacation days', async () => {
      const mockUser = {
        id: 'user-zero',
        email: 'zero@example.com',
        firstName: 'Zero',
        lastName: 'Vacation',
        role: 'USER' as const,
        vacationDays: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedApi.put.mockResolvedValue({ data: mockUser });

      const result = await userService.updateUser('user-zero', { vacationDays: 0 });

      expect(result.vacationDays).toBe(0);
    });

    it('should handle network timeout error', async () => {
      mockedApi.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      await expect(userService.getAllUsers()).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network error', async () => {
      mockedApi.get.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
      });

      await expect(userService.getAllUsers()).rejects.toMatchObject({
        code: 'ECONNREFUSED',
      });
    });
  });
});
