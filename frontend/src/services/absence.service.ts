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

  updateMyAbsenceRequest: async (id: string, data: {
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
  }): Promise<AbsenceRequest> => {
    const response = await api.put(`/absences/my-requests/${id}`, data);
    return response.data;
  },

  deleteMyAbsenceRequest: async (id: string): Promise<void> => {
    await api.delete(`/absences/my-requests/${id}`);
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

  createManualAbsence: async (data: {
    userId: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
    status?: string;
  }): Promise<AbsenceRequest> => {
    const response = await api.post('/absences/manual', data);
    return response.data;
  },
};
