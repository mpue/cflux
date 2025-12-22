import { userService } from '../user.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
        {
          id: '2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'ADMIN',
        },
      ];

      const mockResponse = { data: mockUsers };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await userService.getAllUsers();

      expect(mockedApi.get).toHaveBeenCalledWith('/users');
      expect(result).toHaveLength(2);
    });
  });

  describe('getUserById', () => {
    it('should get user by id', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      };

      const mockResponse = { data: mockUser };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await userService.getUserById('1');

      expect(mockedApi.get).toHaveBeenCalledWith('/users/1');
      expect(result.email).toBe('user@example.com');
    });
  });

  describe('createUser', () => {
    it('should create user', async () => {
      const mockUser = {
        id: '1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
      };

      const mockResponse = { data: { user: mockUser, token: 'test-token' } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await userService.createUser({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const mockUser = {
        id: '1',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
      };

      const mockResponse = { data: mockUser };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await userService.updateUser('1', {
        firstName: 'Updated',
        lastName: 'User',
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/users/1', {
        firstName: 'Updated',
        lastName: 'User',
      });
      expect(result.firstName).toBe('Updated');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await userService.deleteUser('1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/users/1');
    });
  });
});
