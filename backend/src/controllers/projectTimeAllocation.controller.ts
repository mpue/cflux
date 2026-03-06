import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get allocations for a time entry
export const getAllocationsForTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { timeEntryId } = req.params;
    const userId = req.user!.id;

    // Get user's employee profile
    const employeeProfile = await prisma.employee.findUnique({
      where: { userId }
    });

    // Verify the time entry belongs to the user or user is admin
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        ...(req.user!.role !== 'ADMIN' && employeeProfile ? { employeeId: employeeProfile.id } : {})
      }
    });

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found or access denied' });
    }

    const allocations = await prisma.projectTimeAllocation.findMany({
      where: { timeEntryId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        story: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(allocations);
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ error: 'Failed to get allocations' });
  }
};

// Create or update allocations for a time entry
export const setAllocationsForTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { timeEntryId } = req.params;
    const { allocations } = req.body;
    const userId = req.user!.id;

    // Get user's employee profile
    const employeeProfile = await prisma.employee.findUnique({
      where: { userId }
    });

    // Verify the time entry belongs to the user or user is admin
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        ...(req.user!.role !== 'ADMIN' && employeeProfile ? { employeeId: employeeProfile.id } : {})
      },
      select: {
        id: true,
        clockIn: true,
        clockOut: true,
        pauseMinutes: true
      }
    });

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found or access denied' });
    }

    if (!timeEntry.clockOut) {
      return res.status(400).json({ error: 'Cannot allocate time for active entry. Clock out first.' });
    }

    // Calculate total worked hours
    const clockInTime = new Date(timeEntry.clockIn).getTime();
    const clockOutTime = new Date(timeEntry.clockOut).getTime();
    const totalMinutes = (clockOutTime - clockInTime) / (1000 * 60);
    const pauseMinutes = timeEntry.pauseMinutes || 0;
    const workedMinutes = totalMinutes - pauseMinutes;
    const totalWorkedHours = workedMinutes / 60;

    // Validate allocations
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ error: 'Allocations must be a non-empty array' });
    }

    const totalAllocatedHours = allocations.reduce((sum: number, alloc: any) => sum + (alloc.hours || 0), 0);
    
    // Allow small rounding differences (0.1 hours = 6 minutes)
    if (Math.abs(totalAllocatedHours - totalWorkedHours) > 0.1) {
      return res.status(400).json({ 
        error: `Total allocated hours (${totalAllocatedHours.toFixed(2)}h) must equal worked hours (${totalWorkedHours.toFixed(2)}h)`,
        totalWorkedHours: parseFloat(totalWorkedHours.toFixed(2)),
        totalAllocatedHours: parseFloat(totalAllocatedHours.toFixed(2))
      });
    }

    // Validate each allocation
    for (const alloc of allocations) {
      if (!alloc.projectId || !alloc.hours || alloc.hours <= 0) {
        return res.status(400).json({ error: 'Each allocation must have a valid projectId and positive hours' });
      }
    }

    // Delete existing allocations and create new ones in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing allocations
      await tx.projectTimeAllocation.deleteMany({
        where: { timeEntryId }
      });

      // Create new allocations
      await tx.projectTimeAllocation.createMany({
        data: allocations.map((alloc: any) => ({
          timeEntryId,
          projectId: alloc.projectId,
          storyId: alloc.storyId || null,
          hours: alloc.hours,
          description: alloc.description || null
        }))
      });
    });

    // Fetch and return the updated allocations
    const updatedAllocations = await prisma.projectTimeAllocation.findMany({
      where: { timeEntryId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        story: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(updatedAllocations);
  } catch (error) {
    console.error('Set allocations error:', error);
    res.status(500).json({ error: 'Failed to set allocations' });
  }
};

// Delete an allocation
export const deleteAllocation = async (req: AuthRequest, res: Response) => {
  try {
    const { allocationId } = req.params;
    const userId = req.user!.id;

    // Find the allocation and verify access
    const allocation = await prisma.projectTimeAllocation.findUnique({
      where: { id: allocationId },
      include: {
        timeEntry: {
          select: {
            employeeId: true
          }
        }
      }
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Prüfe ob User Zugriff auf diesen TimeEntry hat (via employeeProfile)
    const userEmployee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!userEmployee) {
      return res.status(403).json({ error: 'No employee profile found' });
    }

    if (req.user!.role !== 'ADMIN' && allocation.timeEntry.employeeId !== userEmployee.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.projectTimeAllocation.delete({
      where: { id: allocationId }
    });

    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    console.error('Delete allocation error:', error);
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
};

// Get project time statistics
export const getProjectTimeStats = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    const userId = req.user!.id;

    const where: any = {};

    if (req.user!.role !== 'ADMIN') {
      // Get user's employee profile
      const employeeProfile = await prisma.employee.findUnique({
        where: { userId }
      });
      if (employeeProfile) {
        where.timeEntry = { employeeId: employeeProfile.id };
      }
    }

    if (projectId) {
      where.projectId = projectId as string;
    }

    if (startDate && endDate) {
      where.timeEntry = {
        ...where.timeEntry,
        clockIn: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      };
    }

    const allocations = await prisma.projectTimeAllocation.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        timeEntry: {
          select: {
            id: true,
            clockIn: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Group by project
    const projectStats = allocations.reduce((acc: any, alloc) => {
      const projectId = alloc.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          projectName: alloc.project.name,
          totalHours: 0,
          allocations: []
        };
      }
      acc[projectId].totalHours += alloc.hours;
      acc[projectId].allocations.push({
        id: alloc.id,
        hours: alloc.hours,
        description: alloc.description,
        date: alloc.timeEntry.clockIn,
        employee: alloc.timeEntry.employee
      });
      return acc;
    }, {});

    res.json(Object.values(projectStats));
  } catch (error) {
    console.error('Get project time stats error:', error);
    res.status(500).json({ error: 'Failed to get project time statistics' });
  }
};
