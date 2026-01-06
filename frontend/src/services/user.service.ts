import api from './api';
import { User } from '../types';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/list'); // Use new endpoint for basic user list
    return response.data;
  },

  getAllUsersAdmin: async (): Promise<User[]> => {
    // Admin-only endpoint with full user details
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    vacationDays?: number;
    isActive?: boolean;
  }): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data.user;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
