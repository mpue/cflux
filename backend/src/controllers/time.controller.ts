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

// Helper function to get employeeId from userId
async function getEmployeeId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employeeProfile: true }
  });
  
  if (!user?.employeeProfile) {
    throw new Error('User does not have an employee profile');
  }
  
  return user.employeeProfile.id;
}

// Helper: Prüfe auf überlappende Zeiteinträge
async function checkOverlappingEntries(
  employeeId: string, 
  clockIn: Date, 
  clockOut: Date | null, 
  excludeEntryId?: string
): Promise<{ overlapping: boolean; conflictEntry?: any }> {
  if (!clockOut) {
    // Aktiver Eintrag: Prüfen ob ein anderer Eintrag nach clockIn startet
    const conflict = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        id: excludeEntryId ? { not: excludeEntryId } : undefined,
        OR: [
          {
            // Anderen aktiven Eintrag
            status: { in: ['CLOCKED_IN', 'ON_PAUSE'] }
          },
          {
            // Abgeschlossener Eintrag der nach unserem clockIn beginnt oder unseren clockIn überlappt
            clockIn: { lte: clockIn },
            clockOut: { gt: clockIn }
          }
        ]
      },
      select: {
        id: true,
        clockIn: true,
        clockOut: true,
        status: true
      }
    });
    return { overlapping: !!conflict, conflictEntry: conflict };
  }

  // Abgeschlossener Eintrag: Prüfen auf jede Überlappung
  const conflict = await prisma.timeEntry.findFirst({
    where: {
      employeeId,
      id: excludeEntryId ? { not: excludeEntryId } : undefined,
      OR: [
        {
          // Eintrag dessen clockIn innerhalb unseres Zeitraums liegt
          clockIn: { gte: clockIn, lt: clockOut }
        },
        {
          // Eintrag dessen clockOut innerhalb unseres Zeitraums liegt
          clockOut: { gt: clockIn, lte: clockOut }
        },
        {
          // Eintrag der unseren Zeitraum komplett umschliesst
          clockIn: { lte: clockIn },
          clockOut: { gte: clockOut }
        }
      ]
    },
    select: {
      id: true,
      clockIn: true,
      clockOut: true,
      status: true
    }
  });
  return { overlapping: !!conflict, conflictEntry: conflict };
}

