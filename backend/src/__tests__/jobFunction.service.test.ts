import { prisma } from '../lib/prisma';
import jobFunctionService from '../services/jobFunction.service';

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    jobFunction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    jobFunctionDocument: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

describe('JobFunction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllJobFunctions', () => {
    it('should return only active job functions by default', async () => {
      const mockJobFunctions = [
        {
          id: 'jf-1',
          title: 'Software Engineer',
          isActive: true,
          category: 'IT',
          _count: { employees: 5 },
        },
        {
          id: 'jf-2',
          title: 'Product Manager',
          isActive: true,
          category: 'Management',
          _count: { employees: 2 },
        },
      ];

      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue(mockJobFunctions);

      const result = await jobFunctionService.getAllJobFunctions();

      expect(result).toHaveLength(2);
      expect(prisma.jobFunction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should return all job functions including inactive when specified', async () => {
      const mockJobFunctions = [
        { id: 'jf-1', title: 'Active Job', isActive: true },
        { id: 'jf-2', title: 'Inactive Job', isActive: false },
      ];

      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue(mockJobFunctions);

      const result = await jobFunctionService.getAllJobFunctions(true);

      expect(result).toHaveLength(2);
      expect(prisma.jobFunction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should order by category and title', async () => {
      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue([]);

      await jobFunctionService.getAllJobFunctions();

      expect(prisma.jobFunction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ category: 'asc' }, { title: 'asc' }],
        })
      );
    });
  });

  describe('getJobFunctionById', () => {
    it('should return job function with details', async () => {
      const mockJobFunction = {
        id: 'jf-1',
        title: 'Software Engineer',
        description: 'Develop software',
        createdBy: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        employees: [
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        ],
      };

      (prisma.jobFunction.findUnique as jest.Mock).mockResolvedValue(mockJobFunction);

      const result = await jobFunctionService.getJobFunctionById('jf-1');

      expect(result).toBeDefined();
      expect(result?.title).toBe('Software Engineer');
      expect(prisma.jobFunction.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'jf-1' },
        })
      );
    });

    it('should return null when job function not found', async () => {
      (prisma.jobFunction.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await jobFunctionService.getJobFunctionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createJobFunction', () => {
    it('should create job function with minimal data', async () => {
      const mockJobFunction = {
        id: 'jf-1',
        title: 'New Role',
        createdById: 'user-1',
        isActive: true,
      };

      (prisma.jobFunction.create as jest.Mock).mockResolvedValue(mockJobFunction);

      const result = await jobFunctionService.createJobFunction(
        { title: 'New Role' },
        'user-1'
      );

      expect(result.title).toBe('New Role');
      expect(prisma.jobFunction.create).toHaveBeenCalled();
    });

    it('should create job function with full data including translations', async () => {
      const mockJobFunction = {
        id: 'jf-1',
        title: 'Ingenieur',
        titleEn: 'Engineer',
        description: 'Beschreibung',
        descriptionEn: 'Description',
        category: 'IT',
        department: 'Engineering',
        salaryMin: 80000,
        salaryMax: 120000,
        salaryCurrency: 'CHF',
      };

      (prisma.jobFunction.create as jest.Mock).mockResolvedValue(mockJobFunction);

      const result = await jobFunctionService.createJobFunction(
        {
          title: 'Ingenieur',
          titleEn: 'Engineer',
          description: 'Beschreibung',
          descriptionEn: 'Description',
          category: 'IT',
          department: 'Engineering',
          salaryMin: 80000,
          salaryMax: 120000,
          salaryCurrency: 'CHF',
        },
        'user-1'
      );

      expect(result.title).toBe('Ingenieur');
      expect(result.titleEn).toBe('Engineer');
      expect(result.salaryMin).toBe(80000);
    });

    it('should create job function with requirements and qualifications', async () => {
      const mockJobFunction = {
        id: 'jf-1',
        title: 'Senior Developer',
        requirements: 'Bachelor degree',
        qualifications: '5+ years experience',
        responsibilities: 'Lead team, design systems',
      };

      (prisma.jobFunction.create as jest.Mock).mockResolvedValue(mockJobFunction);

      const result = await jobFunctionService.createJobFunction(
        {
          title: 'Senior Developer',
          requirements: 'Bachelor degree',
          qualifications: '5+ years experience',
          responsibilities: 'Lead team, design systems',
        },
        'user-1'
      );

      expect(result.requirements).toBe('Bachelor degree');
      expect(result.qualifications).toBe('5+ years experience');
    });
  });

  describe('updateJobFunction', () => {
    it('should update job function fields', async () => {
      const mockUpdatedJobFunction = {
        id: 'jf-1',
        title: 'Updated Title',
        description: 'Updated Description',
      };

      (prisma.jobFunction.update as jest.Mock).mockResolvedValue(mockUpdatedJobFunction);

      const result = await jobFunctionService.updateJobFunction('jf-1', {
        title: 'Updated Title',
        description: 'Updated Description',
      });

      expect(result.title).toBe('Updated Title');
      expect(prisma.jobFunction.update).toHaveBeenCalled();
    });

    it('should update salary information', async () => {
      const mockUpdatedJobFunction = {
        id: 'jf-1',
        salaryMin: 90000,
        salaryMax: 130000,
        salaryCurrency: 'CHF',
      };

      (prisma.jobFunction.update as jest.Mock).mockResolvedValue(mockUpdatedJobFunction);

      const result = await jobFunctionService.updateJobFunction('jf-1', {
        salaryMin: 90000,
        salaryMax: 130000,
        salaryCurrency: 'CHF',
      });

      expect(result.salaryMin).toBe(90000);
      expect(result.salaryMax).toBe(130000);
    });
  });

  describe('deleteJobFunction', () => {
    it('should soft delete job function', async () => {
      const mockDeletedJobFunction = {
        id: 'jf-1',
        isActive: false,
      };

      (prisma.jobFunction.update as jest.Mock).mockResolvedValue(mockDeletedJobFunction);

      const result = await jobFunctionService.deleteJobFunction('jf-1');

      expect(result.isActive).toBe(false);
      expect(prisma.jobFunction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'jf-1' },
          data: expect.objectContaining({
            isActive: false,
          }),
        })
      );
    });
  });

  describe('hardDeleteJobFunction', () => {
    it('should hard delete job function when no employees assigned', async () => {
      const mockJobFunction = {
        id: 'jf-1',
        _count: { employees: 0 },
      };

      (prisma.jobFunction.findUnique as jest.Mock).mockResolvedValue(mockJobFunction);
      (prisma.jobFunction.delete as jest.Mock).mockResolvedValue(mockJobFunction);

      const result = await jobFunctionService.hardDeleteJobFunction('jf-1');

      expect(prisma.jobFunction.delete).toHaveBeenCalledWith({
        where: { id: 'jf-1' },
      });
    });

    it('should throw error when trying to delete job function with assigned employees', async () => {
      const mockJobFunction = {
        id: 'jf-1',
        _count: { employees: 3 },
      };

      (prisma.jobFunction.findUnique as jest.Mock).mockResolvedValue(mockJobFunction);

      await expect(jobFunctionService.hardDeleteJobFunction('jf-1')).rejects.toThrow(
        'Cannot delete job function with assigned employees'
      );

      expect(prisma.jobFunction.delete).not.toHaveBeenCalled();
    });
  });

  describe('getJobFunctionsByCategory', () => {
    it('should return job functions in specified category', async () => {
      const mockJobFunctions = [
        { id: 'jf-1', title: 'Software Engineer', category: 'IT' },
        { id: 'jf-2', title: 'DevOps Engineer', category: 'IT' },
      ];

      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue(mockJobFunctions);

      const result = await jobFunctionService.getJobFunctionsByCategory('IT');

      expect(result).toHaveLength(2);
      expect(prisma.jobFunction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            category: 'IT',
            isActive: true,
          },
        })
      );
    });
  });

  describe('getJobFunctionsByDepartment', () => {
    it('should return job functions in specified department', async () => {
      const mockJobFunctions = [
        { id: 'jf-1', title: 'Engineer', department: 'Engineering' },
        { id: 'jf-2', title: 'Architect', department: 'Engineering' },
      ];

      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue(mockJobFunctions);

      const result = await jobFunctionService.getJobFunctionsByDepartment('Engineering');

      expect(result).toHaveLength(2);
      expect(prisma.jobFunction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            department: 'Engineering',
            isActive: true,
          },
        })
      );
    });
  });

  describe('assignJobFunctionToUser', () => {
    it('should assign job function to user', async () => {
      const mockUser = {
        id: 'user-1',
        jobFunctionId: 'jf-1',
        jobFunction: {
          id: 'jf-1',
          title: 'Software Engineer',
        },
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await jobFunctionService.assignJobFunctionToUser('user-1', 'jf-1');

      expect(result.jobFunctionId).toBe('jf-1');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { jobFunctionId: 'jf-1' },
        })
      );
    });
  });

  describe('removeJobFunctionFromUser', () => {
    it('should remove job function from user', async () => {
      const mockUser = {
        id: 'user-1',
        jobFunctionId: null,
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await jobFunctionService.removeJobFunctionFromUser('user-1');

      expect(result.jobFunctionId).toBeNull();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { jobFunctionId: null },
        })
      );
    });
  });

  describe('getCategories', () => {
    it('should return unique categories sorted', async () => {
      const mockJobFunctions = [
        { category: 'IT' },
        { category: 'Management' },
        { category: 'HR' },
      ];

      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue(mockJobFunctions);

      const result = await jobFunctionService.getCategories();

      expect(result).toEqual(['HR', 'IT', 'Management']);
    });

    it('should filter out null/undefined categories', async () => {
      const mockJobFunctions = [
        { category: 'IT' },
        { category: null },
        { category: 'HR' },
      ];

      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue(mockJobFunctions);

      const result = await jobFunctionService.getCategories();

      expect(result).toEqual(['HR', 'IT']);
    });
  });

  describe('getDepartments', () => {
    it('should return unique departments sorted', async () => {
      const mockJobFunctions = [
        { department: 'Engineering' },
        { department: 'Sales' },
        { department: 'Marketing' },
      ];

      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue(mockJobFunctions);

      const result = await jobFunctionService.getDepartments();

      expect(result).toEqual(['Engineering', 'Marketing', 'Sales']);
    });

    it('should filter out null/undefined departments', async () => {
      const mockJobFunctions = [
        { department: 'Engineering' },
        { department: null },
        { department: 'Sales' },
      ];

      (prisma.jobFunction.findMany as jest.Mock).mockResolvedValue(mockJobFunctions);

      const result = await jobFunctionService.getDepartments();

      expect(result).toEqual(['Engineering', 'Sales']);
    });
  });
});
