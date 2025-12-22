import { absenceService } from '../absence.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Absence Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAbsenceRequest', () => {
    it('should create absence request successfully', async () => {
      const mockAbsence = {
        id: '1',
        userId: 'user-1',
        type: 'VACATION',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        days: 5,
        status: 'PENDING',
      };

      const mockResponse = { data: mockAbsence };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await absenceService.createAbsenceRequest({
        type: 'VACATION',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        days: 5,
        reason: 'Summer vacation',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/absences', {
        type: 'VACATION',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        days: 5,
        reason: 'Summer vacation',
      });
      expect(result.type).toBe('VACATION');
    });
  });

  describe('getMyAbsenceRequests', () => {
    it('should get my absence requests', async () => {
      const mockAbsences = [
        {
          id: '1',
          userId: 'user-1',
          type: 'VACATION',
          status: 'APPROVED',
        },
      ];

      const mockResponse = { data: mockAbsences };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await absenceService.getMyAbsenceRequests();

      expect(mockedApi.get).toHaveBeenCalledWith('/absences/my-requests');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAllAbsenceRequests', () => {
    it('should get all absence requests', async () => {
      const mockAbsences = [
        {
          id: '1',
          userId: 'user-1',
          type: 'VACATION',
          status: 'APPROVED',
        },
        {
          id: '2',
          userId: 'user-2',
          type: 'SICK',
          status: 'PENDING',
        },
      ];

      const mockResponse = { data: mockAbsences };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await absenceService.getAllAbsenceRequests();

      expect(mockedApi.get).toHaveBeenCalledWith('/absences', { params: { status: undefined } });
      expect(result).toHaveLength(2);
    });
  });

  describe('approveAbsenceRequest', () => {
    it('should approve absence request', async () => {
      const mockAbsence = {
        id: '1',
        status: 'APPROVED',
      };

      const mockResponse = { data: mockAbsence };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await absenceService.approveAbsenceRequest('1');

      expect(mockedApi.put).toHaveBeenCalledWith('/absences/1/approve');
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('rejectAbsenceRequest', () => {
    it('should reject absence request', async () => {
      const mockAbsence = {
        id: '1',
        status: 'REJECTED',
      };

      const mockResponse = { data: mockAbsence };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await absenceService.rejectAbsenceRequest('1');

      expect(mockedApi.put).toHaveBeenCalledWith('/absences/1/reject');
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('deleteAbsenceRequest', () => {
    it('should delete absence request', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await absenceService.deleteAbsenceRequest('1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/absences/1');
    });
  });
});
