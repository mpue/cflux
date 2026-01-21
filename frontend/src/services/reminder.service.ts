import api from './api';
import {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ReminderSettings,
  OverdueInvoice,
  ReminderStats,
  ReminderStatus,
  ReminderLevel
} from '../types/reminder.types';

export const reminderService = {
  // Alle Mahnungen abrufen
  getAllReminders: async (filters?: {
    status?: ReminderStatus;
    level?: ReminderLevel;
    customerId?: string;
  }): Promise<Reminder[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    
    const response = await api.get(`/reminders?${params.toString()}`);
    return response.data;
  },

  // Einzelne Mahnung abrufen
  getReminderById: async (id: string): Promise<Reminder> => {
    const response = await api.get(`/reminders/${id}`);
    return response.data;
  },

  // Mahnungen für eine Rechnung abrufen
  getRemindersByInvoice: async (invoiceId: string): Promise<Reminder[]> => {
    const response = await api.get(`/reminders/invoice/${invoiceId}`);
    return response.data;
  },

  // Neue Mahnung erstellen
  createReminder: async (data: CreateReminderDto): Promise<Reminder> => {
    const response = await api.post('/reminders', data);
    return response.data;
  },

  // Mahnung aktualisieren
  updateReminder: async (id: string, data: UpdateReminderDto): Promise<Reminder> => {
    const response = await api.put(`/reminders/${id}`, data);
    return response.data;
  },

  // Mahnung löschen
  deleteReminder: async (id: string): Promise<void> => {
    await api.delete(`/reminders/${id}`);
  },

  // Mahnung versenden
  sendReminder: async (id: string, sentBy: string): Promise<Reminder> => {
    const response = await api.post(`/reminders/${id}/send`, { sentBy });
    return response.data;
  },

  // Mahnung als bezahlt markieren
  markReminderAsPaid: async (id: string): Promise<Reminder> => {
    const response = await api.post(`/reminders/${id}/mark-paid`, {});
    return response.data;
  },

  // Überfällige Rechnungen ermitteln
  getOverdueInvoices: async (): Promise<OverdueInvoice[]> => {
    const response = await api.get('/reminders/overdue-invoices');
    return response.data;
  },

  // Mahneinstellungen abrufen
  getReminderSettings: async (): Promise<ReminderSettings> => {
    const response = await api.get('/reminders/settings/current');
    return response.data;
  },

  // Mahneinstellungen aktualisieren
  updateReminderSettings: async (
    id: string,
    data: Partial<ReminderSettings>
  ): Promise<ReminderSettings> => {
    const response = await api.put(`/reminders/settings/${id}`, data);
    return response.data;
  },

  // Statistiken abrufen
  getReminderStats: async (): Promise<ReminderStats> => {
    const response = await api.get('/reminders/stats');
    return response.data;
  },

  // PDF herunterladen
  downloadReminderPdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/reminders/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
