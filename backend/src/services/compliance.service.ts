import { prisma } from '../lib/prisma';
import { actionService } from './action.service';


interface TimeEntryWithDuration {
  clockIn: Date;
  clockOut: Date | null;
  employeeId: string;
}

// Prüfe Ruhezeit-Violations (min. 11h zwischen Arbeitstagen)
export async function checkRestTimeViolation(employeeId: string, newClockIn: Date) {
  try {
    // Letzte TimeEntry des Employees holen
    const lastEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        clockOut: { not: null }
      },
      orderBy: { clockOut: 'desc' }
    });

    if (!lastEntry || !lastEntry.clockOut) return;

    // Differenz berechnen
    const restTimeHours = (newClockIn.getTime() - lastEntry.clockOut.getTime()) / (1000 * 60 * 60);

    if (restTimeHours < 11) {
      console.log(`[COMPLIANCE] Creating REST_TIME violation for employee ${employeeId}: ${restTimeHours.toFixed(1)}h rest time`);
      const violation = await prisma.complianceViolation.create({
        data: {
          employeeId,
          type: 'REST_TIME',
          severity: 'CRITICAL',
          date: newClockIn,
          description: `Ruhezeit unterschritten: Nur ${restTimeHours.toFixed(1)} Stunden zwischen Arbeitstagen`,
          actualValue: `${restTimeHours.toFixed(1)} Stunden`,
          requiredValue: '11 Stunden'
        }
      });
      console.log(`[COMPLIANCE] REST_TIME violation created with ID: ${violation.id}`);

      // Trigger compliance.violation action
      try {
        await actionService.triggerAction('compliance.violation', {
          entityType: 'COMPLIANCE_VIOLATION',
          entityId: violation.id,
          employeeId: employeeId,
          violationType: violation.type,
          severity: violation.severity,
          description: violation.description,
          createdAt: violation.createdAt.toISOString()
        });
      } catch (actionError) {
        console.error('[Action] Failed to trigger compliance.violation:', actionError);
      }
    }
  } catch (error) {
    console.error('Error checking rest time violation:', error);
  }
}

// Prüfe wöchentliche Höchstarbeitszeit
export async function checkWeeklyHoursViolation(employeeId: string, date: Date) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { 
        weeklyHours: true,
        exemptFromTracking: true
      }
    });

    if (!employee || employee.exemptFromTracking) return;

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
        employeeId,
        clockIn: { gte: weekStart, lte: weekEnd },
        clockOut: { not: null }
      }
    });

    // Gesamtarbeitszeit berechnen (Netto: minus Pausen)
    let totalHours = 0;
    entries.forEach((entry: any) => {
      if (entry.clockOut) {
        const bruttoHours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
        const pauseHours = (entry.pauseMinutes || 0) / 60;
        totalHours += bruttoHours - pauseHours;
      }
    });

    // Prüfen ob Höchstarbeitszeit überschritten
    if (totalHours > employee.weeklyHours) {
      // Prüfe ob bereits eine Violation für diese Woche existiert
      const existingViolation = await prisma.complianceViolation.findFirst({
        where: {
          employeeId,
          type: 'MAX_WEEKLY_HOURS',
          date: { gte: weekStart, lte: weekEnd }
        }
      });

      if (!existingViolation) {
        console.log(`[COMPLIANCE] Creating MAX_WEEKLY_HOURS violation for employee ${employeeId}: ${totalHours.toFixed(1)}h of max ${employee.weeklyHours}h`);
        const violation = await prisma.complianceViolation.create({
          data: {
            employeeId,
            type: 'MAX_WEEKLY_HOURS',
            severity: 'WARNING',
            date: weekEnd,
            description: `Wöchentliche Höchstarbeitszeit überschritten: ${totalHours.toFixed(1)}h von max. ${employee.weeklyHours}h`,
            actualValue: `${totalHours.toFixed(1)} Stunden`,
            requiredValue: `${employee.weeklyHours} Stunden`
          }
        });
        console.log(`[COMPLIANCE] MAX_WEEKLY_HOURS violation created with ID: ${violation.id}`);

        // Trigger compliance.violation action
        try {
          await actionService.triggerAction('compliance.violation', {
            entityType: 'COMPLIANCE_VIOLATION',
            entityId: violation.id,
            employeeId: employeeId,
            violationType: violation.type,
            severity: violation.severity,
            description: violation.description,
            createdAt: violation.createdAt.toISOString()
          });
        } catch (actionError) {
          console.error('[Action] Failed to trigger compliance.violation:', actionError);
        }
      }
    }
  } catch (error) {
    console.error('Error checking weekly hours violation:', error);
  }
}

