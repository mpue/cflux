import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller';
import { generateTestToken, mockAuthMiddleware } from './helpers';

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);

app.post('/api/customers', createCustomer);
app.get('/api/customers', getAllCustomers);
app.get('/api/customers/:id', getCustomerById);
app.put('/api/customers/:id', updateCustomer);
app.delete('/api/customers/:id', deleteCustomer);

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Customer Controller', () => {
  const adminToken = generateTestToken('admin-1', 'admin@example.com', 'ADMIN');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const mockCustomer = {
        id: '1',
        name: 'Test Company',
        email: 'contact@testcompany.com',
        phone: '+41 44 123 45 67',
        address: 'Test Street 1',
        city: 'Zurich',
        postalCode: '8000',
        country: 'Switzerland',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customer.create as jest.Mock).mockResolvedValue(mockCustomer);

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Company',
          email: 'contact@testcompany.com',
          phone: '+41 44 123 45 67',
          address: 'Test Street 1',
          city: 'Zurich',
          postalCode: '8000',
          country: 'Switzerland',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Company');
    });
  });

  describe('GET /api/customers', () => {
    it('should get all customers', async () => {
      const mockCustomers = [
        {
          id: '1',
          name: 'Customer 1',
          email: 'customer1@example.com',
        },
        {
          id: '2',
          name: 'Customer 2',
          email: 'customer2@example.com',
        },
      ];

      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should get customer by id', async () => {
      const mockCustomer = {
        id: '1',
        name: 'Test Company',
        email: 'contact@testcompany.com',
      };

      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

      const response = await request(app)
        .get('/api/customers/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Company');
    });

    it('should return 404 if customer not found', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/customers/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update customer', async () => {
      const mockCustomer = {
        id: '1',
        name: 'Updated Company',
        email: 'updated@company.com',
      };

      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.customer.update as jest.Mock).mockResolvedValue(mockCustomer);

      const response = await request(app)
        .put('/api/customers/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Company' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Company');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.customer.delete as jest.Mock).mockResolvedValue({ id: '1' });

      const response = await request(app)
        .delete('/api/customers/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });
  });
});
