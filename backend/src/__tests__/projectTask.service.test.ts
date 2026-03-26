import { PrismaClient } from '@prisma/client';
import {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskDependencies,
  getDependentTasks,
} from '../services/projectTask.service';

const prisma = new PrismaClient();

describe('projectTask.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('creates task without dependencies', async () => {
      (prisma.projectTask.create as jest.Mock).mockResolvedValue({ id: 't1' });
      (prisma.projectTask.findUnique as jest.Mock).mockResolvedValue({ id: 't1' });

      const result = await createTask({ projectId: 'p1', name: 'Task 1' });

      expect(prisma.projectTask.create).toHaveBeenCalled();
      expect(prisma.taskDependency.createMany).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 't1' });
    });

    it('creates dependencies when dependsOn is provided and valid', async () => {
      (prisma.projectTask.create as jest.Mock).mockResolvedValue({ id: 't1' });
      (prisma.projectTask.findUnique as jest.Mock)
        .mockResolvedValueOnce({ projectId: 'p1' })
        .mockResolvedValueOnce({ id: 't1' });
      (prisma.projectTask.findMany as jest.Mock).mockResolvedValue([
        { id: 't2', projectId: 'p1' },
        { id: 't3', projectId: 'p1' },
      ]);
      (prisma.taskDependency.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.taskDependency.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await createTask({ projectId: 'p1', name: 'Task 1', dependsOn: ['t2', 't3'] });

      expect(prisma.taskDependency.createMany).toHaveBeenCalledWith({
        data: [
          { taskId: 't1', dependsOnTaskId: 't2' },
          { taskId: 't1', dependsOnTaskId: 't3' },
        ],
      });
    });

    it('throws when task depends on itself', async () => {
      (prisma.projectTask.create as jest.Mock).mockResolvedValue({ id: 't1' });

      await expect(
        createTask({ projectId: 'p1', name: 'Task 1', dependsOn: ['t1'] })
      ).rejects.toThrow('A task cannot depend on itself');
    });

    it('throws when dependency tasks are missing', async () => {
      (prisma.projectTask.create as jest.Mock).mockResolvedValue({ id: 't1' });
      (prisma.projectTask.findUnique as jest.Mock).mockResolvedValue({ projectId: 'p1' });
      (prisma.projectTask.findMany as jest.Mock).mockResolvedValue([{ id: 't2', projectId: 'p1' }]);

      await expect(
        createTask({ projectId: 'p1', name: 'Task 1', dependsOn: ['t2', 't3'] })
      ).rejects.toThrow('One or more dependency tasks not found');
    });

    it('throws when dependency is from another project', async () => {
      (prisma.projectTask.create as jest.Mock).mockResolvedValue({ id: 't1' });
      (prisma.projectTask.findUnique as jest.Mock).mockResolvedValue({ projectId: 'p1' });
      (prisma.projectTask.findMany as jest.Mock).mockResolvedValue([{ id: 't2', projectId: 'p2' }]);

      await expect(
        createTask({ projectId: 'p1', name: 'Task 1', dependsOn: ['t2'] })
      ).rejects.toThrow('Dependencies must belong to the same project');
    });

    it('throws on circular dependency', async () => {
      (prisma.projectTask.create as jest.Mock).mockResolvedValue({ id: 't1' });
      (prisma.projectTask.findUnique as jest.Mock).mockResolvedValue({ projectId: 'p1' });
      (prisma.projectTask.findMany as jest.Mock).mockResolvedValue([{ id: 't2', projectId: 'p1' }]);
      (prisma.taskDependency.findMany as jest.Mock)
        .mockResolvedValueOnce([{ dependsOnTaskId: 't1' }]);

      await expect(
        createTask({ projectId: 'p1', name: 'Task 1', dependsOn: ['t2'] })
      ).rejects.toThrow('Circular dependency detected. This would create a dependency loop.');
    });
  });

  describe('read methods', () => {
    it('getTasksByProject returns tasks', async () => {
      (prisma.projectTask.findMany as jest.Mock).mockResolvedValue([{ id: 't1' }]);

      const result = await getTasksByProject('p1');

      expect(prisma.projectTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 'p1' } })
      );
      expect(result).toEqual([{ id: 't1' }]);
    });

    it('getTaskById returns task', async () => {
      (prisma.projectTask.findUnique as jest.Mock).mockResolvedValue({ id: 't1' });

      const result = await getTaskById('t1');

      expect(result).toEqual({ id: 't1' });
    });

    it('getTaskDependencies returns dependencies', async () => {
      (prisma.taskDependency.findMany as jest.Mock).mockResolvedValue([{ id: 'd1' }]);

      const result = await getTaskDependencies('t1');

      expect(result).toEqual([{ id: 'd1' }]);
    });

    it('getDependentTasks returns dependent tasks', async () => {
      (prisma.taskDependency.findMany as jest.Mock).mockResolvedValue([{ id: 'd1' }]);

      const result = await getDependentTasks('t1');

      expect(result).toEqual([{ id: 'd1' }]);
    });
  });

  describe('updateTask', () => {
    it('updates task data only when dependsOn is undefined', async () => {
      (prisma.projectTask.update as jest.Mock).mockResolvedValue({ id: 't1' });
      (prisma.projectTask.findUnique as jest.Mock).mockResolvedValue({ id: 't1', name: 'Updated' });

      const result = await updateTask('t1', { name: 'Updated' });

      expect(prisma.projectTask.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { name: 'Updated' },
      });
      expect(prisma.taskDependency.deleteMany).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 't1', name: 'Updated' });
    });

    it('replaces dependencies when dependsOn is empty array', async () => {
      (prisma.projectTask.update as jest.Mock).mockResolvedValue({ id: 't1' });
      (prisma.taskDependency.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.projectTask.findUnique as jest.Mock).mockResolvedValue({ id: 't1' });

      await updateTask('t1', { dependsOn: [] });

      expect(prisma.taskDependency.deleteMany).toHaveBeenCalledWith({ where: { taskId: 't1' } });
      expect(prisma.taskDependency.createMany).not.toHaveBeenCalled();
    });

    it('replaces dependencies when dependsOn contains items', async () => {
      (prisma.projectTask.update as jest.Mock).mockResolvedValue({ id: 't1' });
      (prisma.projectTask.findUnique as jest.Mock)
        .mockResolvedValueOnce({ projectId: 'p1' })
        .mockResolvedValueOnce({ id: 't1' });
      (prisma.projectTask.findMany as jest.Mock).mockResolvedValue([{ id: 't2', projectId: 'p1' }]);
      (prisma.taskDependency.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.taskDependency.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.taskDependency.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await updateTask('t1', { dependsOn: ['t2'] });

      expect(prisma.taskDependency.createMany).toHaveBeenCalledWith({
        data: [{ taskId: 't1', dependsOnTaskId: 't2' }],
      });
    });
  });

  describe('deleteTask', () => {
    it('deletes a task', async () => {
      (prisma.projectTask.delete as jest.Mock).mockResolvedValue({ id: 't1' });

      const result = await deleteTask('t1');

      expect(prisma.projectTask.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
      expect(result).toEqual({ id: 't1' });
    });
  });
});
