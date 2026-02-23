import api from './api';
import { Story } from '../types';

export const storyService = {
  getStoriesByProject: async (projectId: string, includeInactive?: boolean): Promise<Story[]> => {
    const response = await api.get(`/stories/project/${projectId}`, {
      params: { includeInactive: includeInactive || undefined },
    });
    return response.data;
  },

  getStory: async (id: string): Promise<Story> => {
    const response = await api.get(`/stories/${id}`);
    return response.data;
  },

  createStory: async (data: { projectId: string; name: string; description?: string; color?: string }): Promise<Story> => {
    const response = await api.post('/stories', data);
    return response.data;
  },

  updateStory: async (id: string, data: Partial<Story>): Promise<Story> => {
    const response = await api.put(`/stories/${id}`, data);
    return response.data;
  },

  deleteStory: async (id: string): Promise<void> => {
    await api.delete(`/stories/${id}`);
  },
};
