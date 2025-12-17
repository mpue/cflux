import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/user.routes';
import absenceRoutes from '../routes/absence.routes';
import { PrismaClient } from '@prisma/client';
import { generateTestToken, mockAuthMiddleware } from './helpers';

const app = express();
app.use(express.json());
app.use('/api/users', mockAuthMiddleware, userRoutes);
app.use('/api/absences', mockAuthMiddleware, absenceRoutes);

const prisma = new PrismaClient();


describe('User Controller', () => {
  describe('GET /api/users (Admin)', () => {
    it('should return all users for admin', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'USER',
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('PUT /api/users/:id (Admin)', () => {
    it('should update user', async () => {
      const updatedUser = {
        id: 'user-1',
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        role: 'ADMIN',
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .put('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('Updated');
    });
  });

  describe('DELETE /api/users/:id (Admin)', () => {
    it('should delete user', async () => {
      (prisma.user.delete as jest.Mock).mockResolvedValue({ id: 'user-1' });

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .delete('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
    });
  });
});

describe('Absence Controller', () => {
  describe('POST /api/absences', () => {
    it('should create absence request', async () => {
      const newAbsence = {
        type: 'VACATION',
        startDate: new Date('2025-12-20'),
        endDate: new Date('2025-12-25'),
        days: 5,
        reason: 'Holiday',
      };

      const createdAbsence = {
        id: 'absence-1',
        userId: 'user-1',
        ...newAbsence,
        status: 'PENDING',
        createdAt: new Date(),
      };

      (prisma.absenceRequest.create as jest.Mock).mockResolvedValue(createdAbsence);

      const token = generateTestToken('user-1', 'USER');
      const response = await request(app)
        .post('/api/absences')
        .set('Authorization', `Bearer ${token}`)
        .send(newAbsence);

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('VACATION');
      expect(response.body.status).toBe('PENDING');
    });
  });

  describe('GET /api/absences/my-requests', () => {
    it('should return user absence requests', async () => {
      const mockAbsences = [
        {
          id: 'absence-1',
          userId: 'user-1',
          type: 'VACATION',
          status: 'APPROVED',
          days: 5,
        },
        {
          id: 'absence-2',
          userId: 'user-1',
          type: 'SICK_LEAVE',
          status: 'PENDING',
          days: 2,
        },
      ];

      (prisma.absenceRequest.findMany as jest.Mock).mockResolvedValue(mockAbsences);

      const token = generateTestToken('user-1', 'USER');
      const response = await request(app)
        .get('/api/absences/my-requests')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('PUT /api/absences/:id/review (Admin)', () => {
    it('should approve absence request', async () => {
      const mockAbsence = {
        id: 'absence-1',
        userId: 'user-1',
        type: 'VACATION',
        days: 5,
        status: 'PENDING',
      };

      const mockUser = {
        id: 'user-1',
        vacationDays: 30,
      };

      const approvedAbsence = {
        ...mockAbsence,
        status: 'APPROVED',
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
      };

      (prisma.absenceRequest.findUnique as jest.Mock).mockResolvedValue(mockAbsence);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.absenceRequest.update as jest.Mock).mockResolvedValue(approvedAbsence);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        vacationDays: 25,
      });

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .put('/api/absences/absence-1/review')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'APPROVED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('APPROVED');
    });

    it('should reject absence request', async () => {
      const mockAbsence = {
        id: 'absence-1',
        userId: 'user-1',
        status: 'PENDING',
      };

      const rejectedAbsence = {
        ...mockAbsence,
        status: 'REJECTED',
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
      };

      (prisma.absenceRequest.findUnique as jest.Mock).mockResolvedValue(mockAbsence);
      (prisma.absenceRequest.update as jest.Mock).mockResolvedValue(rejectedAbsence);

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .put('/api/absences/absence-1/review')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'REJECTED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('REJECTED');
    });

    it('should return 400 for invalid status', async () => {
      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .put('/api/absences/absence-1/review')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/absences/:id', () => {
    it('should delete own absence request if pending', async () => {
      const mockAbsence = {
        id: 'absence-1',
        userId: 'user-1',
        status: 'PENDING',
      };

      (prisma.absenceRequest.findUnique as jest.Mock).mockResolvedValue(mockAbsence);
      (prisma.absenceRequest.delete as jest.Mock).mockResolvedValue(mockAbsence);

      const token = generateTestToken('user-1', 'USER');
      const response = await request(app)
        .delete('/api/absences/absence-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should return 400 if trying to delete non-pending request', async () => {
      const mockAbsence = {
        id: 'absence-1',
        userId: 'user-1',
        status: 'APPROVED',
      };

      (prisma.absenceRequest.findUnique as jest.Mock).mockResolvedValue(mockAbsence);

      const token = generateTestToken('user-1', 'USER');
      const response = await request(app)
        .delete('/api/absences/absence-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });
});
