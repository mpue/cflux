import { applicantService, onboardingService, equipmentService, trainingService } from '../onboardingService';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('onboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== APPLICANT SERVICE =====

  describe('applicantService', () => {
    const mockApplicant = {
      id: 'app-1',
      firstName: 'Max',
      lastName: 'Muster',
      email: 'max@example.com',
      position: 'Developer',
      status: 'NEW',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    describe('register', () => {
      it('should register a new applicant', async () => {
        mockApi.post.mockResolvedValue({ data: mockApplicant });
        const data = { firstName: 'Max', lastName: 'Muster', email: 'max@example.com', position: 'Developer' } as any;

        const result = await applicantService.register(data);

        expect(mockApi.post).toHaveBeenCalledWith('/onboarding/applicants/register', data);
        expect(result).toEqual(mockApplicant);
      });
    });

    describe('verifyEmail', () => {
      it('should verify email with token', async () => {
        mockApi.get.mockResolvedValue({ data: { message: 'Verified', applicant: mockApplicant } });

        const result = await applicantService.verifyEmail('token-123');

        expect(mockApi.get).toHaveBeenCalledWith('/onboarding/applicants/verify/token-123');
        expect(result.message).toBe('Verified');
      });
    });

    describe('getAll', () => {
      it('should fetch all applicants', async () => {
        mockApi.get.mockResolvedValue({ data: [mockApplicant] });

        const result = await applicantService.getAll();

        expect(mockApi.get).toHaveBeenCalledWith('/onboarding/applicants', { params: undefined });
        expect(result).toEqual([mockApplicant]);
      });

      it('should fetch applicants with filters', async () => {
        mockApi.get.mockResolvedValue({ data: [mockApplicant] });

        await applicantService.getAll({ status: 'NEW' as any });

        expect(mockApi.get).toHaveBeenCalledWith('/onboarding/applicants', { params: { status: 'NEW' } });
      });
    });

    describe('getById', () => {
      it('should fetch applicant by id', async () => {
        mockApi.get.mockResolvedValue({ data: mockApplicant });

        const result = await applicantService.getById('app-1');

        expect(mockApi.get).toHaveBeenCalledWith('/onboarding/applicants/app-1');
        expect(result).toEqual(mockApplicant);
      });
    });

    describe('updateStatus', () => {
      it('should update applicant status', async () => {
        mockApi.patch.mockResolvedValue({ data: { ...mockApplicant, status: 'INTERVIEW' } });

        const result = await applicantService.updateStatus('app-1', 'INTERVIEW' as any);

        expect(mockApi.patch).toHaveBeenCalledWith('/onboarding/applicants/app-1/status', { status: 'INTERVIEW' });
        expect(result.status).toBe('INTERVIEW');
      });
    });

    describe('addNote', () => {
      it('should add a note to an applicant', async () => {
        const mockNote = { id: 'note-1', content: 'Good candidate', isInternal: true };
        mockApi.post.mockResolvedValue({ data: mockNote });

        const result = await applicantService.addNote('app-1', 'Good candidate', true);

        expect(mockApi.post).toHaveBeenCalledWith('/onboarding/applicants/app-1/notes', {
          content: 'Good candidate',
          isInternal: true,
        });
        expect(result).toEqual(mockNote);
      });
    });

    describe('deleteDocument', () => {
      it('should delete a document', async () => {
        mockApi.delete.mockResolvedValue({});

        await applicantService.deleteDocument('doc-1');

        expect(mockApi.delete).toHaveBeenCalledWith('/onboarding/applicants/documents/doc-1');
      });
    });

    describe('deleteNote', () => {
      it('should delete a note', async () => {
        mockApi.delete.mockResolvedValue({});

        await applicantService.deleteNote('note-1');

        expect(mockApi.delete).toHaveBeenCalledWith('/onboarding/notes/note-1');
      });
    });
  });

  // ===== ONBOARDING SERVICE =====

  describe('onboardingService (employees)', () => {
    const mockEmployee = {
      id: 'emp-1',
      firstName: 'Max',
      lastName: 'Muster',
      email: 'max@example.com',
      department: 'Engineering',
    };

    describe('hireApplicant', () => {
      it('should hire an applicant', async () => {
        mockApi.post.mockResolvedValue({ data: mockEmployee });

        const result = await onboardingService.hireApplicant({ applicantId: 'app-1' } as any);

        expect(mockApi.post).toHaveBeenCalledWith('/onboarding/hire', { applicantId: 'app-1' });
        expect(result).toEqual(mockEmployee);
      });
    });

    describe('getAllEmployees', () => {
      it('should fetch all employees', async () => {
        mockApi.get.mockResolvedValue({ data: [mockEmployee] });

        const result = await onboardingService.getAllEmployees();

        expect(mockApi.get).toHaveBeenCalledWith('/onboarding/employees', { params: undefined });
        expect(result).toEqual([mockEmployee]);
      });
    });

    describe('getEmployeeById', () => {
      it('should fetch employee by id', async () => {
        mockApi.get.mockResolvedValue({ data: mockEmployee });

        const result = await onboardingService.getEmployeeById('emp-1');

        expect(mockApi.get).toHaveBeenCalledWith('/onboarding/employees/emp-1');
        expect(result).toEqual(mockEmployee);
      });
    });

    describe('updateEmployee', () => {
      it('should update an employee', async () => {
        mockApi.put.mockResolvedValue({ data: { ...mockEmployee, department: 'Sales' } });

        const result = await onboardingService.updateEmployee('emp-1', { department: 'Sales' });

        expect(mockApi.put).toHaveBeenCalledWith('/onboarding/employees/emp-1', { department: 'Sales' });
        expect(result.department).toBe('Sales');
      });
    });

    describe('createTask', () => {
      it('should create an onboarding task', async () => {
        const task = { id: 'task-1', title: 'Setup Laptop' };
        mockApi.post.mockResolvedValue({ data: task });

        const result = await onboardingService.createTask({ title: 'Setup Laptop' } as any);

        expect(mockApi.post).toHaveBeenCalledWith('/onboarding/tasks', { title: 'Setup Laptop' });
        expect(result).toEqual(task);
      });
    });

    describe('updateTaskStatus', () => {
      it('should update task status', async () => {
        const task = { id: 'task-1', status: 'COMPLETED' };
        mockApi.patch.mockResolvedValue({ data: task });

        const result = await onboardingService.updateTaskStatus('task-1', 'COMPLETED' as any);

        expect(mockApi.patch).toHaveBeenCalledWith('/onboarding/tasks/task-1/status', { status: 'COMPLETED' });
        expect(result.status).toBe('COMPLETED');
      });
    });

    describe('getOverdueTasks', () => {
      it('should fetch overdue tasks', async () => {
        mockApi.get.mockResolvedValue({ data: [] });

        const result = await onboardingService.getOverdueTasks();

        expect(mockApi.get).toHaveBeenCalledWith('/onboarding/tasks/overdue');
        expect(result).toEqual([]);
      });
    });

    describe('getDashboard', () => {
      it('should fetch onboarding dashboard', async () => {
        mockApi.get.mockResolvedValue({ data: [] });

        const result = await onboardingService.getDashboard();

        expect(mockApi.get).toHaveBeenCalledWith('/onboarding/dashboard');
        expect(result).toEqual([]);
      });
    });
  });

  // ===== EQUIPMENT SERVICE =====

  describe('equipmentService', () => {
    const mockEquipment = {
      id: 'eq-1',
      name: 'MacBook Pro',
      category: 'LAPTOP',
      isActive: true,
    };

    describe('getAll', () => {
      it('should fetch all equipment', async () => {
        mockApi.get.mockResolvedValue({ data: [mockEquipment] });

        const result = await equipmentService.getAll();

        expect(mockApi.get).toHaveBeenCalledWith('/equipment-training/equipment', { params: undefined });
        expect(result).toEqual([mockEquipment]);
      });
    });

    describe('getById', () => {
      it('should fetch equipment by id', async () => {
        mockApi.get.mockResolvedValue({ data: mockEquipment });

        const result = await equipmentService.getById('eq-1');

        expect(mockApi.get).toHaveBeenCalledWith('/equipment-training/equipment/eq-1');
        expect(result).toEqual(mockEquipment);
      });
    });

    describe('create', () => {
      it('should create equipment', async () => {
        mockApi.post.mockResolvedValue({ data: mockEquipment });

        const result = await equipmentService.create({ name: 'MacBook Pro' } as any);

        expect(mockApi.post).toHaveBeenCalledWith('/equipment-training/equipment', { name: 'MacBook Pro' });
        expect(result).toEqual(mockEquipment);
      });
    });

    describe('assign', () => {
      it('should assign equipment', async () => {
        const assignment = { id: 'assign-1', equipmentId: 'eq-1', employeeId: 'emp-1' };
        mockApi.post.mockResolvedValue({ data: assignment });

        const result = await equipmentService.assign({ equipmentId: 'eq-1', employeeId: 'emp-1' });

        expect(mockApi.post).toHaveBeenCalledWith('/equipment-training/equipment/assign', {
          equipmentId: 'eq-1',
          employeeId: 'emp-1',
        });
        expect(result).toEqual(assignment);
      });
    });

    describe('getEmployeeEquipment', () => {
      it('should fetch employee equipment', async () => {
        mockApi.get.mockResolvedValue({ data: [] });

        const result = await equipmentService.getEmployeeEquipment('emp-1');

        expect(mockApi.get).toHaveBeenCalledWith('/equipment-training/equipment/employee/emp-1');
        expect(result).toEqual([]);
      });
    });
  });

  // ===== TRAINING SERVICE =====

  describe('trainingService', () => {
    const mockCatalog = {
      id: 'cat-1',
      name: 'Safety Training',
      type: 'SAFETY',
      isActive: true,
    };

    const mockSession = {
      id: 'sess-1',
      catalogId: 'cat-1',
      date: '2024-06-01T00:00:00.000Z',
    };

    describe('getAllCatalog', () => {
      it('should fetch training catalog', async () => {
        mockApi.get.mockResolvedValue({ data: [mockCatalog] });

        const result = await trainingService.getAllCatalog();

        expect(mockApi.get).toHaveBeenCalledWith('/equipment-training/training/catalog', { params: undefined });
        expect(result).toEqual([mockCatalog]);
      });
    });

    describe('getCatalogById', () => {
      it('should fetch catalog item by id', async () => {
        mockApi.get.mockResolvedValue({ data: mockCatalog });

        const result = await trainingService.getCatalogById('cat-1');

        expect(mockApi.get).toHaveBeenCalledWith('/equipment-training/training/catalog/cat-1');
        expect(result).toEqual(mockCatalog);
      });
    });

    describe('createCatalog', () => {
      it('should create catalog entry', async () => {
        mockApi.post.mockResolvedValue({ data: mockCatalog });

        const result = await trainingService.createCatalog({ name: 'Safety Training' } as any);

        expect(mockApi.post).toHaveBeenCalledWith('/equipment-training/training/catalog', { name: 'Safety Training' });
        expect(result).toEqual(mockCatalog);
      });
    });

    describe('createSession', () => {
      it('should create training session', async () => {
        mockApi.post.mockResolvedValue({ data: mockSession });

        const result = await trainingService.createSession({ catalogId: 'cat-1' } as any);

        expect(mockApi.post).toHaveBeenCalledWith('/equipment-training/training/sessions', { catalogId: 'cat-1' });
        expect(result).toEqual(mockSession);
      });
    });

    describe('assignEmployee', () => {
      it('should assign employee to training', async () => {
        const completion = { id: 'comp-1', sessionId: 'sess-1', employeeId: 'emp-1' };
        mockApi.post.mockResolvedValue({ data: completion });

        const result = await trainingService.assignEmployee('sess-1', 'emp-1');

        expect(mockApi.post).toHaveBeenCalledWith('/equipment-training/training/assign', {
          sessionId: 'sess-1',
          employeeId: 'emp-1',
        });
        expect(result).toEqual(completion);
      });
    });

    describe('getEmployeeTrainings', () => {
      it('should fetch employee trainings', async () => {
        mockApi.get.mockResolvedValue({ data: [] });

        const result = await trainingService.getEmployeeTrainings('emp-1');

        expect(mockApi.get).toHaveBeenCalledWith('/equipment-training/training/employee/emp-1');
        expect(result).toEqual([]);
      });
    });
  });
});
