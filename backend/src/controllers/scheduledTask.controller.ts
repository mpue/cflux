import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { refreshTask, triggerTaskNow } from '../services/scheduler.service';

const prisma = new PrismaClient();

// Get all scheduled tasks
export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, taskType } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (taskType) where.taskType = taskType;

    const tasks = await prisma.scheduledTask.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get scheduled tasks error:', error);
    res.status(500).json({ error: 'Failed to get scheduled tasks' });
  }
};

// Get single task with recent executions
export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.scheduledTask.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get scheduled task error:', error);
    res.status(500).json({ error: 'Failed to get scheduled task' });
  }
};

// Update task (change schedule, status, etc.)
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cronExpression, status, name, description, config } = req.body;

    const existing = await prisma.scheduledTask.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const data: any = {};
    if (cronExpression !== undefined) data.cronExpression = cronExpression;
    if (status !== undefined) data.status = status;
    if (name !== undefined && !existing.isSystemTask) data.name = name;
    if (description !== undefined) data.description = description;
    if (config !== undefined) data.config = config;

    const task = await prisma.scheduledTask.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Refresh the scheduler
    await refreshTask(id);

    res.json(task);
  } catch (error) {
    console.error('Update scheduled task error:', error);
    res.status(500).json({ error: 'Failed to update scheduled task' });
  }
};

// Manually trigger a task
export const triggerTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.scheduledTask.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await triggerTaskNow(id);

    // Reload task to get updated lastRunAt etc.
    const updated = await prisma.scheduledTask.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    res.json({ message: 'Task triggered successfully', task: updated });
  } catch (error) {
    console.error('Trigger scheduled task error:', error);
    res.status(500).json({ error: 'Failed to trigger scheduled task' });
  }
};

// Get executions for a task
export const getTaskExecutions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const executions = await prisma.scheduledTaskExecution.findMany({
      where: { taskId: id },
      orderBy: { startedAt: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
    });

    res.json(executions);
  } catch (error) {
    console.error('Get task executions error:', error);
    res.status(500).json({ error: 'Failed to get task executions' });
  }
};
