import { prisma } from '../lib/prisma';
import { incidentService } from '../services/incident.service';
import { IncidentPriority, IncidentStatus } from '@prisma/client';

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    incident: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    incidentComment: {
      create: jest.fn(),
    },
  },
}));

// Mock action service
jest.mock('../services/action.service', () => ({
  actionService: {
    triggerAction: jest.fn().mockResolvedValue({}),
  },
}));

describe('Incident Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncident', () => {
    it('should create incident with minimal data', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'Test Incident',
        description: 'Test Description',
        priority: 'MEDIUM' as IncidentPriority,
        status: 'OPEN' as IncidentStatus,
        reportedById: 'user-1',
        reportedAt: new Date(),
        reportedBy: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        assignedTo: null,
        project: null,
      };

      (prisma.incident.create as jest.Mock).mockResolvedValue(mockIncident);

      const result = await incidentService.createIncident({
        title: 'Test Incident',
        description: 'Test Description',
        reportedById: 'user-1',
      });

      expect(prisma.incident.create).toHaveBeenCalled();
      expect(result.title).toBe('Test Incident');
      expect(result.priority).toBe('MEDIUM');
    });

    it('should create incident with custom priority', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'High Priority Incident',
        description: 'Critical issue',
        priority: 'HIGH' as IncidentPriority,
        status: 'OPEN' as IncidentStatus,
        reportedById: 'user-1',
        reportedAt: new Date(),
      };

      (prisma.incident.create as jest.Mock).mockResolvedValue(mockIncident);

      const result = await incidentService.createIncident({
        title: 'High Priority Incident',
        description: 'Critical issue',
        priority: 'HIGH' as IncidentPriority,
        reportedById: 'user-1',
      });

      expect(result.priority).toBe('HIGH');
    });

    it('should create EHS-relevant incident with specific fields', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'EHS Incident',
        description: 'Safety incident',
        priority: 'HIGH' as IncidentPriority,
        status: 'OPEN' as IncidentStatus,
        reportedById: 'user-1',
        isEHSRelevant: true,
        ehsCategory: 'ACCIDENT',
        ehsSeverity: 'SERIOUS',
        incidentDate: new Date('2024-01-15'),
        location: 'Workshop',
      };

      (prisma.incident.create as jest.Mock).mockResolvedValue(mockIncident);

      const result = await incidentService.createIncident({
        title: 'EHS Incident',
        description: 'Safety incident',
        reportedById: 'user-1',
        isEHSRelevant: true,
        ehsCategory: 'ACCIDENT',
        ehsSeverity: 'SERIOUS',
        incidentDate: new Date('2024-01-15'),
        location: 'Workshop',
      });

      expect(result.isEHSRelevant).toBe(true);
      expect(result.ehsCategory).toBe('ACCIDENT');
      expect(result.location).toBe('Workshop');
    });

    it('should create incident with assignment', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'Assigned Incident',
        description: 'Test',
        priority: 'MEDIUM' as IncidentPriority,
        reportedById: 'user-1',
        assignedToId: 'user-2',
        assignedTo: {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
      };

      (prisma.incident.create as jest.Mock).mockResolvedValue(mockIncident);

      const result = await incidentService.createIncident({
        title: 'Assigned Incident',
        description: 'Test',
        reportedById: 'user-1',
        assignedToId: 'user-2',
      });

      expect(result.assignedToId).toBe('user-2');
    });

    it('should create incident with project reference', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'Project Incident',
        description: 'Test',
        reportedById: 'user-1',
        projectId: 'project-1',
        project: {
          id: 'project-1',
          name: 'Test Project',
        },
      };

      (prisma.incident.create as jest.Mock).mockResolvedValue(mockIncident);

      const result = await incidentService.createIncident({
        title: 'Project Incident',
        description: 'Test',
        reportedById: 'user-1',
        projectId: 'project-1',
      });

      expect(result.projectId).toBe('project-1');
    });

    it('should handle tags correctly', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'Tagged Incident',
        description: 'Test',
        reportedById: 'user-1',
        tags: JSON.stringify(['urgent', 'security']),
      };

      (prisma.incident.create as jest.Mock).mockResolvedValue(mockIncident);

      const result = await incidentService.createIncident({
        title: 'Tagged Incident',
        description: 'Test',
        reportedById: 'user-1',
        tags: ['urgent', 'security'],
      });

      expect(result.tags).toBe(JSON.stringify(['urgent', 'security']));
    });
  });

  describe('getAllIncidents', () => {
    it('should return all incidents without filters', async () => {
      const mockIncidents = [
        {
          id: 'incident-1',
          title: 'Incident 1',
          status: 'OPEN' as IncidentStatus,
          priority: 'MEDIUM' as IncidentPriority,
        },
        {
          id: 'incident-2',
          title: 'Incident 2',
          status: 'IN_PROGRESS' as IncidentStatus,
          priority: 'HIGH' as IncidentPriority,
        },
      ];

      (prisma.incident.findMany as jest.Mock).mockResolvedValue(mockIncidents);

      const result = await incidentService.getAllIncidents();

      expect(result).toHaveLength(2);
      expect(prisma.incident.findMany).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const mockIncidents = [
        {
          id: 'incident-1',
          title: 'Open Incident',
          status: 'OPEN' as IncidentStatus,
        },
      ];

      (prisma.incident.findMany as jest.Mock).mockResolvedValue(mockIncidents);

      const result = await incidentService.getAllIncidents('OPEN' as IncidentStatus);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('OPEN');
    });

    it('should filter by priority', async () => {
      const mockIncidents = [
        {
          id: 'incident-1',
          title: 'High Priority',
          priority: 'HIGH' as IncidentPriority,
        },
      ];

      (prisma.incident.findMany as jest.Mock).mockResolvedValue(mockIncidents);

      const result = await incidentService.getAllIncidents(
        undefined,
        'HIGH' as IncidentPriority
      );

      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('HIGH');
    });

    it('should filter by assignedToId', async () => {
      const mockIncidents = [
        {
          id: 'incident-1',
          assignedToId: 'user-1',
        },
      ];

      (prisma.incident.findMany as jest.Mock).mockResolvedValue(mockIncidents);

      const result = await incidentService.getAllIncidents(
        undefined,
        undefined,
        'user-1'
      );

      expect(result).toHaveLength(1);
    });

    it('should filter by year', async () => {
      const mockIncidents = [
        {
          id: 'incident-1',
          incidentDate: new Date('2024-06-15'),
        },
      ];

      (prisma.incident.findMany as jest.Mock).mockResolvedValue(mockIncidents);

      const result = await incidentService.getAllIncidents(
        undefined,
        undefined,
        undefined,
        2024
      );

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no incidents match filters', async () => {
      (prisma.incident.findMany as jest.Mock).mockResolvedValue([]);

      const result = await incidentService.getAllIncidents('CLOSED' as IncidentStatus);

      expect(result).toHaveLength(0);
    });
  });

  describe('getIncidentById', () => {
    it('should return incident by id', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'Test Incident',
        status: 'OPEN' as IncidentStatus,
      };

      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(mockIncident);

      const result = await incidentService.getIncidentById('incident-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('incident-1');
      expect(prisma.incident.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'incident-1' },
        })
      );
    });

    it('should return null when incident not found', async () => {
      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await incidentService.getIncidentById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateIncident', () => {
    it('should update incident title and description', async () => {
      const mockUpdatedIncident = {
        id: 'incident-1',
        title: 'Updated Title',
        description: 'Updated Description',
      };

      (prisma.incident.update as jest.Mock).mockResolvedValue(mockUpdatedIncident);

      const result = await incidentService.updateIncident('incident-1', {
        title: 'Updated Title',
        description: 'Updated Description',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated Description');
    });

    it('should update incident status', async () => {
      const mockUpdatedIncident = {
        id: 'incident-1',
        status: 'RESOLVED' as IncidentStatus,
      };

      (prisma.incident.update as jest.Mock).mockResolvedValue(mockUpdatedIncident);

      const result = await incidentService.updateIncident('incident-1', {
        status: 'RESOLVED' as IncidentStatus,
      });

      expect(result.status).toBe('RESOLVED');
    });

    it('should update incident priority', async () => {
      const mockUpdatedIncident = {
        id: 'incident-1',
        priority: 'CRITICAL' as IncidentPriority,
      };

      (prisma.incident.update as jest.Mock).mockResolvedValue(mockUpdatedIncident);

      const result = await incidentService.updateIncident('incident-1', {
        priority: 'CRITICAL' as IncidentPriority,
      });

      expect(result.priority).toBe('CRITICAL');
    });
  });

  describe('deleteIncident', () => {
    it('should delete incident by id', async () => {
      const mockDeletedIncident = {
        id: 'incident-1',
        title: 'Deleted Incident',
      };

      (prisma.incident.delete as jest.Mock).mockResolvedValue(mockDeletedIncident);

      await incidentService.deleteIncident('incident-1');

      expect(prisma.incident.delete).toHaveBeenCalledWith({
        where: { id: 'incident-1' },
      });
    });
  });

  describe('addComment', () => {
    it('should add comment to incident', async () => {
      const mockComment = {
        id: 'comment-1',
        incidentId: 'incident-1',
        userId: 'user-1',
        comment: 'Test comment',
        createdAt: new Date(),
      };

      (prisma.incidentComment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await incidentService.addComment('incident-1', {
        comment: 'Test comment',
        userId: 'user-1',
      });

      expect(result).toBeDefined();
      expect(result.comment).toBe('Test comment');
      expect(prisma.incidentComment.create).toHaveBeenCalled();
    });
  });
});
