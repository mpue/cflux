import api from './api';
import { TimeEntry } from '../types';

export const timeService = {
  clockIn: async (projectId?: string, locationId?: string, description?: string, storyId?: string): Promise<TimeEntry> => {
    const response = await api.post('/time/clock-in', { projectId, locationId, description, storyId });
    return response.data;
  },

  clockOut: async (pauseMinutes?: number): Promise<TimeEntry> => {
    const response = await api.post('/time/clock-out', { pauseMinutes });
    return response.data;
  },

  startPause: async (): Promise<TimeEntry> => {
    const response = await api.post('/time/start-pause');
    return response.data;
  },

  endPause: async (): Promise<TimeEntry> => {
    const response = await api.post('/time/end-pause');
    return response.data;
  },

  getCurrentTimeEntry: async (): Promise<TimeEntry | null> => {
    const response = await api.get('/time/current');
    return response.data;
  },

  getMyTimeEntries: async (startDate?: string, endDate?: string): Promise<TimeEntry[]> => {
    const response = await api.get('/time/my-entries', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getUserTimeEntries: async (userId: string, startDate?: string, endDate?: string): Promise<TimeEntry[]> => {
    const response = await api.get(`/time/user/${userId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  updateTimeEntry: async (id: string, data: Partial<TimeEntry>): Promise<TimeEntry> => {
    const response = await api.put(`/time/${id}`, data);
    return response.data;
  },

  updateMyTimeEntry: async (id: string, data: Partial<TimeEntry>): Promise<TimeEntry> => {
    const response = await api.put(`/time/my-entries/${id}`, data);
    return response.data;
  },

  deleteTimeEntry: async (id: string): Promise<void> => {
    await api.delete(`/time/${id}`);
  },

  deleteMyTimeEntry: async (id: string): Promise<void> => {
    await api.delete(`/time/my-entries/${id}`);
  },

  getLoggedInUsers: async (): Promise<any[]> => {
    const response = await api.get('/time/logged-in-users');
    return response.data;
  },

  createTimeEntry: async (data: {
    userId: string;
    clockIn: string;
    clockOut?: string;
    projectId?: string;
    description?: string;
    pauseMinutes?: number;
  }): Promise<TimeEntry> => {
    const response = await api.post('/time/manual-entry', data);
    return response.data;
  },

  createMyManualEntry: async (data: {
    clockIn: string;
    clockOut?: string;
    projectId?: string;
    storyId?: string;
    locationId?: string;
    description?: string;
    pauseMinutes?: number;
  }): Promise<TimeEntry> => {
    const response = await api.post('/time/my-manual-entry', data);
    return response.data;
  },

  // Projektsoll-Cutting
  applyCutting: async (id: string): Promise<TimeEntry> => {
    const response = await api.post(`/time/${id}/cutting`);
    return response.data;
  },

  autoCut: async (id: string): Promise<TimeEntry> => {
    const response = await api.post(`/time/${id}/auto-cut`);
    return response.data;
  },

  updateZuschlagFlags: async (id: string, flags: {
    zuschlagNacht?: boolean;
    zuschlagSonntag?: boolean;
    zuschlagFeiertag?: boolean;
    zuschlagSamstag?: boolean;
    zuschlagGrund?: string;
  }): Promise<TimeEntry> => {
    const response = await api.patch(`/time/${id}/zuschlag-flags`, flags);
    return response.data;
  },

  // Soll-Ist Vergleich
  getSollIstComparison: async (userId: string, startDate?: string, endDate?: string): Promise<any[]> => {
    const response = await api.get(`/time/user/${userId}/soll-ist`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  updateTimeAllocations: async (id: string, data: {
    allocations?: { projectId: string; hours: number; description?: string }[];
    clockIn?: string;
    clockOut?: string;
    pauseMinutes?: number;
  }): Promise<any> => {
    const response = await api.put(`/time/${id}/allocations`, data);
    return response.data;
  },
};
