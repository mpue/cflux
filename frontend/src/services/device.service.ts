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
  action1EndpointId?: string;
  action1Status?: string;
  action1LastSeen?: string;
  action1IpAddress?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  software?: DeviceSoftware[];
  updates?: { id: string; severity?: string | null }[];
  vulnerabilities?: { id: string; score?: string | null }[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceUpdate {
  id: string;
  deviceId: string;
  externalId?: string;
  title: string;
  kb?: string;
  severity?: string;
  category?: string;
  releaseDate?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceVulnerability {
  id: string;
  deviceId: string;
  cveId: string;
  name?: string;
  score?: string;
  remediationStatus?: string;
  lastSyncedAt?: string;
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
  source: 'manual' | 'action1';
  externalId?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Action1SyncResult {
  deviceId: string;
  deviceName: string;
  matched: boolean;
  added: number;
  updated: number;
  removed: number;
  error?: string;
}

export interface Action1SyncSummary {
  devicesTotal: number;
  devicesMatched: number;
  devicesSkipped: number;
  devicesCreated: number;
  serialsUpdated: number;
  added: number;
  updated: number;
  removed: number;
  updatesTotal: number;
  vulnsTotal: number;
  results: Action1SyncResult[];
}

export interface Action1SyncStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  summary: Action1SyncSummary | null;
  error: string | null;
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

export interface SoftwareReportRow {
  name: string;
  vendor: string | null;
  type: string | null;
  deviceCount: number;
  versions: string[];
}

export interface SoftwareInstallation {
  deviceId: string;
  deviceName: string;
  category: string | null;
  version: string | null;
  status: string | null;
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

  async getDeviceUpdates(deviceId: string): Promise<DeviceUpdate[]> {
    const response = await api.get(`/devices/${deviceId}/updates`);
    return response.data;
  }

  async getDeviceVulnerabilities(deviceId: string): Promise<DeviceVulnerability[]> {
    const response = await api.get(`/devices/${deviceId}/vulnerabilities`);
    return response.data;
  }

  async getSoftwareReport(): Promise<SoftwareReportRow[]> {
    const response = await api.get('/devices/software/report');
    return response.data;
  }

  async getSoftwareInstallations(name: string): Promise<SoftwareInstallation[]> {
    const response = await api.get('/devices/software/report/installations', { params: { name } });
    return response.data;
  }

  async deployDeviceUpdates(deviceId: string, autoReboot = false): Promise<{
    policyId: string | null;
    policyName: string;
    packages: Array<{ title: string; packageId: string | null; version: string | null }>;
  }> {
    const response = await api.post(`/devices/${deviceId}/updates/deploy`, { autoReboot });
    return response.data;
  }

  // Action1-Integration
  async testAction1Connection(): Promise<{ ok: boolean; endpoints: number; message: string }> {
    const response = await api.get('/devices/action1/test');
    return response.data;
  }

  async startAction1Sync(): Promise<{ started: boolean; alreadyRunning: boolean; status: Action1SyncStatus }> {
    const response = await api.post('/devices/action1/sync');
    return response.data;
  }

  async getAction1SyncStatus(): Promise<Action1SyncStatus> {
    const response = await api.get('/devices/action1/sync/status');
    return response.data;
  }

  async syncDeviceFromAction1(deviceId: string): Promise<Action1SyncResult> {
    const response = await api.post(`/devices/${deviceId}/action1/sync`);
    return response.data;
  }
}

export const deviceService = new DeviceService();
