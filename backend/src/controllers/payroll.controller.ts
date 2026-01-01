import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Perioden erstellen
export const createPayrollPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { name, year, month, startDate, endDate, type, notes } = req.body;

    const payrollPeriod = await prisma.payrollPeriod.create({
      data: {
        name,
        year: parseInt(year),
        month: parseInt(month),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || 'MONTHLY',
        notes
      }
    });

    res.status(201).json(payrollPeriod);
  } catch (error) {
    console.error('Create payroll period error:', error);
    res.status(500).json({ error: 'Failed to create payroll period' });
  }
};

// Alle Perioden abrufen
export const getPayrollPeriods = async (req: AuthRequest, res: Response) => {
  try {
    const { year, status } = req.query;
    
    const where: any = {};
    if (year) where.year = parseInt(year as string);
    if (status) where.status = status;

    const periods = await prisma.payrollPeriod.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
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
                dateOfBirth: true,
                placeOfBirth: true,
                nationality: true,
                phone: true,
                mobile: true,
                street: true,
                streetNumber: true,
                zipCode: true,
                city: true,
                country: true,
                entryDate: true,
                exitDate: true,
                iban: true,
                bankName: true,
                civilStatus: true,
                religion: true,
                ahvNumber: true,
                canton: true
              }
            }
          }
        }
      }
    });

    res.json(periods);
  } catch (error) {
    console.error('Get payroll periods error:', error);
    res.status(500).json({ error: 'Failed to get payroll periods' });
  }
};

// Eine spezifische Periode abrufen
export const getPayrollPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
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
                dateOfBirth: true,
                placeOfBirth: true,
                nationality: true,
                phone: true,
                mobile: true,
                street: true,
                streetNumber: true,
                zipCode: true,
                city: true,
                country: true,
                entryDate: true,
                exitDate: true,
                iban: true,
                bankName: true,
                civilStatus: true,
                religion: true,
                ahvNumber: true,
                canton: true
              }
            }
          },
          orderBy: {
            user: {
              lastName: 'asc'
            }
          }
        }
      }
    });

    if (!period) {
      return res.status(404).json({ error: 'Payroll period not found' });
    }

    res.json(period);
  } catch (error) {
    console.error('Get payroll period error:', error);
    res.status(500).json({ error: 'Failed to get payroll period' });
  }
};

// Periode aktualisieren
export const updatePayrollPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, notes, approvedBy, paidAt } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'APPROVED') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = approvedBy || req.user!.id;
      } else if (status === 'PAID') {
        updateData.paidAt = paidAt ? new Date(paidAt) : new Date();
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const period = await prisma.payrollPeriod.update({
      where: { id },
      data: updateData,
      include: {
        payrollEntries: {
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
        }
      }
    });

    res.json(period);
  } catch (error) {
    console.error('Update payroll period error:', error);
    res.status(500).json({ error: 'Failed to update payroll period' });
  }
};

// Periode löschen
export const deletePayrollPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.payrollPeriod.delete({
      where: { id }
    });

    res.json({ message: 'Payroll period deleted successfully' });
  } catch (error) {
    console.error('Delete payroll period error:', error);
    res.status(500).json({ error: 'Failed to delete payroll period' });
  }
};

// Abrechnungseintrag erstellen/aktualisieren
export const upsertPayrollEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { payrollPeriodId, userId, ...entryData } = req.body;

    const entry = await prisma.payrollEntry.upsert({
      where: {
        payrollPeriodId_userId: {
          payrollPeriodId,
          userId
        }
      },
      update: entryData,
      create: {
        payrollPeriodId,
        userId,
        ...entryData
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true
          }
        }
      }
    });

    res.json(entry);
  } catch (error) {
    console.error('Upsert payroll entry error:', error);
    res.status(500).json({ error: 'Failed to save payroll entry' });
  }
};

