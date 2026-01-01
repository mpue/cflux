import { timeService } from '../time.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Time Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clockIn', () => {
    it('should clock in successfully', async () => {
      const mockResponse = {
        data: {
          id: 'entry-1',
          userId: 'user-1',
          clockIn: new Date().toISOString(),
          status: 'CLOCKED_IN',
          projectId: 'project-1',
          locationId: 'location-1',
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await timeService.clockIn('project-1', 'location-1', 'Working');

      expect(mockedApi.post).toHaveBeenCalledWith('/time/clock-in', {
        projectId: 'project-1',
        locationId: 'location-1',
        description: 'Working',
      });
      expect(result.status).toBe('CLOCKED_IN');
    });
  });

  describe('clockOut', () => {
    it('should clock out successfully', async () => {
      const mockResponse = {
        data: {
          id: 'entry-1',
          userId: 'user-1',
          clockIn: new Date().toISOString(),
          clockOut: new Date().toISOString(),
          status: 'CLOCKED_OUT',
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await timeService.clockOut();

      expect(mockedApi.post).toHaveBeenCalledWith('/time/clock-out', { pauseMinutes: undefined });
      expect(result.status).toBe('CLOCKED_OUT');
    });
  });

  describe('getMyTimeEntries', () => {
    it('should fetch user time entries', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          clockIn: new Date().toISOString(),
          clockOut: new Date().toISOString(),
          status: 'CLOCKED_OUT',
        },
        {
          id: 'entry-2',
          clockIn: new Date().toISOString(),
          clockOut: null,
          status: 'CLOCKED_IN',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockEntries });

      const result = await timeService.getMyTimeEntries();

      expect(mockedApi.get).toHaveBeenCalledWith('/time/my-entries', {
        params: { startDate: undefined, endDate: undefined },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('updateMyTimeEntry', () => {
    it('should update time entry', async () => {
      const updatedEntry = {
        id: 'entry-1',
        description: 'Updated description',
      };

      mockedApi.put.mockResolvedValue({ data: updatedEntry });

      const result = await timeService.updateMyTimeEntry('entry-1', {
        description: 'Updated description',
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/time/my-entries/entry-1', {
        description: 'Updated description',
      });
      expect(result.description).toBe('Updated description');
    });
  });

  describe('deleteMyTimeEntry', () => {
    it('should delete time entry', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await timeService.deleteMyTimeEntry('entry-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/time/my-entries/entry-1');
    });
  });
});
