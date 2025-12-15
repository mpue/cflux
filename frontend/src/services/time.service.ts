import api from './api';
import { TimeEntry } from '../types';

export const timeService = {
  clockIn: async (projectId?: string, description?: string): Promise<TimeEntry> => {
    const response = await api.post('/time/clock-in', { projectId, description });
    return response.data;
  },

  clockOut: async (): Promise<TimeEntry> => {
    const response = await api.post('/time/clock-out');
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

  updateTimeEntry: async (id: string, data: Partial<TimeEntry>): Promise<TimeEntry> => {
    const response = await api.put(`/time/${id}`, data);
    return response.data;
  },

  deleteTimeEntry: async (id: string): Promise<void> => {
    await api.delete(`/time/${id}`);
  },
};