// Abrechnungseinträge für eine Periode berechnen
export const calculatePayrollForPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Periode abrufen
    const period = await prisma.payrollPeriod.findUnique({
      where: { id }
    });

    if (!period) {
      return res.status(404).json({ error: 'Payroll period not found' });
    }

    // Alle aktiven Benutzer abrufen
    const users = await prisma.user.findMany({
      where: { 
        isActive: true,
        exitDate: null
      },
      include: {
        salaryConfiguration: true,
        timeEntries: {
          where: {
            clockIn: {
              gte: period.startDate,
              lte: period.endDate
            }
          }
        },
        absenceRequests: {
          where: {
            status: 'APPROVED',
            startDate: {
              lte: period.endDate
            },
            endDate: {
              gte: period.startDate
            }
          }
        }
      }
    });

    const entries = [];

    // Für jeden Benutzer Abrechnung berechnen
    for (const user of users) {
      if (!user.salaryConfiguration) continue;

      const config = user.salaryConfiguration;
      
      // Stunden berechnen
      let regularHours = 0;
      let overtimeHours = 0;
      let nightHours = 0;
      let sundayHours = 0;
      let holidayHours = 0;

      user.timeEntries.forEach(entry => {
        if (!entry.clockOut) return;
        
        const hours = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60);
        regularHours += hours;
        
        // Hier könnten weitere Berechnungen für Nacht-/Sonntags-/Feiertagsstunden erfolgen
      });

      // Abwesenheitstage berechnen
      let absenceDays = 0;
      let vacationDaysTaken = 0;
      let sickDays = 0;

      user.absenceRequests.forEach(absence => {
        if (absence.type === 'VACATION') {
          vacationDaysTaken += absence.days;
        } else if (absence.type === 'SICK_LEAVE') {
          sickDays += absence.days;
        }
        absenceDays += absence.days;
      });

      // Gehalt berechnen
      const baseSalary = config.monthlySalary;
      const overtimePay = overtimeHours * (config.hourlySalary || 0) * (config.overtimeRate / 100);
      const nightBonus = nightHours * (config.hourlySalary || 0) * ((config.nightRate - 100) / 100);
      const sundayBonus = sundayHours * (config.hourlySalary || 0) * ((config.sundayRate - 100) / 100);
      const holidayBonus = holidayHours * (config.hourlySalary || 0) * ((config.holidayRate - 100) / 100);

      const grossSalary = baseSalary + overtimePay + nightBonus + sundayBonus + holidayBonus;

      // Abzüge berechnen
      const ahvDeduction = grossSalary * (config.ahvRate / 100);
      const alvDeduction = grossSalary * (config.alvRate / 100);
      const nbuvDeduction = grossSalary * (config.nbuvRate / 100);
      const pensionDeduction = grossSalary * (config.pensionRate / 100);
      const taxDeduction = grossSalary * (config.taxRate / 100);

      const totalDeductions = ahvDeduction + alvDeduction + nbuvDeduction + pensionDeduction + taxDeduction;
      const netSalary = grossSalary - totalDeductions;

      // Eintrag erstellen oder aktualisieren
      const entry = await prisma.payrollEntry.upsert({
        where: {
          payrollPeriodId_userId: {
            payrollPeriodId: id,
            userId: user.id
          }
        },
        update: {
          regularHours,
          overtimeHours,
          nightHours,
          sundayHours,
          holidayHours,
          baseSalary,
          overtimePay,
          nightBonus,
          sundayBonus,
          holidayBonus,
          grossSalary,
          ahvDeduction,
          alvDeduction,
          nbuvDeduction,
          pensionDeduction,
          taxDeduction,
          totalDeductions,
          netSalary,
          absenceDays,
          vacationDaysTaken,
          sickDays
        },
        create: {
          payrollPeriodId: id,
          userId: user.id,
          regularHours,
          overtimeHours,
          nightHours,
          sundayHours,
          holidayHours,
          baseSalary,
          overtimePay,
          nightBonus,
          sundayBonus,
          holidayBonus,
          grossSalary,
          ahvDeduction,
          alvDeduction,
          nbuvDeduction,
          pensionDeduction,
          taxDeduction,
          totalDeductions,
          netSalary,
          absenceDays,
          vacationDaysTaken,
          sickDays
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true
            }
          }
        }
      });

      entries.push(entry);
    }

    // Periode als CALCULATED markieren
    await prisma.payrollPeriod.update({
      where: { id },
      data: { status: 'CALCULATED' }
    });

    res.json({ message: 'Payroll calculated successfully', entries });
  } catch (error) {
    console.error('Calculate payroll error:', error);
    res.status(500).json({ error: 'Failed to calculate payroll' });
  }
};

// Gehaltskonfiguration erstellen/aktualisieren
export const upsertSalaryConfiguration = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, validFrom, validUntil, ...configData } = req.body;

    // Konvertiere Datumsstrings zu DateTime
    const data: any = {
      ...configData,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
    };

    if (validUntil) {
      data.validUntil = new Date(validUntil);
    }

    const config = await prisma.salaryConfiguration.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });

    res.json(config);
  } catch (error) {
    console.error('Upsert salary configuration error:', error);
    res.status(500).json({ error: 'Failed to save salary configuration' });
  }
};

// Gehaltskonfiguration abrufen
export const getSalaryConfiguration = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const config = await prisma.salaryConfiguration.findUnique({
      where: { userId }
    });

    if (!config) {
      return res.status(404).json({ error: 'Salary configuration not found' });
    }

    res.json(config);
  } catch (error) {
    console.error('Get salary configuration error:', error);
    res.status(500).json({ error: 'Failed to get salary configuration' });
  }
};

// Meine Abrechnungen abrufen (für Mitarbeiter)
export const getMyPayrollEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const entries = await prisma.payrollEntry.findMany({
      where: { userId },
      include: {
        payrollPeriod: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
            dateOfBirth: true,
            placeOfBirth: true,
            nationality: true,
            phone: true,
            mobile: true,
            street: true,
            streetNumber: true,
            zipCode: true,
            city: true,
            country: true,
            entryDate: true,
            exitDate: true,
            iban: true,
            bankName: true,
            civilStatus: true,
            religion: true,
            ahvNumber: true,
            canton: true
          }
        }
      },
      orderBy: {
        payrollPeriod: {
          year: 'desc'
        }
      }
    });

    res.json(entries);
  } catch (error) {
    console.error('Get my payroll entries error:', error);
    res.status(500).json({ error: 'Failed to get payroll entries' });
  }
};

// Abrechnungen für einen bestimmten Benutzer abrufen (für Admin)
export const getUserPayrollEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const entries = await prisma.payrollEntry.findMany({
      where: { userId },
      include: {
        payrollPeriod: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
            dateOfBirth: true,
            placeOfBirth: true,
            nationality: true,
            phone: true,
            mobile: true,
            street: true,
            streetNumber: true,
            zipCode: true,
            city: true,
            country: true,
            entryDate: true,
            exitDate: true,
            iban: true,
            bankName: true,
            civilStatus: true,
            religion: true,
            ahvNumber: true,
            canton: true
          }
        }
      },
      orderBy: [
        {
          payrollPeriod: {
            year: 'desc'
          }
        },
        {
          payrollPeriod: {
            month: 'desc'
          }
        }
      ]
    });

    res.json(entries);
  } catch (error) {
    console.error('Get user payroll entries error:', error);
    res.status(500).json({ error: 'Failed to get payroll entries' });
  }
};

