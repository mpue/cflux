import { travelExpenseService, TravelExpense, CreateTravelExpenseData, TravelExpenseType, RequestStatus } from '../travelExpense.service';
import api from '../api';

// Mock the api module
jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('TravelExpense Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockLocalStorage.setItem('token', 'test-token-123');
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createTravelExpense', () => {
    it('should create travel expense with all fields', async () => {
      const newExpenseData: CreateTravelExpenseData = {
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Flug nach Berlin für Kundengespräch',
        destination: 'Berlin',
        purpose: 'Kundengespräch bei Acme Corp',
        amount: 350.00,
        currency: 'CHF',
        receipt: 'receipt-flight-123.pdf',
        notes: 'Economy Class, Direktflug',
      };

      const mockCreatedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Flug nach Berlin für Kundengespräch',
        destination: 'Berlin',
        purpose: 'Kundengespräch bei Acme Corp',
        amount: 350.00,
        currency: 'CHF',
        receipt: 'receipt-flight-123.pdf',
        status: 'PENDING',
        notes: 'Economy Class, Direktflug',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockCreatedExpense,
      });

      const result = await travelExpenseService.createTravelExpense(newExpenseData);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/travel-expenses',
        newExpenseData
      );
      expect(result).toEqual(mockCreatedExpense);
      expect(result.type).toBe('FLIGHT');
      expect(result.amount).toBe(350.00);
    });

    it('should create travel expense with minimal required fields', async () => {
      const minimalData: CreateTravelExpenseData = {
        type: 'MEALS',
        date: '2026-01-10',
        description: 'Mittagessen mit Kunde',
        amount: 45.50,
      };

      const mockExpense: TravelExpense = {
        id: 'expense-456',
        userId: 'user-123',
        type: 'MEALS',
        date: '2026-01-10',
        description: 'Mittagessen mit Kunde',
        amount: 45.50,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.createTravelExpense(minimalData);

      expect(result.type).toBe('MEALS');
      expect(result.status).toBe('PENDING');
    });

    it('should create travel expenses with different types', async () => {
      const types: TravelExpenseType[] = ['FLIGHT', 'TRAIN', 'CAR', 'TAXI', 'ACCOMMODATION', 'MEALS', 'OTHER'];

      for (const type of types) {
        const expenseData: CreateTravelExpenseData = {
          type: type,
          date: '2026-01-01',
          description: `Test ${type}`,
          amount: 100.00,
        };

        const mockExpense: TravelExpense = {
          id: `expense-${type}`,
          userId: 'user-123',
          type: type,
          date: '2026-01-01',
          description: `Test ${type}`,
          amount: 100.00,
          currency: 'CHF',
          status: 'PENDING',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        };

        mockedApi.post.mockResolvedValue({
          data: mockExpense,
        });

        const result = await travelExpenseService.createTravelExpense(expenseData);
        expect(result.type).toBe(type);
      }
    });

    it('should create car travel expense with distance', async () => {
      const carExpenseData: CreateTravelExpenseData = {
        type: 'CAR',
        date: '2026-01-20',
        description: 'Fahrt zu Kunde in Zürich',
        destination: 'Zürich',
        distance: 145,
        vehicleType: 'PKW',
        amount: 87.00,
        currency: 'CHF',
      };

      const mockExpense: TravelExpense = {
        id: 'expense-car',
        userId: 'user-123',
        type: 'CAR',
        date: '2026-01-20',
        description: 'Fahrt zu Kunde in Zürich',
        destination: 'Zürich',
        distance: 145,
        vehicleType: 'PKW',
        amount: 87.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.createTravelExpense(carExpenseData);

      expect(result.distance).toBe(145);
      expect(result.vehicleType).toBe('PKW');
    });

    it('should create accommodation expense', async () => {
      const accommodationData: CreateTravelExpenseData = {
        type: 'ACCOMMODATION',
        date: '2026-01-25',
        description: 'Hotel in Genf',
        destination: 'Genf',
        purpose: 'Mehrtägiges Kundenprojekt',
        amount: 185.00,
        currency: 'CHF',
        receipt: 'hotel-invoice.pdf',
      };

      const mockExpense: TravelExpense = {
        id: 'expense-hotel',
        userId: 'user-123',
        type: 'ACCOMMODATION',
        date: '2026-01-25',
        description: 'Hotel in Genf',
        destination: 'Genf',
        purpose: 'Mehrtägiges Kundenprojekt',
        amount: 185.00,
        currency: 'CHF',
        receipt: 'hotel-invoice.pdf',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.createTravelExpense(accommodationData);

      expect(result.type).toBe('ACCOMMODATION');
      expect(result.destination).toBe('Genf');
    });

    it('should handle creation error', async () => {
      const expenseData: CreateTravelExpenseData = {
        type: 'TRAIN',
        date: '2026-01-01',
        description: 'Test',
        amount: 50.00,
      };

      const error = new Error('Invalid amount');
      mockedApi.post.mockRejectedValue(error);

      await expect(travelExpenseService.createTravelExpense(expenseData))
        .rejects.toThrow('Invalid amount');
    });

    it('should create expense with Swiss locations', async () => {
      const swissLocations = ['Zürich', 'Genf', 'Basel', 'Bern', 'Luzern'];

      for (const location of swissLocations) {
        const expenseData: CreateTravelExpenseData = {
          type: 'TRAIN',
          date: '2026-01-01',
          description: `Zugfahrt nach ${location}`,
          destination: location,
          amount: 75.00,
          currency: 'CHF',
        };

        const mockExpense: TravelExpense = {
          id: `expense-${location}`,
          userId: 'user-123',
          type: 'TRAIN',
          date: '2026-01-01',
          description: `Zugfahrt nach ${location}`,
          destination: location,
          amount: 75.00,
          currency: 'CHF',
          status: 'PENDING',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        };

        mockedApi.post.mockResolvedValue({
          data: mockExpense,
        });

        const result = await travelExpenseService.createTravelExpense(expenseData);
        expect(result.destination).toBe(location);
      }
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllTravelExpenses', () => {
    it('should get all travel expenses', async () => {
      const mockExpenses: TravelExpense[] = [
        {
          id: 'expense-1',
          userId: 'user-1',
          type: 'FLIGHT',
          date: '2026-01-15',
          description: 'Flug Berlin',
          amount: 350.00,
          currency: 'CHF',
          status: 'PENDING',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'expense-2',
          userId: 'user-2',
          type: 'TRAIN',
          date: '2026-01-10',
          description: 'Zug Zürich',
          amount: 85.00,
          currency: 'CHF',
          status: 'APPROVED',
          createdAt: '2026-01-02T10:00:00Z',
          updatedAt: '2026-01-02T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({
        data: mockExpenses,
      });

      const result = await travelExpenseService.getAllTravelExpenses();

      expect(mockedApi.get).toHaveBeenCalledWith('/travel-expenses');
      expect(result).toEqual(mockExpenses);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no expenses found', async () => {
      mockedApi.get.mockResolvedValue({
        data: [],
      });

      const result = await travelExpenseService.getAllTravelExpenses();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should get expenses with user and approver relations', async () => {
      const mockExpenses: TravelExpense[] = [
        {
          id: 'expense-full',
          userId: 'user-1',
          type: 'FLIGHT',
          date: '2026-01-15',
          description: 'Flug Berlin',
          amount: 350.00,
          currency: 'CHF',
          status: 'APPROVED',
          approverId: 'approver-1',
          approvedAt: '2026-01-05T10:00:00Z',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-05T10:00:00Z',
          user: {
            id: 'user-1',
            firstName: 'Hans',
            lastName: 'Müller',
            email: 'hans.mueller@example.com',
          },
          approver: {
            id: 'approver-1',
            firstName: 'Maria',
            lastName: 'Schmidt',
            email: 'maria.schmidt@example.com',
          },
        },
      ];

      mockedApi.get.mockResolvedValue({
        data: mockExpenses,
      });

      const result = await travelExpenseService.getAllTravelExpenses();

      expect(result[0].user).toBeDefined();
      expect(result[0].approver).toBeDefined();
      expect(result[0].user?.firstName).toBe('Hans');
    });

    it('should handle fetch error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Fehler beim Laden der Reisekosten'));

      await expect(travelExpenseService.getAllTravelExpenses())
        .rejects.toThrow();
    });
  });

  describe('READ - getTravelExpenseById', () => {
    it('should get travel expense by id', async () => {
      const mockExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Flug nach Berlin',
        destination: 'Berlin',
        amount: 350.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.getTravelExpenseById('expense-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/travel-expenses/expense-123');
      expect(result).toEqual(mockExpense);
      expect(result.id).toBe('expense-123');
    });

    it('should get expense with full details', async () => {
      const mockExpense: TravelExpense = {
        id: 'expense-full',
        userId: 'user-123',
        type: 'CAR',
        date: '2026-01-20',
        description: 'Geschäftsreise Zürich',
        destination: 'Zürich',
        purpose: 'Kundentermin',
        distance: 145,
        vehicleType: 'PKW',
        amount: 87.00,
        currency: 'CHF',
        receipt: 'receipt-car.pdf',
        status: 'APPROVED',
        approverId: 'approver-1',
        approvedAt: '2026-01-22T10:00:00Z',
        notes: 'Rückerstattung gemäß Kilometerpauschale',
        createdAt: '2026-01-20T10:00:00Z',
        updatedAt: '2026-01-22T10:00:00Z',
        user: {
          id: 'user-123',
          firstName: 'Peter',
          lastName: 'Weber',
          email: 'peter.weber@example.com',
        },
        approver: {
          id: 'approver-1',
          firstName: 'Anna',
          lastName: 'Fischer',
          email: 'anna.fischer@example.com',
        },
      };

      mockedApi.get.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.getTravelExpenseById('expense-full');

      expect(result.distance).toBe(145);
      expect(result.user).toBeDefined();
      expect(result.approver).toBeDefined();
    });

    it('should handle not found error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Fehler beim Laden der Reisekosten'));

      await expect(travelExpenseService.getTravelExpenseById('nonexistent-id'))
        .rejects.toThrow();
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateTravelExpense', () => {
    it('should update travel expense amount', async () => {
      const updates: Partial<CreateTravelExpenseData> = {
        amount: 450.00,
      };

      const mockUpdatedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Flug Berlin',
        amount: 450.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({
        data: mockUpdatedExpense,
      });

      const result = await travelExpenseService.updateTravelExpense('expense-123', updates);

      expect(mockedApi.put).toHaveBeenCalledWith(
        '/travel-expenses/expense-123',
        updates
      );
      expect(result.amount).toBe(450.00);
    });

    it('should update expense description', async () => {
      const updates: Partial<CreateTravelExpenseData> = {
        description: 'Aktualisierte Beschreibung: Flug mit Zwischenstopp',
      };

      const mockUpdatedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Aktualisierte Beschreibung: Flug mit Zwischenstopp',
        amount: 350.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.put.mockResolvedValue({
        data: mockUpdatedExpense,
      });

      const result = await travelExpenseService.updateTravelExpense('expense-123', updates);

      expect(result.description).toBe('Aktualisierte Beschreibung: Flug mit Zwischenstopp');
    });

    it('should update car expense distance', async () => {
      const updates: Partial<CreateTravelExpenseData> = {
        distance: 180,
        amount: 108.00,
      };

      const mockUpdatedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'CAR',
        date: '2026-01-20',
        description: 'Fahrt Zürich',
        distance: 180,
        amount: 108.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedApi.put.mockResolvedValue({
        data: mockUpdatedExpense,
      });

      const result = await travelExpenseService.updateTravelExpense('expense-123', updates);

      expect(result.distance).toBe(180);
      expect(result.amount).toBe(108.00);
    });

    it('should add receipt to expense', async () => {
      const updates: Partial<CreateTravelExpenseData> = {
        receipt: 'updated-receipt.pdf',
      };

      const mockUpdatedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'MEALS',
        date: '2026-01-10',
        description: 'Mittagessen',
        amount: 45.00,
        currency: 'CHF',
        receipt: 'updated-receipt.pdf',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:30:00Z',
      };

      mockedApi.put.mockResolvedValue({
        data: mockUpdatedExpense,
      });

      const result = await travelExpenseService.updateTravelExpense('expense-123', updates);

      expect(result.receipt).toBe('updated-receipt.pdf');
    });

    it('should update all fields at once', async () => {
      const updates: Partial<CreateTravelExpenseData> = {
        description: 'Komplett aktualisierte Reise',
        destination: 'München',
        amount: 500.00,
        notes: 'Neue Notizen',
      };

      const mockUpdatedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'TRAIN',
        date: '2026-01-15',
        description: 'Komplett aktualisierte Reise',
        destination: 'München',
        amount: 500.00,
        currency: 'CHF',
        notes: 'Neue Notizen',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedApi.put.mockResolvedValue({
        data: mockUpdatedExpense,
      });

      const result = await travelExpenseService.updateTravelExpense('expense-123', updates);

      expect(result.description).toBe('Komplett aktualisierte Reise');
      expect(result.destination).toBe('München');
      expect(result.amount).toBe(500.00);
    });

    it('should handle update error', async () => {
      const updates: Partial<CreateTravelExpenseData> = {
        amount: -100.00,
      };

      const error = new Error('Invalid amount');
      mockedApi.put.mockRejectedValue(error);

      await expect(travelExpenseService.updateTravelExpense('expense-123', updates))
        .rejects.toThrow('Invalid amount');
    });

    it('should handle not found error on update', async () => {
      const updates: Partial<CreateTravelExpenseData> = {
        amount: 200.00,
      };

      const error = new Error('Expense not found');
      mockedApi.put.mockRejectedValue(error);

      await expect(travelExpenseService.updateTravelExpense('nonexistent-id', updates))
        .rejects.toThrow('Expense not found');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteTravelExpense', () => {
    it('should delete travel expense successfully', async () => {
      mockedApi.delete.mockResolvedValue({
        data: undefined,
      });

      await travelExpenseService.deleteTravelExpense('expense-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/travel-expenses/expense-123');
    });

    it('should delete multiple expenses', async () => {
      const expenseIds = ['expense-1', 'expense-2', 'expense-3'];

      mockedApi.delete.mockResolvedValue({
        data: undefined,
      });

      for (const id of expenseIds) {
        await travelExpenseService.deleteTravelExpense(id);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle delete error when expense not found', async () => {
      const error = new Error('Expense not found');
      mockedApi.delete.mockRejectedValue(error);

      await expect(travelExpenseService.deleteTravelExpense('nonexistent-id'))
        .rejects.toThrow('Expense not found');
    });

    it('should handle delete error for approved expense', async () => {
      const error = new Error('Cannot delete approved expense');
      mockedApi.delete.mockRejectedValue(error);

      await expect(travelExpenseService.deleteTravelExpense('expense-123'))
        .rejects.toThrow('Cannot delete approved expense');
    });

    it('should handle network error on delete', async () => {
      const error = new Error('Network error');
      mockedApi.delete.mockRejectedValue(error);

      await expect(travelExpenseService.deleteTravelExpense('expense-123'))
        .rejects.toThrow('Network error');
    });
  });

  // ============================================
  // APPROVAL Tests
  // ============================================
  describe('APPROVAL - approveTravelExpense', () => {
    it('should approve travel expense', async () => {
      const mockApprovedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Flug Berlin',
        amount: 350.00,
        currency: 'CHF',
        status: 'APPROVED',
        approverId: 'approver-1',
        approvedAt: '2026-01-05T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-05T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockApprovedExpense,
      });

      const result = await travelExpenseService.approveTravelExpense('expense-123');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/travel-expenses/expense-123/approve',
        {}
      );
      expect(result.status).toBe('APPROVED');
      expect(result.approvedAt).toBeDefined();
    });

    it('should handle approval error', async () => {
      const error = new Error('Not authorized to approve');
      mockedApi.post.mockRejectedValue(error);

      await expect(travelExpenseService.approveTravelExpense('expense-123'))
        .rejects.toThrow('Not authorized to approve');
    });
  });

  describe('APPROVAL - rejectTravelExpense', () => {
    it('should reject travel expense with reason', async () => {
      const rejectionReason = 'Beleg fehlt, bitte nachreichen';

      const mockRejectedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Flug Berlin',
        amount: 350.00,
        currency: 'CHF',
        status: 'REJECTED',
        approverId: 'approver-1',
        rejectionReason: rejectionReason,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-05T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockRejectedExpense,
      });

      const result = await travelExpenseService.rejectTravelExpense('expense-123', rejectionReason);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/travel-expenses/expense-123/reject',
        { rejectionReason }
      );
      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe(rejectionReason);
    });

    it('should reject expense without reason', async () => {
      const mockRejectedExpense: TravelExpense = {
        id: 'expense-123',
        userId: 'user-123',
        type: 'MEALS',
        date: '2026-01-10',
        description: 'Mittagessen',
        amount: 45.00,
        currency: 'CHF',
        status: 'REJECTED',
        approverId: 'approver-1',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-05T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockRejectedExpense,
      });

      const result = await travelExpenseService.rejectTravelExpense('expense-123');

      expect(result.status).toBe('REJECTED');
    });

    it('should handle rejection error', async () => {
      const error = new Error('Not authorized to reject');
      mockedApi.post.mockRejectedValue(error);

      await expect(travelExpenseService.rejectTravelExpense('expense-123', 'Test'))
        .rejects.toThrow('Not authorized to reject');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Travel Expense Lifecycle', () => {
    it('should complete full expense lifecycle from creation to approval', async () => {
      // CREATE
      const newExpense: CreateTravelExpenseData = {
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Geschäftsreise Berlin',
        destination: 'Berlin',
        amount: 350.00,
        currency: 'CHF',
      };

      const createdExpense: TravelExpense = {
        id: 'expense-lifecycle',
        userId: 'user-123',
        type: 'FLIGHT',
        date: '2026-01-15',
        description: 'Geschäftsreise Berlin',
        destination: 'Berlin',
        amount: 350.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: createdExpense,
      });

      const created = await travelExpenseService.createTravelExpense(newExpense);
      expect(created.status).toBe('PENDING');

      // READ
      mockedApi.get.mockResolvedValue({
        data: createdExpense,
      });

      const fetched = await travelExpenseService.getTravelExpenseById('expense-lifecycle');
      expect(fetched.id).toBe('expense-lifecycle');

      // UPDATE
      const updatedExpense: TravelExpense = {
        ...createdExpense,
        receipt: 'flight-receipt.pdf',
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedApi.put.mockResolvedValue({
        data: updatedExpense,
      });

      const updated = await travelExpenseService.updateTravelExpense('expense-lifecycle', {
        receipt: 'flight-receipt.pdf',
      });
      expect(updated.receipt).toBe('flight-receipt.pdf');

      // APPROVE
      const approvedExpense: TravelExpense = {
        ...updatedExpense,
        status: 'APPROVED',
        approverId: 'approver-1',
        approvedAt: '2026-01-05T10:00:00Z',
        updatedAt: '2026-01-05T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: approvedExpense,
      });

      const approved = await travelExpenseService.approveTravelExpense('expense-lifecycle');
      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedAt).toBeDefined();
    });

    it('should handle expense rejection workflow', async () => {
      // Create expense
      const newExpense: CreateTravelExpenseData = {
        type: 'MEALS',
        date: '2026-01-10',
        description: 'Mittagessen',
        amount: 45.00,
      };

      const createdExpense: TravelExpense = {
        id: 'expense-reject',
        userId: 'user-123',
        type: 'MEALS',
        date: '2026-01-10',
        description: 'Mittagessen',
        amount: 45.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: createdExpense,
      });

      await travelExpenseService.createTravelExpense(newExpense);

      // Reject expense
      const rejectedExpense: TravelExpense = {
        ...createdExpense,
        status: 'REJECTED',
        approverId: 'approver-1',
        rejectionReason: 'Beleg fehlt',
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: rejectedExpense,
      });

      const rejected = await travelExpenseService.rejectTravelExpense('expense-reject', 'Beleg fehlt');

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toBe('Beleg fehlt');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle expense with zero amount', async () => {
      const expenseData: CreateTravelExpenseData = {
        type: 'OTHER',
        date: '2026-01-01',
        description: 'Kostenfreie Fahrt',
        amount: 0.00,
      };

      const mockExpense: TravelExpense = {
        id: 'expense-zero',
        userId: 'user-123',
        type: 'OTHER',
        date: '2026-01-01',
        description: 'Kostenfreie Fahrt',
        amount: 0.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.createTravelExpense(expenseData);

      expect(result.amount).toBe(0.00);
    });

    it('should handle expense with very large amount', async () => {
      const expenseData: CreateTravelExpenseData = {
        type: 'FLIGHT',
        date: '2026-01-01',
        description: 'Langstreckenflug USA',
        amount: 9999.99,
        currency: 'CHF',
      };

      const mockExpense: TravelExpense = {
        id: 'expense-large',
        userId: 'user-123',
        type: 'FLIGHT',
        date: '2026-01-01',
        description: 'Langstreckenflug USA',
        amount: 9999.99,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.createTravelExpense(expenseData);

      expect(result.amount).toBe(9999.99);
    });

    it('should handle expense with very long description', async () => {
      const longDescription = 'Geschäftsreise mit ausführlicher Beschreibung: '.repeat(50);

      const expenseData: CreateTravelExpenseData = {
        type: 'TRAIN',
        date: '2026-01-01',
        description: longDescription,
        amount: 100.00,
      };

      const mockExpense: TravelExpense = {
        id: 'expense-long',
        userId: 'user-123',
        type: 'TRAIN',
        date: '2026-01-01',
        description: longDescription,
        amount: 100.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.createTravelExpense(expenseData);

      expect(result.description.length).toBeGreaterThan(1000);
    });

    it('should handle expense with past date', async () => {
      const expenseData: CreateTravelExpenseData = {
        type: 'MEALS',
        date: '2025-12-01',
        description: 'Nachträgliche Reisekosten',
        amount: 50.00,
      };

      const mockExpense: TravelExpense = {
        id: 'expense-past',
        userId: 'user-123',
        type: 'MEALS',
        date: '2025-12-01',
        description: 'Nachträgliche Reisekosten',
        amount: 50.00,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.createTravelExpense(expenseData);

      expect(result.date).toBe('2025-12-01');
    });

    it('should handle expense with German special characters', async () => {
      const expenseData: CreateTravelExpenseData = {
        type: 'TRAIN',
        date: '2026-01-01',
        description: 'Züge nach München über Würzburg für Präsentation',
        destination: 'München',
        purpose: 'Präsentation bei Großkunde',
        amount: 125.50,
        currency: 'CHF',
      };

      const mockExpense: TravelExpense = {
        id: 'expense-umlaut',
        userId: 'user-123',
        type: 'TRAIN',
        date: '2026-01-01',
        description: 'Züge nach München über Würzburg für Präsentation',
        destination: 'München',
        purpose: 'Präsentation bei Großkunde',
        amount: 125.50,
        currency: 'CHF',
        status: 'PENDING',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockExpense,
      });

      const result = await travelExpenseService.createTravelExpense(expenseData);

      expect(result.description).toContain('München');
      expect(result.destination).toBe('München');
    });

    it('should handle expense with different currencies', async () => {
      const currencies = ['CHF', 'EUR', 'USD'];

      for (const currency of currencies) {
        const expenseData: CreateTravelExpenseData = {
          type: 'MEALS',
          date: '2026-01-01',
          description: `Expense in ${currency}`,
          amount: 100.00,
          currency: currency,
        };

        const mockExpense: TravelExpense = {
          id: `expense-${currency}`,
          userId: 'user-123',
          type: 'MEALS',
          date: '2026-01-01',
          description: `Expense in ${currency}`,
          amount: 100.00,
          currency: currency,
          status: 'PENDING',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        };

        mockedApi.post.mockResolvedValue({
          data: mockExpense,
        });

        const result = await travelExpenseService.createTravelExpense(expenseData);
        expect(result.currency).toBe(currency);
      }
    });
  });
});
