import { zeitmodellService } from '../zeitmodell.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('zeitmodellService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockZeitmodell = {
    id: '1',
    name: 'Standard Tarif',
    beschreibung: 'Normaler Arbeitstarif',
    gueltigVon: '2024-01-01',
    gueltigBis: '2024-12-31',
    version: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    updatedBy: 'user1',
    eintraege: [
      {
        id: 'e1',
        stundensatz: 100,
        startzeit: '08:00:00',
        endzeit: '17:00:00',
        wochentage: [0, 1, 2, 3, 4],
        nurFeiertage: false,
        keineFeiertage: true,
        prioritaet: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]
  };

  const mockMitarbeiterZeitmodell = {
    id: 'mz1',
    mitarbeiterId: 'user1',
    zeitmodellId: '1',
    gueltigVon: '2024-01-01',
    gueltigBis: '2024-12-31',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    zeitmodell: mockZeitmodell,
    mitarbeiter: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }
  };

  describe('getAllZeitmodelle', () => {
    it('should fetch all Zeitmodelle', async () => {
      const mockData = [mockZeitmodell];
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await zeitmodellService.getAllZeitmodelle();

      expect(mockApi.get).toHaveBeenCalledWith('/zeitmodelle');
      expect(result).toEqual(mockData);
    });
  });

  describe('getZeitmodellById', () => {
    it('should fetch a Zeitmodell by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockZeitmodell });

      const result = await zeitmodellService.getZeitmodellById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/zeitmodelle/1');
      expect(result).toEqual(mockZeitmodell);
    });
  });

  describe('createZeitmodell', () => {
    it('should create a new Zeitmodell', async () => {
      const createData = {
        name: 'Neuer Tarif',
        beschreibung: 'Test Tarif',
        gueltigVon: '2025-01-01',
        eintraege: [
          {
            stundensatz: 120,
            startzeit: '08:00:00',
            endzeit: '18:00:00',
            wochentage: [0, 1, 2, 3, 4],
            nurFeiertage: false,
            keineFeiertage: true,
            prioritaet: 1
          }
        ]
      };
      mockApi.post.mockResolvedValue({ data: { ...mockZeitmodell, ...createData } });

      const result = await zeitmodellService.createZeitmodell(createData);

      expect(mockApi.post).toHaveBeenCalledWith('/zeitmodelle', createData);
      expect(result.name).toBe('Neuer Tarif');
    });
  });

  describe('updateZeitmodell', () => {
    it('should update a Zeitmodell', async () => {
      const updateData = {
        name: 'Updated Tarif',
        beschreibung: 'Updated description'
      };
      const updatedZeitmodell = { ...mockZeitmodell, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedZeitmodell });

      const result = await zeitmodellService.updateZeitmodell('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/zeitmodelle/1', updateData);
      expect(result.name).toBe('Updated Tarif');
    });
  });

  describe('deleteZeitmodell', () => {
    it('should delete a Zeitmodell', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await zeitmodellService.deleteZeitmodell('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/zeitmodelle/1');
    });
  });

  describe('assignToMitarbeiter', () => {
    it('should assign a Zeitmodell to a Mitarbeiter', async () => {
      const assignData = {
        mitarbeiterId: 'user1',
        zeitmodellId: '1',
        gueltigVon: '2024-01-01',
        gueltigBis: '2024-12-31'
      };
      mockApi.post.mockResolvedValue({ data: mockMitarbeiterZeitmodell });

      const result = await zeitmodellService.assignToMitarbeiter(assignData);

      expect(mockApi.post).toHaveBeenCalledWith('/zeitmodelle/assign', assignData);
      expect(result).toEqual(mockMitarbeiterZeitmodell);
    });
  });

  describe('getMitarbeiterZeitmodelle', () => {
    it('should fetch Zeitmodelle for a Mitarbeiter', async () => {
      const mockData = [mockMitarbeiterZeitmodell];
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await zeitmodellService.getMitarbeiterZeitmodelle('user1');

      expect(mockApi.get).toHaveBeenCalledWith('/zeitmodelle/mitarbeiter/user1');
      expect(result).toEqual(mockData);
    });
  });

  describe('removeMitarbeiterZeitmodell', () => {
    it('should remove a Mitarbeiter Zeitmodell assignment', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await zeitmodellService.removeMitarbeiterZeitmodell('mz1');

      expect(mockApi.delete).toHaveBeenCalledWith('/zeitmodelle/assign/mz1');
    });
  });

  describe('getStundensatz', () => {
    it('should get the hourly rate for a Mitarbeiter at a specific time', async () => {
      const mockResult = {
        stundensatz: 100,
        eintragId: 'e1',
        zeitmodellId: '1',
        zeitmodellName: 'Standard Tarif'
      };
      mockApi.get.mockResolvedValue({ data: mockResult });

      const result = await zeitmodellService.getStundensatz('user1', '2024-01-15', '10:00:00');

      expect(mockApi.get).toHaveBeenCalledWith('/zeitmodelle/stundensatz/user1', {
        params: { datum: '2024-01-15', uhrzeit: '10:00:00' }
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('calculateArbeitszeitabrechnung', () => {
    it('should calculate work time billing for a Mitarbeiter', async () => {
      const mockResult = {
        positionen: [
          {
            zeitraum: { von: '2024-01-01T08:00:00', bis: '2024-01-01T17:00:00' },
            stundensatz: 100,
            dauer: 8,
            betrag: 800
          }
        ],
        gesamtStunden: 8,
        gesamtBetrag: 800
      };
      mockApi.get.mockResolvedValue({ data: mockResult });

      const result = await zeitmodellService.calculateArbeitszeitabrechnung(
        'user1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(mockApi.get).toHaveBeenCalledWith('/zeitmodelle/abrechnung/user1', {
        params: { von: '2024-01-01', bis: '2024-01-31' }
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getStatistics', () => {
    it('should fetch Zeitmodell statistics', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        assignments: 25,
        mitarbeiterMitZeitmodell: 20
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await zeitmodellService.getStatistics();

      expect(mockApi.get).toHaveBeenCalledWith('/zeitmodelle/stats/overview');
      expect(result).toEqual(mockStats);
    });
  });

  describe('Helper Functions', () => {
    describe('formatTimeForDisplay', () => {
      it('should format time for display', () => {
        expect(zeitmodellService.formatTimeForDisplay('08:30:00')).toBe('08:30');
        expect(zeitmodellService.formatTimeForDisplay('17:45:00')).toBe('17:45');
      });
    });

    describe('formatTimeForApi', () => {
      it('should format time for API', () => {
        expect(zeitmodellService.formatTimeForApi('08:30')).toBe('08:30:00');
        expect(zeitmodellService.formatTimeForApi('17:45:00')).toBe('17:45:00');
      });
    });

    describe('getWochentagName', () => {
      it('should return weekday name', () => {
        expect(zeitmodellService.getWochentagName(0)).toBe('Montag');
        expect(zeitmodellService.getWochentagName(4)).toBe('Freitag');
        expect(zeitmodellService.getWochentagName(6)).toBe('Sonntag');
      });
    });

    describe('getWochentagKuerzel', () => {
      it('should return weekday abbreviation', () => {
        expect(zeitmodellService.getWochentagKuerzel(0)).toBe('Mo');
        expect(zeitmodellService.getWochentagKuerzel(4)).toBe('Fr');
        expect(zeitmodellService.getWochentagKuerzel(6)).toBe('So');
      });
    });

    describe('formatWochentage', () => {
      it('should format weekdays', () => {
        expect(zeitmodellService.formatWochentage([0, 1, 2, 3, 4])).toBe('Mo, Di, Mi, Do, Fr');
        expect(zeitmodellService.formatWochentage([5, 6])).toBe('Sa, So');
        expect(zeitmodellService.formatWochentage([])).toBe('Alle Tage');
        expect(zeitmodellService.formatWochentage([0, 1, 2, 3, 4, 5, 6])).toBe('Alle Tage');
      });
    });

    describe('formatStundensatz', () => {
      it('should format hourly rate as CHF currency', () => {
        expect(zeitmodellService.formatStundensatz(100)).toContain('100');
        expect(zeitmodellService.formatStundensatz(100)).toContain('CHF');
      });
    });

    describe('formatDuration', () => {
      it('should format duration in hours and minutes', () => {
        expect(zeitmodellService.formatDuration(8)).toBe('8h 0m');
        expect(zeitmodellService.formatDuration(8.5)).toBe('8h 30m');
        expect(zeitmodellService.formatDuration(1.25)).toBe('1h 15m');
      });
    });
  });
});
