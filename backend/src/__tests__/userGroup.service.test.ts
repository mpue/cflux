import { PrismaClient } from '@prisma/client';
import { userGroupService } from '../services/userGroup.service';

const prisma = new PrismaClient();

describe('userGroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createUserGroup creates group with expected payload', async () => {
    (prisma.userGroup.create as jest.Mock).mockResolvedValue({ id: 'g1', name: 'Team A' });

    const result = await userGroupService.createUserGroup({
      name: 'Team A',
      description: 'Desc',
      color: '#123',
    });

    expect(prisma.userGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Team A', description: 'Desc', color: '#123' },
      })
    );
    expect(result.id).toBe('g1');
  });

  it('getAllUserGroups filters active by default', async () => {
    (prisma.userGroup.findMany as jest.Mock).mockResolvedValue([{ id: 'g1' }]);

    const result = await userGroupService.getAllUserGroups();

    expect(prisma.userGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
    expect(result).toHaveLength(1);
  });

  it('getAllUserGroups includes inactive when requested', async () => {
    (prisma.userGroup.findMany as jest.Mock).mockResolvedValue([{ id: 'g1' }, { id: 'g2' }]);

    const result = await userGroupService.getAllUserGroups(true);

    expect(prisma.userGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
    expect(result).toHaveLength(2);
  });

  it('getUserGroupById returns group with memberships', async () => {
    (prisma.userGroup.findUnique as jest.Mock).mockResolvedValue({ id: 'g1' });

    const result = await userGroupService.getUserGroupById('g1');

    expect(prisma.userGroup.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'g1' } })
    );
    expect(result.id).toBe('g1');
  });

  it('updateUserGroup updates existing group', async () => {
    (prisma.userGroup.update as jest.Mock).mockResolvedValue({ id: 'g1', name: 'New' });

    const result = await userGroupService.updateUserGroup('g1', { name: 'New' });

    expect(prisma.userGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'g1' }, data: { name: 'New' } })
    );
    expect(result.name).toBe('New');
  });

  it('deleteUserGroup deletes group', async () => {
    (prisma.userGroup.delete as jest.Mock).mockResolvedValue({});

    await userGroupService.deleteUserGroup('g1');

    expect(prisma.userGroup.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
  });

  it('addUserToGroup creates membership when not existing', async () => {
    (prisma.userGroupMembership.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.userGroupMembership.create as jest.Mock).mockResolvedValue({});

    await userGroupService.addUserToGroup('u1', 'g1');

    expect(prisma.userGroupMembership.create).toHaveBeenCalledWith({
      data: { userId: 'u1', userGroupId: 'g1' },
    });
  });

  it('addUserToGroup does not create duplicate membership', async () => {
    (prisma.userGroupMembership.findUnique as jest.Mock).mockResolvedValue({ id: 'm1' });

    await userGroupService.addUserToGroup('u1', 'g1');

    expect(prisma.userGroupMembership.create).not.toHaveBeenCalled();
  });

  it('removeUserFromGroup deletes membership', async () => {
    (prisma.userGroupMembership.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await userGroupService.removeUserFromGroup('u1', 'g1');

    expect(prisma.userGroupMembership.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', userGroupId: 'g1' },
    });
  });

  it('getUsersByGroup maps memberships to users', async () => {
    (prisma.userGroupMembership.findMany as jest.Mock).mockResolvedValue([
      { user: { id: 'u1', firstName: 'A' } },
      { user: { id: 'u2', firstName: 'B' } },
    ]);

    const users = await userGroupService.getUsersByGroup('g1');

    expect(users).toEqual([{ id: 'u1', firstName: 'A' }, { id: 'u2', firstName: 'B' }]);
  });

  it('getUserGroups maps memberships to groups', async () => {
    (prisma.userGroupMembership.findMany as jest.Mock).mockResolvedValue([
      { userGroup: { id: 'g1' } },
      { userGroup: { id: 'g2' } },
    ]);

    const groups = await userGroupService.getUserGroups('u1');

    expect(groups).toEqual([{ id: 'g1' }, { id: 'g2' }]);
  });

  it('setUserGroups replaces memberships and creates new ones', async () => {
    (prisma.userGroupMembership.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.userGroupMembership.createMany as jest.Mock).mockResolvedValue({ count: 2 });

    await userGroupService.setUserGroups('u1', ['g1', 'g2']);

    expect(prisma.userGroupMembership.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.userGroupMembership.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'u1', userGroupId: 'g1' },
        { userId: 'u1', userGroupId: 'g2' },
      ],
    });
  });

  it('setUserGroups only clears memberships when input is empty', async () => {
    (prisma.userGroupMembership.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

    await userGroupService.setUserGroups('u1', []);

    expect(prisma.userGroupMembership.deleteMany).toHaveBeenCalled();
    expect(prisma.userGroupMembership.createMany).not.toHaveBeenCalled();
  });
});
