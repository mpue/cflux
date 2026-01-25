import api from './api';
import {
  Applicant,
  ApplicantDocument,
  ApplicantInterview,
  ApplicantNote,
  Employee,
  EmployeeDocument,
  OnboardingTask,
  OnboardingProgress,
  OnboardingDashboardItem,
  Equipment,
  EquipmentAssignment,
  TrainingCatalog,
  TrainingSession,
  TrainingCompletion,
  ApplicantFormData,
  EmployeeFormData,
  TaskFormData,
  EquipmentFormData,
  TrainingCatalogFormData,
  TrainingSessionFormData,
  ApplicantStatus,
  DocumentStatus,
  OnboardingTaskStatus,
} from '../types/onboarding';

// ==================== APPLICANTS ====================

export const applicantService = {
  // Register new applicant (public)
  register: async (data: ApplicantFormData): Promise<Applicant> => {
    const response = await api.post('/applicants/register', data);
    return response.data;
  },

  // Verify email (public)
  verifyEmail: async (token: string): Promise<{ message: string; applicant: Applicant }> => {
    const response = await api.get(`/applicants/verify/${token}`);
    return response.data;
  },

  // Get all applicants
  getAll: async (filters?: { status?: ApplicantStatus; position?: string }): Promise<Applicant[]> => {
    const response = await api.get('/applicants/admin/applicants', { params: filters });
    return response.data;
  },

  // Get single applicant
  getById: async (id: string): Promise<Applicant> => {
    const response = await api.get(`/applicants/${id}`);
    return response.data;
  },

  // Update applicant status
  updateStatus: async (id: string, status: ApplicantStatus): Promise<Applicant> => {
    const response = await api.patch(`/applicants/${id}/status`, { status });
    return response.data;
  },

  // Upload document
  uploadDocument: async (applicantId: string, file: File, documentType: string): Promise<ApplicantDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicantId', applicantId);
    formData.append('documentType', documentType);

    const response = await api.post(`/applicants/${applicantId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get applicant documents
  getDocuments: async (id: string): Promise<ApplicantDocument[]> => {
    const response = await api.get(`/applicants/${id}/documents`);
    return response.data;
  },

  // Delete document
  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/applicants/documents/${documentId}`);
  },

  // Check required documents
  checkRequiredDocuments: async (id: string): Promise<{ allUploaded: boolean; missing: string[]; uploaded: string[] }> => {
    const response = await api.get(`/applicants/${id}/documents/check`);
    return response.data;
  },

  // Schedule interview
  scheduleInterview: async (data: any): Promise<ApplicantInterview> => {
    const response = await api.post('/applicants/interviews', data);
    return response.data;
  },

  // Get applicant interviews
  getInterviews: async (id: string): Promise<ApplicantInterview[]> => {
    const response = await api.get(`/applicants/${id}/interviews`);
    return response.data;
  },

  // Update interview
  updateInterview: async (interviewId: string, data: any): Promise<ApplicantInterview> => {
    const response = await api.patch(`/applicants/interviews/${interviewId}`, data);
    return response.data;
  },

  // Add note
  addNote: async (applicantId: string, content: string, isInternal: boolean = true): Promise<ApplicantNote> => {
    const response = await api.post(`/applicants/${applicantId}/notes`, { content, isInternal });
    return response.data;
  },

  // Get notes
  getNotes: async (id: string, includeInternal: boolean = true): Promise<ApplicantNote[]> => {
    const response = await api.get(`/applicants/${id}/notes`, { params: { includeInternal } });
    return response.data;
  },

  // Delete note
  deleteNote: async (noteId: string): Promise<void> => {
    await api.delete(`/applicants/notes/${noteId}`);
  },
};

// ==================== ONBOARDING ====================

