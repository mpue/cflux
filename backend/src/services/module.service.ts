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
    // PLUS modules without any access restrictions (public modules)
    
    // Get all active modules with ALL their group access entries (not just user's groups)
    const allActiveModules = await prisma.module.findMany({
      where: { isActive: true },
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

    const moduleMap = new Map<string, any>();

    // Extract user's group IDs for filtering
    const userGroupIds = user.userGroupMemberships
      ? user.userGroupMemberships.map(m => m.userGroup.id)
      : [];

    // First, add all public modules (those without ANY group access restrictions in the entire system)
    for (const module of allActiveModules) {
      if (module.groupAccess.length === 0) {
        // Public module - no restrictions at all, accessible to everyone
        moduleMap.set(module.id, {
          ...module,
          permissions: {
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
          },
        });
      }
    }

    // Then, add restricted modules (those with group access restrictions)
    // Only add if the user belongs to one of the allowed groups
    if (userGroupIds.length > 0) {
      for (const module of allActiveModules) {
        if (module.groupAccess.length > 0) {
          // This is a restricted module - check if user's groups have access
          for (const access of module.groupAccess) {
            if (!access.userGroup.isActive || !access.canView) {
              continue;
            }

            // Check if this access entry is for one of the user's groups
            if (!userGroupIds.includes(access.userGroup.id)) {
              continue;
            }

            const moduleId = module.id;
            const existingModule = moduleMap.get(moduleId);

            if (!existingModule) {
              // Add new module with its permissions
              moduleMap.set(moduleId, {
                ...module,
                permissions: {
                  canView: access.canView,
                  canCreate: access.canCreate,
                  canEdit: access.canEdit,
                  canDelete: access.canDelete,
                },
              });
            } else {
              // Module already exists (from another group) - merge permissions (most permissive wins)
              existingModule.permissions.canView =
                existingModule.permissions.canView || access.canView;
              existingModule.permissions.canCreate =
                existingModule.permissions.canCreate || access.canCreate;
              existingModule.permissions.canEdit =
                existingModule.permissions.canEdit || access.canEdit;
              existingModule.permissions.canDelete =
                existingModule.permissions.canDelete || access.canDelete;
            }
          }
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
