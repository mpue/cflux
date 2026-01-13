import api from './api';

export interface Article {
  id: string;
  articleNumber: string;
  name: string;
  description?: string;
  unit: string;
  price: number;
  isActive: boolean;
  articleGroup?: {
    id: string;
    name: string;
  };
}

export interface InventoryMovement {
  id: string;
  type: string; // IN, OUT, ADJUSTMENT
  quantity: number;
  reason?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface InventoryItem {
  id: string;
  articleId: string;
  quantity: number;
  minQuantity: number;
  location?: string;
  notes?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
  article: Article;
  movements?: InventoryMovement[];
}

export const inventoryService = {
  getAll: async (includeInactive = false): Promise<InventoryItem[]> => {
    const response = await api.get(`/inventory?includeInactive=${includeInactive}`);
    return response.data;
  },

  getById: async (id: string): Promise<InventoryItem> => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  upsert: async (data: {
    articleId: string;
    quantity?: number;
    minQuantity?: number;
    location?: string;
    notes?: string;
  }): Promise<InventoryItem> => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  recordMovement: async (data: {
    inventoryItemId: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    reason?: string;
  }): Promise<InventoryMovement> => {
    const response = await api.post('/inventory/movement', data);
    return response.data;
  },

  getLowStock: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },
};
