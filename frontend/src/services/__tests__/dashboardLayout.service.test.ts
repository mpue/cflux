import { dashboardLayoutService } from '../dashboardLayout.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('dashboardLayoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyLayout', () => {
    it('should fetch the current user dashboard layout', async () => {
      const mockLayout = {
        id: '1',
        userId: 'user1',
        layout: JSON.stringify({ widgets: [] }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockApi.get.mockResolvedValue({ data: mockLayout });

      const result = await dashboardLayoutService.getMyLayout();

      expect(mockApi.get).toHaveBeenCalledWith('/dashboard-layout/my-layout');
      expect(result).toEqual(mockLayout);
    });

    it('should return null when no layout exists (404)', async () => {
      mockApi.get.mockRejectedValue({
        response: { status: 404 }
      });

      const result = await dashboardLayoutService.getMyLayout();

      expect(mockApi.get).toHaveBeenCalledWith('/dashboard-layout/my-layout');
      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      const error = {
        response: { status: 500, data: { message: 'Server error' } }
      };
      mockApi.get.mockRejectedValue(error);

      await expect(dashboardLayoutService.getMyLayout()).rejects.toEqual(error);
    });
  });

  describe('saveMyLayout', () => {
    it('should save the dashboard layout', async () => {
      const layout = {
        id: '1',
        userId: 'user1',
        layout: JSON.stringify({ widgets: [{ id: '1', type: 'time' }] }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockApi.put.mockResolvedValue({ data: layout });

      await dashboardLayoutService.saveMyLayout(layout);

      expect(mockApi.put).toHaveBeenCalledWith('/dashboard-layout/my-layout', layout);
    });
  });

  describe('resetMyLayout', () => {
    it('should reset the dashboard layout', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await dashboardLayoutService.resetMyLayout();

      expect(mockApi.delete).toHaveBeenCalledWith('/dashboard-layout/my-layout');
    });
  });
});
