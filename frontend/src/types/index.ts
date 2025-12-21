export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  vacationDays: number;
  
  // Personalien
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  
  // Kontakt
  phone?: string;
  mobile?: string;
  street?: string;
  streetNumber?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  
  // Anstellung
  employeeNumber?: string;
  entryDate?: string;
  exitDate?: string;
  
  // Bankverbindung
  iban?: string;
  bankName?: string;
  
  // Persönliche Angaben
  civilStatus?: string;
  religion?: string;
  
  // Sozialversicherung & Steuern
  ahvNumber?: string;
  isCrossBorderCommuter?: boolean;
  
  // Swiss Compliance
  weeklyHours?: number;
  canton?: string;
  exemptFromTracking?: boolean;
  contractHours?: number;
  
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  customerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  assignments?: ProjectAssignment[];
}

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  projects?: Project[];
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  userId: string;
  user: User;
  project?: Project;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  locationId?: string;
  clockIn: string;
  clockOut?: string;
  status: 'CLOCKED_IN' | 'ON_PAUSE' | 'CLOCKED_OUT';
  description?: string;
  pauseMinutes?: number;
  pauseStartedAt?: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  location?: Location;
  user?: User;
}

export interface AbsenceRequest {
  id: string;
  userId: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL_LEAVE' | 'UNPAID_LEAVE' | 'OTHER';
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Report {
  totalHours: number;
  totalDays: string;
  totalAbsenceDays?: number;
  byProject?: { name: string; hours: number }[];
  entries: number;
  user?: User;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  canton: string;
  percentage: number;
  createdAt: string;
}

export interface ComplianceViolation {
  id: string;
  userId: string;
  type: 'REST_TIME' | 'MAX_WEEKLY_HOURS' | 'MAX_DAILY_HOURS' | 'MISSING_PAUSE' | 'OVERTIME_LIMIT' | 'NIGHT_WORK' | 'SUNDAY_WORK';
  severity: 'WARNING' | 'CRITICAL';
  date: string;
  description: string;
  actualValue?: string;
  requiredValue?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  createdAt: string;
  user?: User;
}

export interface OvertimeBalance {
  id: string;
  userId: string;
  year: number;
  regularOvertime: number;
  extraTime: number;
  nightHours: number;
  sundayHours: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface ComplianceSettings {
  id: string;
  defaultWeeklyHours: number;
  defaultCanton: string;
  overtimeLimit170: boolean;
  enableAutoWarnings: boolean;
  enableEmailAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceStats {
  unresolvedViolations: number;
  criticalViolations: number;
  recentViolations: number;
  violationsByType: Array<{ type: string; count: number }>;
  topUsersWithViolations: Array<{ 
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    violationCount: number;
  }>;
}
