import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const clockIn = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, description } = req.body;
    const userId = req.user!.id;

    // Check if user is already clocked in
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        status: 'CLOCKED_IN'
      }
    });

    if (existingEntry) {
      return res.status(400).json({ error: 'Already clocked in' });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        projectId,
        clockIn: new Date(),
        description,
        status: 'CLOCKED_IN'
      },
      include: {
        project: true
      }
    });

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
};

export const clockOut = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        status: 'CLOCKED_IN'
      }
    });

    if (!timeEntry) {
      return res.status(400).json({ error: 'Not clocked in' });
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOut: new Date(),
        status: 'CLOCKED_OUT'
      },
      include: {
        project: true
      }
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
};

export const getCurrentTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        status: 'CLOCKED_IN'
      },
      include: {
        project: true
      }
    });

    res.json(timeEntry || null);
  } catch (error) {
    console.error('Get current time entry error:', error);
    res.status(500).json({ error: 'Failed to get current time entry' });
  }
};

export const getMyTimeEntries = async (req: AuthRequest, res: Response) => {
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
      },
      orderBy: { clockIn: 'desc' }
    });

    res.json(entries);
  } catch (error) {
    console.error('Get my time entries error:', error);
    res.status(500).json({ error: 'Failed to get time entries' });
  }
};

export const getUserTimeEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
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
        project: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { clockIn: 'desc' }
    });

    res.json(entries);
  } catch (error) {
    console.error('Get user time entries error:', error);
    res.status(500).json({ error: 'Failed to get time entries' });
  }
};

export const updateTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clockIn, clockOut, projectId, description } = req.body;

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        projectId,
        description,
        status: clockOut ? 'CLOCKED_OUT' : 'CLOCKED_IN'
      },
      include: {
        project: true,
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

    res.json(timeEntry);
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
};

export const deleteTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.timeEntry.delete({ where: { id } });

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
};
