import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoice.controller';
import { generateTestToken, mockAuthMiddleware } from './helpers';

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);

app.post('/api/invoices', createInvoice);
app.get('/api/invoices', getAllInvoices);
app.get('/api/invoices/:id', getInvoiceById);
app.put('/api/invoices/:id', updateInvoice);
app.delete('/api/invoices/:id', deleteInvoice);

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    invoice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Invoice Controller', () => {
  const adminToken = generateTestToken('admin-1', 'admin@example.com', 'ADMIN');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/invoices', () => {
    it('should create a new invoice', async () => {
      const mockInvoice = {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        customerId: 'customer-1',
        date: new Date('2024-01-01'),
        dueDate: new Date('2024-01-31'),
        status: 'DRAFT',
        subtotal: 1000.0,
        vatRate: 8.1,
        vatAmount: 81.0,
        total: 1081.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 'customer-1' });
      (prisma.invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceNumber: 'INV-2024-001',
          customerId: 'customer-1',
          date: '2024-01-01',
          dueDate: '2024-01-31',
          items: [],
          vatRate: 8.1,
        });

      expect(response.status).toBe(201);
      expect(response.body.invoiceNumber).toBe('INV-2024-001');
    });

    it('should return 400 if customer not found', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceNumber: 'INV-2024-001',
          customerId: 'invalid-customer',
          date: '2024-01-01',
          dueDate: '2024-01-31',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/invoices', () => {
    it('should get all invoices', async () => {
      const mockInvoices = [
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          total: 1081.0,
          status: 'DRAFT',
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          total: 2000.0,
          status: 'SENT',
        },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should get invoice by id', async () => {
      const mockInvoice = {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        total: 1081.0,
        customer: { name: 'Test Company' },
        items: [],
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const response = await request(app)
        .get('/api/invoices/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.invoiceNumber).toBe('INV-2024-001');
    });

    it('should return 404 if invoice not found', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/invoices/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/invoices/:id', () => {
    it('should update invoice status', async () => {
      const mockInvoice = {
        id: '1',
        status: 'SENT',
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.invoice.update as jest.Mock).mockResolvedValue(mockInvoice);

      const response = await request(app)
        .put('/api/invoices/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SENT' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('SENT');
    });
  });

  describe('DELETE /api/invoices/:id', () => {
    it('should delete invoice', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.invoice.delete as jest.Mock).mockResolvedValue({ id: '1' });

      const response = await request(app)
        .delete('/api/invoices/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });
  });
});
