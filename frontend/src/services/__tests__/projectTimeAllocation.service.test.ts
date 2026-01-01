import projectTimeAllocationService, { ProjectTimeAllocation, AllocationInput, ProjectTimeStats } from '../projectTimeAllocation.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('ProjectTimeAllocation Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - setAllocationsForTimeEntry', () => {
    it('should set allocations with all fields', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 5.5,
          description: 'Frontend Entwicklung',
        },
        {
          projectId: 'project-456',
          hours: 2.5,
          description: 'Code Review',
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-1',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 5.5,
          description: 'Frontend Entwicklung',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'allocation-2',
          timeEntryId: 'time-entry-123',
          projectId: 'project-456',
          hours: 2.5,
          description: 'Code Review',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations);

      expect(mockedApi.post).toHaveBeenCalledWith('/project-time-allocations/time-entry/time-entry-123', {
        allocations,
      });
      expect(result).toEqual(mockAllocations);
      expect(result).toHaveLength(2);
      expect(result[0].hours).toBe(5.5);
    });

    it('should set single allocation', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-789',
          hours: 8.0,
          description: 'Backend API Entwicklung',
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-single',
          timeEntryId: 'time-entry-456',
          projectId: 'project-789',
          hours: 8.0,
          description: 'Backend API Entwicklung',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-456', allocations);

      expect(result).toHaveLength(1);
      expect(result[0].hours).toBe(8.0);
    });

    it('should set allocations without description', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-111',
          hours: 4.0,
        },
        {
          projectId: 'project-222',
          hours: 4.0,
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-3',
          timeEntryId: 'time-entry-789',
          projectId: 'project-111',
          hours: 4.0,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'allocation-4',
          timeEntryId: 'time-entry-789',
          projectId: 'project-222',
          hours: 4.0,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-789', allocations);

      expect(result).toHaveLength(2);
      expect(result[0].description).toBeUndefined();
    });

    it('should set allocations with decimal hours', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 2.25,
          description: 'Meeting',
        },
        {
          projectId: 'project-456',
          hours: 5.75,
          description: 'Development',
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-decimal-1',
          timeEntryId: 'time-entry-decimal',
          projectId: 'project-123',
          hours: 2.25,
          description: 'Meeting',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'allocation-decimal-2',
          timeEntryId: 'time-entry-decimal',
          projectId: 'project-456',
          hours: 5.75,
          description: 'Development',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-decimal', allocations);

      expect(result[0].hours).toBe(2.25);
      expect(result[1].hours).toBe(5.75);
    });

    it('should handle creation error', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'invalid-project',
          hours: 8.0,
        },
      ];

      mockedApi.post.mockRejectedValue(new Error('Project not found'));

      await expect(projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations))
        .rejects.toThrow('Project not found');
    });

    it('should set allocations with German special characters in description', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 6.0,
          description: 'Überarbeitung der Präsentation für Zürich',
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-umlaut',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 6.0,
          description: 'Überarbeitung der Präsentation für Zürich',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations);

      expect(result[0].description).toContain('Überarbeitung');
      expect(result[0].description).toContain('Zürich');
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllocationsForTimeEntry', () => {
    it('should get all allocations for time entry', async () => {
      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-1',
          timeEntryId: 'time-entry-123',
          projectId: 'project-1',
          hours: 4.0,
          description: 'Development',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'allocation-2',
          timeEntryId: 'time-entry-123',
          projectId: 'project-2',
          hours: 4.0,
          description: 'Testing',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.getAllocationsForTimeEntry('time-entry-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/project-time-allocations/time-entry/time-entry-123');
      expect(result).toEqual(mockAllocations);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no allocations found', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await projectTimeAllocationService.getAllocationsForTimeEntry('time-entry-empty');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should get allocations with project details', async () => {
      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-with-project',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 8.0,
          description: 'Full day work',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
          project: {
            id: 'project-123',
            name: 'E-Commerce Platform',
            description: 'Online shop development',
          },
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.getAllocationsForTimeEntry('time-entry-123');

      expect(result[0].project).toBeDefined();
      expect(result[0].project?.name).toBe('E-Commerce Platform');
    });

    it('should handle fetch error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Time entry not found'));

      await expect(projectTimeAllocationService.getAllocationsForTimeEntry('nonexistent-id'))
        .rejects.toThrow('Time entry not found');
    });
  });

  describe('READ - getProjectTimeStats', () => {
    it('should get project time stats without filters', async () => {
      const mockStats: ProjectTimeStats[] = [
        {
          projectId: 'project-1',
          projectName: 'Project Alpha',
          totalHours: 45.5,
          allocations: [
            {
              id: 'alloc-1',
              hours: 8.0,
              description: 'Development',
              date: '2026-01-01',
              user: {
                id: 'user-1',
                firstName: 'Max',
                lastName: 'Müller',
              },
            },
          ],
        },
        {
          projectId: 'project-2',
          projectName: 'Project Beta',
          totalHours: 32.0,
          allocations: [],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await projectTimeAllocationService.getProjectTimeStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/project-time-allocations/stats', {
        params: { startDate: undefined, endDate: undefined, projectId: undefined },
      });
      expect(result).toEqual(mockStats);
      expect(result).toHaveLength(2);
    });

    it('should get project time stats with date range', async () => {
      const mockStats: ProjectTimeStats[] = [
        {
          projectId: 'project-1',
          projectName: 'Project Alpha',
          totalHours: 40.0,
          allocations: [],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await projectTimeAllocationService.getProjectTimeStats('2026-01-01', '2026-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/project-time-allocations/stats', {
        params: { startDate: '2026-01-01', endDate: '2026-01-31', projectId: undefined },
      });
      expect(result[0].totalHours).toBe(40.0);
    });

    it('should get project time stats for specific project', async () => {
      const mockStats: ProjectTimeStats[] = [
        {
          projectId: 'project-123',
          projectName: 'Specific Project',
          totalHours: 120.5,
          allocations: [
            {
              id: 'alloc-1',
              hours: 8.0,
              date: '2026-01-01',
              user: {
                id: 'user-1',
                firstName: 'Anna',
                lastName: 'Schmidt',
              },
            },
            {
              id: 'alloc-2',
              hours: 7.5,
              description: 'Bug fixes',
              date: '2026-01-02',
              user: {
                id: 'user-2',
                firstName: 'Thomas',
                lastName: 'Weber',
              },
            },
          ],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await projectTimeAllocationService.getProjectTimeStats(undefined, undefined, 'project-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/project-time-allocations/stats', {
        params: { startDate: undefined, endDate: undefined, projectId: 'project-123' },
      });
      expect(result[0].projectId).toBe('project-123');
      expect(result[0].allocations).toHaveLength(2);
    });

    it('should get stats with all filters', async () => {
      const mockStats: ProjectTimeStats[] = [
        {
          projectId: 'project-123',
          projectName: 'Filtered Project',
          totalHours: 80.0,
          allocations: [],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await projectTimeAllocationService.getProjectTimeStats('2026-01-01', '2026-01-31', 'project-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/project-time-allocations/stats', {
        params: { startDate: '2026-01-01', endDate: '2026-01-31', projectId: 'project-123' },
      });
      expect(result[0].totalHours).toBe(80.0);
    });

    it('should return empty array when no stats found', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await projectTimeAllocationService.getProjectTimeStats();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle stats fetch error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Access denied'));

      await expect(projectTimeAllocationService.getProjectTimeStats())
        .rejects.toThrow('Access denied');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteAllocation', () => {
    it('should delete allocation successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await projectTimeAllocationService.deleteAllocation('allocation-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/project-time-allocations/allocation-123');
    });

    it('should delete multiple allocations', async () => {
      const allocationIds = ['allocation-1', 'allocation-2', 'allocation-3'];

      mockedApi.delete.mockResolvedValue({});

      for (const id of allocationIds) {
        await projectTimeAllocationService.deleteAllocation(id);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenCalledWith('/project-time-allocations/allocation-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/project-time-allocations/allocation-2');
      expect(mockedApi.delete).toHaveBeenCalledWith('/project-time-allocations/allocation-3');
    });

    it('should handle delete error when allocation not found', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Allocation not found'));

      await expect(projectTimeAllocationService.deleteAllocation('nonexistent-id'))
        .rejects.toThrow('Allocation not found');
    });

    it('should handle delete error when time entry is locked', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Cannot delete allocation for locked time entry'));

      await expect(projectTimeAllocationService.deleteAllocation('allocation-123'))
        .rejects.toThrow('Cannot delete allocation for locked time entry');
    });

    it('should handle network error on delete', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Network error'));

      await expect(projectTimeAllocationService.deleteAllocation('allocation-123'))
        .rejects.toThrow('Network error');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Allocation Lifecycle', () => {
    it('should complete full allocation lifecycle', async () => {
      // CREATE allocations
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 5.0,
          description: 'Initial development',
        },
        {
          projectId: 'project-456',
          hours: 3.0,
          description: 'Code review',
        },
      ];

      const createdAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-lifecycle-1',
          timeEntryId: 'time-entry-lifecycle',
          projectId: 'project-123',
          hours: 5.0,
          description: 'Initial development',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'allocation-lifecycle-2',
          timeEntryId: 'time-entry-lifecycle',
          projectId: 'project-456',
          hours: 3.0,
          description: 'Code review',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: createdAllocations });
      const created = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-lifecycle', allocations);
      expect(created).toHaveLength(2);

      // READ allocations
      mockedApi.get.mockResolvedValue({ data: createdAllocations });
      const fetched = await projectTimeAllocationService.getAllocationsForTimeEntry('time-entry-lifecycle');
      expect(fetched).toHaveLength(2);

      // UPDATE allocations (replace)
      const updatedAllocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 6.0,
          description: 'Updated development time',
        },
        {
          projectId: 'project-456',
          hours: 2.0,
          description: 'Updated review time',
        },
      ];

      const updatedResult: ProjectTimeAllocation[] = [
        {
          id: 'allocation-lifecycle-1',
          timeEntryId: 'time-entry-lifecycle',
          projectId: 'project-123',
          hours: 6.0,
          description: 'Updated development time',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T12:00:00Z',
        },
        {
          id: 'allocation-lifecycle-2',
          timeEntryId: 'time-entry-lifecycle',
          projectId: 'project-456',
          hours: 2.0,
          description: 'Updated review time',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T12:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: updatedResult });
      const updated = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-lifecycle', updatedAllocations);
      expect(updated[0].hours).toBe(6.0);
      expect(updated[1].hours).toBe(2.0);

      // DELETE one allocation
      mockedApi.delete.mockResolvedValue({});
      await projectTimeAllocationService.deleteAllocation('allocation-lifecycle-2');

      // GET remaining allocations
      mockedApi.get.mockResolvedValue({ data: [updatedResult[0]] });
      const remaining = await projectTimeAllocationService.getAllocationsForTimeEntry('time-entry-lifecycle');
      expect(remaining).toHaveLength(1);
    });

    it('should handle stats aggregation', async () => {
      // Set allocations for multiple time entries
      const allocations1: AllocationInput[] = [
        { projectId: 'project-123', hours: 8.0, description: 'Day 1' },
      ];
      const allocations2: AllocationInput[] = [
        { projectId: 'project-123', hours: 7.5, description: 'Day 2' },
      ];

      const mockAlloc1: ProjectTimeAllocation[] = [
        {
          id: 'alloc-stats-1',
          timeEntryId: 'entry-1',
          projectId: 'project-123',
          hours: 8.0,
          description: 'Day 1',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      const mockAlloc2: ProjectTimeAllocation[] = [
        {
          id: 'alloc-stats-2',
          timeEntryId: 'entry-2',
          projectId: 'project-123',
          hours: 7.5,
          description: 'Day 2',
          createdAt: '2026-01-02T10:00:00Z',
          updatedAt: '2026-01-02T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValueOnce({ data: mockAlloc1 });
      await projectTimeAllocationService.setAllocationsForTimeEntry('entry-1', allocations1);

      mockedApi.post.mockResolvedValueOnce({ data: mockAlloc2 });
      await projectTimeAllocationService.setAllocationsForTimeEntry('entry-2', allocations2);

      // Get aggregated stats
      const mockStats: ProjectTimeStats[] = [
        {
          projectId: 'project-123',
          projectName: 'Test Project',
          totalHours: 15.5,
          allocations: [
            {
              id: 'alloc-stats-1',
              hours: 8.0,
              description: 'Day 1',
              date: '2026-01-01',
              user: { id: 'user-1', firstName: 'Max', lastName: 'Mustermann' },
            },
            {
              id: 'alloc-stats-2',
              hours: 7.5,
              description: 'Day 2',
              date: '2026-01-02',
              user: { id: 'user-1', firstName: 'Max', lastName: 'Mustermann' },
            },
          ],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockStats });
      const stats = await projectTimeAllocationService.getProjectTimeStats('2026-01-01', '2026-01-02', 'project-123');

      expect(stats[0].totalHours).toBe(15.5);
      expect(stats[0].allocations).toHaveLength(2);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle allocation with zero hours', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 0.0,
          description: 'No time spent',
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-zero',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 0.0,
          description: 'No time spent',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations);

      expect(result[0].hours).toBe(0.0);
    });

    it('should handle allocation with very small decimal hours', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 0.25,
          description: '15 minutes',
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-small',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 0.25,
          description: '15 minutes',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations);

      expect(result[0].hours).toBe(0.25);
    });

    it('should handle allocation with very large hours', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 24.0,
          description: 'Full day marathon coding',
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-large',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 24.0,
          description: 'Full day marathon coding',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations);

      expect(result[0].hours).toBe(24.0);
    });

    it('should handle allocation with very long description', async () => {
      const longDescription = 'Sehr detaillierte Beschreibung der durchgeführten Arbeiten: '.repeat(20);

      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 8.0,
          description: longDescription,
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-long',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 8.0,
          description: longDescription,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations);

      expect(result[0].description?.length).toBeGreaterThan(500);
    });

    it('should handle empty allocations array', async () => {
      const allocations: AllocationInput[] = [];

      const mockAllocations: ProjectTimeAllocation[] = [];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle stats with zero total hours', async () => {
      const mockStats: ProjectTimeStats[] = [
        {
          projectId: 'project-empty',
          projectName: 'Empty Project',
          totalHours: 0,
          allocations: [],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await projectTimeAllocationService.getProjectTimeStats();

      expect(result[0].totalHours).toBe(0);
      expect(result[0].allocations).toHaveLength(0);
    });

    it('should handle multiple allocations to same project', async () => {
      const allocations: AllocationInput[] = [
        {
          projectId: 'project-123',
          hours: 3.0,
          description: 'Morning work',
        },
        {
          projectId: 'project-123',
          hours: 5.0,
          description: 'Afternoon work',
        },
      ];

      const mockAllocations: ProjectTimeAllocation[] = [
        {
          id: 'allocation-morning',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 3.0,
          description: 'Morning work',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'allocation-afternoon',
          timeEntryId: 'time-entry-123',
          projectId: 'project-123',
          hours: 5.0,
          description: 'Afternoon work',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.post.mockResolvedValue({ data: mockAllocations });

      const result = await projectTimeAllocationService.setAllocationsForTimeEntry('time-entry-123', allocations);

      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe('project-123');
      expect(result[1].projectId).toBe('project-123');
    });
  });
});
