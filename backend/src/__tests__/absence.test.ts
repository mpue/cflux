import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  createAbsence, 
  getAllAbsences, 
  getUserAbsences, 
  updateAbsence, 
  deleteAbsence 
} from '../controllers/absence.controller';
import { generateTestToken, mockAuthMiddleware } from './helpers';

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);

app.post('/api/absences', createAbsence);
app.get('/api/absences', getAllAbsences);
app.get('/api/absences/user/:userId', getUserAbsences);
app.put('/api/absences/:id', updateAbsence);
app.delete('/api/absences/:id', deleteAbsence);

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    absence: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Absence Controller', () => {
  const token = generateTestToken('user-1', 'user@example.com', 'USER');
  const adminToken = generateTestToken('admin-1', 'admin@example.com', 'ADMIN');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/absences', () => {
    it('should create a new absence', async () => {
      const mockAbsence = {
        id: '1',
        userId: 'user-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        type: 'VACATION',
        status: 'APPROVED',
        notes: 'Family vacation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.absence.create as jest.Mock).mockResolvedValue(mockAbsence);

      const response = await request(app)
        .post('/api/absences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: 'user-1',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          type: 'VACATION',
          notes: 'Family vacation',
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('VACATION');
    });

    it('should return 400 for invalid date range', async () => {
      const response = await request(app)
        .post('/api/absences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: 'user-1',
          startDate: '2024-01-05',
          endDate: '2024-01-01',
          type: 'VACATION',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/absences', () => {
    it('should get all absences for admin', async () => {
      const mockAbsences = [
        {
          id: '1',
          userId: 'user-1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          type: 'VACATION',
          status: 'APPROVED',
          user: { firstName: 'John', lastName: 'Doe' },
        },
      ];

      (prisma.absence.findMany as jest.Mock).mockResolvedValue(mockAbsences);

      const response = await request(app)
        .get('/api/absences')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/absences/user/:userId', () => {
    it('should get absences for specific user', async () => {
      const mockAbsences = [
        {
          id: '1',
          userId: 'user-1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          type: 'VACATION',
          status: 'APPROVED',
        },
      ];

      (prisma.absence.findMany as jest.Mock).mockResolvedValue(mockAbsences);

      const response = await request(app)
        .get('/api/absences/user/user-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/absences/:id', () => {
    it('should update an absence', async () => {
      const mockAbsence = {
        id: '1',
        userId: 'user-1',
        status: 'APPROVED',
      };

      (prisma.absence.findUnique as jest.Mock).mockResolvedValue(mockAbsence);
      (prisma.absence.update as jest.Mock).mockResolvedValue({
        ...mockAbsence,
        status: 'REJECTED',
      });

      const response = await request(app)
        .put('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'REJECTED' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/absences/:id', () => {
    it('should delete an absence', async () => {
      const mockAbsence = {
        id: '1',
        userId: 'user-1',
      };

      (prisma.absence.findUnique as jest.Mock).mockResolvedValue(mockAbsence);
      (prisma.absence.delete as jest.Mock).mockResolvedValue(mockAbsence);

      const response = await request(app)
        .delete('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 if absence not found', async () => {
      (prisma.absence.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/absences/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
