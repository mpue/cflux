import api from './api';
import { TimeEntry } from '../types';

export const timeService = {
  clockIn: async (projectId?: string, locationId?: string, description?: string): Promise<TimeEntry> => {
    const response = await api.post('/time/clock-in', { projectId, locationId, description });
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
};
