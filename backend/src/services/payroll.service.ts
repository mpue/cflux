import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PayrollCalculationData {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  regularHours?: number;
  overtimeHours?: number;
  nightHours?: number;
  sundayHours?: number;
  holidayHours?: number;
}

/**
 * Berechnet Arbeitsstunden aus TimeEntries für einen Zeitraum
 */
export async function calculateWorkingHours(userId: string, startDate: Date, endDate: Date) {
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      clockIn: {
        gte: startDate,
        lte: endDate
      },
      clockOut: { not: null }
    }
  });

  let regularHours = 0;
  let overtimeHours = 0;
  let nightHours = 0;
  let sundayHours = 0;
  let holidayHours = 0;

  timeEntries.forEach(entry => {
    if (!entry.clockOut) return;

    const hours = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60);
    const clockInHour = new Date(entry.clockIn).getHours();
    const dayOfWeek = new Date(entry.clockIn).getDay();

    // Sonntagsarbeit (0 = Sonntag)
    if (dayOfWeek === 0) {
      sundayHours += hours;
    }
    // Nachtarbeit (22:00 - 06:00)
    else if (clockInHour >= 22 || clockInHour < 6) {
      nightHours += hours;
    } else {
      regularHours += hours;
    }
  });

  return {
    regularHours,
    overtimeHours,
    nightHours,
    sundayHours,
    holidayHours
  };
}

/**
 * Berechnet Abwesenheitstage für einen Zeitraum
 */
export async function calculateAbsenceDays(userId: string, startDate: Date, endDate: Date) {
  const absenceRequests = await prisma.absenceRequest.findMany({
    where: {
      userId,
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate }
    }
  });

  let totalAbsenceDays = 0;
  let vacationDays = 0;
  let sickDays = 0;

  absenceRequests.forEach(absence => {
    totalAbsenceDays += absence.days;
    
    if (absence.type === 'VACATION') {
      vacationDays += absence.days;
    } else if (absence.type === 'SICK_LEAVE') {
      sickDays += absence.days;
    }
  });

  return {
    totalAbsenceDays,
    vacationDays,
    sickDays
  };
}

/**
 * Berechnet Gehalt basierend auf Stunden und Konfiguration
 */
export async function calculateSalary(userId: string, hours: any, config: any) {
  const baseSalary = config.monthlySalary || 0;
  const hourlyRate = config.hourlySalary || (baseSalary / 173); // 173 = durchschnittliche Arbeitsstunden pro Monat
  
  const overtimePay = hours.overtimeHours * hourlyRate * (config.overtimeRate / 100);
  const nightBonus = hours.nightHours * hourlyRate * ((config.nightRate - 100) / 100);
  const sundayBonus = hours.sundayHours * hourlyRate * ((config.sundayRate - 100) / 100);
  const holidayBonus = hours.holidayHours * hourlyRate * ((config.holidayRate - 100) / 100);

  const grossSalary = baseSalary + overtimePay + nightBonus + sundayBonus + holidayBonus;

  return {
    baseSalary,
    overtimePay,
    nightBonus,
    sundayBonus,
    holidayBonus,
    grossSalary
  };
}

/**
 * Berechnet Abzüge (Sozialversicherung und Steuern)
 */
export function calculateDeductions(grossSalary: number, config: any) {
  const ahvDeduction = grossSalary * (config.ahvRate / 100);
  const alvDeduction = grossSalary * (config.alvRate / 100);
  const nbuvDeduction = grossSalary * (config.nbuvRate / 100);
  const pensionDeduction = grossSalary * (config.pensionRate / 100);
  const taxDeduction = grossSalary * (config.taxRate / 100);
  const otherDeductions = 0;

  const totalDeductions = ahvDeduction + alvDeduction + nbuvDeduction + pensionDeduction + taxDeduction + otherDeductions;
  const netSalary = grossSalary - totalDeductions;

  return {
    ahvDeduction,
    alvDeduction,
    nbuvDeduction,
    pensionDeduction,
    taxDeduction,
    otherDeductions,
    totalDeductions,
    netSalary
  };
}

/**
 * Vollständige Lohnberechnung für einen Benutzer
 */
export async function calculatePayrollForUser(data: PayrollCalculationData) {
  const { userId, periodStart, periodEnd } = data;

  // Gehaltskonfiguration abrufen
  const salaryConfig = await prisma.salaryConfiguration.findUnique({
    where: { userId }
  });

  if (!salaryConfig || !salaryConfig.isActive) {
    throw new Error(`No active salary configuration found for user ${userId}`);
  }

  // Arbeitsstunden berechnen
  const hours = await calculateWorkingHours(userId, periodStart, periodEnd);

  // Abwesenheitstage berechnen
  const absence = await calculateAbsenceDays(userId, periodStart, periodEnd);

  // Gehalt berechnen
  const salary = await calculateSalary(userId, hours, salaryConfig);

  // Abzüge berechnen
  const deductions = calculateDeductions(salary.grossSalary, salaryConfig);

  return {
    ...hours,
    ...salary,
    ...deductions,
    absenceDays: absence.totalAbsenceDays,
    vacationDaysTaken: absence.vacationDays,
    sickDays: absence.sickDays
  };
}

/**
 * Generiert eine Lohnabrechnung (PDF-Export)
 */
export async function generatePayrollReport(payrollPeriodId: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: payrollPeriodId },
    include: {
      payrollEntries: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true,
              street: true,
              streetNumber: true,
              zipCode: true,
              city: true,
              ahvNumber: true
            }
          }
        }
      }
    }
  });

  if (!period) {
    throw new Error('Payroll period not found');
  }

  // Hier könnte die PDF-Generierung erfolgen
  // Für jetzt geben wir die Daten zurück
  return {
    period,
    totalGrossSalary: period.payrollEntries.reduce((sum, entry) => sum + entry.grossSalary, 0),
    totalNetSalary: period.payrollEntries.reduce((sum, entry) => sum + entry.netSalary, 0),
    totalDeductions: period.payrollEntries.reduce((sum, entry) => sum + entry.totalDeductions, 0),
    employeeCount: period.payrollEntries.length
  };
}

/**
 * Validiert eine Lohnperiode vor der Genehmigung
 */
export async function validatePayrollPeriod(payrollPeriodId: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: payrollPeriodId },
    include: {
      payrollEntries: {
        include: {
          user: true
        }
      }
    }
  });

  if (!period) {
    throw new Error('Payroll period not found');
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Prüfen ob alle aktiven Mitarbeiter enthalten sind
  const activeUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      exitDate: null
    }
  });

  const userIdsInPayroll = period.payrollEntries.map(entry => entry.userId);
  const missingUsers = activeUsers.filter(user => !userIdsInPayroll.includes(user.id));

  if (missingUsers.length > 0) {
    warnings.push(`${missingUsers.length} aktive Mitarbeiter fehlen in der Abrechnung`);
  }

  // Prüfen auf ungültige Werte
  period.payrollEntries.forEach(entry => {
    if (entry.netSalary < 0) {
      errors.push(`Negativer Nettolohn für ${entry.user.firstName} ${entry.user.lastName}`);
    }
    if (entry.grossSalary === 0) {
      warnings.push(`Bruttolohn ist 0 für ${entry.user.firstName} ${entry.user.lastName}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
