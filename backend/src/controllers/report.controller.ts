import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const calculateWorkHours = (clockIn: Date, clockOut: Date | null): number => {
  if (!clockOut) return 0;
  return (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
};

export const getMySummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.clockIn = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: true
      }
    });

    const totalHours = entries.reduce((sum, entry) => {
      return sum + calculateWorkHours(entry.clockIn, entry.clockOut);
    }, 0);

    const byProject: Record<string, { name: string; hours: number }> = {};
    entries.forEach(entry => {
      if (entry.project) {
        if (!byProject[entry.project.id]) {
          byProject[entry.project.id] = {
            name: entry.project.name,
            hours: 0
          };
        }
        byProject[entry.project.id].hours += calculateWorkHours(entry.clockIn, entry.clockOut);
      }
    });

    const absenceRequests = await prisma.absenceRequest.findMany({
      where: {
        userId,
        status: 'APPROVED',
        ...(startDate && endDate ? {
          startDate: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        } : {})
      }
    });

    const totalAbsenceDays = absenceRequests.reduce((sum, req) => sum + req.days, 0);

    res.json({
      totalHours,
      totalDays: (totalHours / 8).toFixed(2),
      totalAbsenceDays,
      byProject: Object.values(byProject),
      entries: entries.length
    });
  } catch (error) {
    console.error('Get my summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
};

export const getUserSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where: any = { userId };

    if (startDate && endDate) {
      where.clockIn = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: true
      }
    });

    const totalHours = entries.reduce((sum, entry) => {
      return sum + calculateWorkHours(entry.clockIn, entry.clockOut);
    }, 0);

    const byProject: Record<string, { name: string; hours: number }> = {};
    entries.forEach(entry => {
      if (entry.project) {
        if (!byProject[entry.project.id]) {
          byProject[entry.project.id] = {
            name: entry.project.name,
            hours: 0
          };
        }
        byProject[entry.project.id].hours += calculateWorkHours(entry.clockIn, entry.clockOut);
      }
    });

    const absenceRequests = await prisma.absenceRequest.findMany({
      where: {
        userId,
        status: 'APPROVED',
        ...(startDate && endDate ? {
          startDate: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        } : {})
      }
    });

    const totalAbsenceDays = absenceRequests.reduce((sum, req) => sum + req.days, 0);

    res.json({
      user,
      totalHours,
      totalDays: (totalHours / 8).toFixed(2),
      totalAbsenceDays,
      byProject: Object.values(byProject),
      entries: entries.length
    });
  } catch (error) {
    console.error('Get user summary error:', error);
    res.status(500).json({ error: 'Failed to get user summary' });
  }
};

export const getAllUsersSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    const summaries = await Promise.all(
      users.map(async (user) => {
        const where: any = { userId: user.id };

        if (startDate && endDate) {
          where.clockIn = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          };
        }

        const entries = await prisma.timeEntry.findMany({ where });

        const totalHours = entries.reduce((sum, entry) => {
          return sum + calculateWorkHours(entry.clockIn, entry.clockOut);
        }, 0);

        return {
          user,
          totalHours,
          totalDays: (totalHours / 8).toFixed(2),
          entries: entries.length
        };
      })
    );

    res.json(summaries);
  } catch (error) {
    console.error('Get all users summary error:', error);
    res.status(500).json({ error: 'Failed to get users summary' });
  }
};

export const getProjectSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const where: any = { projectId };

    if (startDate && endDate) {
      where.clockIn = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const totalHours = entries.reduce((sum, entry) => {
      return sum + calculateWorkHours(entry.clockIn, entry.clockOut);
    }, 0);

    const byUser: Record<string, { user: any; hours: number }> = {};
    entries.forEach(entry => {
      if (!byUser[entry.userId]) {
        byUser[entry.userId] = {
          user: entry.user,
          hours: 0
        };
      }
      byUser[entry.userId].hours += calculateWorkHours(entry.clockIn, entry.clockOut);
    });

    res.json({
      project,
      totalHours,
      totalDays: (totalHours / 8).toFixed(2),
      byUser: Object.values(byUser),
      entries: entries.length
    });
  } catch (error) {
    console.error('Get project summary error:', error);
    res.status(500).json({ error: 'Failed to get project summary' });
  }
};
