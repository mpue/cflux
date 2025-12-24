import api from './api';

export interface Module {
  id: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  route?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  permissions?: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

export interface ModuleAccess {
  id: string;
  moduleId: string;
  userGroupId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  module?: Module;
  userGroup?: {
    id: string;
    name: string;
  };
}

export interface CreateModuleData {
  name: string;
  key: string;
  description?: string;
  icon?: string;
  route?: string;
  sortOrder?: number;
}

export interface UpdateModuleData {
  name?: string;
  key?: string;
  description?: string;
  icon?: string;
  route?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ModuleAccessPermissions {
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const moduleService = {
  // Module management
  getAllModules: async (includeInactive = false): Promise<Module[]> => {
    const response = await api.get(`/modules?includeInactive=${includeInactive}`);
    return response.data;
  },

  getModuleById: async (id: string): Promise<Module> => {
    const response = await api.get(`/modules/${id}`);
    return response.data;
  },

  createModule: async (data: CreateModuleData): Promise<Module> => {
    const response = await api.post('/modules', data);
    return response.data;
  },

  updateModule: async (id: string, data: UpdateModuleData): Promise<Module> => {
    const response = await api.put(`/modules/${id}`, data);
    return response.data;
  },

  deleteModule: async (id: string): Promise<void> => {
    await api.delete(`/modules/${id}`);
  },

  // User module access
  getModulesForCurrentUser: async (): Promise<Module[]> => {
    const response = await api.get('/modules/user/me');
    return response.data;
  },

  getModulesForUser: async (userId: string): Promise<Module[]> => {
    const response = await api.get(`/modules/user/${userId}`);
    return response.data;
  },

  // Module access management
  grantModuleAccess: async (
    moduleId: string,
    userGroupId: string,
    permissions: ModuleAccessPermissions
  ): Promise<ModuleAccess> => {
    const response = await api.post(`/modules/${moduleId}/access`, {
      userGroupId,
      permissions,
    });
    return response.data;
  },

  updateModuleAccess: async (
    accessId: string,
    permissions: ModuleAccessPermissions
  ): Promise<ModuleAccess> => {
    const response = await api.put(`/modules/access/${accessId}`, {
      permissions,
    });
    return response.data;
  },

  revokeModuleAccess: async (accessId: string): Promise<void> => {
    await api.delete(`/modules/access/${accessId}`);
  },

  getModuleAccessByGroup: async (groupId: string): Promise<ModuleAccess[]> => {
    const response = await api.get(`/modules/group/${groupId}/access`);
    return response.data;
  },

  getGroupsForModule: async (moduleId: string): Promise<ModuleAccess[]> => {
    const response = await api.get(`/modules/${moduleId}/groups`);
    return response.data;
  },
};

export default moduleService;
