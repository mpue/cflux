import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { roundMsToHours } from '../utils/timeRounding';


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
        budgets: {
          where: { isActive: true },
          include: {
            items: {
              where: { isActive: true },
              select: {
                plannedCost: true,
                actualCost: true,
              },
            },
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
            employeeId: true,
          },
        });

        // Stunden und Kosten berechnen
        let totalHours = 0;
        const employeeHours: Record<string, number> = {};

        for (const entry of timeEntries) {
          if (entry.clockOut) {
            const startTime = new Date(entry.clockIn).getTime();
            const endTime = new Date(entry.clockOut).getTime();
            const pauseMs = (entry.pauseMinutes || 0) * 60 * 1000;
            const workedMs = endTime - startTime - pauseMs;
            const hours = roundMsToHours(workedMs);

            totalHours += hours;

            if (!employeeHours[entry.employeeId]) {
              employeeHours[entry.employeeId] = 0;
            }
            employeeHours[entry.employeeId] += hours;
          }
        }

        // Kosten aus Zeiteinträgen berechnen (wenn Stundensatz vorhanden)
        const hourlyRate = project.defaultHourlyRate || 0;
        const timeCosts = hourlyRate > 0 ? totalHours * hourlyRate : 0;

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          isActive: project.isActive,
          status: project.status,
          customer: project.customer
            ? {
                id: project.customer.id,
                name: project.customer.name,
              }
            : null,
          budget: project.budgets && project.budgets.length > 0
            ? (() => {
                // Budget-Werte verwenden die bereits im Budget-Objekt berechnet wurden
                // Die actualCosts in ProjectBudget enthalten bereits die Summe aller Budget-Item actualCosts
                // Diese werden durch den budgetUpdate.service.ts aktualisiert
                const budget = project.budgets[0];
                const plannedCosts = budget.items?.reduce((sum: number, item: any) => sum + item.plannedCost, 0) || 0;
                const actualCosts = budget.actualCosts || 0;
                const remainingBudget = budget.totalBudget - actualCosts;
                
                // Auslastung = tatsächliche Kosten / Gesamtbudget * 100
                const utilization = budget.totalBudget > 0 
                  ? (actualCosts / budget.totalBudget) * 100 
                  : 0;

                return {
                  totalBudget: budget.totalBudget,
                  plannedCosts,
                  actualCosts,
                  remainingBudget,
                  utilization,
                  status: budget.status,
                };
              })()
            : timeCosts > 0 
              ? {
                  // Kein Budget definiert, aber Zeitkosten vorhanden
                  totalBudget: 0,
                  plannedCosts: 0,
                  actualCosts: timeCosts,
                  remainingBudget: -timeCosts,
                  utilization: 0,
                  status: 'NO_BUDGET',
                }
              : null,
          timeTracking: {
            totalHours: Math.round(totalHours * 100) / 100,
            userCount: Object.keys(employeeHours).length,
            topUsers: await Promise.all(
              Object.entries(employeeHours)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(async ([employeeId, hours]) => {
                  const employee = await prisma.employee.findUnique({
                    where: { id: employeeId },
                    include: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  });
                  return {
                    employeeId,
                    name: employee && employee.user 
                      ? `${employee.user.firstName} ${employee.user.lastName}` 
                      : 'Unknown',
                    hours: Math.round(hours * 100) / 100,
                  };
                })
            ),
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
        budgets: {
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
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hourlyRate: true
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
      const hours = roundMsToHours(workedMs);

      // Stundensatz ermitteln (Employee → Projekt → System)
      // Nutze employee.hourlyRate falls vorhanden, sonst project.defaultHourlyRate, sonst 100 CHF als Fallback
      let hourlyRate = entry.employee.hourlyRate;
      if (!hourlyRate || hourlyRate <= 0) {
        hourlyRate = project.defaultHourlyRate || 100;
      }
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
          groupKey = entry.employeeId;
          break;
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          key: groupKey,
          hours: 0,
          cost: 0,
          entries: 0,
          userName: groupBy === 'user' ? `${entry.employee.firstName} ${entry.employee.lastName}` : groupKey,
          employeeId: groupBy === 'user' ? entry.employeeId : undefined,
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
        budget: project.budgets && project.budgets.length > 0
          ? {
              total: project.budgets[0].totalBudget,
              planned: project.budgets[0].plannedCosts,
              actual: project.budgets[0].actualCosts,
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
        user: `${e.employee.firstName} ${e.employee.lastName}`,
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
