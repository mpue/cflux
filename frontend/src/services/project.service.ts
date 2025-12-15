import api from './api';
import { Project } from '../types';

export const projectService = {
  getAllProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  getMyProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects/my-projects');
    return response.data;
  },

  createProject: async (data: { name: string; description?: string }): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  assignUser: async (projectId: string, userId: string): Promise<void> => {
    await api.post(`/projects/${projectId}/assign`, { userId });
  },

  unassignUser: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/unassign/${userId}`);
  },
};
