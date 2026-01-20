import { PrismaClient } from '@prisma/client';
import { getHourlyRateForUser } from '../services/hourlyRate.service';
import { ZeitmodellService } from '../services/zeitmodell.service';
import { updateBudgetFromTimeEntry } from '../services/budgetUpdate.service';

// Mock Prisma
jest.mock('@prisma/client');
jest.mock('../services/zeitmodell.service');

const prisma = new PrismaClient();

describe('Zeitmodell-Budget Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHourlyRateForUser', () => {
    const userId = 'user-123';
    const projectId = 'project-456';

    it('sollte Zeitmodell-Stundensatz verwenden wenn Zeitmodell vorhanden', async () => {
      const timestamp = new Date('2026-01-20T19:00:00Z');
      
      // Mock ZeitmodellService
      const mockGetStundensatz = jest.fn().mockResolvedValue({
        stundensatz: 125,
        eintragId: 'eintrag-1',
        zeitmodellId: 'zeitmodell-1',
        zeitmodellName: 'Schichtmodell 2026',
      });

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockGetStundensatz,
      }));

      const result = await getHourlyRateForUser(userId, projectId, timestamp);

      expect(result).toBe(125);
      expect(mockGetStundensatz).toHaveBeenCalledWith(
        userId,
        expect.any(Date),
        expect.any(String) // Uhrzeit kann je nach Timezone variieren
      );
    });

    it('sollte auf User.hourlyRate zurückfallen wenn kein Zeitmodell gefunden', async () => {
      const timestamp = new Date('2026-01-20T19:00:00Z');

      // Mock ZeitmodellService wirft Fehler (kein Zeitmodell)
      const mockGetStundensatz = jest.fn().mockRejectedValue(
        new Error('Kein aktives Zeitmodell für diesen Mitarbeiter gefunden')
      );

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockGetStundensatz,
      }));

      // Mock User mit hourlyRate
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        hourlyRate: 85,
      });

      const result = await getHourlyRateForUser(userId, projectId, timestamp);

      expect(result).toBe(85);
      expect(mockGetStundensatz).toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { hourlyRate: true },
      });
    });

    it('sollte auf Project.defaultHourlyRate zurückfallen wenn User.hourlyRate fehlt', async () => {
      const timestamp = new Date('2026-01-20T19:00:00Z');

      // Mock ZeitmodellService wirft Fehler
      const mockGetStundensatz = jest.fn().mockRejectedValue(
        new Error('Kein aktives Zeitmodell')
      );

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockGetStundensatz,
      }));

      // Mock User ohne hourlyRate
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        hourlyRate: null,
      });

      // Mock Project mit defaultHourlyRate
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: projectId,
        defaultHourlyRate: 95,
      });

      const result = await getHourlyRateForUser(userId, projectId, timestamp);

      expect(result).toBe(95);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        select: { defaultHourlyRate: true },
      });
    });

    it('sollte auf SystemSettings.defaultHourlyRate zurückfallen als letztes', async () => {
      const timestamp = new Date('2026-01-20T19:00:00Z');

      // Mock ZeitmodellService wirft Fehler
      const mockGetStundensatz = jest.fn().mockRejectedValue(
        new Error('Kein aktives Zeitmodell')
      );

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockGetStundensatz,
      }));

      // Mock User ohne hourlyRate
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        hourlyRate: null,
      });

      // Mock Project ohne defaultHourlyRate
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: projectId,
        defaultHourlyRate: null,
      });

      // Mock SystemSettings
      (prisma.systemSettings.findFirst as jest.Mock).mockResolvedValue({
        defaultHourlyRate: 100,
      });

      const result = await getHourlyRateForUser(userId, projectId, timestamp);

      expect(result).toBe(100);
      expect(prisma.systemSettings.findFirst).toHaveBeenCalledWith({
        select: { defaultHourlyRate: true },
      });
    });

    it('sollte Fehler werfen wenn kein Stundensatz gefunden werden kann', async () => {
      const timestamp = new Date('2026-01-20T19:00:00Z');

      // Mock ZeitmodellService wirft Fehler
      const mockGetStundensatz = jest.fn().mockRejectedValue(
        new Error('Kein aktives Zeitmodell')
      );

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockGetStundensatz,
      }));

      // Mock alle Fallbacks als null
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ hourlyRate: null });
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({ defaultHourlyRate: null });
      (prisma.systemSettings.findFirst as jest.Mock).mockResolvedValue({ defaultHourlyRate: null });

      await expect(getHourlyRateForUser(userId, projectId, timestamp)).rejects.toThrow(
        'Kein Stundensatz definiert'
      );
    });

    it('sollte ohne timestamp User.hourlyRate verwenden (Rückwärtskompatibilität)', async () => {
      // Kein timestamp → kein Zeitmodell-Lookup
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        hourlyRate: 90,
      });

      const result = await getHourlyRateForUser(userId, projectId);

      expect(result).toBe(90);
      // ZeitmodellService sollte NICHT aufgerufen werden
      expect(ZeitmodellService).not.toHaveBeenCalled();
    });
  });

  describe('Budget-Berechnung mit Zeitmodell', () => {
    it('sollte Budget mit Zeitmodell-Stundensatz aktualisieren', async () => {
      const timeEntryId = 'entry-123';
      const userId = 'user-123';
      const projectId = 'project-456';
      const clockIn = new Date('2026-01-20T18:00:00Z');
      const clockOut = new Date('2026-01-20T20:00:00Z'); // 2 Stunden

      // Mock TimeEntry
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
        id: timeEntryId,
        userId,
        projectId,
        clockIn,
        clockOut,
        status: 'CLOCKED_OUT',
        pauseMinutes: 0,
        user: {
          id: userId,
          firstName: 'Max',
          lastName: 'Mustermann',
        },
      });

      // Mock Budget existiert
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue({
        id: 'budget-1',
      });

      // Mock ZeitmodellService gibt Nachtzuschlag
      const mockGetStundensatz = jest.fn().mockResolvedValue({
        stundensatz: 125, // Nachtzuschlag
        eintragId: 'eintrag-1',
        zeitmodellId: 'zeitmodell-1',
        zeitmodellName: 'Schichtmodell',
      });

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockGetStundensatz,
      }));

      // Mock Budget-Item (neu erstellt)
      (prisma.projectBudgetItem.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.projectBudgetItem.create as jest.Mock).mockResolvedValue({
        id: 'item-1',
        budgetId: 'budget-1',
        actualHours: 0,
        hourlyRate: 125,
      });

      // Mock Budget-Item Update
      (prisma.projectBudgetItem.update as jest.Mock).mockResolvedValue({
        id: 'item-1',
        actualHours: 2,
        actualCost: 250, // 2h * 125 CHF/h
      });

      // Mock findMany für recalculateBudget
      (prisma.projectBudgetItem.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'item-1',
          plannedCost: 1000,
          actualCost: 250,
        },
      ]);

      // Mock aggregate für recalculateBudget
      (prisma.projectBudgetItem.aggregate as jest.Mock).mockResolvedValue({
        _sum: {
          plannedCost: 1000,
          actualCost: 250,
        },
      });

      // Mock Budget Update
      (prisma.projectBudget.findUnique as jest.Mock).mockResolvedValue({
        totalBudget: 5000,
      });
      (prisma.projectBudget.update as jest.Mock).mockResolvedValue({});

      await updateBudgetFromTimeEntry(timeEntryId);

      // Verify Budget-Item wurde mit Zeitmodell-Stundensatz aktualisiert
      expect(prisma.projectBudgetItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: expect.objectContaining({
          actualHours: 2,
          actualCost: 250,
          hourlyRate: 125,
        }),
      });
    });

    it('sollte Budget mit Standard-Stundensatz aktualisieren wenn kein Zeitmodell', async () => {
      const timeEntryId = 'entry-124';
      const userId = 'user-124';
      const projectId = 'project-456';
      const clockIn = new Date('2026-01-20T09:00:00Z');
      const clockOut = new Date('2026-01-20T17:00:00Z'); // 8 Stunden

      // Mock TimeEntry
      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
        id: timeEntryId,
        userId,
        projectId,
        clockIn,
        clockOut,
        status: 'CLOCKED_OUT',
        pauseMinutes: 60, // 1 Stunde Pause
        user: {
          id: userId,
          firstName: 'Anna',
          lastName: 'Schmidt',
        },
      });

      // Mock Budget existiert
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue({
        id: 'budget-2',
      });

      // Mock ZeitmodellService wirft Fehler (kein Zeitmodell)
      const mockGetStundensatz = jest.fn().mockRejectedValue(
        new Error('Kein aktives Zeitmodell')
      );

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockGetStundensatz,
      }));

      // Mock User mit Standard-Stundensatz
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        hourlyRate: 80,
      });

      // Mock Budget-Item
      (prisma.projectBudgetItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'item-2',
        actualHours: 0,
      });

      (prisma.projectBudgetItem.update as jest.Mock).mockResolvedValue({
        id: 'item-2',
        actualHours: 7, // 8h - 1h Pause
        actualCost: 560, // 7h * 80 CHF/h
      });

      // Mock findMany für recalculateBudget
      (prisma.projectBudgetItem.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'item-2',
          plannedCost: 1000,
          actualCost: 560,
        },
      ]);

      // Mock aggregate für recalculateBudget
      (prisma.projectBudgetItem.aggregate as jest.Mock).mockResolvedValue({
        _sum: {
          plannedCost: 1000,
          actualCost: 560,
        },
      });

      (prisma.projectBudget.findUnique as jest.Mock).mockResolvedValue({
        totalBudget: 5000,
      });
      (prisma.projectBudget.update as jest.Mock).mockResolvedValue({});

      await updateBudgetFromTimeEntry(timeEntryId);

      // Verify Budget-Item wurde mit User-Stundensatz aktualisiert
      expect(prisma.projectBudgetItem.update).toHaveBeenCalledWith({
        where: { id: 'item-2' },
        data: expect.objectContaining({
          actualHours: 7,
          actualCost: 560,
          hourlyRate: 80,
        }),
      });
    });

    it('sollte nichts tun wenn kein aktives Budget vorhanden', async () => {
      const timeEntryId = 'entry-125';

      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
        id: timeEntryId,
        userId: 'user-123',
        projectId: 'project-999',
        clockIn: new Date(),
        clockOut: new Date(),
        status: 'CLOCKED_OUT',
        user: { firstName: 'Test', lastName: 'User' },
      });

      // Kein Budget gefunden
      (prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue(null);

      await updateBudgetFromTimeEntry(timeEntryId);

      // Budget-Item sollte NICHT erstellt/aktualisiert werden
      expect(prisma.projectBudgetItem.create).not.toHaveBeenCalled();
      expect(prisma.projectBudgetItem.update).not.toHaveBeenCalled();
    });

    it('sollte nichts tun wenn TimeEntry noch nicht ausgeclockt', async () => {
      const timeEntryId = 'entry-126';

      (prisma.timeEntry.findUnique as jest.Mock).mockResolvedValue({
        id: timeEntryId,
        userId: 'user-123',
        projectId: 'project-456',
        clockIn: new Date(),
        clockOut: null, // Noch nicht ausgeclockt
        status: 'CLOCKED_IN',
        user: { firstName: 'Test', lastName: 'User' },
      });

      await updateBudgetFromTimeEntry(timeEntryId);

      // Budget sollte NICHT aktualisiert werden
      expect(prisma.projectBudget.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('Zeitbasierte Stundensätze', () => {
    it('sollte verschiedene Stundensätze für Tag und Nacht verwenden', async () => {
      const userId = 'user-123';
      const projectId = 'project-456';

      // Tag: 10:00 Uhr → 100 CHF/h
      const dayTimestamp = new Date('2026-01-20T10:00:00Z');
      const mockDayGetStundensatz = jest.fn().mockResolvedValue({
        stundensatz: 100,
        zeitmodellName: 'Schichtmodell',
      });

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockDayGetStundensatz,
      }));

      const dayRate = await getHourlyRateForUser(userId, projectId, dayTimestamp);
      expect(dayRate).toBe(100);

      // Nacht: 22:00 Uhr → 125 CHF/h (Nachtzuschlag)
      const nightTimestamp = new Date('2026-01-20T22:00:00Z');
      const mockNightGetStundensatz = jest.fn().mockResolvedValue({
        stundensatz: 125,
        zeitmodellName: 'Schichtmodell',
      });

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockNightGetStundensatz,
      }));

      const nightRate = await getHourlyRateForUser(userId, projectId, nightTimestamp);
      expect(nightRate).toBe(125);
    });

    it('sollte Feiertagszuschlag verwenden', async () => {
      const userId = 'user-123';
      const projectId = 'project-456';
      
      // Neujahr 2026 (Feiertag)
      const holidayTimestamp = new Date('2026-01-01T10:00:00Z');
      
      const mockHolidayGetStundensatz = jest.fn().mockResolvedValue({
        stundensatz: 200, // Feiertagszuschlag 100%
        zeitmodellName: 'Schichtmodell',
      });

      (ZeitmodellService as jest.Mock).mockImplementation(() => ({
        getStundensatz: mockHolidayGetStundensatz,
      }));

      const holidayRate = await getHourlyRateForUser(userId, projectId, holidayTimestamp);
      expect(holidayRate).toBe(200);
    });
  });
});
