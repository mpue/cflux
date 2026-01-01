import { authService } from '../auth.service';
import api from '../api';
import { User } from '../../types';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Auth Service - Complete Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // LOGIN Tests
  // ============================================
  describe('LOGIN - login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockLoginResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        user: {
          id: 'user-123',
          email: 'max.mueller@example.com',
          firstName: 'Max',
          lastName: 'Müller',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login('max.mueller@example.com', 'password123');

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'max.mueller@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockLoginResponse);
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('max.mueller@example.com');
    });

    it('should login as admin', async () => {
      const mockLoginResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin',
        user: {
          id: 'admin-123',
          email: 'admin@techsolutions.ch',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login('admin@techsolutions.ch', 'admin-password');

      expect(result.user.role).toBe('ADMIN');
    });

    it('should login as manager', async () => {
      const mockLoginResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.manager',
        user: {
          id: 'manager-123',
          email: 'manager@techsolutions.ch',
          firstName: 'Maria',
          lastName: 'Schmidt',
          role: 'MANAGER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login('manager@techsolutions.ch', 'manager-password');

      expect(result.user.role).toBe('MANAGER');
    });

    it('should handle login with email containing special characters', async () => {
      const mockLoginResponse = {
        token: 'test-token',
        user: {
          id: 'user-123',
          email: 'müller.ä@zürich.ch',
          firstName: 'Müller',
          lastName: 'Zürich',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login('müller.ä@zürich.ch', 'password123');

      expect(result.user.email).toBe('müller.ä@zürich.ch');
    });

    it('should handle login error with invalid credentials', async () => {
      mockedApi.post.mockRejectedValue(new Error('Invalid email or password'));

      await expect(authService.login('invalid@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should handle login error with non-existent user', async () => {
      mockedApi.post.mockRejectedValue(new Error('User not found'));

      await expect(authService.login('nonexistent@example.com', 'password'))
        .rejects.toThrow('User not found');
    });

    it('should handle network error during login', async () => {
      mockedApi.post.mockRejectedValue(new Error('Network error'));

      await expect(authService.login('user@example.com', 'password'))
        .rejects.toThrow('Network error');
    });

    it('should handle login with empty password', async () => {
      mockedApi.post.mockRejectedValue(new Error('Password is required'));

      await expect(authService.login('user@example.com', ''))
        .rejects.toThrow('Password is required');
    });

    it('should handle login with very long password', async () => {
      const longPassword = 'a'.repeat(1000);

      const mockLoginResponse = {
        token: 'test-token',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login('user@example.com', longPassword);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'user@example.com',
        password: longPassword,
      });
      expect(result.token).toBeDefined();
    });
  });

  // ============================================
  // REGISTER Tests
  // ============================================
  describe('REGISTER - register', () => {
    it('should register new user successfully', async () => {
      const registerData = {
        email: 'new.user@example.com',
        password: 'SecurePassword123!',
        firstName: 'New',
        lastName: 'User',
      };

      const mockRegisterResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newuser',
        user: {
          id: 'user-new',
          email: 'new.user@example.com',
          firstName: 'New',
          lastName: 'User',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockRegisterResponse });

      const result = await authService.register(registerData);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockRegisterResponse);
      expect(result.user.email).toBe('new.user@example.com');
    });

    it('should register user with Swiss name', async () => {
      const registerData = {
        email: 'anna.müller@zürich.ch',
        password: 'Password123!',
        firstName: 'Anna',
        lastName: 'Müller',
      };

      const mockRegisterResponse = {
        token: 'test-token',
        user: {
          id: 'user-swiss',
          email: 'anna.müller@zürich.ch',
          firstName: 'Anna',
          lastName: 'Müller',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockRegisterResponse });

      const result = await authService.register(registerData);

      expect(result.user.lastName).toBe('Müller');
      expect(result.user.email).toContain('zürich.ch');
    });

    it('should register user with French name', async () => {
      const registerData = {
        email: 'jean.dupont@geneve.ch',
        password: 'Password123!',
        firstName: 'Jean-François',
        lastName: 'Dupont',
      };

      const mockRegisterResponse = {
        token: 'test-token',
        user: {
          id: 'user-french',
          email: 'jean.dupont@geneve.ch',
          firstName: 'Jean-François',
          lastName: 'Dupont',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockRegisterResponse });

      const result = await authService.register(registerData);

      expect(result.user.firstName).toBe('Jean-François');
    });

    it('should handle registration error with existing email', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockedApi.post.mockRejectedValue(new Error('Email already exists'));

      await expect(authService.register(registerData))
        .rejects.toThrow('Email already exists');
    });

    it('should handle registration with weak password', async () => {
      const registerData = {
        email: 'user@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockedApi.post.mockRejectedValue(new Error('Password too weak'));

      await expect(authService.register(registerData))
        .rejects.toThrow('Password too weak');
    });

    it('should handle registration with invalid email format', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockedApi.post.mockRejectedValue(new Error('Invalid email format'));

      await expect(authService.register(registerData))
        .rejects.toThrow('Invalid email format');
    });

    it('should register user with minimal data', async () => {
      const registerData = {
        email: 'minimal@example.com',
        password: 'Password123!',
        firstName: 'A',
        lastName: 'B',
      };

      const mockRegisterResponse = {
        token: 'test-token',
        user: {
          id: 'user-minimal',
          email: 'minimal@example.com',
          firstName: 'A',
          lastName: 'B',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockRegisterResponse });

      const result = await authService.register(registerData);

      expect(result.user.firstName).toBe('A');
      expect(result.user.lastName).toBe('B');
    });

    it('should register user with very long names', async () => {
      const registerData = {
        email: 'user@example.com',
        password: 'Password123!',
        firstName: 'VeryLongFirstName'.repeat(10),
        lastName: 'VeryLongLastName'.repeat(10),
      };

      const mockRegisterResponse = {
        token: 'test-token',
        user: {
          id: 'user-long',
          email: 'user@example.com',
          firstName: 'VeryLongFirstName'.repeat(10),
          lastName: 'VeryLongLastName'.repeat(10),
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockRegisterResponse });

      const result = await authService.register(registerData);

      expect(result.user.firstName.length).toBeGreaterThan(100);
    });
  });

  // ============================================
  // GET CURRENT USER Tests
  // ============================================
  describe('GET CURRENT USER - getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'current.user@example.com',
        firstName: 'Current',
        lastName: 'User',
        role: 'USER',
        department: 'Engineering',
        position: 'Software Developer',
        phone: '+41 44 123 45 67',
        address: 'Bahnhofstrasse 1, 8001 Zürich',
        city: 'Zürich',
        zip: '8001',
        country: 'Switzerland',
        hourlyRate: 85.50,
        isActive: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(mockedApi.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
      expect(result.email).toBe('current.user@example.com');
    });

    it('should get current admin user', async () => {
      const mockAdmin: User = {
        id: 'admin-123',
        email: 'admin@techsolutions.ch',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        department: 'Management',
        position: 'System Administrator',
        isActive: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockAdmin });

      const result = await authService.getCurrentUser();

      expect(result.role).toBe('ADMIN');
      expect(result.position).toBe('System Administrator');
    });

    it('should get current manager user', async () => {
      const mockManager: User = {
        id: 'manager-123',
        email: 'manager@techsolutions.ch',
        firstName: 'Maria',
        lastName: 'Schmidt',
        role: 'MANAGER',
        department: 'Sales',
        position: 'Sales Manager',
        phone: '+41 44 987 65 43',
        isActive: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockManager });

      const result = await authService.getCurrentUser();

      expect(result.role).toBe('MANAGER');
      expect(result.department).toBe('Sales');
    });

    it('should get user with complete profile', async () => {
      const mockUser: User = {
        id: 'user-complete',
        email: 'complete@example.com',
        firstName: 'Thomas',
        lastName: 'Weber',
        role: 'USER',
        department: 'Engineering',
        position: 'Senior Developer',
        phone: '+41 44 111 22 33',
        address: 'Seestrasse 123',
        city: 'Zürich',
        zip: '8008',
        country: 'Switzerland',
        hourlyRate: 95.00,
        isActive: true,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(result.department).toBe('Engineering');
      expect(result.hourlyRate).toBe(95.00);
      expect(result.address).toBeDefined();
    });

    it('should get user with minimal profile', async () => {
      const mockUser: User = {
        id: 'user-minimal',
        email: 'minimal@example.com',
        firstName: 'Min',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(result.department).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });

    it('should handle error when user not authenticated', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not authenticated'));

      await expect(authService.getCurrentUser())
        .rejects.toThrow('Not authenticated');
    });

    it('should handle error with invalid token', async () => {
      mockedApi.get.mockRejectedValue(new Error('Invalid token'));

      await expect(authService.getCurrentUser())
        .rejects.toThrow('Invalid token');
    });

    it('should handle error with expired token', async () => {
      mockedApi.get.mockRejectedValue(new Error('Token expired'));

      await expect(authService.getCurrentUser())
        .rejects.toThrow('Token expired');
    });

    it('should get inactive user', async () => {
      const mockUser: User = {
        id: 'user-inactive',
        email: 'inactive@example.com',
        firstName: 'Inactive',
        lastName: 'User',
        role: 'USER',
        isActive: false,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-12-31T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(result.isActive).toBe(false);
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // REGISTER
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      };

      const mockRegisterResponse = {
        token: 'register-token',
        user: {
          id: 'user-new',
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockRegisterResponse });
      const registered = await authService.register(registerData);
      expect(registered.user.email).toBe('newuser@example.com');

      // GET CURRENT USER
      const mockUser: User = {
        id: 'user-new',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });
      const currentUser = await authService.getCurrentUser();
      expect(currentUser.email).toBe('newuser@example.com');
    });

    it('should complete login and get current user flow', async () => {
      // LOGIN
      const mockLoginResponse = {
        token: 'login-token',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });
      const loginResult = await authService.login('user@example.com', 'password123');
      expect(loginResult.token).toBe('login-token');

      // GET CURRENT USER
      const mockUser: User = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        department: 'Engineering',
        position: 'Developer',
        isActive: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });
      const currentUser = await authService.getCurrentUser();
      expect(currentUser.id).toBe('user-123');
      expect(currentUser.department).toBe('Engineering');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle email with multiple dots', async () => {
      const mockLoginResponse = {
        token: 'test-token',
        user: {
          id: 'user-123',
          email: 'user.name.test@example.co.uk',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login('user.name.test@example.co.uk', 'password');

      expect(result.user.email).toBe('user.name.test@example.co.uk');
    });

    it('should handle email with plus sign', async () => {
      const mockLoginResponse = {
        token: 'test-token',
        user: {
          id: 'user-123',
          email: 'user+tag@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login('user+tag@example.com', 'password');

      expect(result.user.email).toContain('+');
    });

    it('should handle user with hyphenated names', async () => {
      const mockUser: User = {
        id: 'user-hyphen',
        email: 'user@example.com',
        firstName: 'Jean-Pierre',
        lastName: 'von der Müller',
        role: 'USER',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(result.firstName).toBe('Jean-Pierre');
      expect(result.lastName).toBe('von der Müller');
    });

    it('should handle user with very high hourly rate', async () => {
      const mockUser: User = {
        id: 'user-expensive',
        email: 'consultant@example.com',
        firstName: 'Expert',
        lastName: 'Consultant',
        role: 'USER',
        hourlyRate: 500.00,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(result.hourlyRate).toBe(500.00);
    });

    it('should handle concurrent login requests', async () => {
      const mockLoginResponse = {
        token: 'test-token',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const loginPromises = [
        authService.login('user1@example.com', 'password1'),
        authService.login('user2@example.com', 'password2'),
        authService.login('user3@example.com', 'password3'),
      ];

      await Promise.all(loginPromises);

      expect(mockedApi.post).toHaveBeenCalledTimes(3);
    });
  });
});
