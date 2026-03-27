import { prisma } from '../lib/prisma';
import { 
  calculateWorkingHours,
  calculateAbsenceDays,
  calculateSalary,
  calculateDeductions
} from '../services/payroll.service';

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    timeEntry: {
      findMany: jest.fn(),
    },
    absenceRequest: {
      findMany: jest.fn(),
    },
  },
}));

describe('Payroll Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateWorkingHours', () => {
    it('should calculate regular hours correctly', async () => {
      const mockTimeEntries = [
        {
          clockIn: new Date('2024-01-15T09:00:00Z'), // Monday 9:00
          clockOut: new Date('2024-01-15T17:00:00Z'), // 8 hours
          userId: 'user-1',
        },
        {
          clockIn: new Date('2024-01-16T10:00:00Z'), // Tuesday 10:00
          clockOut: new Date('2024-01-16T16:00:00Z'), // 6 hours
          userId: 'user-1',
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockTimeEntries);

      const result = await calculateWorkingHours(
        'user-1',
        new Date('2024-01-15'),
        new Date('2024-01-16')
      );

      expect(result.regularHours).toBeGreaterThan(0);
      expect(result.overtimeHours).toBe(0);
    });

    it('should calculate Sunday hours separately', async () => {
      const mockTimeEntries = [
        {
          clockIn: new Date('2024-01-14T09:00:00Z'), // Sunday 9:00
          clockOut: new Date('2024-01-14T17:00:00Z'), // 8 hours
          userId: 'user-1',
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockTimeEntries);

      const result = await calculateWorkingHours(
        'user-1',
        new Date('2024-01-14'),
        new Date('2024-01-14')
      );

      expect(result.sundayHours).toBeGreaterThan(0);
      expect(result.regularHours).toBe(0);
    });

    it('should calculate night hours (22:00 - 06:00)', async () => {
      const mockTimeEntries = [
        {
          clockIn: new Date('2024-01-15T22:00:00Z'), // 22:00
          clockOut: new Date('2024-01-16T06:00:00Z'), // 8 hours night shift
          userId: 'user-1',
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockTimeEntries);

      const result = await calculateWorkingHours(
        'user-1',
        new Date('2024-01-15'),
        new Date('2024-01-16')
      );

      expect(result.nightHours).toBeGreaterThan(0);
    });

    it('should handle entries without clockOut', async () => {
      const mockTimeEntries = [
        {
          clockIn: new Date('2024-01-15T09:00:00Z'),
          clockOut: null, // Not clocked out yet
          userId: 'user-1',
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockTimeEntries);

      const result = await calculateWorkingHours(
        'user-1',
        new Date('2024-01-15'),
        new Date('2024-01-15')
      );

      expect(result.regularHours).toBe(0);
    });

    it('should return zero hours when no time entries exist', async () => {
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateWorkingHours(
        'user-1',
        new Date('2024-01-15'),
        new Date('2024-01-16')
      );

      expect(result.regularHours).toBe(0);
      expect(result.overtimeHours).toBe(0);
      expect(result.nightHours).toBe(0);
      expect(result.sundayHours).toBe(0);
      expect(result.holidayHours).toBe(0);
    });
  });

  describe('calculateAbsenceDays', () => {
    it('should calculate total absence days correctly', async () => {
      const mockAbsences = [
        {
          userId: 'user-1',
          type: 'VACATION',
          status: 'APPROVED',
          days: 5,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-19'),
        },
        {
          userId: 'user-1',
          type: 'SICK_LEAVE',
          status: 'APPROVED',
          days: 2,
          startDate: new Date('2024-01-22'),
          endDate: new Date('2024-01-23'),
        },
      ];

      (prisma.absenceRequest.findMany as jest.Mock).mockResolvedValue(mockAbsences);

      const result = await calculateAbsenceDays(
        'user-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.totalAbsenceDays).toBe(7);
      expect(result.vacationDays).toBe(5);
      expect(result.sickDays).toBe(2);
    });

    it('should only count approved absences', async () => {
      const mockAbsences = [
        {
          userId: 'user-1',
          type: 'VACATION',
          status: 'APPROVED',
          days: 5,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-19'),
        },
      ];

      (prisma.absenceRequest.findMany as jest.Mock).mockResolvedValue(mockAbsences);

      const result = await calculateAbsenceDays(
        'user-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.totalAbsenceDays).toBe(5);
    });

    it('should return zero when no absences exist', async () => {
      (prisma.absenceRequest.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateAbsenceDays(
        'user-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.totalAbsenceDays).toBe(0);
      expect(result.vacationDays).toBe(0);
      expect(result.sickDays).toBe(0);
    });
  });

  describe('calculateSalary', () => {
    const mockConfig = {
      monthlySalary: 5000,
      hourlySalary: 28.90, // ~5000/173
      overtimeRate: 125,
      nightRate: 125,
      sundayRate: 150,
      holidayRate: 150,
    };

    it('should calculate base salary correctly', async () => {
      const hours = {
        regularHours: 173,
        overtimeHours: 0,
        nightHours: 0,
        sundayHours: 0,
        holidayHours: 0,
      };

      const result = await calculateSalary('user-1', hours, mockConfig);

      expect(result.baseSalary).toBe(5000);
      expect(result.grossSalary).toBeGreaterThanOrEqual(5000);
    });

    it('should calculate overtime pay with 125% rate', async () => {
      const hours = {
        regularHours: 173,
        overtimeHours: 10,
        nightHours: 0,
        sundayHours: 0,
        holidayHours: 0,
      };

      const result = await calculateSalary('user-1', hours, mockConfig);

      expect(result.overtimePay).toBeGreaterThan(0);
      expect(result.grossSalary).toBeGreaterThan(result.baseSalary);
    });

    it('should calculate night bonus (25% extra)', async () => {
      const hours = {
        regularHours: 0,
        overtimeHours: 0,
        nightHours: 8,
        sundayHours: 0,
        holidayHours: 0,
      };

      const result = await calculateSalary('user-1', hours, mockConfig);

      expect(result.nightBonus).toBeGreaterThan(0);
    });

    it('should calculate Sunday bonus (50% extra)', async () => {
      const hours = {
        regularHours: 0,
        overtimeHours: 0,
        nightHours: 0,
        sundayHours: 8,
        holidayHours: 0,
      };

      const result = await calculateSalary('user-1', hours, mockConfig);

      expect(result.sundayBonus).toBeGreaterThan(0);
    });

    it('should combine all bonuses correctly', async () => {
      const hours = {
        regularHours: 173,
        overtimeHours: 5,
        nightHours: 4,
        sundayHours: 2,
        holidayHours: 1,
      };

      const result = await calculateSalary('user-1', hours, mockConfig);

      expect(result.grossSalary).toBeGreaterThan(result.baseSalary);
      expect(result.grossSalary).toBe(
        result.baseSalary +
        result.overtimePay +
        result.nightBonus +
        result.sundayBonus +
        result.holidayBonus
      );
    });
  });

  describe('calculateDeductions', () => {
    const mockConfig = {
      ahvRate: 5.3,        // AHV/IV/EO
      alvRate: 1.1,        // Arbeitslosenversicherung
      nbuvRate: 1.0,       // Nichtberufsunfallversicherung
      pensionRate: 7.5,    // Pensionskasse
      taxRate: 4.5,        // Quellensteuer
    };

    it('should calculate all deductions correctly', () => {
      const grossSalary = 6000;

      const result = calculateDeductions(grossSalary, mockConfig);

      expect(result.ahvDeduction).toBe(grossSalary * 0.053);
      expect(result.alvDeduction).toBe(grossSalary * 0.011);
      expect(result.nbuvDeduction).toBe(grossSalary * 0.01);
      expect(result.pensionDeduction).toBe(grossSalary * 0.075);
      expect(result.taxDeduction).toBe(grossSalary * 0.045);
    });

    it('should calculate total deductions as sum of all components', () => {
      const grossSalary = 6000;

      const result = calculateDeductions(grossSalary, mockConfig);

      const expectedTotal =
        result.ahvDeduction +
        result.alvDeduction +
        result.nbuvDeduction +
        result.pensionDeduction +
        result.taxDeduction +
        result.otherDeductions;

      expect(result.totalDeductions).toBe(expectedTotal);
    });

    it('should calculate net salary correctly', () => {
      const grossSalary = 6000;

      const result = calculateDeductions(grossSalary, mockConfig);

      expect(result.netSalary).toBe(grossSalary - result.totalDeductions);
      expect(result.netSalary).toBeLessThan(grossSalary);
    });

    it('should handle zero gross salary', () => {
      const result = calculateDeductions(0, mockConfig);

      expect(result.totalDeductions).toBe(0);
      expect(result.netSalary).toBe(0);
    });

    it('should handle high gross salary correctly', () => {
      const grossSalary = 15000;

      const result = calculateDeductions(grossSalary, mockConfig);

      expect(result.netSalary).toBeGreaterThan(0);
      expect(result.netSalary).toBeLessThan(grossSalary);
      expect(result.totalDeductions).toBeGreaterThan(0);
    });
  });
});
