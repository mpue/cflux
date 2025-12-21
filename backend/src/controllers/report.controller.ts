import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { generateUserReport } from '../services/pdf.service';

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

// Neue erweiterte Report-Funktionen
export const getAbsenceAnalytics = async (req: AuthRequest, res: Response) => {
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

    const analytics = await Promise.all(
      users.map(async (user) => {
        const where: any = { 
          userId: user.id,
          status: 'APPROVED'
        };

        if (startDate && endDate) {
          where.startDate = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          };
        }

        const absenceRequests = await prisma.absenceRequest.findMany({ where });

        const byType = absenceRequests.reduce((acc, req) => {
          acc[req.type] = (acc[req.type] || 0) + req.days;
          return acc;
        }, {} as Record<string, number>);

        const totalDays = absenceRequests.reduce((sum, req) => sum + req.days, 0);

        return {
          user,
          totalDays,
          sickDays: byType['SICK_LEAVE'] || 0,
          vacationDays: byType['VACATION'] || 0,
          personalDays: byType['PERSONAL_LEAVE'] || 0,
          unpaidDays: byType['UNPAID_LEAVE'] || 0,
          otherDays: byType['OTHER'] || 0
        };
      })
    );

    // Sortiere nach Gesamtfehlzeiten
    analytics.sort((a, b) => b.totalDays - a.totalDays);

    res.json(analytics);
  } catch (error) {
    console.error('Get absence analytics error:', error);
    res.status(500).json({ error: 'Failed to get absence analytics' });
  }
};

export const getAttendanceByMonth = async (req: AuthRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    
    const monthlyData = [];
    
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const entries = await prisma.timeEntry.findMany({
        where: {
          clockIn: {
            gte: startDate,
            lte: endDate
          },
          status: 'CLOCKED_OUT'
        }
      });

      const totalHours = entries.reduce((sum, entry) => {
        return sum + calculateWorkHours(entry.clockIn, entry.clockOut);
      }, 0);

      const absences = await prisma.absenceRequest.findMany({
        where: {
          status: 'APPROVED',
          startDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalAbsenceDays = absences.reduce((sum, req) => sum + req.days, 0);

      monthlyData.push({
        month: new Date(year, month).toLocaleString('de-DE', { month: 'long' }),
        monthNumber: month + 1,
        workHours: Math.round(totalHours * 10) / 10,
        workDays: Math.round((totalHours / 8) * 10) / 10,
        absenceDays: totalAbsenceDays,
        entries: entries.length
      });
    }

    res.json({ year, data: monthlyData });
  } catch (error) {
    console.error('Get attendance by month error:', error);
    res.status(500).json({ error: 'Failed to get attendance by month' });
  }
};

export const getOvertimeReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const expectedHoursPerDay = 8;
    
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    const overtimeData = await Promise.all(
      users.map(async (user) => {
        const where: any = { 
          userId: user.id,
          status: 'CLOCKED_OUT'
        };

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

        const workDays = entries.length;
        const expectedHours = workDays * expectedHoursPerDay;
        const overtime = totalHours - expectedHours;

        return {
          user,
          totalHours: Math.round(totalHours * 10) / 10,
          expectedHours: Math.round(expectedHours * 10) / 10,
          overtime: Math.round(overtime * 10) / 10,
          workDays
        };
      })
    );

    // Sortiere nach Überstunden
    overtimeData.sort((a, b) => b.overtime - a.overtime);

    res.json(overtimeData);
  } catch (error) {
    console.error('Get overtime report error:', error);
    res.status(500).json({ error: 'Failed to get overtime report' });
  }
};

export const getProjectTimeByUser = async (req: AuthRequest, res: Response) => {
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

    const projects = await prisma.project.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true
      }
    });

    const data = await Promise.all(
      users.map(async (user) => {
        const projectHours: Record<string, number> = {};
        
        for (const project of projects) {
          const where: any = { 
            userId: user.id,
            projectId: project.id,
            status: 'CLOCKED_OUT'
          };

          if (startDate && endDate) {
            where.clockIn = {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            };
          }

          const entries = await prisma.timeEntry.findMany({ where });

          const hours = entries.reduce((sum, entry) => {
            return sum + calculateWorkHours(entry.clockIn, entry.clockOut);
          }, 0);

          if (hours > 0) {
            projectHours[project.name] = Math.round(hours * 10) / 10;
          }
        }

        const totalHours = Object.values(projectHours).reduce((sum, h) => sum + h, 0);

        return {
          user,
          projectHours,
          totalHours: Math.round(totalHours * 10) / 10
        };
      })
    );

    // Filtere Benutzer ohne Projektzeit heraus
    const filteredData = data.filter(d => d.totalHours > 0);

    res.json({ users: filteredData, projects: projects.map(p => p.name) });
  } catch (error) {
    console.error('Get project time by user error:', error);
    res.status(500).json({ error: 'Failed to get project time by user' });
  }
};

// PDF Report Generation
export const generateMyPDFReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, detailed } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const includeDetailed = detailed === 'true';

    const pdfBuffer = await generateUserReport(userId, start, end, includeDetailed);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    const filename = `Arbeitszeitbericht_${user?.firstName}_${user?.lastName}_${startDate}_${endDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate my PDF report error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
};

export const generateUserPDFReport = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, detailed } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const includeDetailed = detailed === 'true';

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pdfBuffer = await generateUserReport(userId, start, end, includeDetailed);

    const filename = `Arbeitszeitbericht_${user.firstName}_${user.lastName}_${startDate}_${endDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate user PDF report error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
};

