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
  
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignments?: ProjectAssignment[];
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
  status: 'CLOCKED_IN' | 'CLOCKED_OUT';
  description?: string;
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