// Prüfe tägliche Höchstarbeitszeit (12,5h Netto)
export async function checkDailyHoursViolation(employeeId: string, clockIn: Date, clockOut: Date) {
  try {
    // Pause aus dem TimeEntry holen für Netto-Berechnung
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        clockIn,
        clockOut
      },
      select: {
        pauseMinutes: true
      }
    });

    const pauseMinutes = timeEntry?.pauseMinutes || 0;
    const bruttoHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    const nettoHours = bruttoHours - (pauseMinutes / 60);

    if (nettoHours > 12.5) {
      console.log(`[COMPLIANCE] Creating MAX_DAILY_HOURS violation for employee ${employeeId}: ${nettoHours.toFixed(1)}h netto`);
      const violation = await prisma.complianceViolation.create({
        data: {
          employeeId,
          type: 'MAX_DAILY_HOURS',
          severity: 'CRITICAL',
          date: clockIn,
          description: `Tägliche Höchstarbeitszeit überschritten: ${nettoHours.toFixed(1)}h netto von max. 12,5h`,
          actualValue: `${nettoHours.toFixed(1)} Stunden (netto)`,
          requiredValue: '12,5 Stunden'
        }
      });
      console.log(`[COMPLIANCE] MAX_DAILY_HOURS violation created with ID: ${violation.id}`);

      // Trigger compliance.violation action
      try {
        await actionService.triggerAction('compliance.violation', {
          entityType: 'COMPLIANCE_VIOLATION',
          entityId: violation.id,
          employeeId: employeeId,
          violationType: violation.type,
          severity: violation.severity,
          description: violation.description,
          createdAt: violation.createdAt.toISOString()
        });
      } catch (actionError) {
        console.error('[Action] Failed to trigger compliance.violation:', actionError);
      }
    }
  } catch (error) {
    console.error('Error checking daily hours violation:', error);
  }
}

