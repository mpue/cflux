import axios from 'axios';
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

const API_URL = process.env.REACT_APP_API_URL || '';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
    
    const response = await axios.get(
      `${API_URL}/api/reminders?${params.toString()}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Einzelne Mahnung abrufen
  getReminderById: async (id: string): Promise<Reminder> => {
    const response = await axios.get(
      `${API_URL}/api/reminders/${id}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Mahnungen für eine Rechnung abrufen
  getRemindersByInvoice: async (invoiceId: string): Promise<Reminder[]> => {
    const response = await axios.get(
      `${API_URL}/api/reminders/invoice/${invoiceId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Neue Mahnung erstellen
  createReminder: async (data: CreateReminderDto): Promise<Reminder> => {
    const response = await axios.post(
      `${API_URL}/api/reminders`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Mahnung aktualisieren
  updateReminder: async (id: string, data: UpdateReminderDto): Promise<Reminder> => {
    const response = await axios.put(
      `${API_URL}/api/reminders/${id}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Mahnung löschen
  deleteReminder: async (id: string): Promise<void> => {
    await axios.delete(
      `${API_URL}/api/reminders/${id}`,
      { headers: getAuthHeader() }
    );
  },

  // Mahnung versenden
  sendReminder: async (id: string, sentBy: string): Promise<Reminder> => {
    const response = await axios.post(
      `${API_URL}/api/reminders/${id}/send`,
      { sentBy },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Mahnung als bezahlt markieren
  markReminderAsPaid: async (id: string): Promise<Reminder> => {
    const response = await axios.post(
      `${API_URL}/api/reminders/${id}/mark-paid`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Überfällige Rechnungen ermitteln
  getOverdueInvoices: async (): Promise<OverdueInvoice[]> => {
    const response = await axios.get(
      `${API_URL}/api/reminders/overdue-invoices`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Mahneinstellungen abrufen
  getReminderSettings: async (): Promise<ReminderSettings> => {
    const response = await axios.get(
      `${API_URL}/api/reminders/settings/current`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Mahneinstellungen aktualisieren
  updateReminderSettings: async (
    id: string,
    data: Partial<ReminderSettings>
  ): Promise<ReminderSettings> => {
    const response = await axios.put(
      `${API_URL}/api/reminders/settings/${id}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Statistiken abrufen
  getReminderStats: async (): Promise<ReminderStats> => {
    const response = await axios.get(
      `${API_URL}/api/reminders/stats`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // PDF herunterladen
  downloadReminderPdf: async (id: string): Promise<Blob> => {
    const response = await axios.get(
      `${API_URL}/api/reminders/${id}/pdf`,
      {
        headers: getAuthHeader(),
        responseType: 'blob'
      }
    );
    return response.data;
  }
};
