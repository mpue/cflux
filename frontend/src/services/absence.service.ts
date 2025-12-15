import api from './api';
import { AbsenceRequest } from '../types';

export const absenceService = {
  createAbsenceRequest: async (data: {
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
  }): Promise<AbsenceRequest> => {
    const response = await api.post('/absences', data);
    return response.data;
  },

  getMyAbsenceRequests: async (): Promise<AbsenceRequest[]> => {
    const response = await api.get('/absences/my-requests');
    return response.data;
  },

  getAllAbsenceRequests: async (status?: string): Promise<AbsenceRequest[]> => {
    const response = await api.get('/absences', { params: { status } });
    return response.data;
  },

  approveAbsenceRequest: async (id: string): Promise<AbsenceRequest> => {
    const response = await api.put(`/absences/${id}/approve`);
    return response.data;
  },

  rejectAbsenceRequest: async (id: string): Promise<AbsenceRequest> => {
    const response = await api.put(`/absences/${id}/reject`);
    return response.data;
  },

  deleteAbsenceRequest: async (id: string): Promise<void> => {
    await api.delete(`/absences/${id}`);
  },
};
