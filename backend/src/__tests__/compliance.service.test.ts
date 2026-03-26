import { PrismaClient } from '@prisma/client';
import {
  checkRestTimeViolation,
  checkWeeklyHoursViolation,
  checkDailyHoursViolation,
  checkMissingPauseViolation,
  updateOvertimeBalance,
  isNightWork,
  isSundayWork,
} from '../services/compliance.service';

jest.mock('../services/action.service', () => ({
  actionService: {
    triggerAction: jest.fn().mockResolvedValue(undefined),
  },
}));

const prisma = new PrismaClient();

const makeViolation = (type: string, id = 'v-1') => ({
  id,
  type,
  severity: 'WARNING',
  date: new Date(),
  description: 'Test violation',
  actualValue: '10h',
  requiredValue: '11h',
  createdAt: new Date(),
  employeeId: 'emp-1',
});

describe('Compliance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== checkRestTimeViolation =====
  describe('checkRestTimeViolation', () => {
    it('should do nothing when no previous time entry exists', async () => {
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null);

      await checkRestTimeViolation('emp-1', new Date());

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should do nothing when rest time >= 11h', async () => {
      const clockOut = new Date('2024-01-02T08:00:00Z');
      const newClockIn = new Date('2024-01-02T20:00:00Z'); // 12h later
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ id: 'e-1', clockOut });

      await checkRestTimeViolation('emp-1', newClockIn);

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should do nothing when rest time is exactly 11h', async () => {
      const clockOut = new Date('2024-01-02T08:00:00Z');
      const newClockIn = new Date('2024-01-02T19:00:00Z'); // exactly 11h later
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ id: 'e-1', clockOut });

      await checkRestTimeViolation('emp-1', newClockIn);

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should create REST_TIME CRITICAL violation when rest time < 11h', async () => {
      const clockOut = new Date('2024-01-02T22:00:00Z');
      const newClockIn = new Date('2024-01-03T05:00:00Z'); // 7h later
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ id: 'e-1', clockOut });
      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue(makeViolation('REST_TIME'));

      await checkRestTimeViolation('emp-1', newClockIn);

      expect(prisma.complianceViolation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: 'emp-1',
            type: 'REST_TIME',
            severity: 'CRITICAL',
          }),
        })
      );
    });

    it('should include rest time duration in the description', async () => {
      const clockOut = new Date('2024-01-02T22:00:00Z');
      const newClockIn = new Date('2024-01-03T04:30:00Z'); // 6.5h later
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ id: 'e-1', clockOut });
      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue(makeViolation('REST_TIME'));

      await checkRestTimeViolation('emp-1', newClockIn);

      const createCall = (prisma.complianceViolation.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.description).toContain('6.5');
      expect(createCall.data.requiredValue).toBe('11 Stunden');
    });

    it('should not throw on database errors', async () => {
      (prisma.timeEntry.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(checkRestTimeViolation('emp-1', new Date())).resolves.toBeUndefined();
    });
  });

  // ===== checkWeeklyHoursViolation =====
  describe('checkWeeklyHoursViolation', () => {
    it('should do nothing when employee is not found', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(null);

      await checkWeeklyHoursViolation('emp-1', new Date());

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should do nothing when employee is exempt from tracking', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        weeklyHours: 42,
        exemptFromTracking: true,
      });

      await checkWeeklyHoursViolation('emp-1', new Date());

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should not create violation when weekly hours are within limit', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        weeklyHours: 42,
        exemptFromTracking: false,
      });
      // 5 days × 8h net = 40h < 42h
      const entries = Array.from({ length: 5 }, (_, i) => ({
        clockIn: new Date(`2024-01-1${i + 5}T08:00:00Z`),
        clockOut: new Date(`2024-01-1${i + 5}T16:30:00Z`), // 8.5h gross
        pauseMinutes: 30, // 8h net
      }));
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(entries);

      await checkWeeklyHoursViolation('emp-1', new Date('2024-01-15'));

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should create MAX_WEEKLY_HOURS violation when limit exceeded', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        weeklyHours: 42,
        exemptFromTracking: false,
      });
      // 5 days × 9h net = 45h > 42h
      const entries = Array.from({ length: 5 }, (_, i) => ({
        clockIn: new Date(`2024-01-1${i + 5}T07:00:00Z`),
        clockOut: new Date(`2024-01-1${i + 5}T16:00:00Z`), // 9h gross, 0 pause
        pauseMinutes: 0,
      }));
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(entries);
      (prisma.complianceViolation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue(
        makeViolation('MAX_WEEKLY_HOURS')
      );

      await checkWeeklyHoursViolation('emp-1', new Date('2024-01-15'));

      expect(prisma.complianceViolation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: 'emp-1',
            type: 'MAX_WEEKLY_HOURS',
            severity: 'WARNING',
          }),
        })
      );
    });

    it('should not create duplicate violation if one already exists for the week', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        weeklyHours: 42,
        exemptFromTracking: false,
      });
      const entries = Array.from({ length: 5 }, () => ({
        clockIn: new Date('2024-01-15T07:00:00Z'),
        clockOut: new Date('2024-01-15T16:00:00Z'),
        pauseMinutes: 0,
      }));
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(entries);
      (prisma.complianceViolation.findFirst as jest.Mock).mockResolvedValue(
        makeViolation('MAX_WEEKLY_HOURS')
      );

      await checkWeeklyHoursViolation('emp-1', new Date('2024-01-15'));

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should not throw on database errors', async () => {
      (prisma.employee.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        checkWeeklyHoursViolation('emp-1', new Date())
      ).resolves.toBeUndefined();
    });
  });

  // ===== checkDailyHoursViolation =====
  describe('checkDailyHoursViolation', () => {
    it('should not create violation for a normal 8h shift', async () => {
      const clockIn = new Date('2024-01-15T08:00:00Z');
      const clockOut = new Date('2024-01-15T17:00:00Z'); // 9h gross
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 45 }); // 8.25h net

      await checkDailyHoursViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should not create violation for exactly 12.5h net', async () => {
      const clockIn = new Date('2024-01-15T06:00:00Z');
      const clockOut = new Date('2024-01-15T19:00:00Z'); // 13h gross
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 30 }); // 12.5h net

      await checkDailyHoursViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should create MAX_DAILY_HOURS CRITICAL violation when net hours exceed 12.5h', async () => {
      const clockIn = new Date('2024-01-15T06:00:00Z');
      const clockOut = new Date('2024-01-15T20:00:00Z'); // 14h gross
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 0 }); // 14h net
      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue(
        makeViolation('MAX_DAILY_HOURS')
      );

      await checkDailyHoursViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: 'emp-1',
            type: 'MAX_DAILY_HOURS',
            severity: 'CRITICAL',
          }),
        })
      );
    });

    it('should fallback to 0 pause minutes when time entry not found', async () => {
      const clockIn = new Date('2024-01-15T06:00:00Z');
      const clockOut = new Date('2024-01-15T20:00:00Z'); // 14h gross
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null); // no entry
      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue(
        makeViolation('MAX_DAILY_HOURS')
      );

      await checkDailyHoursViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'MAX_DAILY_HOURS' }),
        })
      );
    });

    it('should not throw on database errors', async () => {
      const clockIn = new Date('2024-01-15T06:00:00Z');
      const clockOut = new Date('2024-01-15T20:00:00Z');
      (prisma.timeEntry.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        checkDailyHoursViolation('emp-1', clockIn, clockOut)
      ).resolves.toBeUndefined();
    });
  });

  // ===== checkMissingPauseViolation =====
  describe('checkMissingPauseViolation', () => {
    it('should not create violation for work < 5.5h (no pause required)', async () => {
      const clockIn = new Date('2024-01-15T08:00:00Z');
      const clockOut = new Date('2024-01-15T13:00:00Z'); // 5h
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 0 });

      await checkMissingPauseViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should create MISSING_PAUSE WARNING for 5.5-7h work with no pause', async () => {
      const clockIn = new Date('2024-01-15T08:00:00Z');
      const clockOut = new Date('2024-01-15T14:30:00Z'); // 6.5h
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 0 });
      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue(
        makeViolation('MISSING_PAUSE')
      );

      await checkMissingPauseViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'MISSING_PAUSE',
            severity: 'WARNING',
          }),
        })
      );
    });

    it('should not create violation when sufficient 15min pause is provided for 5.5-7h', async () => {
      const clockIn = new Date('2024-01-15T08:00:00Z');
      const clockOut = new Date('2024-01-15T14:30:00Z'); // 6.5h gross - 15min = 6.25h net
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 15 });

      await checkMissingPauseViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should create violation for 7-9h work requiring 30 min pause', async () => {
      const clockIn = new Date('2024-01-15T07:00:00Z');
      const clockOut = new Date('2024-01-15T15:00:00Z'); // 8h - 15min pause = 7.75h net
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 15 }); // needs 30
      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue(
        makeViolation('MISSING_PAUSE')
      );

      await checkMissingPauseViolation('emp-1', clockIn, clockOut);

      const createCall = (prisma.complianceViolation.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.type).toBe('MISSING_PAUSE');
      expect(createCall.data.severity).toBe('WARNING');
      expect(createCall.data.requiredValue).toContain('30');
    });

    it('should not create violation when 30min pause is provided for 7-9h work', async () => {
      const clockIn = new Date('2024-01-15T07:00:00Z');
      const clockOut = new Date('2024-01-15T15:30:00Z'); // 8.5h gross - 30min = 8h net
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 30 });

      await checkMissingPauseViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should create CRITICAL violation for 9+h work with < 60min pause', async () => {
      const clockIn = new Date('2024-01-15T06:00:00Z');
      const clockOut = new Date('2024-01-15T16:00:00Z'); // 10h - 30min = 9.5h net
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 30 }); // needs 60
      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue(
        makeViolation('MISSING_PAUSE')
      );

      await checkMissingPauseViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'MISSING_PAUSE',
            severity: 'CRITICAL',
          }),
        })
      );
    });

    it('should not create violation when 60min pause is provided for 9+h work', async () => {
      const clockIn = new Date('2024-01-15T06:00:00Z');
      const clockOut = new Date('2024-01-15T16:00:00Z'); // 10h gross - 60min = 9h net
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({ pauseMinutes: 60 });

      await checkMissingPauseViolation('emp-1', clockIn, clockOut);

      expect(prisma.complianceViolation.create).not.toHaveBeenCalled();
    });

    it('should not throw on database errors', async () => {
      const clockIn = new Date('2024-01-15T08:00:00Z');
      const clockOut = new Date('2024-01-15T16:00:00Z');
      (prisma.timeEntry.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        checkMissingPauseViolation('emp-1', clockIn, clockOut)
      ).resolves.toBeUndefined();
    });
  });

  // ===== updateOvertimeBalance =====
  describe('updateOvertimeBalance', () => {
    it('should do nothing when employee is not found', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(null);

      await updateOvertimeBalance('emp-1', new Date());

      expect(prisma.overtimeBalance.upsert).not.toHaveBeenCalled();
    });

    it('should do nothing when employee is exempt from tracking', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        weeklyHours: 42,
        contractHours: 40,
        exemptFromTracking: true,
      });

      await updateOvertimeBalance('emp-1', new Date());

      expect(prisma.overtimeBalance.upsert).not.toHaveBeenCalled();
    });

    it('should upsert overtime balance for regular work week', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        weeklyHours: 42,
        contractHours: 40,
        exemptFromTracking: false,
      });
      // 5 × 8h = 40h (exactly contract, no overtime)
      const entries = Array.from({ length: 5 }, (_, i) => ({
        clockIn: new Date(`2024-01-1${i + 5}T08:00:00Z`),
        clockOut: new Date(`2024-01-1${i + 5}T16:00:00Z`),
        pauseMinutes: 0,
      }));
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(entries);
      (prisma.overtimeBalance.upsert as jest.Mock).mockResolvedValue({
        id: 'ob-1',
        employeeId: 'emp-1',
        year: 2024,
        regularOvertime: 0,
        extraTime: 0,
      });

      await updateOvertimeBalance('emp-1', new Date('2024-01-15'));

      expect(prisma.overtimeBalance.upsert).toHaveBeenCalled();
    });

    it('should calculate regularOvertime when hours between contract and max', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        weeklyHours: 45,
        contractHours: 40,
        exemptFromTracking: false,
      });
      // 5 × 8.6h = 43h (between contractHours=40 and weeklyHours=45)
      const entries = Array.from({ length: 5 }, (_, i) => ({
        clockIn: new Date(`2024-01-1${i + 5}T07:00:00Z`),
        clockOut: new Date(`2024-01-1${i + 5}T15:36:00Z`), // 8.6h each
        pauseMinutes: 0,
      }));
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(entries);
      (prisma.overtimeBalance.upsert as jest.Mock).mockResolvedValue({
        id: 'ob-1',
        extraTime: 0,
      });

      await updateOvertimeBalance('emp-1', new Date('2024-01-15'));

      const upsertCall = (prisma.overtimeBalance.upsert as jest.Mock).mock.calls[0][0];
      expect(upsertCall.update.regularOvertime.increment).toBeGreaterThan(0);
      expect(upsertCall.update.extraTime.increment).toBe(0);
    });

    it('should not throw on database errors', async () => {
      (prisma.employee.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        updateOvertimeBalance('emp-1', new Date())
      ).resolves.toBeUndefined();
    });
  });

  // ===== isNightWork (pure function) =====
  describe('isNightWork', () => {
    it('should return true when work starts at or after 23:00', () => {
      const clockIn = new Date('2024-01-15T23:00:00');
      const clockOut = new Date('2024-01-16T07:00:00');
      expect(isNightWork(clockIn, clockOut)).toBe(true);
    });

    it('should return true when work starts before 06:00', () => {
      const clockIn = new Date('2024-01-15T04:00:00');
      const clockOut = new Date('2024-01-15T12:00:00');
      expect(isNightWork(clockIn, clockOut)).toBe(true);
    });

    it('should return true when work ends before 06:00', () => {
      const clockIn = new Date('2024-01-15T20:00:00');
      const clockOut = new Date('2024-01-16T05:30:00');
      expect(isNightWork(clockIn, clockOut)).toBe(true);
    });

    it('should return false for normal daytime work (06:00 - 22:59)', () => {
      const clockIn = new Date('2024-01-15T08:00:00');
      const clockOut = new Date('2024-01-15T17:00:00');
      expect(isNightWork(clockIn, clockOut)).toBe(false);
    });

    it('should return false for work ending exactly at 06:00', () => {
      const clockIn = new Date('2024-01-15T08:00:00');
      const clockOut = new Date('2024-01-15T16:00:00');
      expect(isNightWork(clockIn, clockOut)).toBe(false);
    });
  });

  // ===== isSundayWork (pure function) =====
  describe('isSundayWork', () => {
    it('should return true for Sunday', () => {
      const sunday = new Date('2024-01-14'); // Sunday
      expect(isSundayWork(sunday)).toBe(true);
    });

    it('should return false for Monday', () => {
      const monday = new Date('2024-01-15'); // Monday
      expect(isSundayWork(monday)).toBe(false);
    });

    it('should return false for Saturday', () => {
      const saturday = new Date('2024-01-13'); // Saturday
      expect(isSundayWork(saturday)).toBe(false);
    });

    it('should return false for midweek days', () => {
      const wednesday = new Date('2024-01-17'); // Wednesday
      expect(isSundayWork(wednesday)).toBe(false);
    });
  });
});
