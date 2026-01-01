import * as invoiceService from '../invoiceService';
import api from '../api';
import { Invoice, InvoiceStatus } from '../../types';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Invoice Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createInvoice', () => {
    it('should create invoice with all fields', async () => {
      const newInvoiceData: Partial<Invoice> = {
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        templateId: 'template-456',
        status: 'DRAFT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        notes: 'Payment due within 30 days',
        isActive: true,
      };

      const mockCreatedInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        templateId: 'template-456',
        status: 'DRAFT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        notes: 'Payment due within 30 days',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockCreatedInvoice,
      });

      const result = await invoiceService.createInvoice(newInvoiceData);

      expect(mockedApi.post).toHaveBeenCalledWith('/invoices', newInvoiceData);
      expect(result).toEqual(mockCreatedInvoice);
      expect(result.id).toBe('invoice-123');
      expect(result.invoiceNumber).toBe('INV-2026-001');
      expect(result.totalAmount).toBe(1081.00);
    });

    it('should create invoice with minimal required fields', async () => {
      const minimalData: Partial<Invoice> = {
        invoiceNumber: 'INV-2026-002',
        invoiceDate: '2026-01-02',
        dueDate: '2026-02-01',
        customerId: 'customer-456',
        status: 'DRAFT',
        subtotal: 500.00,
        vatAmount: 40.50,
        totalAmount: 540.50,
      };

      const mockInvoice: Invoice = {
        id: 'invoice-456',
        invoiceNumber: 'INV-2026-002',
        invoiceDate: '2026-01-02',
        dueDate: '2026-02-01',
        customerId: 'customer-456',
        status: 'DRAFT',
        subtotal: 500.00,
        vatAmount: 40.50,
        totalAmount: 540.50,
        isActive: true,
        createdAt: '2026-01-02T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.createInvoice(minimalData);

      expect(result.invoiceNumber).toBe('INV-2026-002');
      expect(result.status).toBe('DRAFT');
    });

    it('should create invoice with customer relation', async () => {
      const invoiceData: Partial<Invoice> = {
        invoiceNumber: 'INV-2026-003',
        invoiceDate: '2026-01-03',
        dueDate: '2026-02-02',
        customerId: 'customer-789',
        status: 'DRAFT',
        subtotal: 750.00,
        vatAmount: 60.75,
        totalAmount: 810.75,
      };

      const mockInvoice: Invoice = {
        id: 'invoice-789',
        invoiceNumber: 'INV-2026-003',
        invoiceDate: '2026-01-03',
        dueDate: '2026-02-02',
        customerId: 'customer-789',
        status: 'DRAFT',
        subtotal: 750.00,
        vatAmount: 60.75,
        totalAmount: 810.75,
        isActive: true,
        createdAt: '2026-01-03T10:00:00Z',
        updatedAt: '2026-01-03T10:00:00Z',
        customer: {
          id: 'customer-789',
          name: 'Acme Corporation',
          email: 'info@acme.com',
          isActive: true,
          createdAt: '2025-12-01T10:00:00Z',
          updatedAt: '2025-12-01T10:00:00Z',
        },
      };

      mockedApi.post.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.createInvoice(invoiceData);

      expect(result.customer).toBeDefined();
      expect(result.customer?.name).toBe('Acme Corporation');
    });

    it('should create invoice with different statuses', async () => {
      const statuses: InvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

      for (const status of statuses) {
        const invoiceData: Partial<Invoice> = {
          invoiceNumber: `INV-2026-${status}`,
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-123',
          status: status,
          subtotal: 100.00,
          vatAmount: 8.10,
          totalAmount: 108.10,
        };

        const mockInvoice: Invoice = {
          id: `invoice-${status}`,
          ...invoiceData as Invoice,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        };

        mockedApi.post.mockResolvedValue({ data: mockInvoice });

        const result = await invoiceService.createInvoice(invoiceData);
        expect(result.status).toBe(status);
      }
    });

    it('should handle creation error', async () => {
      const invoiceData: Partial<Invoice> = {
        invoiceNumber: 'DUPLICATE-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 100.00,
        vatAmount: 8.10,
        totalAmount: 108.10,
      };

      mockedApi.post.mockRejectedValue(new Error('Invoice number already exists'));

      await expect(invoiceService.createInvoice(invoiceData))
        .rejects.toThrow('Invoice number already exists');
    });

    it('should create invoice with Swiss VAT rates', async () => {
      const vatRates = [8.1, 2.6, 0]; // Standard, reduced, exempt

      for (const vatRate of vatRates) {
        const subtotal = 1000.00;
        const vatAmount = subtotal * (vatRate / 100);
        const totalAmount = subtotal + vatAmount;

        const invoiceData: Partial<Invoice> = {
          invoiceNumber: `INV-VAT-${vatRate}`,
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-123',
          status: 'DRAFT',
          subtotal: subtotal,
          vatAmount: vatAmount,
          totalAmount: totalAmount,
        };

        const mockInvoice: Invoice = {
          id: `invoice-vat-${vatRate}`,
          ...invoiceData as Invoice,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        };

        mockedApi.post.mockResolvedValue({ data: mockInvoice });

        const result = await invoiceService.createInvoice(invoiceData);
        expect(result.vatAmount).toBe(vatAmount);
      }
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllInvoices', () => {
    it('should get all invoices without filters', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-1',
          status: 'DRAFT',
          subtotal: 1000.00,
          vatAmount: 81.00,
          totalAmount: 1081.00,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'invoice-2',
          invoiceNumber: 'INV-2026-002',
          invoiceDate: '2026-01-02',
          dueDate: '2026-02-01',
          customerId: 'customer-2',
          status: 'SENT',
          subtotal: 500.00,
          vatAmount: 40.50,
          totalAmount: 540.50,
          isActive: true,
          createdAt: '2026-01-02T10:00:00Z',
          updatedAt: '2026-01-02T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInvoices });

      const result = await invoiceService.getAllInvoices();

      expect(mockedApi.get).toHaveBeenCalledWith('/invoices?');
      expect(result).toEqual(mockInvoices);
      expect(result).toHaveLength(2);
    });

    it('should get invoices with search filter', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-1',
          status: 'DRAFT',
          subtotal: 1000.00,
          vatAmount: 81.00,
          totalAmount: 1081.00,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInvoices });

      const result = await invoiceService.getAllInvoices('INV-2026-001');

      expect(mockedApi.get).toHaveBeenCalledWith('/invoices?search=INV-2026-001');
      expect(result).toHaveLength(1);
      expect(result[0].invoiceNumber).toBe('INV-2026-001');
    });

    it('should get invoices by status', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'invoice-paid',
          invoiceNumber: 'INV-2026-PAID',
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-1',
          status: 'PAID',
          subtotal: 1000.00,
          vatAmount: 81.00,
          totalAmount: 1081.00,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInvoices });

      const result = await invoiceService.getAllInvoices(undefined, 'PAID');

      expect(mockedApi.get).toHaveBeenCalledWith('/invoices?status=PAID');
      expect(result[0].status).toBe('PAID');
    });

    it('should get invoices by customer', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-123',
          status: 'DRAFT',
          subtotal: 1000.00,
          vatAmount: 81.00,
          totalAmount: 1081.00,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInvoices });

      const result = await invoiceService.getAllInvoices(undefined, undefined, 'customer-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/invoices?customerId=customer-123');
      expect(result[0].customerId).toBe('customer-123');
    });

    it('should get only active invoices', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-1',
          status: 'DRAFT',
          subtotal: 1000.00,
          vatAmount: 81.00,
          totalAmount: 1081.00,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInvoices });

      const result = await invoiceService.getAllInvoices(undefined, undefined, undefined, true);

      expect(mockedApi.get).toHaveBeenCalledWith('/invoices?isActive=true');
      expect(result.every(inv => inv.isActive)).toBe(true);
    });

    it('should get invoices with combined filters', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-123',
          status: 'SENT',
          subtotal: 1000.00,
          vatAmount: 81.00,
          totalAmount: 1081.00,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInvoices });

      const result = await invoiceService.getAllInvoices('INV-2026', 'SENT', 'customer-123', true);

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/invoices?search=INV-2026&status=SENT&customerId=customer-123&isActive=true'
      );
      expect(result[0].status).toBe('SENT');
      expect(result[0].customerId).toBe('customer-123');
    });

    it('should return empty array when no invoices found', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await invoiceService.getAllInvoices('nonexistent');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should get invoices with customer and items', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-01-01',
          dueDate: '2026-01-31',
          customerId: 'customer-1',
          status: 'DRAFT',
          subtotal: 1000.00,
          vatAmount: 81.00,
          totalAmount: 1081.00,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
          customer: {
            id: 'customer-1',
            name: 'Acme Corp',
            isActive: true,
            createdAt: '2025-12-01T10:00:00Z',
            updatedAt: '2025-12-01T10:00:00Z',
          },
          items: [
            {
              id: 'item-1',
              invoiceId: 'invoice-1',
              position: 1,
              description: 'Consulting Services',
              quantity: 10,
              unitPrice: 100.00,
              unit: 'hour',
              vatRate: 8.1,
              totalPrice: 1000.00,
              createdAt: '2026-01-01T10:00:00Z',
              updatedAt: '2026-01-01T10:00:00Z',
            },
          ],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInvoices });

      const result = await invoiceService.getAllInvoices();

      expect(result[0].customer).toBeDefined();
      expect(result[0].items).toHaveLength(1);
    });
  });

  describe('READ - getInvoiceById', () => {
    it('should get invoice by id', async () => {
      const mockInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        notes: 'Test invoice',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.getInvoiceById('invoice-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/invoices/invoice-123');
      expect(result).toEqual(mockInvoice);
      expect(result.id).toBe('invoice-123');
    });

    it('should get invoice with full details', async () => {
      const mockInvoice: Invoice = {
        id: 'invoice-full',
        invoiceNumber: 'INV-2026-FULL',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        templateId: 'template-456',
        status: 'SENT',
        subtotal: 1500.00,
        vatAmount: 121.50,
        totalAmount: 1621.50,
        notes: 'Complete invoice with all details',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        customer: {
          id: 'customer-123',
          name: 'Complete Customer AG',
          email: 'info@complete.ch',
          address: 'Test Street 1',
          city: 'Zürich',
          isActive: true,
          createdAt: '2025-12-01T10:00:00Z',
          updatedAt: '2025-12-01T10:00:00Z',
        },
        items: [
          {
            id: 'item-1',
            invoiceId: 'invoice-full',
            articleId: 'article-1',
            position: 1,
            description: 'Consulting Hour',
            quantity: 10,
            unitPrice: 150.00,
            unit: 'hour',
            vatRate: 8.1,
            totalPrice: 1500.00,
            createdAt: '2026-01-01T10:00:00Z',
            updatedAt: '2026-01-01T10:00:00Z',
          },
        ],
      };

      mockedApi.get.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.getInvoiceById('invoice-full');

      expect(result.customer).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.templateId).toBe('template-456');
    });

    it('should handle not found error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Invoice not found'));

      await expect(invoiceService.getInvoiceById('nonexistent-id'))
        .rejects.toThrow('Invoice not found');
    });
  });

  describe('READ - getNextInvoiceNumber', () => {
    it('should get next invoice number', async () => {
      mockedApi.get.mockResolvedValue({
        data: { invoiceNumber: 'INV-2026-042' },
      });

      const result = await invoiceService.getNextInvoiceNumber();

      expect(mockedApi.get).toHaveBeenCalledWith('/invoices/next-number');
      expect(result).toBe('INV-2026-042');
    });

    it('should handle error when getting next invoice number', async () => {
      mockedApi.get.mockRejectedValue(new Error('Failed to generate invoice number'));

      await expect(invoiceService.getNextInvoiceNumber())
        .rejects.toThrow('Failed to generate invoice number');
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateInvoice', () => {
    it('should update invoice status', async () => {
      const updates: Partial<Invoice> = {
        status: 'SENT',
      };

      const mockUpdatedInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'SENT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedInvoice });

      const result = await invoiceService.updateInvoice('invoice-123', updates);

      expect(mockedApi.put).toHaveBeenCalledWith('/invoices/invoice-123', updates);
      expect(result.status).toBe('SENT');
      expect(result.updatedAt).not.toBe(result.createdAt);
    });

    it('should update invoice dates', async () => {
      const updates: Partial<Invoice> = {
        invoiceDate: '2026-01-15',
        dueDate: '2026-02-15',
      };

      const mockUpdatedInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-15',
        dueDate: '2026-02-15',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedInvoice });

      const result = await invoiceService.updateInvoice('invoice-123', updates);

      expect(result.invoiceDate).toBe('2026-01-15');
      expect(result.dueDate).toBe('2026-02-15');
    });

    it('should update invoice amounts', async () => {
      const updates: Partial<Invoice> = {
        subtotal: 1500.00,
        vatAmount: 121.50,
        totalAmount: 1621.50,
      };

      const mockUpdatedInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 1500.00,
        vatAmount: 121.50,
        totalAmount: 1621.50,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedInvoice });

      const result = await invoiceService.updateInvoice('invoice-123', updates);

      expect(result.subtotal).toBe(1500.00);
      expect(result.vatAmount).toBe(121.50);
      expect(result.totalAmount).toBe(1621.50);
    });

    it('should update invoice notes', async () => {
      const updates: Partial<Invoice> = {
        notes: 'Updated payment terms: 15 days net',
      };

      const mockUpdatedInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        notes: 'Updated payment terms: 15 days net',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedInvoice });

      const result = await invoiceService.updateInvoice('invoice-123', updates);

      expect(result.notes).toBe('Updated payment terms: 15 days net');
    });

    it('should mark invoice as paid', async () => {
      const updates: Partial<Invoice> = {
        status: 'PAID',
      };

      const mockUpdatedInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'PAID',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedInvoice });

      const result = await invoiceService.updateInvoice('invoice-123', updates);

      expect(result.status).toBe('PAID');
    });

    it('should cancel invoice', async () => {
      const updates: Partial<Invoice> = {
        status: 'CANCELLED',
        isActive: false,
      };

      const mockUpdatedInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'CANCELLED',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedInvoice });

      const result = await invoiceService.updateInvoice('invoice-123', updates);

      expect(result.status).toBe('CANCELLED');
      expect(result.isActive).toBe(false);
    });

    it('should update all fields at once', async () => {
      const updates: Partial<Invoice> = {
        invoiceDate: '2026-02-01',
        dueDate: '2026-03-01',
        status: 'SENT',
        subtotal: 2000.00,
        vatAmount: 162.00,
        totalAmount: 2162.00,
        notes: 'Completely updated invoice',
      };

      const mockUpdatedInvoice: Invoice = {
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-02-01',
        dueDate: '2026-03-01',
        customerId: 'customer-123',
        status: 'SENT',
        subtotal: 2000.00,
        vatAmount: 162.00,
        totalAmount: 2162.00,
        notes: 'Completely updated invoice',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedInvoice });

      const result = await invoiceService.updateInvoice('invoice-123', updates);

      expect(result.status).toBe('SENT');
      expect(result.totalAmount).toBe(2162.00);
    });

    it('should handle update error', async () => {
      const updates: Partial<Invoice> = {
        status: 'PAID',
      };

      mockedApi.put.mockRejectedValue(new Error('Cannot update cancelled invoice'));

      await expect(invoiceService.updateInvoice('invoice-123', updates))
        .rejects.toThrow('Cannot update cancelled invoice');
    });

    it('should handle not found error on update', async () => {
      const updates: Partial<Invoice> = {
        status: 'SENT',
      };

      mockedApi.put.mockRejectedValue(new Error('Invoice not found'));

      await expect(invoiceService.updateInvoice('nonexistent-id', updates))
        .rejects.toThrow('Invoice not found');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await invoiceService.deleteInvoice('invoice-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/invoices/invoice-123');
    });

    it('should delete multiple invoices', async () => {
      const invoiceIds = ['invoice-1', 'invoice-2', 'invoice-3'];

      mockedApi.delete.mockResolvedValue({});

      for (const id of invoiceIds) {
        await invoiceService.deleteInvoice(id);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenCalledWith('/invoices/invoice-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/invoices/invoice-2');
      expect(mockedApi.delete).toHaveBeenCalledWith('/invoices/invoice-3');
    });

    it('should handle delete error when invoice not found', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Invoice not found'));

      await expect(invoiceService.deleteInvoice('nonexistent-id'))
        .rejects.toThrow('Invoice not found');
    });

    it('should handle delete error when invoice is paid', async () => {
      mockedApi.delete.mockRejectedValue(
        new Error('Cannot delete paid invoice')
      );

      await expect(invoiceService.deleteInvoice('invoice-123'))
        .rejects.toThrow('Cannot delete paid invoice');
    });

    it('should handle network error on delete', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Network error'));

      await expect(invoiceService.deleteInvoice('invoice-123'))
        .rejects.toThrow('Network error');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Invoice Lifecycle', () => {
    it('should complete full invoice lifecycle from draft to paid', async () => {
      // CREATE as DRAFT
      const newInvoice: Partial<Invoice> = {
        invoiceNumber: 'INV-LIFECYCLE-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-lifecycle',
        status: 'DRAFT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
      };

      const createdInvoice: Invoice = {
        id: 'invoice-lifecycle',
        ...newInvoice as Invoice,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdInvoice });
      const created = await invoiceService.createInvoice(newInvoice);
      expect(created.status).toBe('DRAFT');

      // READ
      mockedApi.get.mockResolvedValue({ data: createdInvoice });
      const fetched = await invoiceService.getInvoiceById('invoice-lifecycle');
      expect(fetched.invoiceNumber).toBe('INV-LIFECYCLE-001');

      // UPDATE to SENT
      const sentInvoice: Invoice = {
        ...createdInvoice,
        status: 'SENT',
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: sentInvoice });
      const sent = await invoiceService.updateInvoice('invoice-lifecycle', { status: 'SENT' });
      expect(sent.status).toBe('SENT');

      // UPDATE to PAID
      const paidInvoice: Invoice = {
        ...sentInvoice,
        status: 'PAID',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: paidInvoice });
      const paid = await invoiceService.updateInvoice('invoice-lifecycle', { status: 'PAID' });
      expect(paid.status).toBe('PAID');
    });

    it('should handle invoice cancellation', async () => {
      // Create invoice
      const newInvoice: Partial<Invoice> = {
        invoiceNumber: 'INV-CANCEL-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 500.00,
        vatAmount: 40.50,
        totalAmount: 540.50,
      };

      const createdInvoice: Invoice = {
        id: 'invoice-cancel',
        ...newInvoice as Invoice,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdInvoice });
      await invoiceService.createInvoice(newInvoice);

      // Cancel invoice
      const cancelledInvoice: Invoice = {
        ...createdInvoice,
        status: 'CANCELLED',
        isActive: false,
        updatedAt: '2026-01-02T10:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: cancelledInvoice });
      const cancelled = await invoiceService.updateInvoice('invoice-cancel', {
        status: 'CANCELLED',
        isActive: false,
      });

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.isActive).toBe(false);
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle invoice with zero amount', async () => {
      const invoiceData: Partial<Invoice> = {
        invoiceNumber: 'INV-ZERO-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 0.00,
        vatAmount: 0.00,
        totalAmount: 0.00,
      };

      const mockInvoice: Invoice = {
        id: 'invoice-zero',
        ...invoiceData as Invoice,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.createInvoice(invoiceData);

      expect(result.totalAmount).toBe(0.00);
    });

    it('should handle invoice with very large amount', async () => {
      const invoiceData: Partial<Invoice> = {
        invoiceNumber: 'INV-LARGE-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 999999.99,
        vatAmount: 80999.99,
        totalAmount: 1080999.98,
      };

      const mockInvoice: Invoice = {
        id: 'invoice-large',
        ...invoiceData as Invoice,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.createInvoice(invoiceData);

      expect(result.totalAmount).toBe(1080999.98);
    });

    it('should handle invoice with very long notes', async () => {
      const longNotes = 'Payment terms and conditions: '.repeat(100);
      const invoiceData: Partial<Invoice> = {
        invoiceNumber: 'INV-NOTES-001',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
        notes: longNotes,
      };

      const mockInvoice: Invoice = {
        id: 'invoice-notes',
        ...invoiceData as Invoice,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.createInvoice(invoiceData);

      expect(result.notes?.length).toBeGreaterThan(1000);
    });

    it('should handle invoice with past due date', async () => {
      const invoiceData: Partial<Invoice> = {
        invoiceNumber: 'INV-OVERDUE-001',
        invoiceDate: '2025-12-01',
        dueDate: '2025-12-31',
        customerId: 'customer-123',
        status: 'OVERDUE',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
      };

      const mockInvoice: Invoice = {
        id: 'invoice-overdue',
        ...invoiceData as Invoice,
        isActive: true,
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.createInvoice(invoiceData);

      expect(result.status).toBe('OVERDUE');
    });

    it('should handle invoice number with special characters', async () => {
      const invoiceData: Partial<Invoice> = {
        invoiceNumber: 'INV/2026-001/REV-A',
        invoiceDate: '2026-01-01',
        dueDate: '2026-01-31',
        customerId: 'customer-123',
        status: 'DRAFT',
        subtotal: 1000.00,
        vatAmount: 81.00,
        totalAmount: 1081.00,
      };

      const mockInvoice: Invoice = {
        id: 'invoice-special',
        ...invoiceData as Invoice,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockInvoice });

      const result = await invoiceService.createInvoice(invoiceData);

      expect(result.invoiceNumber).toBe('INV/2026-001/REV-A');
    });
  });
});
