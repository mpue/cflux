import { PrismaClient, UserGroup } from '@prisma/client';

const prisma = new PrismaClient();

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
  async createUserGroup(data: CreateUserGroupDto): Promise<UserGroup> {
    return await prisma.userGroup.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async getAllUserGroups(includeInactive: boolean = false): Promise<UserGroup[]> {
    const where = includeInactive ? {} : { isActive: true };
    
    return await prisma.userGroup.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  },

  async getUserGroupById(id: string): Promise<UserGroup | null> {
    return await prisma.userGroup.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  },

  async updateUserGroup(id: string, data: UpdateUserGroupDto): Promise<UserGroup> {
    return await prisma.userGroup.update({
      where: { id },
      data,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async deleteUserGroup(id: string): Promise<void> {
    // First, remove all users from this group
    await prisma.user.updateMany({
      where: { userGroupId: id },
      data: { userGroupId: null },
    });
    
    // Then delete the group
    await prisma.userGroup.delete({
      where: { id },
    });
  },

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { userGroupId: groupId },
    });
  },

  async removeUserFromGroup(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { userGroupId: null },
    });
  },

  async getUsersByGroup(groupId: string): Promise<any[]> {
    return await prisma.user.findMany({
      where: { userGroupId: groupId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  },
};