export const clockIn = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, storyId, locationId, description } = req.body;
    const userId = req.user!.id;
    
    // Get employeeId from user
    const employeeId = await getEmployeeId(userId);

    // Check if employee is already clocked in
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        status: 'CLOCKED_IN'
      }
    });

    if (existingEntry) {
      return res.status(400).json({ error: 'Already clocked in' });
    }

    const clockInTime = new Date();

    // Compliance Check: Ruhezeit
    console.log(`[COMPLIANCE] Checking rest time for employee ${employeeId} at clock-in`);
    await checkRestTimeViolation(employeeId, clockInTime);

    const timeEntry = await prisma.timeEntry.create({
      data: {
        employeeId,
        projectId,
        storyId: storyId || undefined,
        locationId,
        clockIn: clockInTime,
        description,
        status: 'CLOCKED_IN'
      },
      include: {
        project: true,
        story: true,
        location: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Trigger timeentry.clockin action
    try {
      await actionService.triggerAction('timeentry.clockin', {
        entityType: 'TIMEENTRY',
        entityId: timeEntry.id,
        userId: userId,
        employeeId: employeeId,
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
    
    // Get employeeId from user
    const employeeId = await getEmployeeId(userId);

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
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
        story: true,
        location: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Compliance Checks nach Clock-Out
    console.log(`[COMPLIANCE] Running compliance checks for employee ${employeeId} after clock-out (pause: ${pauseMinutes || 0} min)`);
    await checkDailyHoursViolation(employeeId, timeEntry.clockIn, clockOutTime);
    await checkMissingPauseViolation(employeeId, timeEntry.clockIn, clockOutTime);
    await checkWeeklyHoursViolation(employeeId, clockOutTime);
    await updateOvertimeBalance(employeeId, clockOutTime);
    console.log(`[COMPLIANCE] Compliance checks completed`);

    // Budget-Update nach Clock-Out (async, blocking nicht erforderlich)
    try {
      const { updateBudgetFromTimeEntry } = require('../services/budgetUpdate.service');
      updateBudgetFromTimeEntry(updatedEntry.id).catch((budgetError: any) => {
        console.error('[BUDGET] Failed to update budget from time entry:', budgetError);
      });
    } catch (budgetImportError) {
      console.error('[BUDGET] Failed to import budget service:', budgetImportError);
    }

    // Trigger timeentry.clockout action
    try {
      const duration = (clockOutTime.getTime() - timeEntry.clockIn.getTime()) / 1000; // seconds
      await actionService.triggerAction('timeentry.clockout', {
        entityType: 'TIMEENTRY',
        entityId: updatedEntry.id,
        userId: userId,
        employeeId: employeeId,
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
    const employeeId = await getEmployeeId(userId);

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        status: { in: ['CLOCKED_IN', 'ON_PAUSE'] }
      },
      include: {
        project: true,
        story: true,
        location: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
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
    const employeeId = await getEmployeeId(userId);
    const { startDate, endDate } = req.query;

    const where: any = { employeeId };

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
        story: true,
        location: true,
        employee: {
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
    console.error('Get my time entries error:', error);
    res.status(500).json({ error: 'Failed to get time entries' });
  }
};

export const getUserTimeEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Get employee from userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employeeProfile: true }
    });

    if (!user?.employeeProfile) {
      return res.status(404).json({ error: 'User does not have an employee profile' });
    }

    const where: any = { employeeId: user.employeeProfile.id };

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
        story: true,
        employee: {
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
    const { clockIn, clockOut, projectId, storyId, description } = req.body;
    const userId = req.user!.id;
    const employeeId = await getEmployeeId(userId);

    // Check if the time entry belongs to the employee
    const existingEntry = await prisma.timeEntry.findFirst({
      where: { id, employeeId }
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
      // Allow only projectId, storyId and description updates for active entries
      const timeEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          projectId: projectId === null ? null : projectId,
          storyId: storyId === null ? null : storyId,
          description
        },
        include: {
          project: true,
          story: true,
          location: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
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
        storyId: storyId === null ? null : storyId,
        description
      },
      include: {
        project: true,
        story: true,
        location: true,
        employee: {
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
    console.error('Update my time entry error:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
};

export const deleteMyTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const employeeId = await getEmployeeId(userId);

    // Check if the time entry belongs to the employee
    const existingEntry = await prisma.timeEntry.findFirst({
      where: { id, employeeId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Time entry not found or access denied' });
    }

    // Check if the entry is already clocked out
    if (existingEntry.status === 'CLOCKED_IN') {
      return res.status(400).json({ error: 'Cannot delete active time entry. Clock out first.' });
    }

    // Audit-Trail: Aktion loggen vor dem Löschen
    try {
      await actionService.triggerAction('timeentry.deleted', {
        entityType: 'TIMEENTRY',
        entityId: id,
        userId: userId,
        employeeId: existingEntry.employeeId,
        deletedBy: userId,
        clockIn: existingEntry.clockIn.toISOString(),
        clockOut: existingEntry.clockOut?.toISOString(),
        projectId: existingEntry.projectId,
        projectName: existingEntry.project?.name,
        employeeName: `${existingEntry.employee.firstName} ${existingEntry.employee.lastName}`,
        pauseMinutes: existingEntry.pauseMinutes || 0,
        description: existingEntry.description,
        selfDeleted: true
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger timeentry.deleted:', actionError);
    }

    // Budget-Rückrechnung
    try {
      if (existingEntry.projectId && existingEntry.clockOut) {
        const { reverseBudgetFromTimeEntry } = require('../services/budgetUpdate.service');
        await reverseBudgetFromTimeEntry(id);
        console.log(`[BUDGET] Reversed budget for deleted time entry ${id}`);
      }
    } catch (budgetError) {
      console.error('[BUDGET] Failed to reverse budget:', budgetError);
    }

    // Zugehörige Compliance-Violations entfernen
    try {
      if (existingEntry.clockOut) {
        const entryDate = new Date(existingEntry.clockIn);
        entryDate.setHours(0, 0, 0, 0);
        const entryDateEnd = new Date(entryDate);
        entryDateEnd.setHours(23, 59, 59, 999);

        await prisma.complianceViolation.deleteMany({
          where: {
            employeeId: existingEntry.employeeId,
            date: { gte: entryDate, lte: entryDateEnd },
            type: { in: ['MAX_DAILY_HOURS', 'MISSING_PAUSE'] }
          }
        });
        console.log(`[COMPLIANCE] Removed related compliance violations for deleted time entry ${id}`);
      }
    } catch (complianceError) {
      console.error('[COMPLIANCE] Failed to clean up violations:', complianceError);
    }

    await prisma.timeEntry.delete({ where: { id } });

    console.log(`[AUDIT] Time entry ${id} self-deleted by user ${userId}`);

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Delete my time entry error:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
};

export const updateTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clockIn, clockOut, projectId, storyId, description } = req.body;

    // Overlap-Validierung vor dem Update
    if (clockIn && clockOut) {
      const clockInDate = new Date(clockIn);
      const clockOutDate = new Date(clockOut);

      // Bestehenden Eintrag laden um employeeId zu ermitteln
      const existingEntry = await prisma.timeEntry.findUnique({
        where: { id },
        select: { employeeId: true }
      });

      if (!existingEntry) {
        return res.status(404).json({ error: 'Time entry not found' });
      }

      const { overlapping, conflictEntry } = await checkOverlappingEntries(existingEntry.employeeId, clockInDate, clockOutDate, id);
      if (overlapping) {
        return res.status(400).json({
          error: 'Überlappung mit bestehendem Zeiteintrag erkannt',
          conflictEntry: conflictEntry ? {
            id: conflictEntry.id,
            clockIn: conflictEntry.clockIn,
            clockOut: conflictEntry.clockOut
          } : undefined
        });
      }
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        projectId,
        storyId: storyId !== undefined ? storyId : undefined,
        description,
        status: clockOut ? 'CLOCKED_OUT' : 'CLOCKED_IN'
      },
      include: {
        project: true,
        story: true,
        employee: {
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
      const employeeId = timeEntry.employeeId;
      const clockInDate = new Date(clockIn);
      const clockOutDate = new Date(clockOut);
      
      console.log(`[COMPLIANCE] Running compliance checks for employee ${employeeId} after manual time entry update`);
      
      await checkDailyHoursViolation(employeeId, clockInDate, clockOutDate);
      await checkMissingPauseViolation(employeeId, clockInDate, clockOutDate);
      await checkWeeklyHoursViolation(employeeId, clockOutDate);
      await updateOvertimeBalance(employeeId, clockOutDate);
      
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
    const userId = req.user!.id;

    // Eintrag laden für Audit-Trail und Rückrechnung
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    // Audit-Trail: Aktion loggen vor dem Löschen
    try {
      await actionService.triggerAction('timeentry.deleted', {
        entityType: 'TIMEENTRY',
        entityId: id,
        userId: userId,
        employeeId: existingEntry.employeeId,
        deletedBy: userId,
        clockIn: existingEntry.clockIn.toISOString(),
        clockOut: existingEntry.clockOut?.toISOString(),
        projectId: existingEntry.projectId,
        projectName: existingEntry.project?.name,
        employeeName: `${existingEntry.employee.firstName} ${existingEntry.employee.lastName}`,
        pauseMinutes: existingEntry.pauseMinutes || 0,
        description: existingEntry.description,
        manual: true
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger timeentry.deleted:', actionError);
    }

    // Budget-Rückrechnung
    try {
      if (existingEntry.projectId && existingEntry.clockOut) {
        const { reverseBudgetFromTimeEntry } = require('../services/budgetUpdate.service');
        await reverseBudgetFromTimeEntry(id);
        console.log(`[BUDGET] Reversed budget for deleted time entry ${id}`);
      }
    } catch (budgetError) {
      console.error('[BUDGET] Failed to reverse budget:', budgetError);
    }

    // Zugehörige Compliance-Violations entfernen (die durch diesen Eintrag entstanden sind)
    try {
      if (existingEntry.clockOut) {
        const entryDate = new Date(existingEntry.clockIn);
        entryDate.setHours(0, 0, 0, 0);
        const entryDateEnd = new Date(entryDate);
        entryDateEnd.setHours(23, 59, 59, 999);

        await prisma.complianceViolation.deleteMany({
          where: {
            employeeId: existingEntry.employeeId,
            date: { gte: entryDate, lte: entryDateEnd },
            type: { in: ['MAX_DAILY_HOURS', 'MISSING_PAUSE'] }
          }
        });
        console.log(`[COMPLIANCE] Removed related compliance violations for deleted time entry ${id}`);
      }
    } catch (complianceError) {
      console.error('[COMPLIANCE] Failed to clean up violations:', complianceError);
    }

    await prisma.timeEntry.delete({ where: { id } });

    console.log(`[AUDIT] Time entry ${id} deleted by admin ${userId} (Employee: ${existingEntry.employee.firstName} ${existingEntry.employee.lastName}, ClockIn: ${existingEntry.clockIn})`);

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
};

export const startPause = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const employeeId = await getEmployeeId(userId);

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
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
        location: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
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
    const employeeId = await getEmployeeId(userId);

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
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
        location: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('End pause error:', error);
    res.status(500).json({ error: 'Failed to end pause' });
  }
};

export const getLoggedInUsers = async (req: AuthRequest, res: Response) => {
  try {
    const loggedInUsers = await prisma.timeEntry.findMany({
      where: {
        status: {
          in: ['CLOCKED_IN', 'ON_PAUSE']
        },
        clockOut: null
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userId: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        clockIn: 'desc'
      }
    });

    const formattedUsers = loggedInUsers.map(entry => ({
      userId: entry.employee.userId || entry.employee.id,  // Backward compatibility
      employeeId: entry.employee.id,
      firstName: entry.employee.firstName,
      lastName: entry.employee.lastName,
      email: entry.employee.email,
      status: entry.status,
      clockIn: entry.clockIn,
      project: entry.project,
      location: entry.location,
      pauseMinutes: entry.pauseMinutes || 0
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get logged in users error:', error);
    res.status(500).json({ error: 'Failed to get logged in users' });
  }
};

// Admin: Create manual time entry
export const createTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, clockIn, clockOut, projectId, storyId, description, pauseMinutes } = req.body;

    if (!userId || !clockIn) {
      return res.status(400).json({ error: 'userId and clockIn are required' });
    }

    // Get employeeId from userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employeeProfile: true }
    });

    if (!user?.employeeProfile) {
      return res.status(400).json({ error: 'User does not have an employee profile' });
    }

    const employeeId = user.employeeProfile.id;
    const clockInDate = new Date(clockIn);
    const clockOutDate = clockOut ? new Date(clockOut) : undefined;

    // Validate dates
    if (clockOutDate && clockOutDate <= clockInDate) {
      return res.status(400).json({ error: 'clockOut must be after clockIn' });
    }

    // Validate: Keine Zeiteinträge in der Zukunft
    if (clockInDate > new Date()) {
      return res.status(400).json({ error: 'clockIn cannot be in the future' });
    }

    // Überlappungs-Prüfung
    const { overlapping, conflictEntry } = await checkOverlappingEntries(
      employeeId, clockInDate, clockOutDate || null
    );
    if (overlapping) {
      return res.status(400).json({ 
        error: `Überlappender Zeiteintrag gefunden (${conflictEntry?.clockIn?.toISOString()} - ${conflictEntry?.clockOut?.toISOString() || 'aktiv'})`,
        conflictEntryId: conflictEntry?.id
      });
    }

    // Determine status
    const status = clockOutDate ? 'CLOCKED_OUT' : 'CLOCKED_IN';

    const timeEntry = await prisma.timeEntry.create({
      data: {
        employeeId,
        projectId: projectId || undefined,
        storyId: storyId || undefined,
        clockIn: clockInDate,
        clockOut: clockOutDate,
        description,
        pauseMinutes: pauseMinutes || 0,
        status
      },
      include: {
        project: true,
        story: true,
        location: true,
        employee: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Run compliance checks if entry is completed
    if (clockOutDate) {
      console.log(`[COMPLIANCE] Running compliance checks for manually created time entry`);
      try {
        await checkDailyHoursViolation(employeeId, clockInDate, clockOutDate);
        await checkWeeklyHoursViolation(employeeId, clockInDate);
        await checkMissingPauseViolation(employeeId, clockInDate, clockOutDate);
        await updateOvertimeBalance(employeeId, clockInDate);
        console.log(`[COMPLIANCE] Compliance checks completed`);
      } catch (complianceError) {
        console.error('[COMPLIANCE] Error during compliance checks:', complianceError);
      }
    }

    // Trigger action
    try {
      await actionService.triggerAction('timeentry.created', {
        entityType: 'TIMEENTRY',
        entityId: timeEntry.id,
        userId: req.user!.id,
        employeeId: employeeId,
        targetUserId: userId,
        startTime: clockInDate.toISOString(),
        endTime: clockOutDate?.toISOString(),
        projectId: projectId,
        description: description,
        manual: true
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger timeentry.created:', actionError);
    }

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
};
