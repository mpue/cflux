import { PrismaClient } from '@prisma/client';
import {
  checkDailyHoursViolation,
  checkMissingPauseViolation,
  checkWeeklyHoursViolation,
  updateOvertimeBalance,
} from './compliance.service';

const prisma = new PrismaClient();

/**
 * Auto Clock-Out Job: Schliesst alle offenen Zeiteinträge (CLOCKED_IN / ON_PAUSE)
 * automatisch. Wird vom Scheduler aufgerufen.
 */
export async function autoClockOutJob(): Promise<{ affectedCount: number; message: string }> {
  const clockOutTime = new Date();

  // Find all open entries
  const openEntries = await prisma.timeEntry.findMany({
    where: {
      status: { in: ['CLOCKED_IN', 'ON_PAUSE'] },
      clockOut: null,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (openEntries.length === 0) {
    return { affectedCount: 0, message: 'Keine offenen Zeiteinträge gefunden.' };
  }

  console.log(`[AUTO_CLOCK_OUT] Closing ${openEntries.length} open time entries...`);

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const entry of openEntries) {
    try {
      // Close the entry
      await prisma.timeEntry.update({
        where: { id: entry.id },
        data: {
          clockOut: clockOutTime,
          status: 'CLOCKED_OUT',
          autoClockOut: true,
          description: entry.description
            ? `${entry.description} [Auto Clock-Out]`
            : '[Auto Clock-Out]',
        },
      });

      // Run compliance checks
      try {
        await checkDailyHoursViolation(entry.employeeId, entry.clockIn, clockOutTime);
        await checkMissingPauseViolation(entry.employeeId, entry.clockIn, clockOutTime);
        await checkWeeklyHoursViolation(entry.employeeId, clockOutTime);
        await updateOvertimeBalance(entry.employeeId, clockOutTime);
      } catch (complianceError) {
        console.error(`[AUTO_CLOCK_OUT] Compliance check failed for entry ${entry.id}:`, complianceError);
        // Don't fail the clock-out if compliance checks fail
      }

      const name = entry.employee
        ? `${entry.employee.firstName} ${entry.employee.lastName}`
        : entry.employeeId;
      console.log(`[AUTO_CLOCK_OUT] Closed entry ${entry.id} for ${name}`);
      successCount++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Entry ${entry.id}: ${msg}`);
      errorCount++;
      console.error(`[AUTO_CLOCK_OUT] Failed to close entry ${entry.id}:`, msg);
    }
  }

  const message = errorCount > 0
    ? `${successCount} Einträge geschlossen, ${errorCount} Fehler. ${errors.join('; ')}`
    : `${successCount} Einträge erfolgreich automatisch geschlossen.`;

  return { affectedCount: successCount, message };
}
