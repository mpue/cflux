// Import onboarding service
import * as onboardingService from '../services/onboarding.service';

// Mock @prisma/client to preserve enums while mocking PrismaClient
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual<typeof import('@prisma/client')>('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => ({
      applicant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      employee: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      onboardingJob: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      employeeDocument: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      onboardingTask: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

// Mock ../lib/prisma to return our mocked prisma instance
jest.mock('../lib/prisma', () => {
  const { PrismaClient } = jest.requireMock('@prisma/client');
  return {
    prisma: new PrismaClient(),
  };
});

import { prisma } from '../lib/prisma';

describe('Onboarding Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hireApplicant', () => {
    it('should create employee from applicant', async () => {
      const mockApplicant = {
        id: 'applicant-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+41 79 123 45 67',
        position: 'Software Engineer',
        status: 'INTERVIEW_SCHEDULED',
        documents: [],
      };

      const mockEmployee = {
        id: 'employee-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+41 79 123 45 67',
        position: 'Software Engineer',
        department: 'IT',
        startDate: new Date('2024-03-01'),
      };

      (prisma.applicant.findUnique as jest.Mock).mockResolvedValue(mockApplicant);
      (prisma.employee.create as jest.Mock).mockResolvedValue(mockEmployee);
      (prisma.applicant.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingTask.create as jest.Mock).mockResolvedValue({});

      const result = await onboardingService.hireApplicant({
        applicantId: 'applicant-1',
        department: 'IT',
        startDate: new Date('2024-03-01'),
      });

      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(prisma.employee.create).toHaveBeenCalled();
      expect(prisma.applicant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'applicant-1' },
          data: expect.objectContaining({
            status: 'HIRED',
            employeeId: mockEmployee.id,
          }),
        })
      );
    });

    it('should throw error when applicant not found', async () => {
      (prisma.applicant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        onboardingService.hireApplicant({
          applicantId: 'non-existent',
          startDate: new Date('2024-03-01'),
        })
      ).rejects.toThrow('Bewerber nicht gefunden');
    });

    it('should throw error when applicant already hired', async () => {
      const mockApplicant = {
        id: 'applicant-1',
        status: 'HIRED',
      };

      (prisma.applicant.findUnique as jest.Mock).mockResolvedValue(mockApplicant);

      await expect(
        onboardingService.hireApplicant({
          applicantId: 'applicant-1',
          startDate: new Date('2024-03-01'),
        })
      ).rejects.toThrow('Bewerber wurde bereits eingestellt');
    });

    it('should create employee with supervisor and probation period', async () => {
      const mockApplicant = {
        id: 'applicant-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        status: 'OFFER',
        documents: [],
      };

      const mockEmployee = {
        id: 'employee-2',
        supervisorId: 'supervisor-1',
        probationEndDate: new Date('2024-08-31'),
      };

      (prisma.applicant.findUnique as jest.Mock).mockResolvedValue(mockApplicant);
      (prisma.employee.create as jest.Mock).mockResolvedValue(mockEmployee);
      (prisma.applicant.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingTask.create as jest.Mock).mockResolvedValue({});

      const result = await onboardingService.hireApplicant({
        applicantId: 'applicant-1',
        supervisorId: 'supervisor-1',
        startDate: new Date('2024-03-01'),
        probationEndDate: new Date('2024-08-31'),
      });

      expect(result.supervisorId).toBe('supervisor-1');
      expect(result.probationEndDate).toEqual(new Date('2024-08-31'));
    });
  });

  describe('getAllEmployees', () => {
    it('should return all employees without filters', async () => {
      const mockEmployees = [
        { id: 'emp-1', firstName: 'John', lastName: 'Doe', department: 'IT' },
        { id: 'emp-2', firstName: 'Jane', lastName: 'Smith', department: 'HR' },
      ];

      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);

      const result = await onboardingService.getAllEmployees();

      expect(result).toHaveLength(2);
      expect(prisma.employee.findMany).toHaveBeenCalled();
    });

    it('should filter by department', async () => {
      const mockEmployees = [
        { id: 'emp-1', firstName: 'John', lastName: 'Doe', department: 'IT' },
      ];

      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);

      const result = await onboardingService.getAllEmployees({ department: 'IT' });

      expect(result).toHaveLength(1);
      expect(result[0].department).toBe('IT');
    });

    it('should filter by active status', async () => {
      const mockEmployees = [
        { id: 'emp-1', isActive: true },
      ];

      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);

      const result = await onboardingService.getAllEmployees({ isActive: true });

      expect(result).toHaveLength(1);
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee with all related data', async () => {
      const mockEmployee = {
        id: 'employee-1',
        firstName: 'John',
        lastName: 'Doe',
        user: { id: 'user-1', email: 'john@example.com' },
        documents: [],
        tasks: [],
        equipmentAssignments: [],
      };

      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployee);

      const result = await onboardingService.getEmployeeById('employee-1');

      expect(result).toBeDefined();
      expect(result?.firstName).toBe('John');
      expect(prisma.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'employee-1' },
        })
      );
    });

    it('should return null when employee not found', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await onboardingService.getEmployeeById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateEmployee', () => {
    it('should update employee data', async () => {
      const mockUpdatedEmployee = {
        id: 'employee-1',
        department: 'Engineering',
        position: 'Senior Developer',
      };

      (prisma.employee.update as jest.Mock).mockResolvedValue(mockUpdatedEmployee);

      const result = await onboardingService.updateEmployee('employee-1', {
        department: 'Engineering',
        position: 'Senior Developer',
      });

      expect(result.department).toBe('Engineering');
      expect(result.position).toBe('Senior Developer');
    });
  });

  describe('Onboarding Jobs', () => {
    describe('getOnboardingJobs', () => {
      it('should return all active onboarding jobs', async () => {
        const mockJobs = [
          { id: 'job-1', title: 'Software Engineer', isActive: true, sortOrder: 1 },
          { id: 'job-2', title: 'Product Manager', isActive: true, sortOrder: 2 },
        ];

        (prisma.onboardingJob.findMany as jest.Mock).mockResolvedValue(mockJobs);

        const result = await onboardingService.getOnboardingJobs({ isActive: true });

        expect(result).toHaveLength(2);
      });

      it('should return all jobs when no filter specified', async () => {
        const mockJobs = [
          { id: 'job-1', isActive: true },
          { id: 'job-2', isActive: false },
        ];

        (prisma.onboardingJob.findMany as jest.Mock).mockResolvedValue(mockJobs);

        const result = await onboardingService.getOnboardingJobs();

        expect(result).toHaveLength(2);
      });
    });

    describe('createOnboardingJob', () => {
      it('should create onboarding job with all fields', async () => {
        const mockJob = {
          id: 'job-1',
          title: 'Software Engineer',
          description: 'Full Stack Developer',
          department: 'IT',
          salaryMin: 80000,
          salaryMax: 120000,
          salaryCurrency: 'CHF',
        };

        (prisma.onboardingJob.create as jest.Mock).mockResolvedValue(mockJob);

        const result = await onboardingService.createOnboardingJob({
          title: 'Software Engineer',
          description: 'Full Stack Developer',
          department: 'IT',
          salaryMin: 80000,
          salaryMax: 120000,
          salaryCurrency: 'CHF',
        });

        expect(result.title).toBe('Software Engineer');
        expect(result.salaryMin).toBe(80000);
      });
    });

    describe('updateOnboardingJob', () => {
      it('should update onboarding job', async () => {
        const mockJob = {
          id: 'job-1',
          title: 'Senior Software Engineer',
          isActive: false,
        };

        (prisma.onboardingJob.update as jest.Mock).mockResolvedValue(mockJob);

        const result = await onboardingService.updateOnboardingJob('job-1', {
          title: 'Senior Software Engineer',
          isActive: false,
        });

        expect(result.title).toBe('Senior Software Engineer');
        expect(result.isActive).toBe(false);
      });
    });

    describe('deleteOnboardingJob', () => {
      it('should delete onboarding job', async () => {
        (prisma.onboardingJob.delete as jest.Mock).mockResolvedValue({});

        await onboardingService.deleteOnboardingJob('job-1');

        expect(prisma.onboardingJob.delete).toHaveBeenCalledWith({
          where: { id: 'job-1' },
        });
      });
    });
  });

  describe('Employee Documents', () => {
    describe('uploadEmployeeDocument', () => {
      it('should upload document with metadata', async () => {
        const mockDocument = {
          id: 'doc-1',
          employeeId: 'employee-1',
          documentType: 'CONTRACT',
          fileName: 'contract.pdf',
          filePath: '/uploads/contract.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          status: 'UPLOADED',
        };

        (prisma.employeeDocument.create as jest.Mock).mockResolvedValue(mockDocument);

        const result = await onboardingService.uploadEmployeeDocument({
          employeeId: 'employee-1',
          documentType: 'CONTRACT',
          fileName: 'contract.pdf',
          filePath: '/uploads/contract.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          uploadedById: 'user-1',
        });

        expect(result.documentType).toBe('CONTRACT');
        expect(result.status).toBe('UPLOADED');
      });
    });

    describe('getEmployeeDocuments', () => {
      it('should return all documents for employee', async () => {
        const mockDocuments = [
          { id: 'doc-1', documentType: 'CONTRACT' },
          { id: 'doc-2', documentType: 'OTHER' },
        ];

        (prisma.employeeDocument.findMany as jest.Mock).mockResolvedValue(mockDocuments);

        const result = await onboardingService.getEmployeeDocuments('employee-1');

        expect(result).toHaveLength(2);
      });
    });

    describe('updateDocumentStatus', () => {
      it('should update document status to signed', async () => {
        const mockDocument = {
          id: 'doc-1',
          status: 'SIGNED',
          signedAt: new Date(),
        };

        (prisma.employeeDocument.update as jest.Mock).mockResolvedValue(mockDocument);

        const result = await onboardingService.updateDocumentStatus(
          'doc-1',
          'SIGNED'
        );

        expect(result.status).toBe('SIGNED');
        expect(result.signedAt).toBeDefined();
      });

      it('should update document status without signedAt for non-signed status', async () => {
        const mockDocument = {
          id: 'doc-1',
          status: 'PENDING',
        };

        (prisma.employeeDocument.update as jest.Mock).mockResolvedValue(mockDocument);

        const result = await onboardingService.updateDocumentStatus(
          'doc-1',
          'PENDING'
        );

        expect(result.status).toBe('PENDING');
      });
    });
  });

  describe('Onboarding Tasks', () => {
    describe('createOnboardingTask', () => {
      it('should create onboarding task', async () => {
        const mockTask = {
          id: 'task-1',
          employeeId: 'employee-1',
          title: 'Setup laptop',
          category: 'IT_SETUP',
          dueDate: new Date('2024-03-15'),
        };

        (prisma.onboardingTask.create as jest.Mock).mockResolvedValue(mockTask);

        const result = await onboardingService.createOnboardingTask({
          employeeId: 'employee-1',
          title: 'Setup laptop',
          category: 'IT_SETUP',
          dueDate: new Date('2024-03-15'),
        });

        expect(result.title).toBe('Setup laptop');
        expect(result.category).toBe('IT_SETUP');
      });
    });

    describe('getEmployeeTasks', () => {
      it('should return all tasks for employee', async () => {
        const mockTasks = [
          { id: 'task-1', title: 'Task 1', status: 'NOT_STARTED' },
          { id: 'task-2', title: 'Task 2', status: 'COMPLETED' },
        ];

        (prisma.onboardingTask.findMany as jest.Mock).mockResolvedValue(mockTasks);

        const result = await onboardingService.getEmployeeTasks('employee-1');

        expect(result).toHaveLength(2);
      });
    });

    describe('updateTaskStatus', () => {
      it('should update task status to completed', async () => {
        const mockTask = {
          id: 'task-1',
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: 'user-1',
        };

        (prisma.onboardingTask.update as jest.Mock).mockResolvedValue(mockTask);

        const result = await onboardingService.updateTaskStatus(
          'task-1',
          'COMPLETED',
          'user-1'
        );

        expect(result.status).toBe('COMPLETED');
        expect(result.completedAt).toBeDefined();
        expect(result.completedById).toBe('user-1');
      });

      it('should update task status without completion data for non-completed status', async () => {
        const mockTask = {
          id: 'task-1',
          status: 'IN_PROGRESS',
        };

        (prisma.onboardingTask.update as jest.Mock).mockResolvedValue(mockTask);

        const result = await onboardingService.updateTaskStatus(
          'task-1',
          'IN_PROGRESS'
        );

        expect(result.status).toBe('IN_PROGRESS');
      });
    });

    describe('assignTask', () => {
      it('should assign task to user', async () => {
        const mockTask = {
          id: 'task-1',
          assignedToId: 'user-1',
        };

        (prisma.onboardingTask.update as jest.Mock).mockResolvedValue(mockTask);

        const result = await onboardingService.assignTask('task-1', 'user-1');

        expect(result.assignedToId).toBe('user-1');
      });
    });

    describe('getOverdueTasks', () => {
      it('should return overdue incomplete tasks', async () => {
        const mockTasks = [
          {
            id: 'task-1',
            title: 'Overdue Task',
            dueDate: new Date('2024-01-01'),
            status: 'NOT_STARTED',
          },
        ];

        (prisma.onboardingTask.findMany as jest.Mock).mockResolvedValue(mockTasks);

        const result = await onboardingService.getOverdueTasks();

        expect(result).toHaveLength(1);
      });
    });
  });

  describe('Onboarding Progress', () => {
    describe('getOnboardingProgress', () => {
      it('should calculate progress correctly', async () => {
        const mockTasks = [
          {
            id: 'task-1',
            status: 'COMPLETED',
            dueDate: new Date('2024-03-01'),
          },
          {
            id: 'task-2',
            status: 'COMPLETED',
            dueDate: new Date('2024-03-02'),
          },
          {
            id: 'task-3',
            status: 'NOT_STARTED',
            dueDate: new Date('2024-03-03'),
          },
        ];

        (prisma.onboardingTask.findMany as jest.Mock).mockResolvedValue(mockTasks);

        const result = await onboardingService.getOnboardingProgress('employee-1');

        expect(result.totalTasks).toBe(3);
        expect(result.completedTasks).toBe(2);
        expect(result.progressPercentage).toBeCloseTo(66.67, 1);
      });

      it('should handle zero tasks', async () => {
        (prisma.onboardingTask.findMany as jest.Mock).mockResolvedValue([]);

        const result = await onboardingService.getOnboardingProgress('employee-1');

        expect(result.totalTasks).toBe(0);
        expect(result.completedTasks).toBe(0);
        expect(result.progressPercentage).toBe(0);
      });

      it('should count overdue tasks', async () => {
        const pastDate = new Date('2020-01-01');
        const mockTasks = [
          {
            id: 'task-1',
            status: 'NOT_STARTED',
            dueDate: pastDate,
          },
          {
            id: 'task-2',
            status: 'IN_PROGRESS',
            dueDate: pastDate,
          },
        ];

        (prisma.onboardingTask.findMany as jest.Mock).mockResolvedValue(mockTasks);

        const result = await onboardingService.getOnboardingProgress('employee-1');

        expect(result.overdueTasks).toBe(2);
      });
    });

    describe('getOnboardingDashboard', () => {
      it('should return dashboard data for all active employees', async () => {
        const mockEmployees = [
          {
            id: 'emp-1',
            firstName: 'John',
            lastName: 'Doe',
            position: 'Developer',
            startDate: new Date('2024-03-01'),
            isActive: true,
            tasks: [
              { status: 'COMPLETED', dueDate: new Date('2024-03-01') },
              { status: 'NOT_STARTED', dueDate: new Date('2024-03-15') },
            ],
          },
          {
            id: 'emp-2',
            firstName: 'Jane',
            lastName: 'Smith',
            position: 'Manager',
            startDate: new Date('2024-03-01'),
            isActive: true,
            tasks: [
              { status: 'COMPLETED', dueDate: new Date('2024-03-01') },
              { status: 'COMPLETED', dueDate: new Date('2024-03-02') },
              { status: 'COMPLETED', dueDate: new Date('2024-03-03') },
            ],
          },
        ];

        (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);

        const result = await onboardingService.getOnboardingDashboard();

        expect(result).toHaveLength(2);
        expect(result[0].employee.firstName).toBe('John');
        expect(result[0].progress.totalTasks).toBe(2);
        expect(result[0].progress.completedTasks).toBe(1);
        expect(result[0].progress.progressPercentage).toBe(50);

        expect(result[1].employee.firstName).toBe('Jane');
        expect(result[1].progress.totalTasks).toBe(3);
        expect(result[1].progress.completedTasks).toBe(3);
        expect(result[1].progress.progressPercentage).toBe(100);
      });
    });
  });
});
