// Mock axios BEFORE any imports
jest.mock('axios', () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockPut = jest.fn();
  const mockDelete = jest.fn();
  
  (global as any).mockGet = mockGet;
  (global as any).mockPost = mockPost;
  (global as any).mockPut = mockPut;
  (global as any).mockDelete = mockDelete;
  
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => ({
        get: mockGet,
        post: mockPost,
        put: mockPut,
        delete: mockDelete,
        interceptors: {
          request: {
            use: jest.fn((successFn) => {
              if (successFn) {
                successFn({ headers: {}, baseURL: '', url: '' });
              }
              return 0;
            }),
          },
        },
      })),
    },
  };
});

import { deviceService, Device } from '../device.service';

// Get mocks from global
const mockGet = (global as any).mockGet;
const mockPost = (global as any).mockPost;
const mockPut = (global as any).mockPut;
const mockDelete = (global as any).mockDelete;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Device Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('token', 'test-token');
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  describe('getAllDevices', () => {
    it('should get all devices', async () => {
      const mockDevices: Device[] = [
        {
          id: '1',
          name: 'Device 1',
          serialNumber: 'SN001',
          manufacturer: 'Apple',
          model: 'MacBook Pro',
          category: 'Laptop',
          purchaseDate: '2023-01-01',
          isActive: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ];

      mockGet.mockResolvedValue({ data: mockDevices });

      const result = await deviceService.getAllDevices();

      expect(mockGet).toHaveBeenCalledWith('/devices');
      expect(result).toEqual(mockDevices);
    });
  });

  describe('createDevice', () => {
    it('should create device', async () => {
      const newDevice: Partial<Device> = {
        name: 'MacBook Pro',
        serialNumber: 'SN123',
      };

      const createdDevice: Device = {
        id: '123',
        name: 'MacBook Pro',
        serialNumber: 'SN123',
        manufacturer: '',
        model: '',
        category: '',
        isActive: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };

      mockPost.mockResolvedValue({ data: createdDevice });

      const result = await deviceService.createDevice(newDevice);

      expect(mockPost).toHaveBeenCalledWith('/devices', newDevice);
      expect(result).toEqual(createdDevice);
    });
  });

  describe('updateDevice', () => {
    it('should update device', async () => {
      const updates: Partial<Device> = {
        name: 'Updated Name',
      };

      const updatedDevice: Device = {
        id: '123',
        name: 'Updated Name',
        serialNumber: 'SN123',
        manufacturer: '',
        model: '',
        category: '',
        isActive: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
      };

      mockPut.mockResolvedValue({ data: updatedDevice });

      const result = await deviceService.updateDevice('123', updates);

      expect(mockPut).toHaveBeenCalledWith('/devices/123', updates);
      expect(result).toEqual(updatedDevice);
    });
  });

  describe('deleteDevice', () => {
    it('should delete device', async () => {
      mockDelete.mockResolvedValue({});

      await deviceService.deleteDevice('123');

      expect(mockDelete).toHaveBeenCalledWith('/devices/123');
    });
  });

  describe('getDeviceById', () => {
    it('should get device by id', async () => {
      const mockDevice: Device = {
        id: '123',
        name: 'Device',
        serialNumber: 'SN123',
        manufacturer: 'Apple',
        model: 'MacBook',
        category: 'Laptop',
        isActive: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };

      mockGet.mockResolvedValue({ data: mockDevice });

      const result = await deviceService.getDeviceById('123');

      expect(mockGet).toHaveBeenCalledWith('/devices/123');
      expect(result).toEqual(mockDevice);
    });
  });

  describe('getDevicesByUser', () => {
    it('should get devices by user', async () => {
      const mockDevices: Device[] = [
        {
          id: '1',
          name: 'Device 1',
          serialNumber: 'SN001',
          manufacturer: 'Apple',
          model: 'MacBook Pro',
          category: 'Laptop',
          isActive: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ];

      mockGet.mockResolvedValue({ data: mockDevices });

      const result = await deviceService.getDevicesByUser('user-123');

      expect(mockGet).toHaveBeenCalledWith('/devices/user/user-123');
      expect(result).toEqual(mockDevices);
    });
  });

  describe('assignDevice', () => {
    it('should assign device to user', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        deviceId: 'device-123',
        userId: 'user-456',
        assignedAt: '2023-01-01',
      };

      mockPost.mockResolvedValue({ data: mockAssignment });

      const result = await deviceService.assignDevice('device-123', 'user-456', 'Test notes');

      expect(mockPost).toHaveBeenCalledWith('/devices/device-123/assign', {
        userId: 'user-456',
        notes: 'Test notes',
      });
      expect(result).toEqual(mockAssignment);
    });
  });

  describe('returnDevice', () => {
    it('should return device', async () => {
      mockPost.mockResolvedValue({});

      await deviceService.returnDevice('device-123', 'Returned in good condition');

      expect(mockPost).toHaveBeenCalledWith('/devices/device-123/return', {
        notes: 'Returned in good condition',
      });
    });
  });
});
