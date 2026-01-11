import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { 
  checkRestTimeViolation, 
  checkWeeklyHoursViolation,
  checkDailyHoursViolation,
  checkMissingPauseViolation,
  updateOvertimeBalance
} from '../services/compliance.service';
import { actionService } from '../services/action.service';

const prisma = new PrismaClient();

export const clockIn = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, locationId, description } = req.body;
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

    const clockInTime = new Date();

    // Compliance Check: Ruhezeit
    console.log(`[COMPLIANCE] Checking rest time for user ${userId} at clock-in`);
    await checkRestTimeViolation(userId, clockInTime);

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        projectId,
        locationId,
        clockIn: clockInTime,
        description,
        status: 'CLOCKED_IN'
      },
      include: {
        project: true,
        location: true
      }
    });

    // Trigger timeentry.clockin action
    try {
      await actionService.triggerAction('timeentry.clockin', {
        entityType: 'TIMEENTRY',
        entityId: timeEntry.id,
        userId: userId,
        startTime: clockInTime.toISOString(),
        projectId: projectId,
        locationId: locationId,
        description: description
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger timeentry.clockin:', actionError);
      // Don't fail the request if action fails
    }

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
};

export const clockOut = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { pauseMinutes } = req.body; // Pausen in Minuten

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        status: 'CLOCKED_IN'
      }
    });

    if (!timeEntry) {
      return res.status(400).json({ error: 'Not clocked in' });
    }

    const clockOutTime = new Date();

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOut: clockOutTime,
        status: 'CLOCKED_OUT',
        pauseMinutes: pauseMinutes || 0
      },
      include: {
        project: true,
        location: true
      }
    });

    // Compliance Checks nach Clock-Out
    console.log(`[COMPLIANCE] Running compliance checks for user ${userId} after clock-out (pause: ${pauseMinutes || 0} min)`);
    await checkDailyHoursViolation(userId, timeEntry.clockIn, clockOutTime);
    await checkMissingPauseViolation(userId, timeEntry.clockIn, clockOutTime);
    await checkWeeklyHoursViolation(userId, clockOutTime);
    await updateOvertimeBalance(userId, clockOutTime);
    console.log(`[COMPLIANCE] Compliance checks completed`);

    // Trigger timeentry.clockout action
    try {
      const duration = (clockOutTime.getTime() - timeEntry.clockIn.getTime()) / 1000; // seconds
      await actionService.triggerAction('timeentry.clockout', {
        entityType: 'TIMEENTRY',
        entityId: updatedEntry.id,
        userId: userId,
        startTime: timeEntry.clockIn.toISOString(),
        endTime: clockOutTime.toISOString(),
        duration: duration,
        pauseMinutes: pauseMinutes || 0,
        projectId: updatedEntry.projectId,
        locationId: updatedEntry.locationId
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger timeentry.clockout:', actionError);
      // Don't fail the request if action fails
    }

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
        status: { in: ['CLOCKED_IN', 'ON_PAUSE'] }
      },
      include: {
        project: true,
        location: true
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
        project: true,
        location: true
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

export const updateMyTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clockIn, clockOut, projectId, description } = req.body;
    const userId = req.user!.id;

    // Check if the time entry belongs to the user
    const existingEntry = await prisma.timeEntry.findFirst({
      where: { id, userId }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Time entry not found or access denied' });
    }

    // Allow project and description updates for active entries
    // Only restrict clockIn/clockOut changes for active entries
    if (existingEntry.status === 'CLOCKED_IN') {
      if (clockIn || clockOut) {
        return res.status(400).json({ error: 'Cannot edit clock times for active entry. Clock out first.' });
      }
      // Allow only projectId and description updates for active entries
      const timeEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          projectId: projectId === null ? null : projectId,
          description
        },
        include: {
          project: true,
          location: true
        }
      });
      return res.json(timeEntry);
    }

    // For clocked out entries, allow all updates
    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        projectId: projectId === null ? null : projectId,
        description
      },
      include: {
        project: true,
        location: true
      }
    });

    res.json(timeEntry);
  } catch (error) {
    console.error('Update my time entry error:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
};

export const deleteMyTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if the time entry belongs to the user
    const existingEntry = await prisma.timeEntry.findFirst({
      where: { id, userId }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Time entry not found or access denied' });
    }

    // Check if the entry is already clocked out
    if (existingEntry.status === 'CLOCKED_IN') {
      return res.status(400).json({ error: 'Cannot delete active time entry. Clock out first.' });
    }

    await prisma.timeEntry.delete({ where: { id } });

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Delete my time entry error:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
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

    // Compliance Checks ausführen wenn clockOut gesetzt ist
    if (clockOut && clockIn) {
      const userId = timeEntry.userId;
      const clockInDate = new Date(clockIn);
      const clockOutDate = new Date(clockOut);
      
      console.log(`[COMPLIANCE] Running compliance checks for user ${userId} after manual time entry update`);
      
      await checkDailyHoursViolation(userId, clockInDate, clockOutDate);
      await checkMissingPauseViolation(userId, clockInDate, clockOutDate);
      await checkWeeklyHoursViolation(userId, clockOutDate);
      await updateOvertimeBalance(userId, clockOutDate);
      
      console.log(`[COMPLIANCE] Compliance checks completed for manual update`);
    }

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

export const startPause = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        status: 'CLOCKED_IN'
      }
    });

    if (!timeEntry) {
      return res.status(400).json({ error: 'Not currently clocked in' });
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        status: 'ON_PAUSE',
        pauseStartedAt: new Date()
      },
      include: {
        project: true,
        location: true
      }
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Start pause error:', error);
    res.status(500).json({ error: 'Failed to start pause' });
  }
};

export const endPause = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        status: 'ON_PAUSE'
      }
    });

    if (!timeEntry || !timeEntry.pauseStartedAt) {
      return res.status(400).json({ error: 'Not currently on pause' });
    }

    const pauseEndTime = new Date();
    const pauseDurationMinutes = Math.floor(
      (pauseEndTime.getTime() - timeEntry.pauseStartedAt.getTime()) / (1000 * 60)
    );

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        status: 'CLOCKED_IN',
        pauseStartedAt: null,
        pauseMinutes: (timeEntry.pauseMinutes || 0) + pauseDurationMinutes
      },
      include: {
        project: true,
        location: true
      }
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('End pause error:', error);
    res.status(500).json({ error: 'Failed to end pause' });
  }
};
