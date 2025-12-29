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

  async getAllUserGroups(includeInactive: boolean = false): Promise<any[]> {
    const where = includeInactive ? {} : { isActive: true };
    
    return await prisma.userGroup.findMany({
      where,
      include: {
        userGroupMemberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: { 
            userGroupMemberships: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  },

  async getUserGroupById(id: string): Promise<any | null> {
    return await prisma.userGroup.findUnique({
      where: { id },
      include: {
        userGroupMemberships: {
          include: {
            user: {
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
        },
      },
    });
  },

  async updateUserGroup(id: string, data: UpdateUserGroupDto): Promise<UserGroup> {
    return await prisma.userGroup.update({
      where: { id },
      data,
      include: {
        userGroupMemberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  },

  async deleteUserGroup(id: string): Promise<void> {
    // Memberships will be deleted automatically due to cascade
    await prisma.userGroup.delete({
      where: { id },
    });
  },

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    // Check if membership already exists
    const existing = await prisma.userGroupMembership.findUnique({
      where: {
        userId_userGroupId: {
          userId,
          userGroupId: groupId,
        },
      },
    });

    if (!existing) {
      await prisma.userGroupMembership.create({
        data: {
          userId,
          userGroupId: groupId,
        },
      });
    }
  },

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await prisma.userGroupMembership.deleteMany({
      where: {
        userId,
        userGroupId: groupId,
      },
    });
  },

  async getUsersByGroup(groupId: string): Promise<any[]> {
    const memberships = await prisma.userGroupMembership.findMany({
      where: { userGroupId: groupId },
      include: {
        user: {
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
      orderBy: {
        user: {
          lastName: 'asc',
        },
      },
    });

    return memberships.map(m => m.user);
  },

  async getUserGroups(userId: string): Promise<any[]> {
    const memberships = await prisma.userGroupMembership.findMany({
      where: { userId },
      include: {
        userGroup: true,
      },
    });

    return memberships.map(m => m.userGroup);
  },

  async setUserGroups(userId: string, groupIds: string[]): Promise<void> {
    // Remove all existing memberships
    await prisma.userGroupMembership.deleteMany({
      where: { userId },
    });

    // Add new memberships
    if (groupIds.length > 0) {
      await prisma.userGroupMembership.createMany({
        data: groupIds.map(groupId => ({
          userId,
          userGroupId: groupId,
        })),
      });
    }
  },
};
