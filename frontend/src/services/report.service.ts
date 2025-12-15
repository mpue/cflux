import api from './api';
import { Report, User } from '../types';

export const reportService = {
  getMySummary: async (startDate?: string, endDate?: string): Promise<Report> => {
    const response = await api.get('/reports/my-summary', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getUserSummary: async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Report> => {
    const response = await api.get(`/reports/user-summary/${userId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getAllUsersSummary: async (startDate?: string, endDate?: string): Promise<Report[]> => {
    const response = await api.get('/reports/all-users-summary', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getProjectSummary: async (
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Report> => {
    const response = await api.get(`/reports/project-summary/${projectId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
