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
  software?: DeviceSoftware[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceSoftware {
  id: string;
  deviceId: string;
  name: string;
  type?: string;
  vendor?: string;
  version?: string;
  licenseKey?: string;
  licenseType?: string;
  seats?: number | null;
  purchaseDate?: string;
  expiryDate?: string;
  cost?: string | number | null;
  notes?: string;
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

  async exportDevices(): Promise<Blob> {
    const response = await api.get('/devices/export/json', {
      responseType: 'blob'
    });
    return response.data;
  }

  async importDevices(devices: Partial<Device>[]): Promise<{ message: string; results: { success: number; failed: number; errors: string[] } }> {
    const response = await api.post('/devices/import/json', devices);
    return response.data;
  }

  // Software / Lizenzen pro Gerät
  async getDeviceSoftware(deviceId: string): Promise<DeviceSoftware[]> {
    const response = await api.get(`/devices/${deviceId}/software`);
    return response.data;
  }

  async createDeviceSoftware(deviceId: string, software: Partial<DeviceSoftware>): Promise<DeviceSoftware> {
    const response = await api.post(`/devices/${deviceId}/software`, software);
    return response.data;
  }

  async updateDeviceSoftware(deviceId: string, softwareId: string, software: Partial<DeviceSoftware>): Promise<DeviceSoftware> {
    const response = await api.put(`/devices/${deviceId}/software/${softwareId}`, software);
    return response.data;
  }

  async deleteDeviceSoftware(deviceId: string, softwareId: string): Promise<void> {
    await api.delete(`/devices/${deviceId}/software/${softwareId}`);
  }
}

export const deviceService = new DeviceService();
