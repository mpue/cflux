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

  getAbsenceAnalytics: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const response = await api.get('/reports/absence-analytics', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getAttendanceByMonth: async (year?: number): Promise<any> => {
    const response = await api.get('/reports/attendance-by-month', {
      params: { year },
    });
    return response.data;
  },

  getOvertimeReport: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const response = await api.get('/reports/overtime-report', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getProjectTimeByUser: async (startDate?: string, endDate?: string): Promise<any> => {
    const response = await api.get('/reports/project-time-by-user', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
