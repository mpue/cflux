import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async getSettings(): Promise<SystemSettings> {
    const response = await axios.get(`${API_URL}/system-settings`, this.getAuthHeaders());
    return response.data;
  }

  async getPublicSettings(): Promise<Partial<SystemSettings>> {
    const response = await axios.get(`${API_URL}/system-settings/public`);
    return response.data;
  }

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await axios.put(`${API_URL}/system-settings`, data, this.getAuthHeaders());
    return response.data;
  }

  async testEmailSettings(data: EmailTestRequest): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${API_URL}/system-settings/test-email`, data, this.getAuthHeaders());
    return response.data;
  }

  async uploadLogo(logoData: string): Promise<SystemSettings> {
    const response = await axios.post(
      `${API_URL}/system-settings/upload-logo`,
      { logoData },
      this.getAuthHeaders()
    );
    return response.data;
  }
}

export const systemSettingsService = new SystemSettingsService();
