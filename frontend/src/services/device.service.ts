import api from './api';

export interface Device {
  id: string;
  name: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  category?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  notes?: string;
  isActive: boolean;
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DeviceAssignment {
  id: string;
  deviceId: string;
  userId: string;
  assignedAt: string;
  returnedAt?: string;
  notes?: string;
  device?: Device;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

class DeviceService {
  async getAllDevices(): Promise<Device[]> {
    const response = await api.get('/devices');
    return response.data;
  }

  async getDeviceById(id: string): Promise<Device> {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  }

  async getDevicesByUser(userId: string): Promise<Device[]> {
    const response = await api.get(`/devices/user/${userId}`);
    return response.data;
  }

  async createDevice(device: Partial<Device>): Promise<Device> {
    const response = await api.post('/devices', device);
    return response.data;
  }

  async updateDevice(id: string, device: Partial<Device>): Promise<Device> {
    const response = await api.put(`/devices/${id}`, device);
    return response.data;
  }

  async deleteDevice(id: string): Promise<void> {
    await api.delete(`/devices/${id}`);
  }

  async assignDevice(id: string, userId: string, notes?: string): Promise<DeviceAssignment> {
    const response = await api.post(`/devices/${id}/assign`, { userId, notes });
    return response.data;
  }

  async returnDevice(id: string, notes?: string): Promise<void> {
    await api.post(`/devices/${id}/return`, { notes });
  }
}

export const deviceService = new DeviceService();
