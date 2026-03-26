import { PrismaClient } from '@prisma/client';
import { moduleService, checkModulePermission } from '../services/module.service';

const prisma = new PrismaClient();

const makeModule = (overrides: Partial<any> = {}) => ({
  id: 'mod-1',
  name: 'Time Tracking',
  key: 'time_tracking',
  description: 'Track work time',
  icon: 'clock',
  route: '/time',
  isActive: true,
  sortOrder: 1,
  groupAccess: [],
  ...overrides,
});

const makeGroup = (overrides: Partial<any> = {}) => ({
  id: 'group-1',
  name: 'Employees',
  isActive: true,
  ...overrides,
});

const makeAccess = (overrides: Partial<any> = {}) => ({
  id: 'access-1',
  canView: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  userGroup: makeGroup(),
  module: makeModule(),
  ...overrides,
});

describe('Module Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== createModule =====
  describe('createModule', () => {
    it('should create a new module', async () => {
      const moduleData = { name: 'Invoices', key: 'invoices', sortOrder: 2 };
      const created = makeModule({ ...moduleData, id: 'mod-2', key: 'invoices', name: 'Invoices' });
      (prisma.module.create as jest.Mock).mockResolvedValue(created);

      const result = await moduleService.createModule(moduleData);

      expect(prisma.module.create).toHaveBeenCalledWith({ data: moduleData });
      expect(result.key).toBe('invoices');
    });
  });

  // ===== getAllModules =====
  describe('getAllModules', () => {
    it('should return only active modules by default', async () => {
      const modules = [makeModule(), makeModule({ id: 'mod-2', key: 'invoices' })];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(modules);

      const result = await moduleService.getAllModules();

      expect(prisma.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } })
      );
      expect(result).toHaveLength(2);
    });

    it('should return all modules including inactive when requested', async () => {
      const modules = [makeModule(), makeModule({ id: 'mod-2', isActive: false })];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(modules);

      const result = await moduleService.getAllModules(true);

      expect(prisma.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined })
      );
      expect(result).toHaveLength(2);
    });
  });

  // ===== getModuleById =====
  describe('getModuleById', () => {
    it('should return a module by id', async () => {
      const mod = makeModule({ groupAccess: [makeAccess()] });
      (prisma.module.findUnique as jest.Mock).mockResolvedValue(mod);

      const result = await moduleService.getModuleById('mod-1');

      expect(prisma.module.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'mod-1' } })
      );
      expect(result?.id).toBe('mod-1');
    });

    it('should return null when module does not exist', async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await moduleService.getModuleById('non-existent');

      expect(result).toBeNull();
    });
  });

  // ===== updateModule =====
  describe('updateModule', () => {
    it('should update module properties', async () => {
      const updated = makeModule({ name: 'Updated Name' });
      (prisma.module.update as jest.Mock).mockResolvedValue(updated);

      const result = await moduleService.updateModule('mod-1', { name: 'Updated Name' });

      expect(prisma.module.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'mod-1' } })
      );
      expect(result.name).toBe('Updated Name');
    });

    it('should deactivate a module', async () => {
      const deactivated = makeModule({ isActive: false });
      (prisma.module.update as jest.Mock).mockResolvedValue(deactivated);

      const result = await moduleService.updateModule('mod-1', { isActive: false });

      expect(result.isActive).toBe(false);
    });
  });

  // ===== deleteModule =====
  describe('deleteModule', () => {
    it('should delete a module by id', async () => {
      (prisma.module.delete as jest.Mock).mockResolvedValue(makeModule());

      await moduleService.deleteModule('mod-1');

      expect(prisma.module.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'mod-1' } })
      );
    });
  });

  // ===== getModulesForUser =====
  describe('getModulesForUser', () => {
    it('should throw when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(moduleService.getModulesForUser('user-1')).rejects.toThrow('User not found');
    });

    it('should return all active modules with full permissions for ADMIN users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        userGroupMemberships: [],
      });
      const allModules = [makeModule(), makeModule({ id: 'mod-2', key: 'invoices' })];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(allModules);

      const result = await moduleService.getModulesForUser('admin-1');

      expect(result).toHaveLength(2);
      result.forEach((mod) => {
        expect(mod.permissions).toEqual({
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        });
      });
    });

    it('should return empty array when user has no group memberships', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [],
      });

      const result = await moduleService.getModulesForUser('user-1');

      expect(result).toEqual([]);
    });

    it('should return modules accessible to user groups with group permissions', async () => {
      const group = makeGroup();
      const access = makeAccess({
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        userGroup: group,
      });
      const mod = makeModule({ groupAccess: [access] });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          { userGroupId: 'group-1', userGroup: group },
        ],
      });
      (prisma.module.findMany as jest.Mock).mockResolvedValue([mod]);

      const result = await moduleService.getModulesForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].permissions.canView).toBe(true);
      expect(result[0].permissions.canCreate).toBe(true);
      expect(result[0].permissions.canEdit).toBe(false);
    });

    it('should merge permissions from multiple groups (most permissive wins)', async () => {
      const group1 = makeGroup({ id: 'group-1' });
      const group2 = makeGroup({ id: 'group-2' });

      const access1 = makeAccess({
        id: 'access-1',
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        userGroup: group1,
      });
      const access2 = makeAccess({
        id: 'access-2',
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        userGroup: group2,
      });
      const mod = makeModule({ groupAccess: [access1, access2] });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          { userGroupId: 'group-1', userGroup: group1 },
          { userGroupId: 'group-2', userGroup: group2 },
        ],
      });
      (prisma.module.findMany as jest.Mock).mockResolvedValue([mod]);

      const result = await moduleService.getModulesForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].permissions.canCreate).toBe(true); // merged: true wins
      expect(result[0].permissions.canEdit).toBe(true);   // merged: true wins
      expect(result[0].permissions.canDelete).toBe(false); // both false → false
    });

    it('should not include modules from inactive groups', async () => {
      const inactiveGroup = makeGroup({ id: 'group-1', isActive: false });
      const access = makeAccess({ canView: true, userGroup: inactiveGroup });
      const mod = makeModule({ groupAccess: [access] });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          { userGroupId: 'group-1', userGroup: inactiveGroup },
        ],
      });
      (prisma.module.findMany as jest.Mock).mockResolvedValue([mod]);

      const result = await moduleService.getModulesForUser('user-1');

      // Module from inactive group should not be included
      expect(result).toHaveLength(0);
    });

    it('should sort by name when sortOrder is equal', async () => {
      const group = makeGroup({ id: 'group-1', isActive: true });
      const access = makeAccess({ userGroup: group, canView: true });
      const moduleB = makeModule({ id: 'm2', name: 'B Module', sortOrder: 1, groupAccess: [access] });
      const moduleA = makeModule({ id: 'm1', name: 'A Module', sortOrder: 1, groupAccess: [access] });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [{ userGroupId: 'group-1', userGroup: group }],
      });
      (prisma.module.findMany as jest.Mock).mockResolvedValue([moduleB, moduleA]);

      const result = await moduleService.getModulesForUser('user-1');

      expect(result.map((m) => m.name)).toEqual(['A Module', 'B Module']);
    });
  });

  // ===== grantModuleAccess =====
  describe('grantModuleAccess', () => {
    it('should create a new module access entry', async () => {
      const created = makeAccess({ canView: true, canCreate: true });
      (prisma.moduleAccess.create as jest.Mock).mockResolvedValue(created);

      const result = await moduleService.grantModuleAccess('mod-1', 'group-1', {
        canView: true,
        canCreate: true,
      });

      expect(prisma.moduleAccess.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moduleId: 'mod-1',
            userGroupId: 'group-1',
            canView: true,
            canCreate: true,
          }),
        })
      );
      expect(result.canView).toBe(true);
    });
  });

  // ===== updateModuleAccess =====
  describe('updateModuleAccess', () => {
    it('should update module access permissions', async () => {
      const updated = makeAccess({ canEdit: true, canDelete: true });
      (prisma.moduleAccess.update as jest.Mock).mockResolvedValue(updated);

      const result = await moduleService.updateModuleAccess('access-1', {
        canEdit: true,
        canDelete: true,
      });

      expect(prisma.moduleAccess.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'access-1' } })
      );
      expect(result.canEdit).toBe(true);
    });
  });

  // ===== revokeModuleAccess =====
  describe('revokeModuleAccess', () => {
    it('should delete module access entry', async () => {
      (prisma.moduleAccess.delete as jest.Mock).mockResolvedValue(makeAccess());

      await moduleService.revokeModuleAccess('access-1');

      expect(prisma.moduleAccess.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'access-1' } })
      );
    });
  });

  // ===== getModuleAccessByGroup =====
  describe('getModuleAccessByGroup', () => {
    it('should return all access entries for a group', async () => {
      const accessList = [makeAccess(), makeAccess({ id: 'access-2' })];
      (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue(accessList);

      const result = await moduleService.getModuleAccessByGroup('group-1');

      expect(prisma.moduleAccess.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userGroupId: 'group-1' } })
      );
      expect(result).toHaveLength(2);
    });
  });

  // ===== getGroupsForModule =====
  describe('getGroupsForModule', () => {
    it('should return all groups with access to a module', async () => {
      const accessList = [makeAccess()];
      (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue(accessList);

      const result = await moduleService.getGroupsForModule('mod-1');

      expect(prisma.moduleAccess.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { moduleId: 'mod-1' } })
      );
      expect(result).toHaveLength(1);
    });
  });

  // ===== checkUserModuleAccess =====
  describe('checkUserModuleAccess', () => {
    it('should return false when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await moduleService.checkUserModuleAccess('user-1', 'time_tracking');

      expect(result).toBe(false);
    });

    it('should return true for ADMIN regardless of module', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        userGroupMemberships: [],
      });

      const result = await moduleService.checkUserModuleAccess('admin-1', 'time_tracking');

      expect(result).toBe(true);
    });

    it('should return false when user has no group memberships', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [],
      });

      const result = await moduleService.checkUserModuleAccess('user-1', 'time_tracking');

      expect(result).toBe(false);
    });

    it('should return true when user group has canView permission', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          {
            userGroup: {
              id: 'group-1',
              isActive: true,
              moduleAccess: [{ canView: true, canCreate: false, canEdit: false, canDelete: false }],
            },
          },
        ],
      });

      const result = await moduleService.checkUserModuleAccess('user-1', 'time_tracking', 'canView');

      expect(result).toBe(true);
    });

    it('should return false when user group lacks the required permission', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          {
            userGroup: {
              id: 'group-1',
              isActive: true,
              moduleAccess: [{ canView: true, canCreate: false, canEdit: false, canDelete: false }],
            },
          },
        ],
      });

      const result = await moduleService.checkUserModuleAccess('user-1', 'time_tracking', 'canDelete');

      expect(result).toBe(false);
    });

    it('should return false when user groups are inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          {
            userGroup: {
              id: 'group-1',
              isActive: false,
              moduleAccess: [{ canView: true, canCreate: true, canEdit: true, canDelete: true }],
            },
          },
        ],
      });

      const result = await moduleService.checkUserModuleAccess('user-1', 'time_tracking');

      expect(result).toBe(false);
    });
  });

  // ===== checkModulePermission =====
  describe('checkModulePermission', () => {
    it('should return false when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkModulePermission('user-1', 'time_tracking', 'READ');

      expect(result).toBe(false);
    });

    it('should return true for ADMIN users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        userGroupMemberships: [],
      });

      expect(await checkModulePermission('admin-1', 'time_tracking', 'READ')).toBe(true);
      expect(await checkModulePermission('admin-1', 'time_tracking', 'WRITE')).toBe(true);
    });

    it('should return true for READ permission when user canView', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          {
            userGroup: {
              id: 'group-1',
              isActive: true,
              moduleAccess: [
                { canView: true, canCreate: false, canEdit: false, canDelete: false, module: {} },
              ],
            },
          },
        ],
      });

      const result = await checkModulePermission('user-1', 'time_tracking', 'READ');

      expect(result).toBe(true);
    });

    it('should return true for WRITE permission when user canEdit', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          {
            userGroup: {
              id: 'group-1',
              isActive: true,
              moduleAccess: [
                { canView: true, canCreate: false, canEdit: true, canDelete: false, module: {} },
              ],
            },
          },
        ],
      });

      const result = await checkModulePermission('user-1', 'time_tracking', 'WRITE');

      expect(result).toBe(true);
    });

    it('should return false for WRITE when user only has canView', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          {
            userGroup: {
              id: 'group-1',
              isActive: true,
              moduleAccess: [
                { canView: true, canCreate: false, canEdit: false, canDelete: false, module: {} },
              ],
            },
          },
        ],
      });

      const result = await checkModulePermission('user-1', 'time_tracking', 'WRITE');

      expect(result).toBe(false);
    });

    it('should return false when user group is inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        userGroupMemberships: [
          {
            userGroup: {
              id: 'group-1',
              isActive: false,
              moduleAccess: [
                { canView: true, canCreate: true, canEdit: true, canDelete: true, module: {} },
              ],
            },
          },
        ],
      });

      const result = await checkModulePermission('user-1', 'time_tracking', 'READ');

      expect(result).toBe(false);
    });
  });
});
