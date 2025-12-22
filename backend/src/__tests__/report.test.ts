import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  getUserReport, 
  getProjectReport, 
  getDetailedReport 
} from '../controllers/report.controller';
import { generateTestToken, mockAuthMiddleware } from './helpers';

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);

app.get('/api/reports/user/:userId', getUserReport);
app.get('/api/reports/project/:projectId', getProjectReport);
app.get('/api/reports/detailed', getDetailedReport);

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    timeEntry: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Report Controller', () => {
  const token = generateTestToken('user-1', 'user@example.com', 'USER');
  const adminToken = generateTestToken('admin-1', 'admin@example.com', 'ADMIN');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/user/:userId', () => {
    it('should get user report', async () => {
      const mockTimeEntries = [
        {
          id: '1',
          userId: 'user-1',
          projectId: 'project-1',
          startTime: new Date('2024-01-01T08:00:00'),
          endTime: new Date('2024-01-01T17:00:00'),
          pauseMinutes: 60,
          description: 'Work',
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockTimeEntries);

      const response = await request(app)
        .get('/api/reports/user/user-1?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalHours');
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/user/999?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/reports/project/:projectId', () => {
    it('should get project report', async () => {
      const mockTimeEntries = [
        {
          id: '1',
          userId: 'user-1',
          projectId: 'project-1',
          startTime: new Date('2024-01-01T08:00:00'),
          endTime: new Date('2024-01-01T17:00:00'),
          pauseMinutes: 60,
          user: { firstName: 'John', lastName: 'Doe' },
        },
      ];

      (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockTimeEntries);

      const response = await request(app)
        .get('/api/reports/project/project-1?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalHours');
    });
  });

  describe('GET /api/reports/detailed', () => {
    it('should get detailed report with aggregations', async () => {
      const mockTimeEntries = [
        {
          id: '1',
          userId: 'user-1',
          projectId: 'project-1',
          startTime: new Date('2024-01-01T08:00:00'),
          endTime: new Date('2024-01-01T17:00:00'),
          pauseMinutes: 60,
          user: { firstName: 'John', lastName: 'Doe' },
          project: { name: 'Project A' },
        },
      ];

      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockTimeEntries);

      const response = await request(app)
        .get('/api/reports/detailed?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 if date range is missing', async () => {
      const response = await request(app)
        .get('/api/reports/detailed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });
});
