import api from './api';
import { Location } from '../types';

export const locationService = {
  getAllLocations: async (): Promise<Location[]> => {
    const response = await api.get('/locations');
    return response.data;
  },

  getActiveLocations: async (): Promise<Location[]> => {
    const response = await api.get('/locations/active');
    return response.data;
  },

  getLocationById: async (id: string): Promise<Location> => {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },

  createLocation: async (data: Partial<Location>): Promise<Location> => {
    const response = await api.post('/locations', data);
    return response.data;
  },

  updateLocation: async (id: string, data: Partial<Location>): Promise<Location> => {
    const response = await api.put(`/locations/${id}`, data);
    return response.data;
  },

  deleteLocation: async (id: string): Promise<void> => {
    await api.delete(`/locations/${id}`);
  },
};
