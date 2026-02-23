export interface EmployeeProfile {
  id: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  streetNumber?: string;
  zipCode?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  employeeNumber?: string;
  startDate?: string;
  entryDate?: string;
  exitDate?: string;
  iban?: string;
  bankName?: string;
  bic?: string;
  civilStatus?: string;
  religion?: string;
  ahvNumber?: string;
  healthInsurance?: string;
  isCrossBorderCommuter?: boolean;
  taxId?: string;
  taxClass?: string;
  socialSecurityNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  department?: string;
  position?: string;
  supervisorId?: string;
  salaryEncrypted?: string;
  weeklyHours?: number;
  contractHours?: number;
  hourlyRate?: number;
  canton?: string;
  exemptFromTracking?: boolean;
  vacationDays?: number;
  probationEndDate?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  requiresPasswordChange?: boolean;
  avatarUrl?: string;
  userGroupId?: string; // Deprecated: kept for backwards compatibility
  supervisorId?: string;
  supervisor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  subordinates?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  userGroupMemberships?: Array<{
    userGroup: {
      id: string;
      name: string;
      color?: string;
      isActive: boolean;
    };
  }>;
  employeeProfile?: EmployeeProfile;
  createdAt: string;
  
  // Legacy fields for backwards compatibility - use employeeProfile instead
  vacationDays?: number;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  streetNumber?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  employeeNumber?: string;
  entryDate?: string;
  exitDate?: string;
  iban?: string;
  bankName?: string;
  civilStatus?: string;
  religion?: string;
  ahvNumber?: string;
  isCrossBorderCommuter?: boolean;
  weeklyHours?: number;
  canton?: string;
  exemptFromTracking?: boolean;
  contractHours?: number;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: string;
  name: string;
  description?: string;
  customerId?: string;
  isActive: boolean;
  status?: ProjectStatus;
  defaultHourlyRate?: number;

  // Projektsoll-Vorgaben (für Cutting)
  sollBeginn?: string;        // z.B. "06:00"
  sollEnde?: string;          // z.B. "17:00"
  sollPauseDauer?: number;    // Minuten, default 60
  sollArbeitszeit?: number;   // Stunden, z.B. 10.0
  cuttingAktiv?: boolean;     // Cutting aktiviert
  cuttingTolerance?: number;  // Toleranz in Minuten

  startDate?: string;
  endDate?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  assignments?: ProjectAssignment[];
  stories?: Story[];
}

export interface Story {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  _count?: { timeEntries: number };
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
  customerNumber?: string;
  category?: string;
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

export interface ArticleGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  articles?: Article[];
}

export interface Article {
  id: string;
  articleNumber: string;
  name: string;
  description?: string;
  articleGroupId?: string;
  price: number;
  unit: string;
  vatRate: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  articleGroup?: ArticleGroup;
}

export type DocumentType = 'INVOICE' | 'QUOTE';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'ACCEPTED' | 'DECLINED';

export interface Invoice {
  id: string;
  documentType: DocumentType;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;        // Optional für Angebote
  validUntil?: string;     // Nur für Angebote
  customerId: string;
  templateId?: string;
  status: InvoiceStatus;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  articleId?: string;
  position: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  vatRate: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  article?: Article;
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
  userId?: string; // DEPRECATED: For backwards compatibility
  employeeId: string;
  projectId?: string;
  storyId?: string;
  locationId?: string;
  clockIn: string;
  clockOut?: string;
  status: 'CLOCKED_IN' | 'ON_PAUSE' | 'CLOCKED_OUT';
  description?: string;
  pauseMinutes?: number;
  pauseStartedAt?: string;

  // Projektsoll-Cutting
  sollBeginn?: string;
  sollEnde?: string;
  sollPause?: number;
  abrechenbareStunden?: number;
  nichtAbrechenbar?: number;
  vorSoll?: number;        // Minuten vor Soll-Beginn
  nachSoll?: number;       // Minuten nach Soll-Ende

  // Zuschlagsstunden
  nachtStunden?: number;
  sonntagStunden?: number;
  feiertagStunden?: number;
  samstagStunden?: number;

  // Zuschlagsberechtigungs-Flags
  zuschlagNacht?: boolean;
  zuschlagSonntag?: boolean;
  zuschlagFeiertag?: boolean;
  zuschlagSamstag?: boolean;
  zuschlagGrund?: string;

  createdAt: string;
  updatedAt: string;
  project?: Project;
  story?: Story;
  location?: Location;
  employee?: EmployeeProfile & { id: string; firstName: string; lastName: string; email: string; userId?: string };
  user?: User; // DEPRECATED: For backwards compatibility
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

// Payroll Types
export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED';
export type PayrollType = 'MONTHLY' | 'BONUS' | 'CORRECTION';

export interface PayrollPeriod {
  id: string;
  name: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: PayrollStatus;
  type: PayrollType;
  notes?: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  payrollEntries?: PayrollEntry[];
}

export interface PayrollEntry {
  id: string;
  payrollPeriodId: string;
  userId: string;
  
  // Arbeitsstunden
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  
  // Bruttogehalt & Zuschläge
  baseSalary: number;
  overtimePay: number;
  nightBonus: number;
  sundayBonus: number;
  holidayBonus: number;
  bonus: number;
  commission: number;
  
  // Abzüge
  ahvDeduction: number;
  alvDeduction: number;
  nbuvDeduction: number;
  pensionDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  
  // Berechnet
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  
  // Zusatzinformationen
  absenceDays: number;
  vacationDaysTaken: number;
  sickDays: number;
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  payrollPeriod?: PayrollPeriod;
  user?: User;
}

export interface SalaryConfiguration {
  id: string;
  userId: string;
  
  // Grundgehalt
  monthlySalary: number;
  hourlySalary?: number;
  
  // Zuschlagsätze (in Prozent)
  overtimeRate: number;
  nightRate: number;
  sundayRate: number;
  holidayRate: number;
  
  // Abzugsätze (in Prozent)
  ahvRate: number;
  alvRate: number;
  nbuvRate: number;
  pensionRate: number;
  taxRate: number;
  
  // Aktiv
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  user?: User;
}

export interface JobFunction {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  requirements?: string;
  requirementsEn?: string;
  qualifications?: string;
  qualificationsEn?: string;
  responsibilities?: string;
  responsibilitiesEn?: string;
  department?: string;
  level?: string;
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  employees?: User[];
  _count?: {
    employees: number;
  };
}
