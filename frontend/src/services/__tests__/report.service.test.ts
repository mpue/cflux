import { reportService } from '../report.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Report Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMySummary', () => {
    it('should get my summary', async () => {
      const mockReport = {
        totalHours: 160,
        totalDays: 20,
        projectBreakdown: [],
      };

      const mockResponse = { data: mockReport };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportService.getMySummary('2024-01-01', '2024-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/reports/my-summary', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
      expect(result.totalHours).toBe(160);
    });
  });

  describe('getUserSummary', () => {
    it('should get user summary', async () => {
      const mockReport = {
        totalHours: 120,
        totalDays: 15,
        projectBreakdown: [],
      };

      const mockResponse = { data: mockReport };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportService.getUserSummary('user-1', '2024-01-01', '2024-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/reports/user-summary/user-1', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
      expect(result.totalHours).toBe(120);
    });
  });

  describe('getAllUsersSummary', () => {
    it('should get all users summary', async () => {
      const mockReports = [
        { totalHours: 160, userId: 'user-1' },
        { totalHours: 140, userId: 'user-2' },
      ];

      const mockResponse = { data: mockReports };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportService.getAllUsersSummary('2024-01-01', '2024-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/reports/all-users-summary', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getProjectSummary', () => {
    it('should get project summary', async () => {
      const mockReport = {
        totalHours: 200,
        totalDays: 25,
        userBreakdown: [],
      };

      const mockResponse = { data: mockReport };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportService.getProjectSummary('project-1', '2024-01-01', '2024-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/reports/project-summary/project-1', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
      expect(result.totalHours).toBe(200);
    });
  });

  describe('getAbsenceAnalytics', () => {
    it('should get absence analytics', async () => {
      const mockAnalytics = [
        { type: 'VACATION', count: 5 },
        { type: 'SICK', count: 2 },
      ];

      const mockResponse = { data: mockAnalytics };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await reportService.getAbsenceAnalytics('2024-01-01', '2024-12-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/reports/absence-analytics', {
        params: { startDate: '2024-01-01', endDate: '2024-12-31' },
      });
      expect(result).toHaveLength(2);
    });
  });
});
