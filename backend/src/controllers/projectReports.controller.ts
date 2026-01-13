import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * GET /api/project-reports/overview
 * Projekt-Übersicht Report
 * 
 * Query Parameters:
 * - status: Filter nach Projekt-Status (active/inactive)
 * - customerId: Filter nach Kunde
 * - startDate: Von-Datum (ISO)
 * - endDate: Bis-Datum (ISO)
 */
export const getProjectOverview = async (req: AuthRequest, res: Response) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;

    // Base query
    const whereClause: any = {};

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    if (customerId) {
      whereClause.customerId = customerId as string;
    }

    // Projekte laden mit Budget und Zeitdaten
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        budget: {
          where: { isActive: true },
          select: {
            id: true,
            totalBudget: true,
            plannedCosts: true,
            actualCosts: true,
            remainingBudget: true,
            budgetUtilization: true,
            status: true,
          },
        },
        assignments: {
          where: { user: { isActive: true } },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Zeiteinträge aggregieren
    const projectReports = await Promise.all(
      projects.map(async (project) => {
        // Zeiteinträge für das Projekt
        const timeEntriesWhere: any = {
          projectId: project.id,
          status: 'CLOCKED_OUT',
        };

        if (startDate) {
          timeEntriesWhere.clockIn = {
            ...timeEntriesWhere.clockIn,
            gte: new Date(startDate as string),
          };
        }

        if (endDate) {
          timeEntriesWhere.clockOut = {
            ...timeEntriesWhere.clockOut,
            lte: new Date(endDate as string),
          };
        }

        const timeEntries = await prisma.timeEntry.findMany({
          where: timeEntriesWhere,
          select: {
            clockIn: true,
            clockOut: true,
            pauseMinutes: true,
            userId: true,
          },
        });

        // Stunden berechnen
        let totalHours = 0;
        const userHours: Record<string, number> = {};

        for (const entry of timeEntries) {
          if (entry.clockOut) {
            const startTime = new Date(entry.clockIn).getTime();
            const endTime = new Date(entry.clockOut).getTime();
            const pauseMs = (entry.pauseMinutes || 0) * 60 * 1000;
            const workedMs = endTime - startTime - pauseMs;
            const hours = workedMs / (1000 * 60 * 60);

            totalHours += hours;

            if (!userHours[entry.userId]) {
              userHours[entry.userId] = 0;
            }
            userHours[entry.userId] += hours;
          }
        }

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          isActive: project.isActive,
          customer: project.customer
            ? {
                id: project.customer.id,
                name: project.customer.name,
              }
            : null,
          budget: project.budget
            ? {
                totalBudget: project.budget.totalBudget,
                plannedCosts: project.budget.plannedCosts,
                actualCosts: project.budget.actualCosts,
                remainingBudget: project.budget.remainingBudget,
                utilization: project.budget.budgetUtilization,
                status: project.budget.status,
              }
            : null,
          timeTracking: {
            totalHours: Math.round(totalHours * 100) / 100,
            userCount: Object.keys(userHours).length,
            topUsers: Object.entries(userHours)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([userId, hours]) => {
                const user = project.assignments.find((a) => a.userId === userId)?.user;
                return {
                  userId,
                  name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                  hours: Math.round(hours * 100) / 100,
                };
              }),
          },
          teamSize: project.assignments.length,
        };
      })
    );

    res.json({
      projects: projectReports,
      summary: {
        totalProjects: projectReports.length,
        activeProjects: projectReports.filter((p) => p.isActive).length,
        totalBudget: projectReports.reduce((sum, p) => sum + (p.budget?.totalBudget || 0), 0),
        totalActualCosts: projectReports.reduce((sum, p) => sum + (p.budget?.actualCosts || 0), 0),
        totalHours: projectReports.reduce((sum, p) => sum + p.timeTracking.totalHours, 0),
      },
    });
  } catch (error) {
    console.error('Fehler beim Laden der Projekt-Übersicht:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Projekt-Übersicht' });
  }
};