export const onboardingService = {
  // Hire applicant
  hireApplicant: async (data: EmployeeFormData): Promise<Employee> => {
    const response = await api.post('/onboarding/hire', data);
    return response.data;
  },

  // Get all employees
  getAllEmployees: async (filters?: { department?: string; isActive?: boolean }): Promise<Employee[]> => {
    const response = await api.get('/onboarding/employees', { params: filters });
    return response.data;
  },

  // Get single employee
  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await api.get(`/onboarding/employees/${id}`);
    return response.data;
  },

  // Update employee
  updateEmployee: async (id: string, data: any): Promise<Employee> => {
    const response = await api.put(`/onboarding/employees/${id}`, data);
    return response.data;
  },

  // Upload employee document
  uploadDocument: async (employeeId: string, file: File, documentType: string): Promise<EmployeeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeId', employeeId);
    formData.append('documentType', documentType);

    const response = await api.post(`/onboarding/employees/${employeeId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get employee documents
  getDocuments: async (id: string): Promise<EmployeeDocument[]> => {
    const response = await api.get(`/onboarding/employees/${id}/documents`);
    return response.data;
  },

  // Update document status
  updateDocumentStatus: async (documentId: string, status: DocumentStatus): Promise<EmployeeDocument> => {
    const response = await api.patch(`/onboarding/documents/${documentId}/status`, { status });
    return response.data;
  },

  // Create task
  createTask: async (data: TaskFormData): Promise<OnboardingTask> => {
    const response = await api.post('/onboarding/tasks', data);
    return response.data;
  },

  // Get employee tasks
  getTasks: async (id: string): Promise<OnboardingTask[]> => {
    const response = await api.get(`/onboarding/employees/${id}/tasks`);
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (taskId: string, status: OnboardingTaskStatus): Promise<OnboardingTask> => {
    const response = await api.patch(`/onboarding/tasks/${taskId}/status`, { status });
    return response.data;
  },

  // Assign task
  assignTask: async (taskId: string, assignedToId: string): Promise<OnboardingTask> => {
    const response = await api.patch(`/onboarding/tasks/${taskId}/assign`, { assignedToId });
    return response.data;
  },

  // Get overdue tasks
  getOverdueTasks: async (): Promise<OnboardingTask[]> => {
    const response = await api.get('/onboarding/tasks/overdue');
    return response.data;
  },

  // Get onboarding progress
  getProgress: async (id: string): Promise<OnboardingProgress> => {
    const response = await api.get(`/onboarding/employees/${id}/progress`);
    return response.data;
  },

  // Get onboarding dashboard
  getDashboard: async (): Promise<OnboardingDashboardItem[]> => {
    const response = await api.get('/onboarding/dashboard');
    return response.data;
  },
};

// ==================== EQUIPMENT ====================

export const equipmentService = {
  // Get all equipment
  getAll: async (filters?: { category?: string; isActive?: boolean }): Promise<Equipment[]> => {
    const response = await api.get('/equipment-training/equipment', { params: filters });
    return response.data;
  },

  // Get single equipment
  getById: async (id: string): Promise<Equipment> => {
    const response = await api.get(`/equipment-training/equipment/${id}`);
    return response.data;
  },

  // Create equipment
  create: async (data: EquipmentFormData): Promise<Equipment> => {
    const response = await api.post('/equipment-training/equipment', data);
    return response.data;
  },

  // Update equipment
  update: async (id: string, data: Partial<EquipmentFormData>): Promise<Equipment> => {
    const response = await api.put(`/equipment-training/equipment/${id}`, data);
    return response.data;
  },

  // Assign equipment
  assign: async (data: any): Promise<EquipmentAssignment> => {
    const response = await api.post('/equipment-training/equipment/assign', data);
    return response.data;
  },

  // Get employee equipment
  getEmployeeEquipment: async (employeeId: string): Promise<EquipmentAssignment[]> => {
    const response = await api.get(`/equipment-training/equipment/employee/${employeeId}`);
    return response.data;
  },

  // Return equipment
  returnEquipment: async (assignmentId: string, data: any): Promise<EquipmentAssignment> => {
    const response = await api.patch(`/equipment-training/equipment/assignments/${assignmentId}/return`, data);
    return response.data;
  },

  // Generate handover protocol
  generateProtocol: async (assignmentId: string): Promise<{ filePath: string; message: string }> => {
    const response = await api.post(`/equipment-training/equipment/assignments/${assignmentId}/protocol`);
    return response.data;
  },
};

// ==================== TRAINING ====================

export const trainingService = {
  // Get all training catalog
  getAllCatalog: async (filters?: { type?: string; isActive?: boolean; isRecurring?: boolean }): Promise<TrainingCatalog[]> => {
    const response = await api.get('/equipment-training/training/catalog', { params: filters });
    return response.data;
  },

  // Get single training catalog
  getCatalogById: async (id: string): Promise<TrainingCatalog> => {
    const response = await api.get(`/equipment-training/training/catalog/${id}`);
    return response.data;
  },

  // Create training catalog
  createCatalog: async (data: TrainingCatalogFormData): Promise<TrainingCatalog> => {
    const response = await api.post('/equipment-training/training/catalog', data);
    return response.data;
  },

  // Update training catalog
  updateCatalog: async (id: string, data: Partial<TrainingCatalogFormData>): Promise<TrainingCatalog> => {
    const response = await api.put(`/equipment-training/training/catalog/${id}`, data);
    return response.data;
  },

  // Create training session
  createSession: async (data: TrainingSessionFormData): Promise<TrainingSession> => {
    const response = await api.post('/equipment-training/training/sessions', data);
    return response.data;
  },

  // Get all training sessions
  getAllSessions: async (filters?: any): Promise<TrainingSession[]> => {
    const response = await api.get('/equipment-training/training/sessions', { params: filters });
    return response.data;
  },

  // Get single training session
  getSessionById: async (id: string): Promise<TrainingSession> => {
    const response = await api.get(`/equipment-training/training/sessions/${id}`);
    return response.data;
  },

  // Update training session
  updateSession: async (id: string, data: any): Promise<TrainingSession> => {
    const response = await api.put(`/equipment-training/training/sessions/${id}`, data);
    return response.data;
  },

  // Assign employee to training
  assignEmployee: async (sessionId: string, employeeId: string): Promise<TrainingCompletion> => {
    const response = await api.post('/equipment-training/training/assign', { sessionId, employeeId });
    return response.data;
  },

  // Mark training completed
  markCompleted: async (completionId: string, data: any): Promise<TrainingCompletion> => {
    const response = await api.patch(`/equipment-training/training/completions/${completionId}`, data);
    return response.data;
  },

  // Get employee trainings
  getEmployeeTrainings: async (employeeId: string): Promise<TrainingCompletion[]> => {
    const response = await api.get(`/equipment-training/training/employee/${employeeId}`);
    return response.data;
  },
};
