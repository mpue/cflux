export enum ReminderLevel {
  FIRST_REMINDER = 'FIRST_REMINDER',
  SECOND_REMINDER = 'SECOND_REMINDER',
  FINAL_REMINDER = 'FINAL_REMINDER'
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  PAID = 'PAID',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED'
}

export interface Reminder {
  id: string;
  invoiceId: string;
  reminderNumber: string;
  level: ReminderLevel;
  status: ReminderStatus;
  reminderDate: string;
  dueDate: string;
  originalAmount: number;
  reminderFee: number;
  interestAmount: number;
  totalAmount: number;
  interestRate: number;
  subject?: string;
  message?: string;
  notes?: string;
  sentDate?: string;
  sentBy?: string;
  paidDate?: string;
  paymentSlipRef?: string;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    customer: {
      id: string;
      name: string;
      email?: string;
    };
  };
}

export interface CreateReminderDto {
  invoiceId: string;
  level?: ReminderLevel;
  dueDate: string;
  reminderFee?: number;
  interestAmount?: number;
  interestRate?: number;
  subject?: string;
  message?: string;
  notes?: string;
}

export interface UpdateReminderDto {
  status?: ReminderStatus;
  dueDate?: string;
  reminderFee?: number;
  interestAmount?: number;
  interestRate?: number;
  subject?: string;
  message?: string;
  notes?: string;
  sentDate?: string;
  paidDate?: string;
}

export interface ReminderSettings {
  id: string;
  firstReminderDays: number;
  secondReminderDays: number;
  finalReminderDays: number;
  firstReminderFee: number;
  secondReminderFee: number;
  finalReminderFee: number;
  defaultInterestRate: number;
  firstReminderPaymentDays: number;
  secondReminderPaymentDays: number;
  finalReminderPaymentDays: number;
  autoSendReminders: boolean;
  autoEscalate: boolean;
  firstReminderTemplate?: string;
  secondReminderTemplate?: string;
  finalReminderTemplate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  reminders: Reminder[];
  daysPastDue: number;
  reminderCount: number;
  lastReminder?: Reminder;
  suggestedLevel: ReminderLevel;
  suggestedFee: number;
  shouldSendReminder: boolean;
}

export interface ReminderStats {
  totalReminders: number;
  byStatus: Array<{
    status: ReminderStatus;
    _count: number;
  }>;
  byLevel: Array<{
    level: ReminderLevel;
    _count: number;
  }>;
  totalFees: number;
  totalInterest: number;
}

// Label-Mappings für UI
export const ReminderLevelLabels: Record<ReminderLevel, string> = {
  [ReminderLevel.FIRST_REMINDER]: '1. Mahnung',
  [ReminderLevel.SECOND_REMINDER]: '2. Mahnung',
  [ReminderLevel.FINAL_REMINDER]: '3. Mahnung / Letzte Mahnung'
};

export const ReminderStatusLabels: Record<ReminderStatus, string> = {
  [ReminderStatus.PENDING]: 'Ausstehend',
  [ReminderStatus.SENT]: 'Versendet',
  [ReminderStatus.PAID]: 'Bezahlt',
  [ReminderStatus.ESCALATED]: 'Eskaliert',
  [ReminderStatus.CANCELLED]: 'Storniert'
};