// Prüfe fehlende Pausen (Art. 15 ArGV 1)
export async function checkMissingPauseViolation(employeeId: string, clockIn: Date, clockOut: Date) {
  try {
    // Gesamtarbeitszeit in Stunden berechnen
    const totalDuration = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    // Tatsächliche Pausen aus TimeEntry holen
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        clockIn,
        clockOut
      },
      select: {
        pauseMinutes: true
      }
    });

    const actualPauseMinutes = timeEntry?.pauseMinutes || 0;
    const actualPauseHours = actualPauseMinutes / 60;

    // Nettoarbeitszeit (nach Abzug der Pausen)
    const netWorkDuration = totalDuration - actualPauseHours;

    let requiredPauseMinutes = 0;
    let description = '';
    let severity: 'WARNING' | 'CRITICAL' = 'WARNING';

    // Art. 15 ArGV 1: Pausenvorschriften
    if (netWorkDuration >= 9) {
      requiredPauseMinutes = 60; // 1 Stunde
      description = 'Bei 9+ Stunden Arbeit ist 1 Stunde Pause vorgeschrieben (Art. 15 Abs. 2 ArGV 1)';
      severity = 'CRITICAL';
    } else if (netWorkDuration >= 7) {
      requiredPauseMinutes = 30; // 30 Minuten
      description = 'Bei 7+ Stunden Arbeit sind 30 Minuten Pause vorgeschrieben (Art. 15 Abs. 1 ArGV 1)';
    } else if (netWorkDuration >= 5.5) {
      requiredPauseMinutes = 15; // 15 Minuten
      description = 'Bei 5,5+ Stunden Arbeit sind 15 Minuten Pause vorgeschrieben (Art. 15 Abs. 1 ArGV 1)';
    }

    // Nur Violation erstellen wenn Pause fehlt oder zu kurz
    if (requiredPauseMinutes > 0 && actualPauseMinutes < requiredPauseMinutes) {
      const missingMinutes = requiredPauseMinutes - actualPauseMinutes;
      
      console.log(`[COMPLIANCE] Creating MISSING_PAUSE violation for employee ${employeeId}: ${netWorkDuration.toFixed(1)}h work, ${actualPauseMinutes}min pause (required: ${requiredPauseMinutes}min)`);
      
      const violation = await prisma.complianceViolation.create({
        data: {
          employeeId,
          type: 'MISSING_PAUSE',
          severity,
          date: clockIn,
          description: `${description}. Gearbeitet: ${netWorkDuration.toFixed(1)}h, Pause gemacht: ${actualPauseMinutes} Min`,
          actualValue: `${actualPauseMinutes} Minuten`,
          requiredValue: `${requiredPauseMinutes} Minuten (fehlen: ${missingMinutes} Min)`
        }
      });
      
      console.log(`[COMPLIANCE] MISSING_PAUSE violation created with ID: ${violation.id}`);

      // Trigger compliance.violation action
      try {
        await actionService.triggerAction('compliance.violation', {
          entityType: 'COMPLIANCE_VIOLATION',
          entityId: violation.id,
          employeeId: employeeId,
          violationType: violation.type,
          severity: violation.severity,
          description: violation.description,
          createdAt: violation.createdAt.toISOString()
        });
      } catch (actionError) {
        console.error('[Action] Failed to trigger compliance.violation:', actionError);
      }
    } else if (requiredPauseMinutes > 0) {
      console.log(`[COMPLIANCE] No MISSING_PAUSE violation for employee ${employeeId}: ${actualPauseMinutes}min pause sufficient for ${netWorkDuration.toFixed(1)}h work`);
    }
  } catch (error) {
    console.error('Error checking missing pause violation:', error);
  }
}

// Überstunden berechnen und in OvertimeBalance speichern
export async function updateOvertimeBalance(employeeId: string, date: Date) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { 
        weeklyHours: true,
        contractHours: true,
        exemptFromTracking: true
      }
    });

    if (!employee || employee.exemptFromTracking) return;

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
        employeeId,
        clockIn: { gte: weekStart, lte: weekEnd },
        clockOut: { not: null }
      }
    });

    let totalHours = 0;
    entries.forEach((entry: any) => {
      if (entry.clockOut) {
        const bruttoHours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
        const pauseHours = (entry.pauseMinutes || 0) / 60;
        totalHours += bruttoHours - pauseHours;
      }
    });

    const contractHours = employee.contractHours || employee.weeklyHours;
    const maxLegalHours = employee.weeklyHours;

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
        employeeId_year: {
          employeeId,
          year
        }
      },
      update: {
        regularOvertime: { increment: regularOvertime },
        extraTime: { increment: extraTime }
      },
      create: {
        employeeId,
        year,
        regularOvertime,
        extraTime
      }
    });

    // Überzeit-Limit prüfen (170h bei 45h-Woche, 140h bei 50h-Woche)
    const overtimeLimit = employee.weeklyHours === 45 ? 170 : 140;
    if (balance.extraTime > overtimeLimit) {
      const existingViolation = await prisma.complianceViolation.findFirst({
        where: {
          employeeId,
          type: 'OVERTIME_LIMIT',
          date: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) }
        }
      });

      if (!existingViolation) {
        await prisma.complianceViolation.create({
          data: {
            employeeId,
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
