const API_URL = process.env.REACT_APP_API_URL || '';

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
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllDevices(): Promise<Device[]> {
    const response = await fetch(`${API_URL}/api/devices`, {
      headers: this.getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Fehler beim Laden der Geräte');
    }

    return response.json();
  }

  async getDeviceById(id: string): Promise<Device> {
    const response = await fetch(`${API_URL}/api/devices/${id}`, {
      headers: this.getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Fehler beim Laden des Geräts');
    }

    return response.json();
  }

  async getDevicesByUser(userId: string): Promise<Device[]> {
    const response = await fetch(`${API_URL}/api/devices/user/${userId}`, {
      headers: this.getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Fehler beim Laden der Benutzergeräte');
    }

    return response.json();
  }

  async createDevice(device: Partial<Device>): Promise<Device> {
    const response = await fetch(`${API_URL}/api/devices`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(device)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Erstellen des Geräts');
    }

    return response.json();
  }

  async updateDevice(id: string, device: Partial<Device>): Promise<Device> {
    const response = await fetch(`${API_URL}/api/devices/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(device)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Aktualisieren des Geräts');
    }

    return response.json();
  }

  async deleteDevice(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/devices/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    });

    if (!response.ok) {
      throw new Error('Fehler beim Löschen des Geräts');
    }
  }

  async assignDevice(id: string, userId: string, notes?: string): Promise<DeviceAssignment> {
    const response = await fetch(`${API_URL}/api/devices/${id}/assign`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ userId, notes })
    });

    if (!response.ok) {
      throw new Error('Fehler beim Zuweisen des Geräts');
    }

    return response.json();
  }

  async returnDevice(id: string, notes?: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/devices/${id}/return`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ notes })
    });

    if (!response.ok) {
      throw new Error('Fehler beim Zurückgeben des Geräts');
    }
  }
}

export const deviceService = new DeviceService();
