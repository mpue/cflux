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
        userGroupMemberships: {
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
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Admin has access to all modules with full permissions
    if (user.role === 'ADMIN') {
      const allModules = await prisma.module.findMany({
        where: { isActive: true },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });
      
      // Add full permissions for admin
      return allModules.map(module => ({
        ...module,
        permissions: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
      }));
    }

    // Return modules accessible by any of user's groups
    if (!user.userGroupMemberships || user.userGroupMemberships.length === 0) {
      return [];
    }

    // Collect all module access from all user groups
    const moduleMap = new Map<string, any>();

    for (const membership of user.userGroupMemberships) {
      if (!membership.userGroup.isActive) {
        continue;
      }

      for (const access of membership.userGroup.moduleAccess) {
        if (!access.module.isActive || !access.canView) {
          continue;
        }

        const moduleId = access.module.id;
        const existingModule = moduleMap.get(moduleId);

        if (!existingModule) {
          // Add new module with its permissions
          moduleMap.set(moduleId, {
            ...access.module,
            permissions: {
              canView: access.canView,
              canCreate: access.canCreate,
              canEdit: access.canEdit,
              canDelete: access.canDelete,
            },
          });
        } else {
          // Merge permissions (use the most permissive)
          existingModule.permissions.canView = existingModule.permissions.canView || access.canView;
          existingModule.permissions.canCreate = existingModule.permissions.canCreate || access.canCreate;
          existingModule.permissions.canEdit = existingModule.permissions.canEdit || access.canEdit;
          existingModule.permissions.canDelete = existingModule.permissions.canDelete || access.canDelete;
        }
      }
    }

    // Convert map to array and sort
    const modules = Array.from(moduleMap.values()).sort((a, b) => {
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
        userGroupMemberships: {
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

    // Check if user has any group with the required permission
    if (!user.userGroupMemberships || user.userGroupMemberships.length === 0) {
      return false;
    }

    // Check all user groups for the required permission
    for (const membership of user.userGroupMemberships) {
      if (!membership.userGroup.isActive) {
        continue;
      }

      for (const access of membership.userGroup.moduleAccess) {
        if (access[requiredPermission] === true) {
          return true;
        }
      }
    }

    return false;
  },
};

// Export standalone function for easy imports
export const checkModulePermission = async (
  userId: string,
  moduleKey: string,
  permission: 'READ' | 'WRITE'
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userGroupMemberships: {
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
                include: {
                  module: true,
                },
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

  // Admin has all permissions
  if (user.role === 'ADMIN') {
    return true;
  }

  // Check user groups for permission
  for (const membership of user.userGroupMemberships) {
    if (!membership.userGroup.isActive) {
      continue;
    }

    for (const access of membership.userGroup.moduleAccess) {
      if (permission === 'READ' && access.canView) {
        return true;
      }
      if (permission === 'WRITE' && (access.canEdit || access.canCreate)) {
        return true;
      }
    }
  }

  return false;
};