/**
 * GET /api/project-reports/time-tracking
 * Zeiterfassung Report pro Projekt
 * 
 * Query Parameters:
 * - projectId: Projekt ID (required)
 * - startDate: Von-Datum (ISO)
 * - endDate: Bis-Datum (ISO)
 * - userId: Filter nach User
 * - groupBy: 'day' | 'week' | 'month' | 'user' (default: 'user')
 */
export const getTimeTrackingReport = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, startDate, endDate, userId, groupBy = 'user' } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Projekt ID erforderlich' });
    }

    // Projekt laden
    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        budget: {
          where: { isActive: true },
          select: {
            totalBudget: true,
            plannedCosts: true,
            actualCosts: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Projekt nicht gefunden' });
    }

    // Zeiteinträge laden
    const whereClause: any = {
      projectId: projectId as string,
      status: 'CLOCKED_OUT',
    };

    if (userId) {
      whereClause.userId = userId as string;
    }

    if (startDate) {
      whereClause.clockIn = {
        gte: new Date(startDate as string),
      };
    }

    if (endDate) {
      whereClause.clockOut = {
        lte: new Date(endDate as string),
      };
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: {
        clockIn: 'desc',
      },
    });

    // Daten gruppieren
    const grouped: Record<string, any> = {};
    let totalHours = 0;
    let totalCost = 0;

    for (const entry of timeEntries) {
      if (!entry.clockOut) continue;

      const startTime = new Date(entry.clockIn).getTime();
      const endTime = new Date(entry.clockOut).getTime();
      const pauseMs = (entry.pauseMinutes || 0) * 60 * 1000;
      const workedMs = endTime - startTime - pauseMs;
      const hours = workedMs / (1000 * 60 * 60);

      // Stundensatz ermitteln (User → Projekt → System)
      let hourlyRate = entry.user.hourlyRate || project.defaultHourlyRate || 100;
      const cost = hours * hourlyRate;

      totalHours += hours;
      totalCost += cost;

      let groupKey: string;

      switch (groupBy) {
        case 'day':
          groupKey = entry.clockIn.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(entry.clockIn);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          groupKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          groupKey = `${entry.clockIn.getFullYear()}-${String(entry.clockIn.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'user':
        default:
          groupKey = entry.userId;
          break;
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          key: groupKey,
          hours: 0,
          cost: 0,
          entries: 0,
          userName: groupBy === 'user' ? `${entry.user.firstName} ${entry.user.lastName}` : groupKey,
          userId: groupBy === 'user' ? entry.userId : undefined,
        };
      }

      grouped[groupKey].hours += hours;
      grouped[groupKey].cost += cost;
      grouped[groupKey].entries += 1;
    }

    const groupedArray = Object.values(grouped).map((g: any) => ({
      ...g,
      hours: Math.round(g.hours * 100) / 100,
      cost: Math.round(g.cost * 100) / 100,
    }));

    res.json({
      project: {
        id: project.id,
        name: project.name,
        customer: project.customer?.name,
        budget: project.budget
          ? {
              total: project.budget.totalBudget,
              planned: project.budget.plannedCosts,
              actual: project.budget.actualCosts,
            }
          : null,
      },
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        entryCount: timeEntries.length,
        period: {
          from: startDate || 'Beginn',
          to: endDate || 'Heute',
        },
      },
      groupedData: groupedArray.sort((a, b) => b.hours - a.hours),
      entries: timeEntries.map((e) => ({
        id: e.id,
        date: e.clockIn.toISOString().split('T')[0],
        user: `${e.user.firstName} ${e.user.lastName}`,
        clockIn: e.clockIn,
        clockOut: e.clockOut,
        hours: e.clockOut
          ? Math.round(
              ((new Date(e.clockOut).getTime() -
                new Date(e.clockIn).getTime() -
                (e.pauseMinutes || 0) * 60 * 1000) /
                (1000 * 60 * 60)) *
                100
            ) / 100
          : 0,
        description: e.description,
      })),
    });
  } catch (error) {
    console.error('Fehler beim Laden des Zeiterfassung-Reports:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Zeiterfassung-Reports' });
  }
};
