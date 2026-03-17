import api from './api';

export interface Tool {
  id: string;
  name: string;
  inventoryNumber?: string;
  manufacturer?: string;
  model?: string;
  category?: string;
  location?: string;
  purchaseDate?: string;
  lastInspection?: string;
  nextInspection?: string;
  condition?: string;
  notes?: string;
  isActive: boolean;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ToolAssignment {
  id: string;
  toolId: string;
  userId: string;
  assignedAt: string;
  returnedAt?: string;
  notes?: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

class WerkzeugeService {
  async getAllTools(): Promise<Tool[]> {
    const response = await api.get('/werkzeuge');
    return response.data;
  }

  async getToolById(id: string): Promise<Tool & { assignments: ToolAssignment[] }> {
    const response = await api.get(`/werkzeuge/${id}`);
    return response.data;
  }

  async getToolsByUser(userId: string): Promise<Tool[]> {
    const response = await api.get(`/werkzeuge/user/${userId}`);
    return response.data;
  }

  async createTool(tool: Partial<Tool>): Promise<Tool> {
    const response = await api.post('/werkzeuge', tool);
    return response.data;
  }

  async updateTool(id: string, tool: Partial<Tool>): Promise<Tool> {
    const response = await api.put(`/werkzeuge/${id}`, tool);
    return response.data;
  }

  async deleteTool(id: string): Promise<void> {
    await api.delete(`/werkzeuge/${id}`);
  }

  async assignTool(id: string, userId: string, notes?: string): Promise<ToolAssignment> {
    const response = await api.post(`/werkzeuge/${id}/assign`, { userId, notes });
    return response.data;
  }

  async returnTool(id: string, notes?: string): Promise<void> {
    await api.post(`/werkzeuge/${id}/return`, { notes });
  }
}

export const werkzeugeService = new WerkzeugeService();
