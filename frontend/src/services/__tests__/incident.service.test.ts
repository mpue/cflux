import axios from 'axios';
import { incidentService, Incident, CreateIncidentDto, UpdateIncidentDto, IncidentComment, IncidentStatistics } from '../incident.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Incident Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'test-token-123');
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.clear = jest.fn();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - create', () => {
    it('should create incident with all fields', async () => {
      const newIncidentData: CreateIncidentDto = {
        title: 'Server Ausfall',
        description: 'Der Produktionsserver ist nicht erreichbar',
        priority: 'CRITICAL',
        assignedToId: 'user-123',
        projectId: 'project-456',
        category: 'Infrastructure',
        affectedSystem: 'Production Server',
        dueDate: '2026-01-02',
        tags: ['server', 'critical', 'production'],
      };

      const mockCreatedIncident: Incident = {
        id: 'incident-123',
        title: 'Server Ausfall',
        description: 'Der Produktionsserver ist nicht erreichbar',
        priority: 'CRITICAL',
        status: 'OPEN',
        reportedById: 'current-user-123',
        assignedToId: 'user-123',
        projectId: 'project-456',
        category: 'Infrastructure',
        affectedSystem: 'Production Server',
        dueDate: '2026-01-02',
        tags: 'server,critical,production',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockCreatedIncident });

      const result = await incidentService.create(newIncidentData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/incidents'),
        newIncidentData,
        expect.any(Object)
      );
      expect(result).toEqual(mockCreatedIncident);
      expect(result.id).toBe('incident-123');
      expect(result.priority).toBe('CRITICAL');
    });

    it('should create incident with minimal required fields', async () => {
      const minimalData: CreateIncidentDto = {
        title: 'Drucker funktioniert nicht',
        description: 'Der Drucker im 2. Stock druckt nicht',
      };

      const mockIncident: Incident = {
        id: 'incident-456',
        title: 'Drucker funktioniert nicht',
        description: 'Der Drucker im 2. Stock druckt nicht',
        priority: 'LOW',
        status: 'OPEN',
        reportedById: 'current-user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.create(minimalData);

      expect(result.title).toBe('Drucker funktioniert nicht');
      expect(result.status).toBe('OPEN');
    });

    it('should create incident with different priorities', async () => {
      const priorities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      for (const priority of priorities) {
        const incidentData: CreateIncidentDto = {
          title: `Incident ${priority}`,
          description: `Test incident with ${priority} priority`,
          priority: priority,
        };

        const mockIncident: Incident = {
          id: `incident-${priority}`,
          title: `Incident ${priority}`,
          description: `Test incident with ${priority} priority`,
          priority: priority,
          status: 'OPEN',
          reportedById: 'user-123',
          reportedAt: '2026-01-01T10:00:00Z',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        };

        mockedAxios.post.mockResolvedValue({ data: mockIncident });

        const result = await incidentService.create(incidentData);
        expect(result.priority).toBe(priority);
      }
    });

    it('should create incident with assigned user', async () => {
      const incidentData: CreateIncidentDto = {
        title: 'Network Issue',
        description: 'WiFi connection unstable',
        assignedToId: 'user-456',
      };

      const mockIncident: Incident = {
        id: 'incident-789',
        title: 'Network Issue',
        description: 'WiFi connection unstable',
        priority: 'MEDIUM',
        status: 'OPEN',
        reportedById: 'user-123',
        assignedToId: 'user-456',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        assignedTo: {
          id: 'user-456',
          firstName: 'Max',
          lastName: 'Müller',
          email: 'max.mueller@example.com',
        },
      };

      mockedAxios.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.create(incidentData);

      expect(result.assignedToId).toBe('user-456');
      expect(result.assignedTo).toBeDefined();
      expect(result.assignedTo?.firstName).toBe('Max');
    });

    it('should create incident with project relation', async () => {
      const incidentData: CreateIncidentDto = {
        title: 'Project Deployment Failed',
        description: 'Cannot deploy new version',
        projectId: 'project-789',
      };

      const mockIncident: Incident = {
        id: 'incident-project',
        title: 'Project Deployment Failed',
        description: 'Cannot deploy new version',
        priority: 'HIGH',
        status: 'OPEN',
        reportedById: 'user-123',
        projectId: 'project-789',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        project: {
          id: 'project-789',
          name: 'E-Commerce Platform',
        },
      };

      mockedAxios.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.create(incidentData);

      expect(result.projectId).toBe('project-789');
      expect(result.project).toBeDefined();
      expect(result.project?.name).toBe('E-Commerce Platform');
    });

    it('should handle creation error', async () => {
      const incidentData: CreateIncidentDto = {
        title: 'Test Incident',
        description: 'Test',
      };

      mockedAxios.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(incidentService.create(incidentData))
        .rejects.toThrow('Unauthorized');
    });

    it('should create incident with German special characters', async () => {
      const incidentData: CreateIncidentDto = {
        title: 'Ärger mit Übertragung',
        description: 'Die Datenübertragung führt zu Problemen bei Umlauten (ä, ö, ü, ß)',
        category: 'Netzwerkprobleme',
        affectedSystem: 'Zürich Server',
      };

      const mockIncident: Incident = {
        id: 'incident-umlaut',
        title: 'Ärger mit Übertragung',
        description: 'Die Datenübertragung führt zu Problemen bei Umlauten (ä, ö, ü, ß)',
        priority: 'MEDIUM',
        status: 'OPEN',
        reportedById: 'user-123',
        category: 'Netzwerkprobleme',
        affectedSystem: 'Zürich Server',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.create(incidentData);

      expect(result.title).toBe('Ärger mit Übertragung');
      expect(result.affectedSystem).toBe('Zürich Server');
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAll', () => {
    it('should get all incidents without filters', async () => {
      const mockIncidents: Incident[] = [
        {
          id: 'incident-1',
          title: 'Server Issue',
          description: 'Server is down',
          priority: 'CRITICAL',
          status: 'OPEN',
          reportedById: 'user-1',
          reportedAt: '2026-01-01T10:00:00Z',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'incident-2',
          title: 'Network Problem',
          description: 'Slow connection',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          reportedById: 'user-2',
          reportedAt: '2026-01-01T11:00:00Z',
          createdAt: '2026-01-01T11:00:00Z',
          updatedAt: '2026-01-01T11:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockIncidents });

      const result = await incidentService.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/incidents?'),
        expect.any(Object)
      );
      expect(result).toEqual(mockIncidents);
      expect(result).toHaveLength(2);
    });

    it('should get incidents by status', async () => {
      const mockIncidents: Incident[] = [
        {
          id: 'incident-open',
          title: 'Open Issue',
          description: 'Test',
          priority: 'MEDIUM',
          status: 'OPEN',
          reportedById: 'user-1',
          reportedAt: '2026-01-01T10:00:00Z',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockIncidents });

      const result = await incidentService.getAll('OPEN');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('status=OPEN'),
        expect.any(Object)
      );
      expect(result[0].status).toBe('OPEN');
    });

    it('should get incidents by priority', async () => {
      const mockIncidents: Incident[] = [
        {
          id: 'incident-critical',
          title: 'Critical Issue',
          description: 'Test',
          priority: 'CRITICAL',
          status: 'OPEN',
          reportedById: 'user-1',
          reportedAt: '2026-01-01T10:00:00Z',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockIncidents });

      const result = await incidentService.getAll(undefined, 'CRITICAL');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('priority=CRITICAL'),
        expect.any(Object)
      );
      expect(result[0].priority).toBe('CRITICAL');
    });

    it('should get incidents by assigned user', async () => {
      const mockIncidents: Incident[] = [
        {
          id: 'incident-assigned',
          title: 'Assigned Issue',
          description: 'Test',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          reportedById: 'user-1',
          assignedToId: 'user-456',
          reportedAt: '2026-01-01T10:00:00Z',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockIncidents });

      const result = await incidentService.getAll(undefined, undefined, 'user-456');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('assignedToId=user-456'),
        expect.any(Object)
      );
      expect(result[0].assignedToId).toBe('user-456');
    });

    it('should get incidents with combined filters', async () => {
      const mockIncidents: Incident[] = [
        {
          id: 'incident-filtered',
          title: 'Filtered Issue',
          description: 'Test',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          reportedById: 'user-1',
          assignedToId: 'user-456',
          reportedAt: '2026-01-01T10:00:00Z',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockIncidents });

      const result = await incidentService.getAll('IN_PROGRESS', 'HIGH', 'user-456');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('status=IN_PROGRESS'),
        expect.any(Object)
      );
      expect(result[0].status).toBe('IN_PROGRESS');
      expect(result[0].priority).toBe('HIGH');
    });

    it('should return empty array when no incidents found', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await incidentService.getAll('CLOSED');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should get incidents with full relations', async () => {
      const mockIncidents: Incident[] = [
        {
          id: 'incident-full',
          title: 'Full Incident',
          description: 'With all relations',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          reportedById: 'user-1',
          assignedToId: 'user-2',
          projectId: 'project-1',
          reportedAt: '2026-01-01T10:00:00Z',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
          reportedBy: {
            id: 'user-1',
            firstName: 'Anna',
            lastName: 'Schmidt',
            email: 'anna.schmidt@example.com',
          },
          assignedTo: {
            id: 'user-2',
            firstName: 'Thomas',
            lastName: 'Weber',
            email: 'thomas.weber@example.com',
          },
          project: {
            id: 'project-1',
            name: 'Main Project',
          },
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockIncidents });

      const result = await incidentService.getAll();

      expect(result[0].reportedBy).toBeDefined();
      expect(result[0].assignedTo).toBeDefined();
      expect(result[0].project).toBeDefined();
    });
  });

  describe('READ - getById', () => {
    it('should get incident by id', async () => {
      const mockIncident: Incident = {
        id: 'incident-123',
        title: 'Server Crash',
        description: 'Main server crashed',
        priority: 'CRITICAL',
        status: 'OPEN',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.getById('incident-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/incident-123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockIncident);
      expect(result.id).toBe('incident-123');
    });

    it('should get incident with full details', async () => {
      const mockIncident: Incident = {
        id: 'incident-full',
        title: 'Database Performance',
        description: 'Database queries are slow',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        reportedById: 'user-1',
        assignedToId: 'user-2',
        projectId: 'project-1',
        category: 'Database',
        affectedSystem: 'PostgreSQL Production',
        reportedAt: '2026-01-01T10:00:00Z',
        dueDate: '2026-01-03',
        solution: 'Optimized query indexes',
        notes: 'Check performance after changes',
        tags: 'database,performance,optimization',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
        reportedBy: {
          id: 'user-1',
          firstName: 'Lisa',
          lastName: 'Meier',
          email: 'lisa.meier@example.com',
        },
        assignedTo: {
          id: 'user-2',
          firstName: 'Peter',
          lastName: 'Keller',
          email: 'peter.keller@example.com',
        },
        project: {
          id: 'project-1',
          name: 'CRM System',
        },
      };

      mockedAxios.get.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.getById('incident-full');

      expect(result.solution).toBe('Optimized query indexes');
      expect(result.reportedBy).toBeDefined();
      expect(result.assignedTo).toBeDefined();
      expect(result.project).toBeDefined();
    });

    it('should handle not found error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Incident not found'));

      await expect(incidentService.getById('nonexistent-id'))
        .rejects.toThrow('Incident not found');
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - update', () => {
    it('should update incident status', async () => {
      const updates: UpdateIncidentDto = {
        status: 'IN_PROGRESS',
      };

      const mockUpdatedIncident: Incident = {
        id: 'incident-123',
        title: 'Server Issue',
        description: 'Server down',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedIncident });

      const result = await incidentService.update('incident-123', updates);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/incident-123'),
        updates,
        expect.any(Object)
      );
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should update incident priority', async () => {
      const updates: UpdateIncidentDto = {
        priority: 'HIGH',
      };

      const mockUpdatedIncident: Incident = {
        id: 'incident-123',
        title: 'Server Issue',
        description: 'Server down',
        priority: 'HIGH',
        status: 'OPEN',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedIncident });

      const result = await incidentService.update('incident-123', updates);

      expect(result.priority).toBe('HIGH');
    });

    it('should assign incident to user', async () => {
      const updates: UpdateIncidentDto = {
        assignedToId: 'user-456',
      };

      const mockUpdatedIncident: Incident = {
        id: 'incident-123',
        title: 'Server Issue',
        description: 'Server down',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        reportedById: 'user-123',
        assignedToId: 'user-456',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
        assignedTo: {
          id: 'user-456',
          firstName: 'Stefan',
          lastName: 'Fischer',
          email: 'stefan.fischer@example.com',
        },
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedIncident });

      const result = await incidentService.update('incident-123', updates);

      expect(result.assignedToId).toBe('user-456');
      expect(result.assignedTo).toBeDefined();
    });

    it('should resolve incident with solution', async () => {
      const updates: UpdateIncidentDto = {
        status: 'RESOLVED',
        solution: 'Restarted server and cleared cache',
      };

      const mockUpdatedIncident: Incident = {
        id: 'incident-123',
        title: 'Server Issue',
        description: 'Server down',
        priority: 'CRITICAL',
        status: 'RESOLVED',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        resolvedAt: '2026-01-01T14:00:00Z',
        solution: 'Restarted server and cleared cache',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedIncident });

      const result = await incidentService.update('incident-123', updates);

      expect(result.status).toBe('RESOLVED');
      expect(result.solution).toBe('Restarted server and cleared cache');
      expect(result.resolvedAt).toBeDefined();
    });

    it('should close incident', async () => {
      const updates: UpdateIncidentDto = {
        status: 'CLOSED',
      };

      const mockUpdatedIncident: Incident = {
        id: 'incident-123',
        title: 'Server Issue',
        description: 'Server down',
        priority: 'CRITICAL',
        status: 'CLOSED',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        resolvedAt: '2026-01-01T14:00:00Z',
        closedAt: '2026-01-01T15:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedIncident });

      const result = await incidentService.update('incident-123', updates);

      expect(result.status).toBe('CLOSED');
      expect(result.closedAt).toBeDefined();
    });

    it('should update incident title and description', async () => {
      const updates: UpdateIncidentDto = {
        title: 'Updated: Server Issue',
        description: 'Updated description with more details',
      };

      const mockUpdatedIncident: Incident = {
        id: 'incident-123',
        title: 'Updated: Server Issue',
        description: 'Updated description with more details',
        priority: 'CRITICAL',
        status: 'OPEN',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:30:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedIncident });

      const result = await incidentService.update('incident-123', updates);

      expect(result.title).toBe('Updated: Server Issue');
      expect(result.description).toBe('Updated description with more details');
    });

    it('should update incident with notes', async () => {
      const updates: UpdateIncidentDto = {
        notes: 'Customer has been notified about the issue',
      };

      const mockUpdatedIncident: Incident = {
        id: 'incident-123',
        title: 'Server Issue',
        description: 'Server down',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        reportedById: 'user-123',
        notes: 'Customer has been notified about the issue',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T16:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedIncident });

      const result = await incidentService.update('incident-123', updates);

      expect(result.notes).toBe('Customer has been notified about the issue');
    });

    it('should update all fields at once', async () => {
      const updates: UpdateIncidentDto = {
        title: 'Fully Updated Incident',
        description: 'Completely new description',
        priority: 'LOW',
        status: 'RESOLVED',
        assignedToId: 'user-999',
        solution: 'Problem fixed',
        notes: 'All resolved',
      };

      const mockUpdatedIncident: Incident = {
        id: 'incident-123',
        title: 'Fully Updated Incident',
        description: 'Completely new description',
        priority: 'LOW',
        status: 'RESOLVED',
        reportedById: 'user-123',
        assignedToId: 'user-999',
        solution: 'Problem fixed',
        notes: 'All resolved',
        reportedAt: '2026-01-01T10:00:00Z',
        resolvedAt: '2026-01-01T17:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T17:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedIncident });

      const result = await incidentService.update('incident-123', updates);

      expect(result.title).toBe('Fully Updated Incident');
      expect(result.status).toBe('RESOLVED');
      expect(result.priority).toBe('LOW');
    });

    it('should handle update error', async () => {
      const updates: UpdateIncidentDto = {
        status: 'CLOSED',
      };

      mockedAxios.put.mockRejectedValue(new Error('Cannot update closed incident'));

      await expect(incidentService.update('incident-123', updates))
        .rejects.toThrow('Cannot update closed incident');
    });

    it('should handle not found error on update', async () => {
      const updates: UpdateIncidentDto = {
        status: 'IN_PROGRESS',
      };

      mockedAxios.put.mockRejectedValue(new Error('Incident not found'));

      await expect(incidentService.update('nonexistent-id', updates))
        .rejects.toThrow('Incident not found');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - delete', () => {
    it('should delete incident successfully', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await incidentService.delete('incident-123');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/incident-123'),
        expect.any(Object)
      );
    });

    it('should delete multiple incidents', async () => {
      const incidentIds = ['incident-1', 'incident-2', 'incident-3'];

      mockedAxios.delete.mockResolvedValue({});

      for (const id of incidentIds) {
        await incidentService.delete(id);
      }

      expect(mockedAxios.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle delete error when incident not found', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Incident not found'));

      await expect(incidentService.delete('nonexistent-id'))
        .rejects.toThrow('Incident not found');
    });

    it('should handle delete error for active incident', async () => {
      mockedAxios.delete.mockRejectedValue(
        new Error('Cannot delete active incident')
      );

      await expect(incidentService.delete('incident-123'))
        .rejects.toThrow('Cannot delete active incident');
    });

    it('should handle network error on delete', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Network error'));

      await expect(incidentService.delete('incident-123'))
        .rejects.toThrow('Network error');
    });
  });

  // ============================================
  // COMMENT Tests
  // ============================================
  describe('COMMENTS - addComment and getComments', () => {
    it('should add comment to incident', async () => {
      const mockComment: IncidentComment = {
        id: 'comment-123',
        incidentId: 'incident-123',
        userId: 'user-123',
        comment: 'Investigating the issue',
        createdAt: '2026-01-01T12:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockComment });

      const result = await incidentService.addComment('incident-123', 'Investigating the issue');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/incident-123/comments'),
        { comment: 'Investigating the issue' },
        expect.any(Object)
      );
      expect(result).toEqual(mockComment);
      expect(result.comment).toBe('Investigating the issue');
    });

    it('should add multiple comments', async () => {
      const comments = ['First comment', 'Second comment', 'Third comment'];

      for (let i = 0; i < comments.length; i++) {
        const mockComment: IncidentComment = {
          id: `comment-${i}`,
          incidentId: 'incident-123',
          userId: 'user-123',
          comment: comments[i],
          createdAt: `2026-01-01T${12 + i}:00:00Z`,
          updatedAt: `2026-01-01T${12 + i}:00:00Z`,
        };

        mockedAxios.post.mockResolvedValue({ data: mockComment });

        const result = await incidentService.addComment('incident-123', comments[i]);
        expect(result.comment).toBe(comments[i]);
      }
    });

    it('should get all comments for incident', async () => {
      const mockComments: IncidentComment[] = [
        {
          id: 'comment-1',
          incidentId: 'incident-123',
          userId: 'user-1',
          comment: 'Started investigation',
          createdAt: '2026-01-01T12:00:00Z',
          updatedAt: '2026-01-01T12:00:00Z',
        },
        {
          id: 'comment-2',
          incidentId: 'incident-123',
          userId: 'user-2',
          comment: 'Found root cause',
          createdAt: '2026-01-01T13:00:00Z',
          updatedAt: '2026-01-01T13:00:00Z',
        },
        {
          id: 'comment-3',
          incidentId: 'incident-123',
          userId: 'user-1',
          comment: 'Implemented fix',
          createdAt: '2026-01-01T14:00:00Z',
          updatedAt: '2026-01-01T14:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockComments });

      const result = await incidentService.getComments('incident-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/incident-123/comments'),
        expect.any(Object)
      );
      expect(result).toEqual(mockComments);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no comments', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await incidentService.getComments('incident-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle comment with German special characters', async () => {
      const comment = 'Lösung: Server in Zürich neu gestartet. Prüfung erforderlich.';

      const mockComment: IncidentComment = {
        id: 'comment-umlaut',
        incidentId: 'incident-123',
        userId: 'user-123',
        comment: comment,
        createdAt: '2026-01-01T12:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockComment });

      const result = await incidentService.addComment('incident-123', comment);

      expect(result.comment).toBe(comment);
    });

    it('should handle error when adding comment', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(incidentService.addComment('incident-123', 'Test comment'))
        .rejects.toThrow('Unauthorized');
    });
  });

  // ============================================
  // STATISTICS Tests
  // ============================================
  describe('STATISTICS - getStatistics', () => {
    it('should get incident statistics', async () => {
      const mockStats: IncidentStatistics = {
        total: 42,
        open: 15,
        inProgress: 10,
        resolved: 12,
        critical: 5,
        high: 8,
      };

      mockedAxios.get.mockResolvedValue({ data: mockStats });

      const result = await incidentService.getStatistics();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/statistics'),
        expect.any(Object)
      );
      expect(result).toEqual(mockStats);
      expect(result.total).toBe(42);
      expect(result.critical).toBe(5);
    });

    it('should handle statistics with zero values', async () => {
      const mockStats: IncidentStatistics = {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        critical: 0,
        high: 0,
      };

      mockedAxios.get.mockResolvedValue({ data: mockStats });

      const result = await incidentService.getStatistics();

      expect(result.total).toBe(0);
      expect(result.critical).toBe(0);
    });

    it('should handle error when getting statistics', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Access denied'));

      await expect(incidentService.getStatistics())
        .rejects.toThrow('Access denied');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Incident Lifecycle', () => {
    it('should complete full incident lifecycle from open to closed', async () => {
      // CREATE
      const newIncident: CreateIncidentDto = {
        title: 'Production Database Slow',
        description: 'Query performance degraded',
        priority: 'HIGH',
      };

      const createdIncident: Incident = {
        id: 'incident-lifecycle',
        title: 'Production Database Slow',
        description: 'Query performance degraded',
        priority: 'HIGH',
        status: 'OPEN',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: createdIncident });
      const created = await incidentService.create(newIncident);
      expect(created.status).toBe('OPEN');

      // ADD COMMENT
      const comment1: IncidentComment = {
        id: 'comment-1',
        incidentId: 'incident-lifecycle',
        userId: 'user-123',
        comment: 'Starting investigation',
        createdAt: '2026-01-01T10:30:00Z',
        updatedAt: '2026-01-01T10:30:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: comment1 });
      await incidentService.addComment('incident-lifecycle', 'Starting investigation');

      // ASSIGN
      const assignedIncident: Incident = {
        ...createdIncident,
        status: 'IN_PROGRESS',
        assignedToId: 'user-456',
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: assignedIncident });
      const assigned = await incidentService.update('incident-lifecycle', {
        status: 'IN_PROGRESS',
        assignedToId: 'user-456',
      });
      expect(assigned.status).toBe('IN_PROGRESS');

      // RESOLVE
      const resolvedIncident: Incident = {
        ...assignedIncident,
        status: 'RESOLVED',
        solution: 'Optimized database indexes',
        resolvedAt: '2026-01-01T14:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: resolvedIncident });
      const resolved = await incidentService.update('incident-lifecycle', {
        status: 'RESOLVED',
        solution: 'Optimized database indexes',
      });
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.solution).toBe('Optimized database indexes');

      // CLOSE
      const closedIncident: Incident = {
        ...resolvedIncident,
        status: 'CLOSED',
        closedAt: '2026-01-01T15:00:00Z',
        updatedAt: '2026-01-01T15:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: closedIncident });
      const closed = await incidentService.update('incident-lifecycle', {
        status: 'CLOSED',
      });
      expect(closed.status).toBe('CLOSED');
      expect(closed.closedAt).toBeDefined();
    });

    it('should handle incident with multiple comments', async () => {
      // Create incident
      const newIncident: CreateIncidentDto = {
        title: 'Email Server Issue',
        description: 'Cannot send emails',
        priority: 'CRITICAL',
      };

      const createdIncident: Incident = {
        id: 'incident-comments',
        ...newIncident,
        status: 'OPEN',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: createdIncident });
      await incidentService.create(newIncident);

      // Add multiple comments
      const commentTexts = [
        'Checking email server logs',
        'Found authentication issue',
        'Resetting credentials',
        'Testing email sending',
        'Issue resolved',
      ];

      for (const text of commentTexts) {
        const comment: IncidentComment = {
          id: `comment-${text}`,
          incidentId: 'incident-comments',
          userId: 'user-123',
          comment: text,
          createdAt: '2026-01-01T12:00:00Z',
          updatedAt: '2026-01-01T12:00:00Z',
        };

        mockedAxios.post.mockResolvedValue({ data: comment });
        const result = await incidentService.addComment('incident-comments', text);
        expect(result.comment).toBe(text);
      }

      // Get all comments
      const allComments: IncidentComment[] = commentTexts.map((text, index) => ({
        id: `comment-${index}`,
        incidentId: 'incident-comments',
        userId: 'user-123',
        comment: text,
        createdAt: '2026-01-01T12:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      }));

      mockedAxios.get.mockResolvedValue({ data: allComments });
      const comments = await incidentService.getComments('incident-comments');
      expect(comments).toHaveLength(5);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle incident with very long description', async () => {
      const longDescription = 'This is a very detailed description. '.repeat(100);

      const incidentData: CreateIncidentDto = {
        title: 'Complex Issue',
        description: longDescription,
      };

      const mockIncident: Incident = {
        id: 'incident-long',
        title: 'Complex Issue',
        description: longDescription,
        priority: 'MEDIUM',
        status: 'OPEN',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.create(incidentData);

      expect(result.description.length).toBeGreaterThan(1000);
    });

    it('should handle incident with multiple tags', async () => {
      const incidentData: CreateIncidentDto = {
        title: 'Tagged Issue',
        description: 'Issue with many tags',
        tags: ['critical', 'server', 'production', 'database', 'performance', 'urgent'],
      };

      const mockIncident: Incident = {
        id: 'incident-tags',
        title: 'Tagged Issue',
        description: 'Issue with many tags',
        priority: 'MEDIUM',
        status: 'OPEN',
        reportedById: 'user-123',
        tags: 'critical,server,production,database,performance,urgent',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.create(incidentData);

      expect(result.tags).toContain('critical');
      expect(result.tags).toContain('database');
    });

    it('should handle incident without authentication token', async () => {
      Storage.prototype.getItem = jest.fn(() => null);

      const mockIncidents: Incident[] = [];
      mockedAxios.get.mockResolvedValue({ data: mockIncidents });

      await incidentService.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {},
        })
      );
    });

    it('should handle incident with due date in the past', async () => {
      const incidentData: CreateIncidentDto = {
        title: 'Overdue Issue',
        description: 'This was supposed to be fixed yesterday',
        dueDate: '2025-12-31',
      };

      const mockIncident: Incident = {
        id: 'incident-overdue',
        title: 'Overdue Issue',
        description: 'This was supposed to be fixed yesterday',
        priority: 'MEDIUM',
        status: 'OPEN',
        reportedById: 'user-123',
        dueDate: '2025-12-31',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.create(incidentData);

      expect(result.dueDate).toBe('2025-12-31');
    });

    it('should handle special characters in incident title', async () => {
      const incidentData: CreateIncidentDto = {
        title: 'Fehler: Ärger mit Übertragung & Co. (30%)',
        description: 'Test with special chars: äöüß<>{}[]',
      };

      const mockIncident: Incident = {
        id: 'incident-special',
        title: 'Fehler: Ärger mit Übertragung & Co. (30%)',
        description: 'Test with special chars: äöüß<>{}[]',
        priority: 'MEDIUM',
        status: 'OPEN',
        reportedById: 'user-123',
        reportedAt: '2026-01-01T10:00:00Z',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentService.create(incidentData);

      expect(result.title).toBe('Fehler: Ärger mit Übertragung & Co. (30%)');
    });
  });
});
