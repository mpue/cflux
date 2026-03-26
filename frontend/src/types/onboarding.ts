// Onboarding Module Types

export enum ApplicantStatus {
  NEW = 'NEW',
  IN_REVIEW = 'IN_REVIEW',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export enum OnboardingDocumentType {
  CV = 'CV',
  CERTIFICATE = 'CERTIFICATE',
  COVER_LETTER = 'COVER_LETTER',
  CONTRACT = 'CONTRACT',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  IT_GUIDELINES = 'IT_GUIDELINES',
  NDA = 'NDA',
  CONFIDENTIALITY = 'CONFIDENTIALITY',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  SIGNED = 'SIGNED',
  ARCHIVED = 'ARCHIVED',
}

export enum InterviewType {
  PHONE = 'PHONE',
  VIDEO_CALL = 'VIDEO_CALL',
  IN_PERSON = 'IN_PERSON',
  ASSESSMENT = 'ASSESSMENT',
  TRIAL_WORK = 'TRIAL_WORK',
}

export enum OnboardingTaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

export enum EquipmentCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  DAMAGED = 'DAMAGED',
}

export enum TrainingStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ==================== APPLICANT ====================

export interface Applicant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  emailVerified: boolean;
  verificationToken?: string;
  status: ApplicantStatus;
  appliedAt: string;
  employeeId?: string;
  createdAt: string;
  updatedAt: string;
  documents?: ApplicantDocument[];
  interviews?: ApplicantInterview[];
  notes?: ApplicantNote[];
  employee?: Employee;
  _count?: {
    documents: number;
    interviews: number;
    notes: number;
  };
}

export interface ApplicantDocument {
  id: string;
  applicantId: string;
  documentType: OnboardingDocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  version: number;
  uploadedAt: string;
}

export interface ApplicantInterview {
  id: string;
  applicantId: string;
  interviewType: InterviewType;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  interviewerIds: string[];
  notes?: string;
  rating?: number;
  recommendation?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicantNote {
  id: string;
  applicantId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ==================== EMPLOYEE ====================

export interface Employee {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
  taxId?: string;
  taxClass?: string;
  religion?: string;
  socialSecurityNumber?: string;
  healthInsurance?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  department?: string;
  position?: string;
  supervisorId?: string;
  startDate?: string;
  probationEndDate?: string;
  salaryEncrypted?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: any;
  supervisor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  applicant?: {
    id: string;
    appliedAt: string;
    position: string;
  };
  documents?: EmployeeDocument[];
  tasks?: OnboardingTask[];
  equipmentAssignments?: EquipmentAssignment[];
  trainingCompletions?: TrainingCompletion[];
  _count?: {
    documents: number;
    tasks: number;
    equipmentAssignments: number;
    trainingCompletions: number;
  };
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: OnboardingDocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  signedAt?: string;
  version: number;
  uploadedAt: string;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ==================== ONBOARDING TASKS ====================

export interface OnboardingTask {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  category: string;
  assignedToId?: string;
  dueDate?: string;
  status: OnboardingTaskStatus;
  completedAt?: string;
  completedById?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  completedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface OnboardingProgress {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progressPercentage: number;
  tasks: OnboardingTask[];
}

export interface OnboardingDashboardItem {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string;
    startDate?: string;
  };
  progress: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    progressPercentage: number;
  };
}

export interface OnboardingJob {
  id: string;
  title: string;
  description?: string;
  department?: string;
  employmentType?: string;
  location?: string;
  workload?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== EQUIPMENT ====================

export interface Equipment {
  id: string;
  name: string;
  category: string;
  description?: string;
  inventoryNumber?: string;
  serialNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignments?: EquipmentAssignment[];
  _count?: {
    assignments: number;
  };
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  employeeId: string;
  assignedAt: string;
  assignedById: string;
  condition: EquipmentCondition;
  notes?: string;
  returnedAt?: string;
  returnCondition?: EquipmentCondition;
  returnNotes?: string;
  signatureEmployeePath?: string;
  signatureResponsiblePath?: string;
  handoverProtocolPath?: string;
  createdAt: string;
  updatedAt: string;
  equipment?: Equipment;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ==================== TRAINING ====================

export interface TrainingCatalog {
  id: string;
  title: string;
  description?: string;
  type: string;
  autoAssignForPositions: string[];
  daysAfterStart?: number;
  isRecurring: boolean;
  recurringMonths?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  trainingSessions?: TrainingSession[];
  _count?: {
    trainingSessions: number;
  };
}

export interface TrainingSession {
  id: string;
  catalogId: string;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  trainerId: string;
  maxParticipants?: number;
  status: TrainingStatus;
  createdAt: string;
  updatedAt: string;
  catalog?: TrainingCatalog;
  trainer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  completions?: TrainingCompletion[];
  _count?: {
    completions: number;
  };
}

export interface TrainingCompletion {
  id: string;
  sessionId: string;
  employeeId: string;
  attended: boolean;
  completedAt?: string;
  certificatePath?: string;
  nextDueDate?: string;
  createdAt: string;
  updatedAt: string;
  session?: TrainingSession;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ==================== FORM DATA TYPES ====================

export interface ApplicantFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
}

export interface EmployeeFormData {
  applicantId: string;
  department?: string;
  supervisorId?: string;
  startDate: string;
  probationEndDate?: string;
}

export interface TaskFormData {
  employeeId: string;
  title: string;
  description?: string;
  category: string;
  assignedToId?: string;
  dueDate?: string;
}

export interface OnboardingJobFormData {
  title: string;
  description?: string;
  department?: string;
  employmentType?: string;
  location?: string;
  workload?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface EquipmentFormData {
  name: string;
  category: string;
  description?: string;
  inventoryNumber?: string;
  serialNumber?: string;
}

export interface TrainingCatalogFormData {
  title: string;
  description?: string;
  type: string;
  autoAssignForPositions?: string[];
  daysAfterStart?: number;
  isRecurring?: boolean;
  recurringMonths?: number;
}

export interface TrainingSessionFormData {
  catalogId: string;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  trainerId: string;
  maxParticipants?: number;
}
