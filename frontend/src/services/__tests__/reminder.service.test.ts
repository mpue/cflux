import axios from 'axios';
import { reminderService } from '../reminder.service';
import {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ReminderSettings,
  OverdueInvoice,
  ReminderStats,
  ReminderStatus,
  ReminderLevel
} from '../../types/reminder.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Reminder Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token-123');
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createReminder', () => {
    it('should create reminder with all fields', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-123',
        customerId: 'customer-456',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 1500.50,
        fee: 25.00,
        totalAmount: 1525.50,
        message: 'Erste Mahnung für überfällige Rechnung',
      };

      const mockReminder: Reminder = {
        id: 'reminder-1',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders'),
        reminderData,
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockReminder);
      expect(result.level).toBe('FIRST');
    });

    it('should create second level reminder', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-123',
        customerId: 'customer-456',
        level: 'SECOND' as ReminderLevel,
        dueDate: '2026-02-15',
        amount: 1500.50,
        fee: 50.00,
        totalAmount: 1550.50,
        message: 'Zweite Mahnung',
      };

      const mockReminder: Reminder = {
        id: 'reminder-2',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(result.level).toBe('SECOND');
      expect(result.fee).toBe(50.00);
    });

    it('should create third level reminder', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-123',
        customerId: 'customer-456',
        level: 'THIRD' as ReminderLevel,
        dueDate: '2026-03-01',
        amount: 1500.50,
        fee: 75.00,
        totalAmount: 1575.50,
        message: 'Letzte Mahnung vor rechtlichen Schritten',
      };

      const mockReminder: Reminder = {
        id: 'reminder-3',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(result.level).toBe('THIRD');
      expect(result.fee).toBe(75.00);
    });

    it('should create reminder with custom message', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-789',
        customerId: 'customer-123',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 2500.00,
        fee: 25.00,
        totalAmount: 2525.00,
        message: 'Sehr geehrter Kunde, wir möchten Sie höflich an die überfällige Zahlung erinnern.',
      };

      const mockReminder: Reminder = {
        id: 'reminder-custom',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(result.message).toContain('höflich');
    });

    it('should handle creation error', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invalid-invoice',
        customerId: 'customer-123',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
      };

      mockedAxios.post.mockRejectedValue(new Error('Invoice not found'));

      await expect(reminderService.createReminder(reminderData))
        .rejects.toThrow('Invoice not found');
    });

    it('should create reminder with Swiss currency amounts', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-ch',
        customerId: 'customer-ch',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 3500.75,
        fee: 30.00,
        totalAmount: 3530.75,
        message: 'Mahnung für ausstehende Zahlung in CHF',
      };

      const mockReminder: Reminder = {
        id: 'reminder-chf',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(result.amount).toBe(3500.75);
      expect(result.totalAmount).toBe(3530.75);
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllReminders', () => {
    it('should get all reminders without filters', async () => {
      const mockReminders: Reminder[] = [
        {
          id: 'reminder-1',
          invoiceId: 'invoice-1',
          customerId: 'customer-1',
          level: 'FIRST' as ReminderLevel,
          status: 'PENDING' as ReminderStatus,
          dueDate: '2026-02-01',
          amount: 1000.00,
          fee: 25.00,
          totalAmount: 1025.00,
          sentDate: null,
          sentBy: null,
          paidDate: null,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'reminder-2',
          invoiceId: 'invoice-2',
          customerId: 'customer-2',
          level: 'SECOND' as ReminderLevel,
          status: 'SENT' as ReminderStatus,
          dueDate: '2026-02-15',
          amount: 2000.00,
          fee: 50.00,
          totalAmount: 2050.00,
          sentDate: '2026-01-15T10:00:00Z',
          sentBy: 'user-123',
          paidDate: null,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-15T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockReminders });

      const result = await reminderService.getAllReminders();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders?'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockReminders);
      expect(result).toHaveLength(2);
    });

    it('should get reminders filtered by status', async () => {
      const mockReminders: Reminder[] = [
        {
          id: 'reminder-pending',
          invoiceId: 'invoice-1',
          customerId: 'customer-1',
          level: 'FIRST' as ReminderLevel,
          status: 'PENDING' as ReminderStatus,
          dueDate: '2026-02-01',
          amount: 1000.00,
          fee: 25.00,
          totalAmount: 1025.00,
          sentDate: null,
          sentBy: null,
          paidDate: null,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockReminders });

      const result = await reminderService.getAllReminders({ status: 'PENDING' as ReminderStatus });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders?status=PENDING'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result[0].status).toBe('PENDING');
    });

    it('should get reminders filtered by level', async () => {
      const mockReminders: Reminder[] = [
        {
          id: 'reminder-first',
          invoiceId: 'invoice-1',
          customerId: 'customer-1',
          level: 'FIRST' as ReminderLevel,
          status: 'SENT' as ReminderStatus,
          dueDate: '2026-02-01',
          amount: 1000.00,
          fee: 25.00,
          totalAmount: 1025.00,
          sentDate: '2026-01-20T10:00:00Z',
          sentBy: 'user-123',
          paidDate: null,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-20T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockReminders });

      const result = await reminderService.getAllReminders({ level: 'FIRST' as ReminderLevel });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders?level=FIRST'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result[0].level).toBe('FIRST');
    });

    it('should get reminders filtered by customer', async () => {
      const mockReminders: Reminder[] = [
        {
          id: 'reminder-customer',
          invoiceId: 'invoice-1',
          customerId: 'customer-123',
          level: 'FIRST' as ReminderLevel,
          status: 'PENDING' as ReminderStatus,
          dueDate: '2026-02-01',
          amount: 1500.00,
          fee: 25.00,
          totalAmount: 1525.00,
          sentDate: null,
          sentBy: null,
          paidDate: null,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockReminders });

      const result = await reminderService.getAllReminders({ customerId: 'customer-123' });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders?customerId=customer-123'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result[0].customerId).toBe('customer-123');
    });

    it('should get reminders with multiple filters', async () => {
      const mockReminders: Reminder[] = [
        {
          id: 'reminder-filtered',
          invoiceId: 'invoice-1',
          customerId: 'customer-123',
          level: 'SECOND' as ReminderLevel,
          status: 'SENT' as ReminderStatus,
          dueDate: '2026-02-15',
          amount: 2000.00,
          fee: 50.00,
          totalAmount: 2050.00,
          sentDate: '2026-01-20T10:00:00Z',
          sentBy: 'user-123',
          paidDate: null,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-20T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockReminders });

      const result = await reminderService.getAllReminders({
        status: 'SENT' as ReminderStatus,
        level: 'SECOND' as ReminderLevel,
        customerId: 'customer-123',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders?status=SENT&level=SECOND&customerId=customer-123'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result[0].status).toBe('SENT');
      expect(result[0].level).toBe('SECOND');
    });
  });

  describe('READ - getReminderById', () => {
    it('should get reminder by id', async () => {
      const mockReminder: Reminder = {
        id: 'reminder-123',
        invoiceId: 'invoice-456',
        customerId: 'customer-789',
        level: 'FIRST' as ReminderLevel,
        status: 'PENDING' as ReminderStatus,
        dueDate: '2026-02-01',
        amount: 1200.50,
        fee: 25.00,
        totalAmount: 1225.50,
        message: 'Test reminder message',
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.getReminderById('reminder-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/reminder-123'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockReminder);
      expect(result.id).toBe('reminder-123');
    });

    it('should handle reminder not found', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Reminder not found'));

      await expect(reminderService.getReminderById('nonexistent-id'))
        .rejects.toThrow('Reminder not found');
    });
  });

  describe('READ - getRemindersByInvoice', () => {
    it('should get all reminders for invoice', async () => {
      const mockReminders: Reminder[] = [
        {
          id: 'reminder-1',
          invoiceId: 'invoice-123',
          customerId: 'customer-456',
          level: 'FIRST' as ReminderLevel,
          status: 'SENT' as ReminderStatus,
          dueDate: '2026-02-01',
          amount: 1000.00,
          fee: 25.00,
          totalAmount: 1025.00,
          sentDate: '2026-01-15T10:00:00Z',
          sentBy: 'user-123',
          paidDate: null,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-15T10:00:00Z',
        },
        {
          id: 'reminder-2',
          invoiceId: 'invoice-123',
          customerId: 'customer-456',
          level: 'SECOND' as ReminderLevel,
          status: 'PENDING' as ReminderStatus,
          dueDate: '2026-02-15',
          amount: 1000.00,
          fee: 50.00,
          totalAmount: 1050.00,
          sentDate: null,
          sentBy: null,
          paidDate: null,
          createdAt: '2026-01-20T10:00:00Z',
          updatedAt: '2026-01-20T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockReminders });

      const result = await reminderService.getRemindersByInvoice('invoice-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/invoice/invoice-123'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toHaveLength(2);
      expect(result[0].invoiceId).toBe('invoice-123');
    });
  });

  describe('READ - getOverdueInvoices', () => {
    it('should get all overdue invoices', async () => {
      const mockOverdueInvoices: OverdueInvoice[] = [
        {
          invoiceId: 'invoice-1',
          invoiceNumber: 'RE-2026-001',
          customerId: 'customer-1',
          customerName: 'Müller AG',
          amount: 1500.00,
          dueDate: '2025-12-15',
          daysOverdue: 17,
          lastReminderLevel: null,
          lastReminderDate: null,
        },
        {
          invoiceId: 'invoice-2',
          invoiceNumber: 'RE-2026-002',
          customerId: 'customer-2',
          customerName: 'Schmidt GmbH',
          amount: 2500.00,
          dueDate: '2025-12-20',
          daysOverdue: 12,
          lastReminderLevel: 'FIRST' as ReminderLevel,
          lastReminderDate: '2026-01-01',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockOverdueInvoices });

      const result = await reminderService.getOverdueInvoices();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/overdue-invoices'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockOverdueInvoices);
      expect(result).toHaveLength(2);
    });
  });

  describe('READ - getReminderSettings', () => {
    it('should get reminder settings', async () => {
      const mockSettings: ReminderSettings = {
        id: 'settings-1',
        firstReminderDays: 7,
        secondReminderDays: 14,
        thirdReminderDays: 21,
        firstReminderFee: 25.00,
        secondReminderFee: 50.00,
        thirdReminderFee: 75.00,
        defaultMessage: 'Bitte begleichen Sie die offene Rechnung umgehend.',
        autoSendReminders: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: mockSettings });

      const result = await reminderService.getReminderSettings();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/settings/current'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockSettings);
      expect(result.firstReminderDays).toBe(7);
    });
  });

  describe('READ - getReminderStats', () => {
    it('should get reminder statistics', async () => {
      const mockStats: ReminderStats = {
        totalReminders: 45,
        pendingReminders: 12,
        sentReminders: 28,
        paidReminders: 5,
        totalOutstandingAmount: 15000.50,
        totalFeesCollected: 750.00,
        averagePaymentDays: 18.5,
        remindersByLevel: {
          FIRST: 20,
          SECOND: 15,
          THIRD: 10,
        },
      };

      mockedAxios.get.mockResolvedValue({ data: mockStats });

      const result = await reminderService.getReminderStats();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/stats'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockStats);
      expect(result.totalReminders).toBe(45);
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateReminder', () => {
    it('should update reminder message', async () => {
      const updateData: UpdateReminderDto = {
        message: 'Aktualisierte Mahnungsnachricht',
      };

      const mockUpdatedReminder: Reminder = {
        id: 'reminder-123',
        invoiceId: 'invoice-456',
        customerId: 'customer-789',
        level: 'FIRST' as ReminderLevel,
        status: 'PENDING' as ReminderStatus,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
        message: 'Aktualisierte Mahnungsnachricht',
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedReminder });

      const result = await reminderService.updateReminder('reminder-123', updateData);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/reminder-123'),
        updateData,
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result.message).toBe('Aktualisierte Mahnungsnachricht');
    });

    it('should update reminder status', async () => {
      const updateData: UpdateReminderDto = {
        status: 'SENT' as ReminderStatus,
      };

      const mockUpdatedReminder: Reminder = {
        id: 'reminder-123',
        invoiceId: 'invoice-456',
        customerId: 'customer-789',
        level: 'FIRST' as ReminderLevel,
        status: 'SENT' as ReminderStatus,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
        sentDate: '2026-01-15T10:00:00Z',
        sentBy: 'user-123',
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedReminder });

      const result = await reminderService.updateReminder('reminder-123', updateData);

      expect(result.status).toBe('SENT');
    });

    it('should update reminder due date', async () => {
      const updateData: UpdateReminderDto = {
        dueDate: '2026-03-01',
      };

      const mockUpdatedReminder: Reminder = {
        id: 'reminder-123',
        invoiceId: 'invoice-456',
        customerId: 'customer-789',
        level: 'FIRST' as ReminderLevel,
        status: 'PENDING' as ReminderStatus,
        dueDate: '2026-03-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedReminder });

      const result = await reminderService.updateReminder('reminder-123', updateData);

      expect(result.dueDate).toBe('2026-03-01');
    });

    it('should update reminder fee', async () => {
      const updateData: UpdateReminderDto = {
        fee: 30.00,
        totalAmount: 1030.00,
      };

      const mockUpdatedReminder: Reminder = {
        id: 'reminder-123',
        invoiceId: 'invoice-456',
        customerId: 'customer-789',
        level: 'FIRST' as ReminderLevel,
        status: 'PENDING' as ReminderStatus,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 30.00,
        totalAmount: 1030.00,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedReminder });

      const result = await reminderService.updateReminder('reminder-123', updateData);

      expect(result.fee).toBe(30.00);
      expect(result.totalAmount).toBe(1030.00);
    });

    it('should handle update error', async () => {
      const updateData: UpdateReminderDto = {
        message: 'New message',
      };

      mockedAxios.put.mockRejectedValue(new Error('Reminder not found'));

      await expect(reminderService.updateReminder('nonexistent-id', updateData))
        .rejects.toThrow('Reminder not found');
    });
  });

  describe('UPDATE - updateReminderSettings', () => {
    it('should update reminder settings', async () => {
      const updateData: Partial<ReminderSettings> = {
        firstReminderDays: 10,
        firstReminderFee: 30.00,
        autoSendReminders: true,
      };

      const mockUpdatedSettings: ReminderSettings = {
        id: 'settings-1',
        firstReminderDays: 10,
        secondReminderDays: 14,
        thirdReminderDays: 21,
        firstReminderFee: 30.00,
        secondReminderFee: 50.00,
        thirdReminderFee: 75.00,
        defaultMessage: 'Bitte begleichen Sie die offene Rechnung umgehend.',
        autoSendReminders: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await reminderService.updateReminderSettings('settings-1', updateData);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/settings/settings-1'),
        updateData,
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result.firstReminderDays).toBe(10);
      expect(result.autoSendReminders).toBe(true);
    });
  });

  // ============================================
  // ACTIONS Tests
  // ============================================
  describe('ACTIONS - sendReminder', () => {
    it('should send reminder successfully', async () => {
      const mockSentReminder: Reminder = {
        id: 'reminder-123',
        invoiceId: 'invoice-456',
        customerId: 'customer-789',
        level: 'FIRST' as ReminderLevel,
        status: 'SENT' as ReminderStatus,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
        sentDate: '2026-01-15T10:00:00Z',
        sentBy: 'user-123',
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockSentReminder });

      const result = await reminderService.sendReminder('reminder-123', 'user-123');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/reminder-123/send'),
        { sentBy: 'user-123' },
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result.status).toBe('SENT');
      expect(result.sentBy).toBe('user-123');
    });

    it('should handle send error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Email service unavailable'));

      await expect(reminderService.sendReminder('reminder-123', 'user-123'))
        .rejects.toThrow('Email service unavailable');
    });
  });

  describe('ACTIONS - markReminderAsPaid', () => {
    it('should mark reminder as paid', async () => {
      const mockPaidReminder: Reminder = {
        id: 'reminder-123',
        invoiceId: 'invoice-456',
        customerId: 'customer-789',
        level: 'FIRST' as ReminderLevel,
        status: 'PAID' as ReminderStatus,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
        sentDate: '2026-01-15T10:00:00Z',
        sentBy: 'user-123',
        paidDate: '2026-01-20T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-20T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockPaidReminder });

      const result = await reminderService.markReminderAsPaid('reminder-123');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/reminder-123/mark-paid'),
        {},
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result.status).toBe('PAID');
      expect(result.paidDate).toBeDefined();
    });
  });

  describe('ACTIONS - downloadReminderPdf', () => {
    it('should download reminder PDF', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      mockedAxios.get.mockResolvedValue({ data: mockBlob });

      const result = await reminderService.downloadReminderPdf('reminder-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/reminder-123/pdf'),
        expect.objectContaining({
          headers: expect.any(Object),
          responseType: 'blob'
        })
      );
      expect(result).toEqual(mockBlob);
    });

    it('should handle PDF download error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('PDF generation failed'));

      await expect(reminderService.downloadReminderPdf('reminder-123'))
        .rejects.toThrow('PDF generation failed');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteReminder', () => {
    it('should delete reminder successfully', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await reminderService.deleteReminder('reminder-123');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/reminders/reminder-123'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });

    it('should handle delete error', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Cannot delete sent reminder'));

      await expect(reminderService.deleteReminder('reminder-123'))
        .rejects.toThrow('Cannot delete sent reminder');
    });

    it('should delete multiple reminders', async () => {
      const reminderIds = ['reminder-1', 'reminder-2', 'reminder-3'];

      mockedAxios.delete.mockResolvedValue({});

      for (const id of reminderIds) {
        await reminderService.deleteReminder(id);
      }

      expect(mockedAxios.delete).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Reminder Escalation Flow', () => {
    it('should complete full reminder escalation lifecycle', async () => {
      // CREATE first reminder
      const firstReminderData: CreateReminderDto = {
        invoiceId: 'invoice-123',
        customerId: 'customer-456',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
        message: 'Erste Mahnung',
      };

      const mockFirstReminder: Reminder = {
        id: 'reminder-first',
        ...firstReminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockFirstReminder });
      const firstReminder = await reminderService.createReminder(firstReminderData);
      expect(firstReminder.level).toBe('FIRST');

      // SEND first reminder
      const mockSentFirst: Reminder = {
        ...mockFirstReminder,
        status: 'SENT' as ReminderStatus,
        sentDate: '2026-01-15T10:00:00Z',
        sentBy: 'user-123',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockSentFirst });
      const sentFirst = await reminderService.sendReminder('reminder-first', 'user-123');
      expect(sentFirst.status).toBe('SENT');

      // CREATE second reminder (escalation)
      const secondReminderData: CreateReminderDto = {
        invoiceId: 'invoice-123',
        customerId: 'customer-456',
        level: 'SECOND' as ReminderLevel,
        dueDate: '2026-02-15',
        amount: 1000.00,
        fee: 50.00,
        totalAmount: 1050.00,
        message: 'Zweite Mahnung',
      };

      const mockSecondReminder: Reminder = {
        id: 'reminder-second',
        ...secondReminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-02-05T10:00:00Z',
        updatedAt: '2026-02-05T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockSecondReminder });
      const secondReminder = await reminderService.createReminder(secondReminderData);
      expect(secondReminder.level).toBe('SECOND');

      // GET all reminders for invoice
      mockedAxios.get.mockResolvedValue({ data: [mockSentFirst, mockSecondReminder] });
      const allReminders = await reminderService.getRemindersByInvoice('invoice-123');
      expect(allReminders).toHaveLength(2);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle reminder with zero fee', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-123',
        customerId: 'customer-456',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 0.00,
        totalAmount: 1000.00,
      };

      const mockReminder: Reminder = {
        id: 'reminder-zero-fee',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(result.fee).toBe(0.00);
      expect(result.totalAmount).toBe(1000.00);
    });

    it('should handle very long reminder message', async () => {
      const longMessage = 'Sehr ausführliche Mahnungsnachricht mit vielen Details. '.repeat(50);

      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-123',
        customerId: 'customer-456',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
        message: longMessage,
      };

      const mockReminder: Reminder = {
        id: 'reminder-long',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(result.message?.length).toBeGreaterThan(1000);
    });

    it('should handle reminder with special characters in message', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-123',
        customerId: 'customer-456',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 1000.00,
        fee: 25.00,
        totalAmount: 1025.00,
        message: 'Sehr geehrte Damen & Herren, Überprüfung für Zürich, Rückzahlung möglich',
      };

      const mockReminder: Reminder = {
        id: 'reminder-special',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(result.message).toContain('&');
      expect(result.message).toContain('Überprüfung');
      expect(result.message).toContain('Zürich');
    });

    it('should handle empty reminders list', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await reminderService.getAllReminders();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle reminder with very large amount', async () => {
      const reminderData: CreateReminderDto = {
        invoiceId: 'invoice-large',
        customerId: 'customer-large',
        level: 'FIRST' as ReminderLevel,
        dueDate: '2026-02-01',
        amount: 999999.99,
        fee: 500.00,
        totalAmount: 1000499.99,
      };

      const mockReminder: Reminder = {
        id: 'reminder-large',
        ...reminderData,
        status: 'PENDING' as ReminderStatus,
        sentDate: null,
        sentBy: null,
        paidDate: null,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.createReminder(reminderData);

      expect(result.amount).toBe(999999.99);
      expect(result.totalAmount).toBe(1000499.99);
    });

    it('should handle stats with zero values', async () => {
      const mockStats: ReminderStats = {
        totalReminders: 0,
        pendingReminders: 0,
        sentReminders: 0,
        paidReminders: 0,
        totalOutstandingAmount: 0,
        totalFeesCollected: 0,
        averagePaymentDays: 0,
        remindersByLevel: {
          FIRST: 0,
          SECOND: 0,
          THIRD: 0,
        },
      };

      mockedAxios.get.mockResolvedValue({ data: mockStats });

      const result = await reminderService.getReminderStats();

      expect(result.totalReminders).toBe(0);
      expect(result.totalOutstandingAmount).toBe(0);
    });
  });
});
