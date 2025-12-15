export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  vacationDays: number;
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
  clockIn: string;
  clockOut?: string;
  status: 'CLOCKED_IN' | 'CLOCKED_OUT';
  description?: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
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
