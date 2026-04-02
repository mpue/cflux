import api from './api';

export interface SystemSettings {
  id: string;
  // Company Information
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyTaxId?: string;

  // System Settings
  currency: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  timezone: string;

  // Backup Settings
  autoBackupEnabled: boolean;
  backupInterval: string;
  backupTime: string;
  backupRetention: number;
  lastBackupAt?: string;

  // Email Settings
  smtpEnabled: boolean;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;

  // Invoice Settings
  invoicePrefix: string;
  invoiceNumberStart: number;
  invoiceNumberPadding: number;
  invoiceTermsDays: number;
  invoiceFooter?: string;

  // Feature Flags
  enableWorkflows: boolean;
  enableIncidents: boolean;
  enableCompliance: boolean;
  enableTimeTracking: boolean;

  // Google Maps
  googleMapsApiKey?: string;

  // Time Rounding
  timeRoundingMode: string;
  timeRoundingThreshold: number;

  createdAt: string;
  updatedAt: string;
}

export interface EmailTestRequest {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  testRecipient: string;
}

class SystemSettingsService {
  async getSettings(): Promise<SystemSettings> {
    const response = await api.get('/system-settings');
    return response.data;
  }

  async getPublicSettings(): Promise<Partial<SystemSettings>> {
    const response = await api.get('/system-settings/public');
    return response.data;
  }

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await api.put('/system-settings', data);
    return response.data;
  }

  async testEmailSettings(data: EmailTestRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/system-settings/test-email', data);
    return response.data;
  }

  async uploadLogo(logoData: string): Promise<SystemSettings> {
    const response = await api.post('/system-settings/upload-logo', { logoData });
    return response.data;
  }
}

export const systemSettingsService = new SystemSettingsService();
