import api from './api';

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employees: DepartmentEmployee[];
}

export interface DepartmentEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  employeeNumber?: string;
  departmentId?: string;
  departmentRef?: { name: string };
}

export const getAllDepartments = async (): Promise<Department[]> => {
  const response = await api.get('/departments');
  return response.data;
};

export const getDepartmentById = async (id: string): Promise<Department> => {
  const response = await api.get(`/departments/${id}`);
  return response.data;
};

export const createDepartment = async (data: Partial<Department>): Promise<Department> => {
  const response = await api.post('/departments', data);
  return response.data;
};

export const updateDepartment = async (id: string, data: Partial<Department>): Promise<Department> => {
  const response = await api.put(`/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/departments/${id}`);
};

export const addEmployeeToDepartment = async (departmentId: string, employeeId: string): Promise<DepartmentEmployee> => {
  const response = await api.post(`/departments/${departmentId}/employees`, { employeeId });
  return response.data;
};

export const removeEmployeeFromDepartment = async (departmentId: string, employeeId: string): Promise<void> => {
  await api.delete(`/departments/${departmentId}/employees/${employeeId}`);
};

export const getAvailableEmployees = async (departmentId: string): Promise<DepartmentEmployee[]> => {
  const response = await api.get(`/departments/${departmentId}/available-employees`);
  return response.data;
};
