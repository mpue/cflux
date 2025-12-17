import { locationService } from '../location.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Location Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLocations', () => {
    it('should fetch all locations', async () => {
      const mockLocations = [
        { id: '1', name: 'Office', address: '123 Main St', isActive: true },
        { id: '2', name: 'Remote', address: null, isActive: true },
      ];

      mockedApi.get.mockResolvedValue({ data: mockLocations });

      const result = await locationService.getAllLocations();

      expect(mockedApi.get).toHaveBeenCalledWith('/locations');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Office');
    });
  });

  describe('getActiveLocations', () => {
    it('should fetch only active locations', async () => {
      const mockLocations = [
        { id: '1', name: 'Office', isActive: true },
      ];

      mockedApi.get.mockResolvedValue({ data: mockLocations });

      const result = await locationService.getActiveLocations();

      expect(mockedApi.get).toHaveBeenCalledWith('/locations/active');
      expect(result).toHaveLength(1);
    });
  });

  describe('createLocation', () => {
    it('should create a new location', async () => {
      const newLocation = {
        name: 'New Office',
        address: '456 Oak St',
        description: 'Second office',
      };

      const createdLocation = {
        id: '3',
        ...newLocation,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      mockedApi.post.mockResolvedValue({ data: createdLocation });

      const result = await locationService.createLocation(newLocation);

      expect(mockedApi.post).toHaveBeenCalledWith('/locations', newLocation);
      expect(result.name).toBe('New Office');
    });
  });

  describe('updateLocation', () => {
    it('should update location', async () => {
      const updates = { name: 'Updated Office' };
      const updatedLocation = { id: '1', ...updates };

      mockedApi.put.mockResolvedValue({ data: updatedLocation });

      const result = await locationService.updateLocation('1', updates);

      expect(mockedApi.put).toHaveBeenCalledWith('/locations/1', updates);
      expect(result.name).toBe('Updated Office');
    });
  });

  describe('deleteLocation', () => {
    it('should delete location', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await locationService.deleteLocation('1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/locations/1');
    });
  });
});
