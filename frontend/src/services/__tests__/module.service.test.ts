import moduleService from '../module.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('moduleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockModule = {
    id: '1',
    name: 'Time Tracking',
    key: 'time_tracking',
    description: 'Track working hours',
    icon: 'clock',
    route: '/time',
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false
    }
  };

  const mockModuleAccess = {
    id: 'access1',
    moduleId: '1',
    userGroupId: 'group1',
    canView: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    module: mockModule,
    userGroup: {
      id: 'group1',
      name: 'Users'
    }
  };

  describe('getAllModules', () => {
    it('should fetch all active modules', async () => {
      const mockModules = [mockModule];
      mockApi.get.mockResolvedValue({ data: mockModules });

      const result = await moduleService.getAllModules();

      expect(mockApi.get).toHaveBeenCalledWith('/modules?includeInactive=false');
      expect(result).toEqual(mockModules);
    });

    it('should fetch all modules including inactive', async () => {
      const mockModules = [
        mockModule,
        { ...mockModule, id: '2', key: 'old_module', isActive: false }
      ];
      mockApi.get.mockResolvedValue({ data: mockModules });

      const result = await moduleService.getAllModules(true);

      expect(mockApi.get).toHaveBeenCalledWith('/modules?includeInactive=true');
      expect(result).toEqual(mockModules);
    });
  });

  describe('getModuleById', () => {
    it('should fetch a module by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockModule });

      const result = await moduleService.getModuleById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/modules/1');
      expect(result).toEqual(mockModule);
    });
  });

  describe('createModule', () => {
    it('should create a new module', async () => {
      const createData = {
        name: 'New Module',
        key: 'new_module',
        description: 'A new module',
        icon: 'star',
        route: '/new',
        sortOrder: 10
      };
      const newModule = { ...mockModule, ...createData, id: '2' };
      mockApi.post.mockResolvedValue({ data: newModule });

      const result = await moduleService.createModule(createData);

      expect(mockApi.post).toHaveBeenCalledWith('/modules', createData);
      expect(result).toEqual(newModule);
    });
  });

  describe('updateModule', () => {
    it('should update a module', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        isActive: false
      };
      const updatedModule = { ...mockModule, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedModule });

      const result = await moduleService.updateModule('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/modules/1', updateData);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('deleteModule', () => {
    it('should delete a module', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await moduleService.deleteModule('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/modules/1');
    });
  });

  describe('getModulesForCurrentUser', () => {
    it('should fetch modules for the current user', async () => {
      const mockModules = [mockModule];
      mockApi.get.mockResolvedValue({ data: mockModules });

      const result = await moduleService.getModulesForCurrentUser();

      expect(mockApi.get).toHaveBeenCalledWith('/modules/user/me');
      expect(result).toEqual(mockModules);
    });
  });

  describe('getModulesForUser', () => {
    it('should fetch modules for a specific user', async () => {
      const mockModules = [mockModule];
      mockApi.get.mockResolvedValue({ data: mockModules });

      const result = await moduleService.getModulesForUser('user1');

      expect(mockApi.get).toHaveBeenCalledWith('/modules/user/user1');
      expect(result).toEqual(mockModules);
    });
  });

  describe('grantModuleAccess', () => {
    it('should grant module access to a user group', async () => {
      const permissions = {
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false
      };
      mockApi.post.mockResolvedValue({ data: mockModuleAccess });

      const result = await moduleService.grantModuleAccess('1', 'group1', permissions);

      expect(mockApi.post).toHaveBeenCalledWith('/modules/1/access', {
        userGroupId: 'group1',
        permissions
      });
      expect(result).toEqual(mockModuleAccess);
    });
  });

  describe('updateModuleAccess', () => {
    it('should update module access permissions', async () => {
      const permissions = {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      };
      const updatedAccess = { ...mockModuleAccess, ...permissions };
      mockApi.put.mockResolvedValue({ data: updatedAccess });

      const result = await moduleService.updateModuleAccess('access1', permissions);

      expect(mockApi.put).toHaveBeenCalledWith('/modules/access/access1', {
        permissions
      });
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(true);
    });
  });

  describe('revokeModuleAccess', () => {
    it('should revoke module access', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await moduleService.revokeModuleAccess('access1');

      expect(mockApi.delete).toHaveBeenCalledWith('/modules/access/access1');
    });
  });

  describe('getModuleAccessByGroup', () => {
    it('should fetch module access for a user group', async () => {
      const mockAccessList = [mockModuleAccess];
      mockApi.get.mockResolvedValue({ data: mockAccessList });

      const result = await moduleService.getModuleAccessByGroup('group1');

      expect(mockApi.get).toHaveBeenCalledWith('/modules/group/group1/access');
      expect(result).toEqual(mockAccessList);
    });
  });

  describe('getGroupsForModule', () => {
    it('should fetch groups that have access to a module', async () => {
      const mockAccessList = [mockModuleAccess];
      mockApi.get.mockResolvedValue({ data: mockAccessList });

      const result = await moduleService.getGroupsForModule('1');

      expect(mockApi.get).toHaveBeenCalledWith('/modules/1/groups');
      expect(result).toEqual(mockAccessList);
    });
  });
});
