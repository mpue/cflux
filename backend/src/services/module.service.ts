import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const moduleService = {
  createModule: async (data: {
    name: string;
    key: string;
    description?: string;
    icon?: string;
    route?: string;
    sortOrder?: number;
  }) => {
    return await prisma.module.create({
      data,
    });
  },

  getAllModules: async (includeInactive = false) => {
    return await prisma.module.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        groupAccess: {
          include: {
            userGroup: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  },

  getModuleById: async (id: string) => {
    return await prisma.module.findUnique({
      where: { id },
      include: {
        groupAccess: {
          include: {
            userGroup: true,
          },
        },
      },
    });
  },

  updateModule: async (id: string, data: {
    name?: string;
    key?: string;
    description?: string;
    icon?: string;
    route?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) => {
    return await prisma.module.update({
      where: { id },
      data,
    });
  },

  deleteModule: async (id: string) => {
    return await prisma.module.delete({
      where: { id },
    });
  },

  getModulesForUser: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userGroup: {
          include: {
            moduleAccess: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Admin has access to all modules
    if (user.role === 'ADMIN') {
      return await prisma.module.findMany({
        where: { isActive: true },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });
    }

    // Return modules accessible by user's group
    if (!user.userGroup) {
      return [];
    }

    const modules = user.userGroup.moduleAccess
      .filter(access => access.module.isActive && access.canView)
      .map(access => ({
        ...access.module,
        permissions: {
          canView: access.canView,
          canCreate: access.canCreate,
          canEdit: access.canEdit,
          canDelete: access.canDelete,
        },
      }))
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
      });

    return modules;
  },

  grantModuleAccess: async (
    moduleId: string,
    userGroupId: string,
    permissions: {
      canView?: boolean;
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
    }
  ) => {
    return await prisma.moduleAccess.create({
      data: {
        moduleId,
        userGroupId,
        ...permissions,
      },
      include: {
        module: true,
        userGroup: true,
      },
    });
  },

  updateModuleAccess: async (
    accessId: string,
    permissions: {
      canView?: boolean;
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
    }
  ) => {
    return await prisma.moduleAccess.update({
      where: { id: accessId },
      data: permissions,
      include: {
        module: true,
        userGroup: true,
      },
    });
  },

  revokeModuleAccess: async (accessId: string) => {
    return await prisma.moduleAccess.delete({
      where: { id: accessId },
    });
  },

  getModuleAccessByGroup: async (groupId: string) => {
    return await prisma.moduleAccess.findMany({
      where: { userGroupId: groupId },
      include: {
        module: true,
      },
      orderBy: {
        module: {
          name: 'asc',
        },
      },
    });
  },

  getGroupsForModule: async (moduleId: string) => {
    return await prisma.moduleAccess.findMany({
      where: { moduleId },
      include: {
        userGroup: true,
      },
    });
  },

  checkUserModuleAccess: async (
    userId: string,
    moduleKey: string,
    requiredPermission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' = 'canView'
  ): Promise<boolean> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userGroup: {
          include: {
            moduleAccess: {
              where: {
                module: {
                  key: moduleKey,
                  isActive: true,
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Admin has full access to all modules
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check if user has group and required permission
    if (!user.userGroup || !user.userGroup.isActive) {
      return false;
    }

    const access = user.userGroup.moduleAccess[0];
    if (!access) {
      return false;
    }

    return access[requiredPermission] === true;
  },
};
