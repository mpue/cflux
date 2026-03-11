import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addEmployeeToDepartment,
  removeEmployeeFromDepartment,
  getAvailableEmployees,
} from '../departmentService';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('departmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDepartment = {
    id: 'dept-1',
    name: 'Engineering',
    description: 'Software Engineering',
    managerId: 'user-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    employees: [],
  };

  const mockEmployee = {
    id: 'emp-1',
    firstName: 'Max',
    lastName: 'Muster',
    email: 'max@example.com',
    position: 'Developer',
    employeeNumber: 'E001',
  };

  describe('getAllDepartments', () => {
    it('should fetch all departments', async () => {
      mockApi.get.mockResolvedValue({ data: [mockDepartment] });

      const result = await getAllDepartments();

      expect(mockApi.get).toHaveBeenCalledWith('/departments');
      expect(result).toEqual([mockDepartment]);
    });
  });

  describe('getDepartmentById', () => {
    it('should fetch a department by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockDepartment });

      const result = await getDepartmentById('dept-1');

      expect(mockApi.get).toHaveBeenCalledWith('/departments/dept-1');
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('createDepartment', () => {
    it('should create a department', async () => {
      const data = { name: 'Engineering', description: 'Software Engineering' };
      mockApi.post.mockResolvedValue({ data: mockDepartment });

      const result = await createDepartment(data);

      expect(mockApi.post).toHaveBeenCalledWith('/departments', data);
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('updateDepartment', () => {
    it('should update a department', async () => {
      const data = { name: 'Engineering Updated' };
      const updated = { ...mockDepartment, ...data };
      mockApi.put.mockResolvedValue({ data: updated });

      const result = await updateDepartment('dept-1', data);

      expect(mockApi.put).toHaveBeenCalledWith('/departments/dept-1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteDepartment', () => {
    it('should delete a department', async () => {
      mockApi.delete.mockResolvedValue({});

      await deleteDepartment('dept-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/departments/dept-1');
    });
  });

  describe('addEmployeeToDepartment', () => {
    it('should add an employee to a department', async () => {
      mockApi.post.mockResolvedValue({ data: mockEmployee });

      const result = await addEmployeeToDepartment('dept-1', 'emp-1');

      expect(mockApi.post).toHaveBeenCalledWith('/departments/dept-1/employees', { employeeId: 'emp-1' });
      expect(result).toEqual(mockEmployee);
    });
  });

  describe('removeEmployeeFromDepartment', () => {
    it('should remove an employee from a department', async () => {
      mockApi.delete.mockResolvedValue({});

      await removeEmployeeFromDepartment('dept-1', 'emp-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/departments/dept-1/employees/emp-1');
    });
  });

  describe('getAvailableEmployees', () => {
    it('should fetch available employees for a department', async () => {
      mockApi.get.mockResolvedValue({ data: [mockEmployee] });

      const result = await getAvailableEmployees('dept-1');

      expect(mockApi.get).toHaveBeenCalledWith('/departments/dept-1/available-employees');
      expect(result).toEqual([mockEmployee]);
    });
  });
});
