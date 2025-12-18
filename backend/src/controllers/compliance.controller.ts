import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Feiertage für ein bestimmtes Jahr und Kanton abrufen
export const getHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const { year, canton } = req.query;
    
    if (!year) {
      return res.status(400).json({ error: 'Year parameter is required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    // Filter nach Kanton (nationale + kantonale Feiertage)
    if (canton) {
      where.canton = {
        in: ['CH', canton]
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    res.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
};

// Feiertage von externer API synchronisieren
export const syncHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.body;
    
    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    // Feiertage von date.nager.at API abrufen
    const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/CH`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch holidays from API');
    }

    const apiHolidays = await response.json() as any[];
    
    // In Datenbank speichern
    const holidaysToCreate = apiHolidays.map((holiday: any) => ({
      date: new Date(holiday.date),
      name: holiday.localName || holiday.name,
      canton: holiday.global ? 'CH' : (holiday.counties?.[0] || 'CH'),
      percentage: 100
    }));

    // Bestehende Feiertage für das Jahr löschen
    await prisma.holiday.deleteMany({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      }
    });

    // Neue Feiertage einfügen
    const created = await prisma.holiday.createMany({
      data: holidaysToCreate,
      skipDuplicates: true
    });

    res.json({ 
      message: 'Holidays synchronized successfully',
      count: created.count
    });
  } catch (error) {
    console.error('Error syncing holidays:', error);
    res.status(500).json({ error: 'Failed to sync holidays' });
  }
};

// Compliance Violations abrufen
export const getViolations = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, resolved, severity, startDate, endDate } = req.query;
    
    const where: any = {};
    
    if (userId && req.user?.role === 'ADMIN') {
      where.userId = userId;
    } else if (req.user?.role !== 'ADMIN') {
      // Normale User sehen nur ihre eigenen Violations
      where.userId = req.user?.id;
    }
    
    if (resolved !== undefined) {
      where.resolved = resolved === 'true';
    }
    
    if (severity) {
      where.severity = severity;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const violations = await prisma.complianceViolation.findMany({
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
      },
      orderBy: { date: 'desc' }
    });

    res.json(violations);
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
};

// Violation als gelöst markieren
export const resolveViolation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can resolve violations' });
    }

    const violation = await prisma.complianceViolation.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        notes: notes || null
      }
    });

    res.json(violation);
  } catch (error) {
    console.error('Error resolving violation:', error);
    res.status(500).json({ error: 'Failed to resolve violation' });
  }
};

// Überstunden-Saldo abrufen
export const getOvertimeBalance = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, year } = req.query;
    
    const targetUserId = req.user?.role === 'ADMIN' && userId 
      ? userId as string 
      : req.user?.id;
    
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    let balance = await prisma.overtimeBalance.findUnique({
      where: {
        userId_year: {
          userId: targetUserId!,
          year: targetYear
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            weeklyHours: true,
            contractHours: true
          }
        }
      }
    });

    // Falls noch kein Eintrag existiert, erstelle einen
    if (!balance) {
      balance = await prisma.overtimeBalance.create({
        data: {
          userId: targetUserId!,
          year: targetYear
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              weeklyHours: true,
              contractHours: true
            }
          }
        }
      });
    }

    res.json(balance);
  } catch (error) {
    console.error('Error fetching overtime balance:', error);
    res.status(500).json({ error: 'Failed to fetch overtime balance' });
  }
};

// Compliance Settings abrufen/erstellen
export const getComplianceSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can access compliance settings' });
    }

    let settings = await prisma.complianceSettings.findFirst();

    if (!settings) {
      settings = await prisma.complianceSettings.create({
        data: {}
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching compliance settings:', error);
    res.status(500).json({ error: 'Failed to fetch compliance settings' });
  }
};

// Compliance Settings aktualisieren
export const updateComplianceSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update compliance settings' });
    }

    const { defaultWeeklyHours, defaultCanton, overtimeLimit170, enableAutoWarnings, enableEmailAlerts } = req.body;

    let settings = await prisma.complianceSettings.findFirst();

    if (!settings) {
      settings = await prisma.complianceSettings.create({
        data: {
          defaultWeeklyHours,
          defaultCanton,
          overtimeLimit170,
          enableAutoWarnings,
          enableEmailAlerts
        }
      });
    } else {
      settings = await prisma.complianceSettings.update({
        where: { id: settings.id },
        data: {
          defaultWeeklyHours,
          defaultCanton,
          overtimeLimit170,
          enableAutoWarnings,
          enableEmailAlerts
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error updating compliance settings:', error);
    res.status(500).json({ error: 'Failed to update compliance settings' });
  }
};

// Compliance Dashboard Statistiken
export const getComplianceStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can access compliance stats' });
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Anzahl ungelöster Violations
    const unresolvedViolations = await prisma.complianceViolation.count({
      where: { resolved: false }
    });

    // Kritische Violations
    const criticalViolations = await prisma.complianceViolation.count({
      where: { 
        resolved: false,
        severity: 'CRITICAL'
      }
    });

    // Violations der letzten 30 Tage
    const recentViolations = await prisma.complianceViolation.count({
      where: {
        date: { gte: thirtyDaysAgo }
      }
    });

    // Violations nach Typ (Top 5)
    const violationsByType = await prisma.complianceViolation.groupBy({
      by: ['type'],
      where: { resolved: false },
      _count: true,
      orderBy: { _count: { type: 'desc' } },
      take: 5
    });

    // User mit den meisten Violations
    const userViolations = await prisma.complianceViolation.groupBy({
      by: ['userId'],
      where: { resolved: false },
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 5
    });

    // User-Details abrufen
    const userIds = userViolations.map((v: any) => v.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    const topUsersWithViolations = userViolations.map((v: any) => ({
      ...users.find((u: any) => u.id === v.userId),
      violationCount: v._count
    }));

    res.json({
      unresolvedViolations,
      criticalViolations,
      recentViolations,
      violationsByType: violationsByType.map((v: any) => ({
        type: v.type,
        count: v._count
      })),
      topUsersWithViolations
    });
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    res.status(500).json({ error: 'Failed to fetch compliance stats' });
  }
};
