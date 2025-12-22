import { projectService } from '../project.service';
import api from '../api';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Project Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        isActive: true,
      };

      const mockResponse = { data: mockProject };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await projectService.createProject({
        name: 'Test Project',
        description: 'Test Description',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/projects', {
        name: 'Test Project',
        description: 'Test Description',
      });
      expect(result.name).toBe('Test Project');
    });
  });

  describe('getAllProjects', () => {
    it('should get all projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', isActive: true },
        { id: '2', name: 'Project 2', isActive: true },
      ];

      const mockResponse = { data: mockProjects };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getAllProjects();

      expect(mockedApi.get).toHaveBeenCalledWith('/projects');
      expect(result).toHaveLength(2);
    });
  });

  describe('getMyProjects', () => {
    it('should get my projects', async () => {
      const mockProjects = [
        { id: '1', name: 'My Project', isActive: true },
      ];

      const mockResponse = { data: mockProjects };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getMyProjects();

      expect(mockedApi.get).toHaveBeenCalledWith('/projects/my-projects');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateProject', () => {
    it('should update project', async () => {
      const mockProject = {
        id: '1',
        name: 'Updated Project',
        isActive: true,
      };

      const mockResponse = { data: mockProject };
      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await projectService.updateProject('1', {
        name: 'Updated Project',
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/projects/1', {
        name: 'Updated Project',
      });
      expect(result.name).toBe('Updated Project');
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await projectService.deleteProject('1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/projects/1');
    });
  });

  describe('assignUser', () => {
    it('should assign user to project', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await projectService.assignUser('project-1', 'user-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/projects/project-1/assign', { userId: 'user-1' });
    });
  });

  describe('unassignUser', () => {
    it('should unassign user from project', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await projectService.unassignUser('project-1', 'user-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/projects/project-1/unassign/user-1');
    });
  });
});
