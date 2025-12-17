import request from 'supertest';
import express from 'express';
import timeRoutes from '../routes/time.routes';
import { PrismaClient } from '@prisma/client';
import { generateTestToken, mockAuthMiddleware } from './helpers';

const app = express();
app.use(express.json());
app.use('/api/time', mockAuthMiddleware, timeRoutes);

const prisma = new PrismaClient();

describe('Time Entry Controller', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'USER',
  };

  const token = generateTestToken('user-1', 'USER');

  describe('POST /api/time/clock-in', () => {
    it('should clock in user successfully', async () => {
      const mockTimeEntry = {
        id: 'entry-1',
        userId: 'user-1',
        projectId: 'project-1',
        locationId: 'location-1',
        clockIn: new Date(),
        clockOut: null,
        status: 'CLOCKED_IN',
        description: 'Working on feature',
        project: { id: 'project-1', name: 'Project A' },
        location: { id: 'location-1', name: 'Office' },
      };

      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.timeEntry.create as jest.Mock).mockResolvedValue(mockTimeEntry);

      const token = generateTestToken('user-1');
      const response = await request(app)
        .post('/api/time/clock-in')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: 'project-1',
          locationId: 'location-1',
          description: 'Working on feature',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('CLOCKED_IN');
      expect(response.body.project.name).toBe('Project A');
    });

    it('should return 400 if already clocked in', async () => {
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        status: 'CLOCKED_IN',
      });

      const token = generateTestToken('user-1');
      const response = await request(app)
        .post('/api/time/clock-in')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Already clocked in');
    });
  });

  describe('POST /api/time/clock-out', () => {
    it('should clock out user successfully', async () => {
      const mockTimeEntry = {
        id: 'entry-1',
        userId: 'user-1',
        status: 'CLOCKED_IN',
      };

      const updatedEntry = {
        ...mockTimeEntry,
        clockOut: new Date(),
        status: 'CLOCKED_OUT',
      };

      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(mockTimeEntry);
      (prisma.timeEntry.update as jest.Mock).mockResolvedValue(updatedEntry);

      const token = generateTestToken('user-1');
      const response = await request(app)
        .post('/api/time/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CLOCKED_OUT');
    });

    it('should return 400 if not clocked in', async () => {
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null);

      const token = generateTestToken('user-1');
      const response = await request(app)
        .post('/api/time/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Not clocked in');
    });
  });

  describe('GET /api/time/my-entries', () => {
    it('should return user time entries', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          userId: 'user-1',
          clockIn: new Date(),
          clockOut: new Date(),
          status: 'CLOCKED_OUT',
          project: { name: 'Project A' },
          location: { name: 'Office' },
        },
        {
          id: 'entry-2',
          userId: 'user-1',
          clockIn: new Date(),
          clockOut: new Date(),
          status: 'CLOCKED_OUT',
          project: { name: 'Project B' },
          location: { name: 'Remote' },
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const token = generateTestToken('user-1');
      const response = await request(app)
        .get('/api/time/my-entries')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].project.name).toBe('Project A');
    });
  });

  describe('PUT /api/time/my-entries/:id', () => {
    it('should update own time entry', async () => {
      const mockEntry = {
        id: 'entry-1',
        userId: 'user-1',
        status: 'CLOCKED_OUT',
        clockIn: new Date(),
        clockOut: new Date(),
      };

      const updatedEntry = {
        ...mockEntry,
        description: 'Updated description',
      };

      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.timeEntry.update as jest.Mock).mockResolvedValue(updatedEntry);

      const token = generateTestToken('user-1');
      const response = await request(app)
        .put('/api/time/my-entries/entry-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Updated description');
    });

    it('should return 404 if entry not found or not owned', async () => {
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(null);

      const token = generateTestToken('user-1');
      const response = await request(app)
        .put('/api/time/my-entries/entry-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 if trying to edit active entry', async () => {
      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
        status: 'CLOCKED_IN',
      });

      const token = generateTestToken('user-1');
      const response = await request(app)
        .put('/api/time/my-entries/entry-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot edit active time entry');
    });
  });

  describe('DELETE /api/time/my-entries/:id', () => {
    it('should delete own time entry', async () => {
      const mockEntry = {
        id: 'entry-1',
        userId: 'user-1',
        status: 'CLOCKED_OUT',
      };

      (prisma.timeEntry.findFirst as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.timeEntry.delete as jest.Mock).mockResolvedValue(mockEntry);

      const token = generateTestToken('user-1');
      const response = await request(app)
        .delete('/api/time/my-entries/entry-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Time entry deleted successfully');
    });
  });
});
