import api from './api';
import { User } from '../types';

export interface OneTimePasswordResult {
  password: string;
  email: string;
  emailSent: boolean;
  emailError?: string;
  user: { id: string; firstName: string; lastName: string };
}

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

  /**
   * Erzeugt ein Einmal-Passwort, setzt es beim Benutzer und stellt es per
   * E-Mail zu. Das Klartext-Passwort kommt zurück, damit es der Administrator
   * weitergeben kann, falls der Mailversand nicht klappt.
   */
  sendOneTimePassword: async (id: string): Promise<OneTimePasswordResult> => {
    const response = await api.post(`/users/${id}/one-time-password`);
    return response.data;
  },

  exportUsers: async (): Promise<void> => {
    const response = await api.get('/users/export', {
      responseType: 'blob'
    });
    
    // Create a download link
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    link.download = `users_export_${timestamp}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  uploadAvatar: async (userId: string, file: File): Promise<{ id: string; avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteAvatar: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}/avatar`);
  },

  importUsers: async (file: File): Promise<{
    success: boolean;
    message: string;
    results: {
      created: number;
      updated: number;
      errors: Array<{ email: string; error: string }>;
      skipped: number;
    };
  }> => {
    // Read file content
    const fileContent = await file.text();
    const importData = JSON.parse(fileContent);
    
    // Send to backend
    const response = await api.post('/users/import', importData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  },
};
