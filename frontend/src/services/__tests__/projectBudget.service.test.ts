import projectBudgetService from '../projectBudget.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('projectBudgetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBudget = {
    id: '1',
    projectId: 'proj1',
    costCenterId: 'cc1',
    budgetName: '2024 Budget',
    totalBudget: 100000,
    fiscalYear: 2024,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    plannedCosts: 80000,
    actualCosts: 50000,
    remainingBudget: 50000,
    budgetUtilization: 50,
    status: 'ACTIVE',
    notes: 'Annual budget',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    createdById: 'user1'
  };

  const mockBudgetItem = {
    id: 'item1',
    budgetId: '1',
    category: 'PERSONNEL',
    itemName: 'Developer Salary',
    description: 'Senior developer',
    plannedQuantity: 1,
    actualQuantity: 1,
    unitPrice: 5000,
    actualUnitPrice: 5200,
    plannedCost: 60000,
    actualCost: 62400,
    plannedHours: 1920,
    actualHours: 1800,
    hourlyRate: 100,
    actualHourlyRate: 105,
    status: 'IN_PROGRESS',
    variance: 2400,
    variancePercent: 4,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  describe('getAllBudgets', () => {
    it('should fetch all budgets', async () => {
      const mockBudgets = [mockBudget];
      mockApi.get.mockResolvedValue({ data: mockBudgets });

      const result = await projectBudgetService.getAllBudgets();

      expect(mockApi.get).toHaveBeenCalledWith('/project-budgets');
      expect(result).toEqual(mockBudgets);
    });
  });

  describe('getBudgetById', () => {
    it('should fetch a budget by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockBudget });

      const result = await projectBudgetService.getBudgetById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/project-budgets/1');
      expect(result).toEqual(mockBudget);
    });
  });

  describe('getBudgetByProjectId', () => {
    it('should fetch a budget by project id', async () => {
      mockApi.get.mockResolvedValue({ data: mockBudget });

      const result = await projectBudgetService.getBudgetByProjectId('proj1');

      expect(mockApi.get).toHaveBeenCalledWith('/project-budgets/project/proj1');
      expect(result).toEqual(mockBudget);
    });
  });

  describe('createBudget', () => {
    it('should create a new budget', async () => {
      const budgetData = {
        projectId: 'proj1',
        budgetName: 'New Budget',
        totalBudget: 50000,
        fiscalYear: 2025,
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };
      mockApi.post.mockResolvedValue({ data: { ...mockBudget, ...budgetData } });

      const result = await projectBudgetService.createBudget(budgetData);

      expect(mockApi.post).toHaveBeenCalledWith('/project-budgets', budgetData);
      expect(result.budgetName).toBe('New Budget');
    });
  });

  describe('updateBudget', () => {
    it('should update a budget', async () => {
      const updateData = {
        budgetName: 'Updated Budget',
        totalBudget: 120000,
        notes: 'Budget increased'
      };
      const updatedBudget = { ...mockBudget, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedBudget });

      const result = await projectBudgetService.updateBudget('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/project-budgets/1', updateData);
      expect(result.budgetName).toBe('Updated Budget');
      expect(result.totalBudget).toBe(120000);
    });
  });

  describe('recalculateBudget', () => {
    it('should recalculate a budget', async () => {
      const recalculatedBudget = {
        ...mockBudget,
        actualCosts: 55000,
        remainingBudget: 45000,
        budgetUtilization: 55
      };
      mockApi.post.mockResolvedValue({ data: recalculatedBudget });

      const result = await projectBudgetService.recalculateBudget('1');

      expect(mockApi.post).toHaveBeenCalledWith('/project-budgets/1/recalculate');
      expect(result.actualCosts).toBe(55000);
      expect(result.budgetUtilization).toBe(55);
    });
  });

  describe('deleteBudget', () => {
    it('should delete a budget', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await projectBudgetService.deleteBudget('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/project-budgets/1');
    });
  });

  describe('addBudgetItem', () => {
    it('should add a budget item', async () => {
      const itemData = {
        category: 'MATERIALS',
        itemName: 'Office Supplies',
        plannedQuantity: 10,
        unitPrice: 50,
        plannedCost: 500
      };
      mockApi.post.mockResolvedValue({ data: { ...mockBudgetItem, ...itemData } });

      const result = await projectBudgetService.addBudgetItem('1', itemData);

      expect(mockApi.post).toHaveBeenCalledWith('/project-budgets/1/items', itemData);
      expect(result.itemName).toBe('Office Supplies');
    });
  });

  describe('updateBudgetItem', () => {
    it('should update a budget item', async () => {
      const updateData = {
        actualQuantity: 10,
        actualCost: 550,
        notes: 'Quantity adjusted'
      };
      const updatedItem = { ...mockBudgetItem, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedItem });

      const result = await projectBudgetService.updateBudgetItem('item1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/project-budgets/items/item1', updateData);
      expect(result.actualQuantity).toBe(10);
      expect(result.actualCost).toBe(550);
    });
  });

  describe('deleteBudgetItem', () => {
    it('should delete a budget item', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await projectBudgetService.deleteBudgetItem('item1');

      expect(mockApi.delete).toHaveBeenCalledWith('/project-budgets/items/item1');
    });
  });

  describe('getBudgetTimeEntries', () => {
    it('should fetch time entries for a budget', async () => {
      const mockTimeEntries = [
        {
          id: 'te1',
          userId: 'user1',
          projectId: 'proj1',
          date: '2024-01-15',
          hours: 8,
          description: 'Development work'
        }
      ];
      mockApi.get.mockResolvedValue({ data: mockTimeEntries });

      const result = await projectBudgetService.getBudgetTimeEntries('1');

      expect(mockApi.get).toHaveBeenCalledWith('/project-budgets/1/time-entries');
      expect(result).toEqual(mockTimeEntries);
    });
  });
});
