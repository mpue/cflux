import request from 'supertest';
import express from 'express';
import projectRoutes from '../routes/project.routes';
import locationRoutes from '../routes/location.routes';
import { PrismaClient } from '@prisma/client';
import { generateTestToken, mockAuthMiddleware, mockRequireAdmin } from './helpers';

const app = express();
app.use(express.json());
app.use('/api/projects', mockAuthMiddleware, projectRoutes);
app.use('/api/locations', mockAuthMiddleware, locationRoutes);

const prisma = new PrismaClient();

describe('Project Controller', () => {
  describe('GET /api/projects', () => {
    it('should return all projects for authenticated user', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project A',
          description: 'Description A',
          isActive: true,
        },
        {
          id: 'project-2',
          name: 'Project B',
          description: 'Description B',
          isActive: true,
        },
      ];

      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const token = generateTestToken('user-1', 'USER');
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Project A');
    });
  });

  describe('POST /api/projects', () => {
    it('should create new project (admin only)', async () => {
      const newProject = {
        name: 'New Project',
        description: 'New Description',
        isActive: true,
      };

      const createdProject = {
        id: 'project-3',
        ...newProject,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(createdProject);

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(newProject);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Project');
    });

    it('should return 400 if name is missing', async () => {
      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No name' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project (admin only)', async () => {
      const updatedProject = {
        id: 'project-1',
        name: 'Updated Project',
        description: 'Updated Description',
        isActive: false,
      };

      (prisma.project.update as jest.Mock).mockResolvedValue(updatedProject);

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .put('/api/projects/project-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Project',
          description: 'Updated Description',
          isActive: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Project');
      expect(response.body.isActive).toBe(false);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project (admin only)', async () => {
      (prisma.project.delete as jest.Mock).mockResolvedValue({ id: 'project-1' });

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .delete('/api/projects/project-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Project deleted successfully');
    });
  });
});

describe('Location Controller', () => {
  describe('GET /api/locations/active', () => {
    it('should return active locations for all users', async () => {
      const mockLocations = [
        {
          id: 'location-1',
          name: 'Office',
          address: '123 Main St',
          isActive: true,
        },
        {
          id: 'location-2',
          name: 'Remote',
          address: null,
          isActive: true,
        },
      ];

      (prisma.location.findMany as jest.Mock).mockResolvedValue(mockLocations);

      const token = generateTestToken('user-1', 'USER');
      const response = await request(app)
        .get('/api/locations/active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Office');
    });
  });

  describe('POST /api/locations', () => {
    it('should create new location (admin only)', async () => {
      const newLocation = {
        name: 'New Office',
        address: '456 Oak St',
        description: 'Second office',
        isActive: true,
      };

      const createdLocation = {
        id: 'location-3',
        ...newLocation,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.location.create as jest.Mock).mockResolvedValue(createdLocation);

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${token}`)
        .send(newLocation);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Office');
      expect(response.body.address).toBe('456 Oak St');
    });

    it('should return 400 if name is missing', async () => {
      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${token}`)
        .send({ address: '123 St' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Location name is required');
    });
  });

  describe('DELETE /api/locations/:id', () => {
    it('should delete location if not used in time entries', async () => {
      (prisma.timeEntry.count as jest.Mock).mockResolvedValue(0);
      (prisma.location.delete as jest.Mock).mockResolvedValue({ id: 'location-1' });

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .delete('/api/locations/location-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Location deleted successfully');
    });

    it('should return 400 if location has associated time entries', async () => {
      (prisma.timeEntry.count as jest.Mock).mockResolvedValue(5);

      const token = generateTestToken('admin-1', 'ADMIN');
      const response = await request(app)
        .delete('/api/locations/location-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete location');
      expect(response.body.timeEntryCount).toBe(5);
    });
  });
});
