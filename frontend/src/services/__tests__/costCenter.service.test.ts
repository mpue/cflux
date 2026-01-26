import { costCenterService } from '../costCenter.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('costCenterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all active cost centers', async () => {
      const mockData = [
        { id: '1', code: 'CC001', name: 'Sales', isActive: true },
        { id: '2', code: 'CC002', name: 'Marketing', isActive: true }
      ];
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await costCenterService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/cost-centers', {
        params: { includeInactive: false }
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch all cost centers including inactive when specified', async () => {
      const mockData = [
        { id: '1', code: 'CC001', name: 'Sales', isActive: true },
        { id: '2', code: 'CC002', name: 'Old Dept', isActive: false }
      ];
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await costCenterService.getAll(true);

      expect(mockApi.get).toHaveBeenCalledWith('/cost-centers', {
        params: { includeInactive: true }
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('getById', () => {
    it('should fetch a cost center by id', async () => {
      const mockData = { id: '1', code: 'CC001', name: 'Sales', isActive: true };
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await costCenterService.getById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/cost-centers/1');
      expect(result).toEqual(mockData);
    });
  });

  describe('getStats', () => {
    it('should fetch cost center statistics', async () => {
      const mockStats = {
        totalHours: 120,
        invoices: { total: 5000, count: 5, paid: 3000, pending: 2000 },
        orders: { total: 1000, count: 3, completed: 2, pending: 1 }
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await costCenterService.getStats('1');

      expect(mockApi.get).toHaveBeenCalledWith('/cost-centers/1/stats', {
        params: { startDate: undefined, endDate: undefined }
      });
      expect(result).toEqual(mockStats);
    });

    it('should fetch cost center statistics with date range', async () => {
      const mockStats = {
        totalHours: 80,
        invoices: { total: 3000, count: 3, paid: 2000, pending: 1000 },
        orders: { total: 500, count: 2, completed: 1, pending: 1 }
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await costCenterService.getStats('1', '2024-01-01', '2024-01-31');

      expect(mockApi.get).toHaveBeenCalledWith('/cost-centers/1/stats', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' }
      });
      expect(result).toEqual(mockStats);
    });
  });

  describe('create', () => {
    it('should create a new cost center', async () => {
      const newCostCenter = {
        code: 'CC003',
        name: 'Development',
        description: 'Dev team',
        managerId: 'user1'
      };
      const mockResponse = { ...newCostCenter, id: '3', isActive: true };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await costCenterService.create(newCostCenter);

      expect(mockApi.post).toHaveBeenCalledWith('/cost-centers', newCostCenter);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should update an existing cost center', async () => {
      const updates = { name: 'Updated Name', description: 'Updated description' };
      const mockResponse = { id: '1', code: 'CC001', ...updates, isActive: true };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await costCenterService.update('1', updates);

      expect(mockApi.put).toHaveBeenCalledWith('/cost-centers/1', updates);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete a cost center', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await costCenterService.delete('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/cost-centers/1');
    });
  });
});
