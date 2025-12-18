import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TimeEntryWithDuration {
  clockIn: Date;
  clockOut: Date | null;
  userId: string;
}

// Prüfe Ruhezeit-Violations (min. 11h zwischen Arbeitstagen)
export async function checkRestTimeViolation(userId: string, newClockIn: Date) {
  try {
    // Letzte TimeEntry des Users holen
    const lastEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        clockOut: { not: null }
      },
      orderBy: { clockOut: 'desc' }
    });

    if (!lastEntry || !lastEntry.clockOut) return;

    // Differenz berechnen
    const restTimeHours = (newClockIn.getTime() - lastEntry.clockOut.getTime()) / (1000 * 60 * 60);

    if (restTimeHours < 11) {
      console.log(`[COMPLIANCE] Creating REST_TIME violation for user ${userId}: ${restTimeHours.toFixed(1)}h rest time`);
      const violation = await prisma.complianceViolation.create({
        data: {
          userId,
          type: 'REST_TIME',
          severity: 'CRITICAL',
          date: newClockIn,
          description: `Ruhezeit unterschritten: Nur ${restTimeHours.toFixed(1)} Stunden zwischen Arbeitstagen`,
          actualValue: `${restTimeHours.toFixed(1)} Stunden`,
          requiredValue: '11 Stunden'
        }
      });
      console.log(`[COMPLIANCE] REST_TIME violation created with ID: ${violation.id}`);
    }
  } catch (error) {
    console.error('Error checking rest time violation:', error);
  }
}

// Prüfe wöchentliche Höchstarbeitszeit
export async function checkWeeklyHoursViolation(userId: string, date: Date) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { weeklyHours: true, exemptFromTracking: true }
    });

    if (!user || user.exemptFromTracking) return;

    // Wochenstart (Montag) und -ende (Sonntag) berechnen
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1); // Montag
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sonntag
    weekEnd.setHours(23, 59, 59, 999);

    // Alle TimeEntries der Woche holen
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        clockIn: { gte: weekStart, lte: weekEnd },
        clockOut: { not: null }
      }
    });

    // Gesamtarbeitszeit berechnen
    let totalHours = 0;
    entries.forEach((entry: any) => {
      if (entry.clockOut) {
        const duration = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
        totalHours += duration;
      }
    });

    // Prüfen ob Höchstarbeitszeit überschritten
    if (totalHours > user.weeklyHours) {
      // Prüfe ob bereits eine Violation für diese Woche existiert
      const existingViolation = await prisma.complianceViolation.findFirst({
        where: {
          userId,
          type: 'MAX_WEEKLY_HOURS',
          date: { gte: weekStart, lte: weekEnd }
        }
      });

      if (!existingViolation) {
        console.log(`[COMPLIANCE] Creating MAX_WEEKLY_HOURS violation for user ${userId}: ${totalHours.toFixed(1)}h of max ${user.weeklyHours}h`);
        const violation = await prisma.complianceViolation.create({
          data: {
            userId,
            type: 'MAX_WEEKLY_HOURS',
            severity: 'WARNING',
            date: weekEnd,
            description: `Wöchentliche Höchstarbeitszeit überschritten: ${totalHours.toFixed(1)}h von max. ${user.weeklyHours}h`,
            actualValue: `${totalHours.toFixed(1)} Stunden`,
            requiredValue: `${user.weeklyHours} Stunden`
          }
        });
        console.log(`[COMPLIANCE] MAX_WEEKLY_HOURS violation created with ID: ${violation.id}`);
      }
    }
  } catch (error) {
    console.error('Error checking weekly hours violation:', error);
  }
}

// Prüfe tägliche Höchstarbeitszeit (12,5h)
export async function checkDailyHoursViolation(userId: string, clockIn: Date, clockOut: Date) {
  try {
    const duration = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    if (duration > 12.5) {
      console.log(`[COMPLIANCE] Creating MAX_DAILY_HOURS violation for user ${userId}: ${duration.toFixed(1)}h`);
      const violation = await prisma.complianceViolation.create({
        data: {
          userId,
          type: 'MAX_DAILY_HOURS',
          severity: 'CRITICAL',
          date: clockIn,
          description: `Tägliche Höchstarbeitszeit überschritten: ${duration.toFixed(1)}h von max. 12,5h`,
          actualValue: `${duration.toFixed(1)} Stunden`,
          requiredValue: '12,5 Stunden'
        }
      });
      console.log(`[COMPLIANCE] MAX_DAILY_HOURS violation created with ID: ${violation.id}`);
    }
  } catch (error) {
    console.error('Error checking daily hours violation:', error);
  }
}

