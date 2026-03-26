import { PrismaClient } from '@prisma/client';
import {
  updateBudgetFromTimeEntry,
  reverseBudgetFromTimeEntry,
} from '../services/budgetUpdate.service';
import { getHourlyRateForUser } from '../services/hourlyRate.service';

jest.mock('../services/hourlyRate.service', () => ({
  getHourlyRateForUser: jest.fn(),
}));

const prisma = new PrismaClient();
const mockGetHourlyRateForUser = getHourlyRateForUser as jest.MockedFunction<typeof getHourlyRateForUser>;

const makeTimeEntry = (overrides: Partial<any> = {}) => ({
  id: 'te-1',
  employeeId: 'emp-1',
  projectId: 'proj-1',
  clockIn: new Date('2026-01-10T08:00:00Z'),
  clockOut: new Date('2026-01-10T12:00:00Z'),
  status: 'CLOCKED_OUT',
  pauseMinutes: 0,
  employee: {
    id: 'emp-1',
    firstName: 'Max',
    lastName: 'Muster',
    userId: 'user-1',
  },
  projectTimeAllocations: [],
  ...overrides,
});

describe('budgetUpdate.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateBudgetFromTimeEntry', () => {
    it('returns when time entry is not found', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await updateBudgetFromTimeEntry('missing');

      expect(mockGetHourlyRateForUser).not.toHaveBeenCalled();
      expect(prisma.projectBudgetItem.update).not.toHaveBeenCalled();
    });

    it('returns when status is not CLOCKED_OUT', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(
        makeTimeEntry({ status: 'CLOCKED_IN' })
      );

      await updateBudgetFromTimeEntry('te-1');

      expect(mockGetHourlyRateForUser).not.toHaveBeenCalled();
    });

    it('returns when clockOut is missing', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(
        makeTimeEntry({ clockOut: null })
      );

      await updateBudgetFromTimeEntry('te-1');

      expect(mockGetHourlyRateForUser).not.toHaveBeenCalled();
    });

    it('returns when employee has no userId', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(
        makeTimeEntry({ employee: { firstName: 'Max', lastName: 'Muster', userId: null } })
      );

      await updateBudgetFromTimeEntry('te-1');

      expect(mockGetHourlyRateForUser).not.toHaveBeenCalled();
    });

    it('returns when hourly rate lookup throws', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(makeTimeEntry());
      mockGetHourlyRateForUser.mockRejectedValue(new Error('rate error'));

      await updateBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudget.findFirst).not.toHaveBeenCalled();
    });

    it('updates budget from project allocations path', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(
        makeTimeEntry({
          projectTimeAllocations: [
            { projectId: 'proj-1', hours: 2 },
            { projectId: 'proj-2', hours: 1.5 },
          ],
        })
      );
      mockGetHourlyRateForUser.mockResolvedValue(100);

      (prisma.projectBudget.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'b1' })
        .mockResolvedValueOnce({ id: 'b2' });
      (prisma.projectBudgetItem.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'i1', actualHours: 1, plannedHours: 3 })
        .mockResolvedValueOnce({ id: 'i2', actualHours: 0, plannedHours: 2 });
      (prisma.projectBudgetItem.update as jest.Mock).mockResolvedValue({});
      (prisma.projectBudgetItem.findMany as jest.Mock)
        .mockResolvedValueOnce([{ plannedCost: 300, actualCost: 300, isActive: true }])
        .mockResolvedValueOnce([{ plannedCost: 200, actualCost: 150, isActive: true }]);
      (prisma.projectBudget.findUnique as jest.Mock)
        .mockResolvedValueOnce({ totalBudget: 1000 })
        .mockResolvedValueOnce({ totalBudget: 800 });
      (prisma.projectBudget.update as jest.Mock).mockResolvedValue({});

      await updateBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudgetItem.update).toHaveBeenCalledTimes(2);
      expect(prisma.projectBudget.update).toHaveBeenCalledTimes(2);
    });

    it('creates budget item when none exists', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(makeTimeEntry());
      mockGetHourlyRateForUser.mockResolvedValue(90);
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue({ id: 'b1' });
      (prisma.projectBudgetItem.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.projectBudgetItem.create as jest.Mock).mockResolvedValue({
        id: 'i-new',
        actualHours: 0,
        plannedHours: 0,
      });
      (prisma.projectBudgetItem.update as jest.Mock).mockResolvedValue({});
      (prisma.projectBudgetItem.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectBudget.findUnique as jest.Mock).mockResolvedValue({ totalBudget: 1000 });
      (prisma.projectBudget.update as jest.Mock).mockResolvedValue({});

      await updateBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudgetItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'LABOR',
            hourlyRate: 90,
          }),
        })
      );
    });

    it('returns when projectId is missing and no allocations exist', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(
        makeTimeEntry({ projectId: null, projectTimeAllocations: [] })
      );
      mockGetHourlyRateForUser.mockResolvedValue(80);

      await updateBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudget.findFirst).not.toHaveBeenCalled();
    });

    it('returns when worked hours are <= 0 in fallback path', async () => {
      const sameTime = new Date('2026-01-10T10:00:00Z');
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(
        makeTimeEntry({ clockIn: sameTime, clockOut: sameTime, projectTimeAllocations: [] })
      );
      mockGetHourlyRateForUser.mockResolvedValue(80);

      await updateBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudget.findFirst).not.toHaveBeenCalled();
    });

    it('returns when no active budget is found', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(makeTimeEntry());
      mockGetHourlyRateForUser.mockResolvedValue(80);
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue(null);

      await updateBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudgetItem.update).not.toHaveBeenCalled();
    });

    it('sets budget status to EXCEEDED when utilization >= 100', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(makeTimeEntry());
      mockGetHourlyRateForUser.mockResolvedValue(200);
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue({ id: 'b1' });
      (prisma.projectBudgetItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'i1',
        actualHours: 3,
        plannedHours: 1,
      });
      (prisma.projectBudgetItem.update as jest.Mock).mockResolvedValue({});
      (prisma.projectBudgetItem.findMany as jest.Mock).mockResolvedValue([
        { plannedCost: 100, actualCost: 1200, isActive: true },
      ]);
      (prisma.projectBudget.findUnique as jest.Mock).mockResolvedValue({ totalBudget: 1000 });
      (prisma.projectBudget.update as jest.Mock).mockResolvedValue({});

      await updateBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudget.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'EXCEEDED' }) })
      );
    });
  });

  describe('reverseBudgetFromTimeEntry', () => {
    it('returns when entry is missing or incomplete', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await reverseBudgetFromTimeEntry('missing');

      expect(mockGetHourlyRateForUser).not.toHaveBeenCalled();
    });

    it('returns when hourly rate lookup fails', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(makeTimeEntry());
      mockGetHourlyRateForUser.mockRejectedValue(new Error('rate error'));

      await reverseBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudget.findFirst).not.toHaveBeenCalled();
    });

    it('reverses with allocations path', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(
        makeTimeEntry({
          projectTimeAllocations: [{ projectId: 'proj-1', hours: 2 }],
        })
      );
      mockGetHourlyRateForUser.mockResolvedValue(100);
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue({ id: 'b1' });
      (prisma.projectBudgetItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'i1',
        actualHours: 5,
        plannedHours: 2,
      });
      (prisma.projectBudgetItem.update as jest.Mock).mockResolvedValue({});
      (prisma.projectBudgetItem.findMany as jest.Mock).mockResolvedValue([
        { plannedCost: 400, actualCost: 300, isActive: true },
      ]);
      (prisma.projectBudget.findUnique as jest.Mock).mockResolvedValue({ totalBudget: 1000 });
      (prisma.projectBudget.update as jest.Mock).mockResolvedValue({});

      await reverseBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudgetItem.update).toHaveBeenCalled();
      expect(prisma.projectBudget.update).toHaveBeenCalled();
    });

    it('clamps actualHours at zero on reversal', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(makeTimeEntry());
      mockGetHourlyRateForUser.mockResolvedValue(100);
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue({ id: 'b1' });
      (prisma.projectBudgetItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'i1',
        actualHours: 1,
        plannedHours: 1,
      });
      (prisma.projectBudgetItem.update as jest.Mock).mockResolvedValue({});
      (prisma.projectBudgetItem.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectBudget.findUnique as jest.Mock).mockResolvedValue({ totalBudget: 1000 });
      (prisma.projectBudget.update as jest.Mock).mockResolvedValue({});

      await reverseBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudgetItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ actualHours: 0 }) })
      );
    });

    it('returns when reverse fallback has workedHours <= 0', async () => {
      const sameTime = new Date('2026-01-10T10:00:00Z');
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(
        makeTimeEntry({ clockIn: sameTime, clockOut: sameTime, projectTimeAllocations: [] })
      );
      mockGetHourlyRateForUser.mockResolvedValue(100);

      await reverseBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudget.findFirst).not.toHaveBeenCalled();
    });

    it('returns when no budget or no budget item exists in reverse', async () => {
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue(makeTimeEntry());
      mockGetHourlyRateForUser.mockResolvedValue(100);
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue(null);

      await reverseBudgetFromTimeEntry('te-1');

      expect(prisma.projectBudgetItem.update).not.toHaveBeenCalled();
    });
  });
});
