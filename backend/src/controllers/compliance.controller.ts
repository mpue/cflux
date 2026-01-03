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

    console.log(`[HOLIDAYS] Syncing holidays for year ${year}...`);

    // Feiertage von date.nager.at API abrufen (nur nationale)
    const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/CH`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch holidays from API');
    }

    const apiHolidays = await response.json() as any[];
    console.log(`[HOLIDAYS] Fetched ${apiHolidays.length} holidays from API`);
    
    // Nationale Feiertage (gelten für ganze Schweiz)
    const nationalHolidays = apiHolidays
      .filter((h: any) => h.global)
      .map((holiday: any) => ({
        date: new Date(holiday.date),
        name: holiday.localName || holiday.name,
        canton: 'CH',
        percentage: 100
      }));

    console.log(`[HOLIDAYS] ${nationalHolidays.length} national holidays found`);

    // Kantonale Feiertage
    const cantonalHolidays: any[] = [];
    apiHolidays.forEach((holiday: any) => {
      if (!holiday.global && holiday.counties && holiday.counties.length > 0) {
        holiday.counties.forEach((cantonCode: string) => {
          // Remove "CH-" prefix from canton codes
          const normalizedCanton = cantonCode.replace('CH-', '');
          cantonalHolidays.push({
            date: new Date(holiday.date),
            name: holiday.localName || holiday.name,
            canton: normalizedCanton,
            percentage: 100
          });
        });
      }
    });

    console.log(`[HOLIDAYS] ${cantonalHolidays.length} cantonal holidays found`);

    // Zusätzliche kantonale Feiertage die die API nicht hat
    const additionalHolidays = getAdditionalCantonalHolidays(year);
    console.log(`[HOLIDAYS] ${additionalHolidays.length} additional cantonal holidays added`);

    const allHolidays = [...nationalHolidays, ...cantonalHolidays, ...additionalHolidays];

    // Bestehende Feiertage für das Jahr löschen
    const deleted = await prisma.holiday.deleteMany({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      }
    });

    console.log(`[HOLIDAYS] Deleted ${deleted.count} existing holidays`);

    // Neue Feiertage einfügen
    const created = await prisma.holiday.createMany({
      data: allHolidays,
      skipDuplicates: true
    });

    console.log(`[HOLIDAYS] Created ${created.count} holidays`);

    res.json({ 
      message: 'Holidays synchronized successfully',
      count: created.count,
      details: {
        national: nationalHolidays.length,
        cantonal: cantonalHolidays.length,
        additional: additionalHolidays.length,
        total: allHolidays.length
      }
    });
  } catch (error) {
    console.error('Error syncing holidays:', error);
    res.status(500).json({ error: 'Failed to sync holidays' });
  }
};

// Zusätzliche kantonale Feiertage die nicht in der API sind
function getAdditionalCantonalHolidays(year: number): any[] {
  const holidays: any[] = [];
  
  // Berchtoldstag (2. Januar) - Mehrere Kantone
  const berchtoldstag = ['ZH', 'BE', 'LU', 'OW', 'GL', 'ZG', 'FR', 'SO', 'SH', 'TG', 'VD', 'NE', 'GE', 'JU'];
  berchtoldstag.forEach(canton => {
    holidays.push({
      date: new Date(`${year}-01-02`),
      name: 'Berchtoldstag',
      canton,
      percentage: 100
    });
  });

  // Josefstag (19. März) - Einige Kantone
  const josefstag = ['LU', 'UR', 'SZ', 'OW', 'NW', 'ZG', 'GR', 'TI', 'VS'];
  josefstag.forEach(canton => {
    holidays.push({
      date: new Date(`${year}-03-19`),
      name: 'Josefstag',
      canton,
      percentage: 100
    });
  });

  // Näfelser Fahrt (erster Donnerstag im April) - GL
  const firstThursday = getFirstWeekdayOfMonth(year, 3, 4); // April = 3, Thursday = 4
  holidays.push({
    date: firstThursday,
    name: 'Näfelser Fahrt',
    canton: 'GL',
    percentage: 100
  });

  // Ostermontag wird von API geliefert, aber sicherstellen
  // Pfingstmontag wird von API geliefert
  // Fronleichnam wird von API geliefert

  // Bruder Klaus (25. September) - OW
  holidays.push({
    date: new Date(`${year}-09-25`),
    name: 'Bruder Klaus',
    canton: 'OW',
    percentage: 100
  });

  // Genfer Bettag (Donnerstag nach erstem Sonntag im September) - GE
  const genevaBettag = getGenevaBettag(year);
  holidays.push({
    date: genevaBettag,
    name: 'Genfer Bettag',
    canton: 'GE',
    percentage: 100
  });

  // Bettagsmontag (Montag nach Eidg. Dank-, Buss- und Bettag) - VD, NE
  const bettagsMontag = getBettagsMontag(year);
  ['VD', 'NE'].forEach(canton => {
    holidays.push({
      date: bettagsMontag,
      name: 'Bettagsmontag',
      canton,
      percentage: 100
    });
  });

  return holidays;
}

// Hilfsfunktionen für bewegliche Feiertage
function getFirstWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const date = new Date(year, month, 1);
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function getGenevaBettag(year: number): Date {
  // Erster Sonntag im September
  const firstSunday = getFirstWeekdayOfMonth(year, 8, 0); // September = 8, Sunday = 0
  // Donnerstag danach (4 Tage später)
  const thursday = new Date(firstSunday);
  thursday.setDate(thursday.getDate() + 4);
  return thursday;
}

function getBettagsMontag(year: number): Date {
  // Eidgenössischer Dank-, Buss- und Bettag = dritter Sonntag im September
  const firstSunday = getFirstWeekdayOfMonth(year, 8, 0);
  const thirdSunday = new Date(firstSunday);
  thirdSunday.setDate(thirdSunday.getDate() + 14);
  // Montag danach
  const monday = new Date(thirdSunday);
  monday.setDate(monday.getDate() + 1);
  return monday;
}

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

// Manuelles Erstellen eines Feiertags
export const createHoliday = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create holidays' });
    }

    const { date, name, canton, percentage } = req.body;

    if (!date || !name || !canton) {
      return res.status(400).json({ error: 'Date, name, and canton are required' });
    }

    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        name,
        canton,
        percentage: percentage || 100
      }
    });

    console.log(`[HOLIDAYS] Manually created holiday: ${name} for ${canton} on ${date}`);
    res.json(holiday);
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
};

// Feiertag löschen
export const deleteHoliday = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete holidays' });
    }

    const { id } = req.params;

    await prisma.holiday.delete({
      where: { id }
    });

    console.log(`[HOLIDAYS] Deleted holiday: ${id}`);
    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
};

// Alle verfügbaren Kantone zurückgeben
export const getCantons = async (req: AuthRequest, res: Response) => {
  const cantons = [
    { code: 'CH', name: 'Schweiz (National)' },
    { code: 'AG', name: 'Aargau' },
    { code: 'AI', name: 'Appenzell Innerrhoden' },
    { code: 'AR', name: 'Appenzell Ausserrhoden' },
    { code: 'BE', name: 'Bern' },
    { code: 'BL', name: 'Basel-Landschaft' },
    { code: 'BS', name: 'Basel-Stadt' },
    { code: 'FR', name: 'Freiburg' },
    { code: 'GE', name: 'Genf' },
    { code: 'GL', name: 'Glarus' },
    { code: 'GR', name: 'Graubünden' },
    { code: 'JU', name: 'Jura' },
    { code: 'LU', name: 'Luzern' },
    { code: 'NE', name: 'Neuenburg' },
    { code: 'NW', name: 'Nidwalden' },
    { code: 'OW', name: 'Obwalden' },
    { code: 'SG', name: 'St. Gallen' },
    { code: 'SH', name: 'Schaffhausen' },
    { code: 'SO', name: 'Solothurn' },
    { code: 'SZ', name: 'Schwyz' },
    { code: 'TG', name: 'Thurgau' },
    { code: 'TI', name: 'Tessin' },
    { code: 'UR', name: 'Uri' },
    { code: 'VD', name: 'Waadt' },
    { code: 'VS', name: 'Wallis' },
    { code: 'ZG', name: 'Zug' },
    { code: 'ZH', name: 'Zürich' }
  ];
  res.json(cantons);
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
