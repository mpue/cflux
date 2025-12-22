import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createBackup, restoreBackup } from '../controllers/backup.controller';
import { generateTestToken, mockAuthMiddleware } from './helpers';

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);

app.post('/api/backup/create', createBackup);
app.post('/api/backup/restore', restoreBackup);

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    timeEntry: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    absence: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    location: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Backup Controller', () => {
  const adminToken = generateTestToken('admin-1', 'admin@example.com', 'ADMIN');
  const userToken = generateTestToken('user-1', 'user@example.com', 'USER');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/backup/create', () => {
    it('should create a backup for admin', async () => {
      const mockData = {
        users: [{ id: '1', email: 'test@example.com' }],
        projects: [{ id: '1', name: 'Project A' }],
        timeEntries: [],
        absences: [],
        locations: [],
      };

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockData.users);
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockData.projects);
      (prisma.timeEntry.findMany as jest.Mock).mockResolvedValue(mockData.timeEntries);
      (prisma.absence.findMany as jest.Mock).mockResolvedValue(mockData.absences);
      (prisma.location.findMany as jest.Mock).mockResolvedValue(mockData.locations);

      const response = await request(app)
        .post('/api/backup/create')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('projects');
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .post('/api/backup/create')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/backup/restore', () => {
    it('should restore backup for admin', async () => {
      const backupData = {
        users: [{ id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }],
        projects: [{ id: '1', name: 'Project A' }],
        timeEntries: [],
        absences: [],
        locations: [],
      };

      (prisma.user.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.project.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.timeEntry.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.absence.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.location.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      (prisma.user.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.project.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/backup/restore')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(backupData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .post('/api/backup/restore')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(403);
    });
  });
});
