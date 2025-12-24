import api from './api';

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    isActive?: boolean;
  }>;
  _count?: {
    users: number;
  };
}

export interface CreateUserGroupDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateUserGroupDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export const userGroupService = {
  async getAll(includeInactive: boolean = false): Promise<UserGroup[]> {
    const response = await api.get(`/user-groups?includeInactive=${includeInactive}`);
    return response.data;
  },

  async getById(id: string): Promise<UserGroup> {
    const response = await api.get(`/user-groups/${id}`);
    return response.data;
  },

  async create(data: CreateUserGroupDto): Promise<UserGroup> {
    const response = await api.post('/user-groups', data);
    return response.data;
  },

  async update(id: string, data: UpdateUserGroupDto): Promise<UserGroup> {
    const response = await api.put(`/user-groups/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/user-groups/${id}`);
  },

  async addUser(groupId: string, userId: string): Promise<void> {
    await api.post(`/user-groups/${groupId}/users`, { userId });
  },

  async removeUser(groupId: string, userId: string): Promise<void> {
    await api.delete(`/user-groups/${groupId}/users/${userId}`);
  },

  async getUsers(groupId: string): Promise<any[]> {
    const response = await api.get(`/user-groups/${groupId}/users`);
    return response.data;
  },
};
