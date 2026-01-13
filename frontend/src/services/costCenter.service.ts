import api from './api';

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    timeEntries: number;
    invoices: number;
    orders: number;
  };
}

export interface CostCenterStats {
  totalHours: number;
  invoices: {
    total: number;
    count: number;
    paid: number;
    pending: number;
  };
  orders: {
    total: number;
    count: number;
    completed: number;
    pending: number;
  };
}

export const costCenterService = {
  getAll: async (includeInactive = false): Promise<CostCenter[]> => {
    const response = await api.get('/cost-centers', {
      params: { includeInactive }
    });
    return response.data;
  },

  getById: async (id: string): Promise<CostCenter> => {
    const response = await api.get(`/cost-centers/${id}`);
    return response.data;
  },

  getStats: async (id: string, startDate?: string, endDate?: string): Promise<CostCenterStats> => {
    const response = await api.get(`/cost-centers/${id}/stats`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  create: async (data: Partial<CostCenter>): Promise<CostCenter> => {
    const response = await api.post('/cost-centers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CostCenter>): Promise<CostCenter> => {
    const response = await api.put(`/cost-centers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cost-centers/${id}`);
  }
};
