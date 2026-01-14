import api from './api';

export interface ProjectBudget {
  id: string;
  projectId: string;
  costCenterId?: string;
  budgetName: string;
  totalBudget: number;
  fiscalYear: number;
  startDate: string;
  endDate: string;
  plannedCosts: number;
  actualCosts: number;
  remainingBudget: number;
  budgetUtilization: number;
  status: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  project?: any;
  costCenter?: any;
  createdBy?: any;
  items?: ProjectBudgetItem[];
}

export interface ProjectBudgetItem {
  id: string;
  budgetId: string;
  category: string;
  itemName: string;
  description?: string;
  inventoryItemId?: string;
  costCenterId?: string;
  plannedQuantity: number;
  actualQuantity: number;
  unitPrice: number;
  actualUnitPrice?: number;
  plannedCost: number;
  actualCost: number;
  plannedHours?: number;
  actualHours?: number;
  hourlyRate?: number;
  actualHourlyRate?: number;
  status: string;
  variance: number;
  variancePercent: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  inventoryItem?: any;
  costCenter?: any;
}

class ProjectBudgetService {
  async getAllBudgets(): Promise<ProjectBudget[]> {
    const response = await api.get('/project-budgets');
    return response.data;
  }

  async getBudgetById(id: string): Promise<ProjectBudget> {
    const response = await api.get(`/project-budgets/${id}`);
    return response.data;
  }

  async getBudgetByProjectId(projectId: string): Promise<ProjectBudget> {
    const response = await api.get(`/project-budgets/project/${projectId}`);
    return response.data;
  }

  async createBudget(budget: Partial<ProjectBudget>): Promise<ProjectBudget> {
    const response = await api.post('/project-budgets', budget);
    return response.data;
  }

  async updateBudget(id: string, budget: Partial<ProjectBudget>): Promise<ProjectBudget> {
    const response = await api.put(`/project-budgets/${id}`, budget);
    return response.data;
  }

  async recalculateBudget(id: string): Promise<ProjectBudget> {
    const response = await api.post(`/project-budgets/${id}/recalculate`);
    return response.data;
  }

  async deleteBudget(id: string): Promise<void> {
    await api.delete(`/project-budgets/${id}`);
  }

  async addBudgetItem(budgetId: string, item: Partial<ProjectBudgetItem>): Promise<ProjectBudgetItem> {
    const response = await api.post(`/project-budgets/${budgetId}/items`, item);
    return response.data;
  }

  async updateBudgetItem(itemId: string, item: Partial<ProjectBudgetItem>): Promise<ProjectBudgetItem> {
    const response = await api.put(`/project-budgets/items/${itemId}`, item);
    return response.data;
  }

  async deleteBudgetItem(itemId: string): Promise<void> {
    await api.delete(`/project-budgets/items/${itemId}`);
  }

  async getBudgetTimeEntries(budgetId: string): Promise<any> {
    const response = await api.get(`/project-budgets/${budgetId}/time-entries`);
    return response.data;
  }
}

export default new ProjectBudgetService();