// Prüfe fehlende Pausen
export async function checkMissingPauseViolation(userId: string, clockIn: Date, clockOut: Date) {
  try {
    const duration = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    let requiredPause = 0;
    let description = '';

    if (duration >= 9) {
      requiredPause = 1; // 60 Min
      description = 'Bei 9+ Stunden Arbeit ist 1 Stunde Pause vorgeschrieben';
    } else if (duration >= 7) {
      requiredPause = 0.5; // 30 Min
      description = 'Bei 7+ Stunden Arbeit sind 30 Minuten Pause vorgeschrieben';
    } else if (duration >= 5.5) {
      requiredPause = 0.25; // 15 Min
      description = 'Bei 5,5+ Stunden Arbeit sind 15 Minuten Pause vorgeschrieben';
    }

    if (requiredPause > 0) {
      // TODO: Tatsächliche Pausen aus separatem Pausen-Tracking prüfen
      // Für jetzt: Warnung wenn Arbeit lang genug ist
      await prisma.complianceViolation.create({
        data: {
          userId,
          type: 'MISSING_PAUSE',
          severity: 'WARNING',
          date: clockIn,
          description: `${description} (${duration.toFixed(1)}h Arbeitszeit)`,
          actualValue: '0 Minuten (nicht erfasst)',
          requiredValue: `${requiredPause * 60} Minuten`
        }
      });
    }
  } catch (error) {
    console.error('Error checking missing pause violation:', error);
  }
}

// Überstunden berechnen und in OvertimeBalance speichern
export async function updateOvertimeBalance(userId: string, date: Date) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        weeklyHours: true, 
        contractHours: true,
        exemptFromTracking: true 
      }
    });

    if (!user || user.exemptFromTracking) return;

    const year = date.getFullYear();

    // Wochenstart und -ende
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Alle TimeEntries der Woche
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        clockIn: { gte: weekStart, lte: weekEnd },
        clockOut: { not: null }
      }
    });

    let totalHours = 0;
    entries.forEach((entry: any) => {
      if (entry.clockOut) {
        const duration = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
        totalHours += duration;
      }
    });

    const contractHours = user.contractHours || user.weeklyHours;
    const maxLegalHours = user.weeklyHours;

    let regularOvertime = 0;
    let extraTime = 0;

    if (totalHours > maxLegalHours) {
      // Überzeit (über gesetzliche Grenze)
      extraTime = totalHours - maxLegalHours;
      // Überstunden (zwischen Vertrag und gesetzlicher Grenze)
      if (contractHours < maxLegalHours) {
        regularOvertime = maxLegalHours - contractHours;
      }
    } else if (totalHours > contractHours) {
      // Nur Überstunden (über Vertrag, aber unter gesetzlicher Grenze)
      regularOvertime = totalHours - contractHours;
    }

    // Balance aktualisieren
    const balance = await prisma.overtimeBalance.upsert({
      where: {
        userId_year: {
          userId,
          year
        }
      },
      update: {
        regularOvertime: { increment: regularOvertime },
        extraTime: { increment: extraTime }
      },
      create: {
        userId,
        year,
        regularOvertime,
        extraTime
      }
    });

    // Überzeit-Limit prüfen (170h bei 45h-Woche, 140h bei 50h-Woche)
    const overtimeLimit = user.weeklyHours === 45 ? 170 : 140;
    if (balance.extraTime > overtimeLimit) {
      const existingViolation = await prisma.complianceViolation.findFirst({
        where: {
          userId,
          type: 'OVERTIME_LIMIT',
          date: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) }
        }
      });

      if (!existingViolation) {
        await prisma.complianceViolation.create({
          data: {
            userId,
            type: 'OVERTIME_LIMIT',
            severity: 'CRITICAL',
            date: new Date(),
            description: `Überzeit-Jahres-Limit überschritten: ${balance.extraTime.toFixed(1)}h von max. ${overtimeLimit}h`,
            actualValue: `${balance.extraTime.toFixed(1)} Stunden`,
            requiredValue: `${overtimeLimit} Stunden`
          }
        });
      }
    }
  } catch (error) {
    console.error('Error updating overtime balance:', error);
  }
}

// Prüfe Nachtarbeit (23:00 - 6:00)
export function isNightWork(clockIn: Date, clockOut: Date): boolean {
  const nightStart = 23;
  const nightEnd = 6;
  
  const clockInHour = clockIn.getHours();
  const clockOutHour = clockOut.getHours();
  
  return (clockInHour >= nightStart || clockInHour < nightEnd) ||
         (clockOutHour >= nightStart || clockOutHour < nightEnd);
}

// Prüfe Sonntagsarbeit
export function isSundayWork(date: Date): boolean {
  return date.getDay() === 0; // 0 = Sonntag
}
