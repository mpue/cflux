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

  // Detailed time bookings reports
  getDetailedTimeBookings: async (
    startDate?: string,
    endDate?: string,
    userId?: string,
    projectId?: string
  ): Promise<any> => {
    const response = await api.get('/reports/time-bookings', {
      params: { startDate, endDate, userId, projectId },
    });
    return response.data;
  },

  getUserTimeBookingsReport: async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> => {
    const response = await api.get(`/reports/user-time-bookings/${userId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // PDF exports
  downloadTimeBookingsPDF: async (
    startDate: string,
    endDate: string,
    userIds?: string[],
    projectIds?: string[]
  ): Promise<void> => {
    const params: any = { startDate, endDate };
    if (userIds && userIds.length > 0) {
      params.userIds = userIds.join(',');
    }
    if (projectIds && projectIds.length > 0) {
      params.projectIds = projectIds.join(',');
    }

    const response = await api.get('/reports/time-bookings-pdf', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Stundenbuchungs-Report_${startDate}_${endDate}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadUserTimeBookingsPDF: async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<void> => {
    const response = await api.get(`/reports/user-time-bookings-pdf/${userId}`, {
      params: { startDate, endDate },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Stundenbuchungs-Report_${startDate}_${endDate}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
