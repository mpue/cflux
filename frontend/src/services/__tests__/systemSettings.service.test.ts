import axios from 'axios';
import { systemSettingsService, SystemSettings, EmailTestRequest } from '../systemSettings.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SystemSettings Service - Complete Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token-123');
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getSettings', () => {
    it('should get all system settings', async () => {
      const mockSettings: SystemSettings = {
        id: 'settings-1',
        companyName: 'Tech Solutions AG',
        companyLogo: 'https://example.com/logo.png',
        companyAddress: 'Bahnhofstrasse 123, 8001 Zürich, Schweiz',
        companyPhone: '+41 44 123 45 67',
        companyEmail: 'info@techsolutions.ch',
        companyWebsite: 'https://www.techsolutions.ch',
        companyTaxId: 'CHE-123.456.789',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: true,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        lastBackupAt: '2026-01-01T02:00:00Z',
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: 'noreply@techsolutions.ch',
        smtpPassword: 'encrypted-password',
        smtpFromEmail: 'noreply@techsolutions.ch',
        smtpFromName: 'Tech Solutions',
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        invoiceFooter: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: mockSettings });

      const result = await systemSettingsService.getSettings();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/system-settings'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockSettings);
      expect(result.companyName).toBe('Tech Solutions AG');
    });

    it('should get settings with minimal configuration', async () => {
      const mockSettings: SystemSettings = {
        id: 'settings-minimal',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 7,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'INV',
        invoiceNumberStart: 1,
        invoiceNumberPadding: 4,
        invoiceTermsDays: 14,
        enableWorkflows: false,
        enableIncidents: false,
        enableCompliance: false,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: mockSettings });

      const result = await systemSettingsService.getSettings();

      expect(result.companyName).toBeUndefined();
      expect(result.enableTimeTracking).toBe(true);
    });

    it('should handle get settings error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Settings not found'));

      await expect(systemSettingsService.getSettings())
        .rejects.toThrow('Settings not found');
    });
  });

  describe('READ - getPublicSettings', () => {
    it('should get public settings without authentication', async () => {
      const mockPublicSettings: Partial<SystemSettings> = {
        companyName: 'Tech Solutions AG',
        companyLogo: 'https://example.com/logo.png',
        companyAddress: 'Bahnhofstrasse 123, 8001 Zürich',
        companyPhone: '+41 44 123 45 67',
        companyEmail: 'info@techsolutions.ch',
        companyWebsite: 'https://www.techsolutions.ch',
        currency: 'CHF',
        language: 'de',
      };

      mockedAxios.get.mockResolvedValue({ data: mockPublicSettings });

      const result = await systemSettingsService.getPublicSettings();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/system-settings/public')
      );
      expect(result).toEqual(mockPublicSettings);
      expect(result.smtpPassword).toBeUndefined();
    });

    it('should get public settings with minimal data', async () => {
      const mockPublicSettings: Partial<SystemSettings> = {
        companyName: 'My Company',
        currency: 'CHF',
      };

      mockedAxios.get.mockResolvedValue({ data: mockPublicSettings });

      const result = await systemSettingsService.getPublicSettings();

      expect(result.companyName).toBe('My Company');
      expect(result.currency).toBe('CHF');
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateSettings', () => {
    it('should update company information', async () => {
      const updateData: Partial<SystemSettings> = {
        companyName: 'Updated Tech Solutions AG',
        companyAddress: 'Seestrasse 456, 8008 Zürich, Schweiz',
        companyPhone: '+41 44 987 65 43',
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        companyName: 'Updated Tech Solutions AG',
        companyAddress: 'Seestrasse 456, 8008 Zürich, Schweiz',
        companyPhone: '+41 44 987 65 43',
        companyEmail: 'info@techsolutions.ch',
        companyTaxId: 'CHE-123.456.789',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: true,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: true,
        smtpPort: 587,
        smtpSecure: true,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/system-settings'),
        updateData,
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result.companyName).toBe('Updated Tech Solutions AG');
      expect(result.companyAddress).toContain('Seestrasse');
    });

    it('should update email settings', async () => {
      const updateData: Partial<SystemSettings> = {
        smtpEnabled: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'user@gmail.com',
        smtpPassword: 'new-password',
        smtpFromEmail: 'noreply@company.com',
        smtpFromName: 'Company Name',
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: true,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'user@gmail.com',
        smtpPassword: 'new-password',
        smtpFromEmail: 'noreply@company.com',
        smtpFromName: 'Company Name',
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.smtpHost).toBe('smtp.gmail.com');
      expect(result.smtpPort).toBe(465);
      expect(result.smtpSecure).toBe(true);
    });

    it('should update backup settings', async () => {
      const updateData: Partial<SystemSettings> = {
        autoBackupEnabled: true,
        backupInterval: 'weekly',
        backupTime: '03:30',
        backupRetention: 60,
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: true,
        backupInterval: 'weekly',
        backupTime: '03:30',
        backupRetention: 60,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.backupInterval).toBe('weekly');
      expect(result.backupTime).toBe('03:30');
      expect(result.backupRetention).toBe(60);
    });

    it('should update invoice settings', async () => {
      const updateData: Partial<SystemSettings> = {
        invoicePrefix: 'INV',
        invoiceNumberStart: 2000,
        invoiceNumberPadding: 6,
        invoiceTermsDays: 14,
        invoiceFooter: 'Vielen Dank für Ihr Vertrauen!',
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'INV',
        invoiceNumberStart: 2000,
        invoiceNumberPadding: 6,
        invoiceTermsDays: 14,
        invoiceFooter: 'Vielen Dank für Ihr Vertrauen!',
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.invoicePrefix).toBe('INV');
      expect(result.invoiceNumberStart).toBe(2000);
      expect(result.invoiceFooter).toContain('Vertrauen');
    });

    it('should update feature flags', async () => {
      const updateData: Partial<SystemSettings> = {
        enableWorkflows: false,
        enableIncidents: false,
        enableCompliance: true,
        enableTimeTracking: true,
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: false,
        enableIncidents: false,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.enableWorkflows).toBe(false);
      expect(result.enableCompliance).toBe(true);
    });

    it('should update regional settings', async () => {
      const updateData: Partial<SystemSettings> = {
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        language: 'en',
        timezone: 'Europe/London',
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        language: 'en',
        timezone: 'Europe/London',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.currency).toBe('EUR');
      expect(result.language).toBe('en');
      expect(result.timezone).toBe('Europe/London');
    });

    it('should handle update error', async () => {
      const updateData: Partial<SystemSettings> = {
        companyName: 'Invalid',
      };

      mockedAxios.put.mockRejectedValue(new Error('Update failed'));

      await expect(systemSettingsService.updateSettings(updateData))
        .rejects.toThrow('Update failed');
    });
  });

  // ============================================
  // ACTIONS Tests
  // ============================================
  describe('ACTIONS - testEmailSettings', () => {
    it('should test email settings successfully', async () => {
      const emailTestData: EmailTestRequest = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: 'test@gmail.com',
        smtpPassword: 'test-password',
        smtpFromEmail: 'noreply@company.com',
        smtpFromName: 'Test Company',
        testRecipient: 'recipient@example.com',
      };

      const mockResponse = {
        success: true,
        message: 'Test email sent successfully',
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await systemSettingsService.testEmailSettings(emailTestData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/system-settings/test-email'),
        emailTestData,
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Test email sent successfully');
    });

    it('should handle email test failure', async () => {
      const emailTestData: EmailTestRequest = {
        smtpHost: 'invalid-host',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'test@gmail.com',
        smtpPassword: 'wrong-password',
        smtpFromEmail: 'noreply@company.com',
        smtpFromName: 'Test Company',
        testRecipient: 'recipient@example.com',
      };

      const mockResponse = {
        success: false,
        message: 'SMTP connection failed: Invalid host',
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await systemSettingsService.testEmailSettings(emailTestData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });

    it('should handle network error during email test', async () => {
      const emailTestData: EmailTestRequest = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: 'test@gmail.com',
        smtpPassword: 'test-password',
        smtpFromEmail: 'noreply@company.com',
        smtpFromName: 'Test Company',
        testRecipient: 'recipient@example.com',
      };

      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(systemSettingsService.testEmailSettings(emailTestData))
        .rejects.toThrow('Network error');
    });
  });

  describe('ACTIONS - uploadLogo', () => {
    it('should upload company logo successfully', async () => {
      const logoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        companyName: 'Tech Solutions AG',
        companyLogo: 'https://example.com/logo-new.png',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.uploadLogo(logoData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/system-settings/upload-logo'),
        { logoData },
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result.companyLogo).toBe('https://example.com/logo-new.png');
    });

    it('should handle logo upload error', async () => {
      const logoData = 'invalid-data';

      mockedAxios.post.mockRejectedValue(new Error('Invalid image format'));

      await expect(systemSettingsService.uploadLogo(logoData))
        .rejects.toThrow('Invalid image format');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Settings Configuration Flow', () => {
    it('should complete full settings configuration', async () => {
      // GET initial settings
      const initialSettings: SystemSettings = {
        id: 'settings-1',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 7,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'INV',
        invoiceNumberStart: 1,
        invoiceNumberPadding: 4,
        invoiceTermsDays: 14,
        enableWorkflows: false,
        enableIncidents: false,
        enableCompliance: false,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: initialSettings });
      const settings = await systemSettingsService.getSettings();
      expect(settings.companyName).toBeUndefined();

      // UPDATE company information
      const companyUpdate: Partial<SystemSettings> = {
        companyName: 'Swiss Tech AG',
        companyAddress: 'Bahnhofstrasse 1, 8001 Zürich',
        companyEmail: 'info@swisstech.ch',
        companyTaxId: 'CHE-111.222.333',
      };

      const settingsWithCompany: SystemSettings = {
        ...initialSettings,
        ...companyUpdate,
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: settingsWithCompany });
      const updated1 = await systemSettingsService.updateSettings(companyUpdate);
      expect(updated1.companyName).toBe('Swiss Tech AG');

      // UPDATE email settings
      const emailUpdate: Partial<SystemSettings> = {
        smtpEnabled: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: 'user@gmail.com',
        smtpPassword: 'password',
        smtpFromEmail: 'noreply@swisstech.ch',
        smtpFromName: 'Swiss Tech',
      };

      const settingsWithEmail: SystemSettings = {
        ...settingsWithCompany,
        ...emailUpdate,
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: settingsWithEmail });
      const updated2 = await systemSettingsService.updateSettings(emailUpdate);
      expect(updated2.smtpEnabled).toBe(true);

      // TEST email settings
      const emailTest: EmailTestRequest = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: 'user@gmail.com',
        smtpPassword: 'password',
        smtpFromEmail: 'noreply@swisstech.ch',
        smtpFromName: 'Swiss Tech',
        testRecipient: 'test@example.com',
      };

      mockedAxios.post.mockResolvedValue({ data: { success: true, message: 'Test successful' } });
      const testResult = await systemSettingsService.testEmailSettings(emailTest);
      expect(testResult.success).toBe(true);

      // ENABLE feature flags
      const featureUpdate: Partial<SystemSettings> = {
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
      };

      const finalSettings: SystemSettings = {
        ...settingsWithEmail,
        ...featureUpdate,
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: finalSettings });
      const updated3 = await systemSettingsService.updateSettings(featureUpdate);
      expect(updated3.enableWorkflows).toBe(true);
      expect(updated3.enableCompliance).toBe(true);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle settings with special characters', async () => {
      const updateData: Partial<SystemSettings> = {
        companyName: 'Müller & Söhne GmbH',
        companyAddress: 'Zürichstrasse 123, 8000 Zürich',
        invoiceFooter: 'Zahlbar innerhalb 30 Tagen. MwSt.-Nr.: CHE-123.456.789 MWST',
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        companyName: 'Müller & Söhne GmbH',
        companyAddress: 'Zürichstrasse 123, 8000 Zürich',
        invoiceFooter: 'Zahlbar innerhalb 30 Tagen. MwSt.-Nr.: CHE-123.456.789 MWST',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.companyName).toContain('Müller');
      expect(result.companyAddress).toContain('Zürichstrasse');
    });

    it('should handle very long invoice footer', async () => {
      const longFooter = 'Sehr ausführlicher Rechnungsfußtext mit vielen Informationen. '.repeat(20);

      const updateData: Partial<SystemSettings> = {
        invoiceFooter: longFooter,
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        invoiceFooter: longFooter,
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.invoiceFooter?.length).toBeGreaterThan(500);
    });

    it('should handle extreme backup retention values', async () => {
      const updateData: Partial<SystemSettings> = {
        backupRetention: 365,
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: true,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 365,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.backupRetention).toBe(365);
    });

    it('should handle very large logo data', async () => {
      const largeLogo = 'data:image/png;base64,' + 'A'.repeat(100000);

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        companyLogo: 'https://example.com/large-logo.png',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: true,
        enableIncidents: true,
        enableCompliance: true,
        enableTimeTracking: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.uploadLogo(largeLogo);

      expect(result.companyLogo).toBeDefined();
    });

    it('should handle all feature flags disabled', async () => {
      const updateData: Partial<SystemSettings> = {
        enableWorkflows: false,
        enableIncidents: false,
        enableCompliance: false,
        enableTimeTracking: false,
      };

      const mockUpdatedSettings: SystemSettings = {
        id: 'settings-1',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        autoBackupEnabled: false,
        backupInterval: 'daily',
        backupTime: '02:00',
        backupRetention: 30,
        smtpEnabled: false,
        smtpPort: 587,
        smtpSecure: false,
        invoicePrefix: 'RE',
        invoiceNumberStart: 1000,
        invoiceNumberPadding: 5,
        invoiceTermsDays: 30,
        enableWorkflows: false,
        enableIncidents: false,
        enableCompliance: false,
        enableTimeTracking: false,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: mockUpdatedSettings });

      const result = await systemSettingsService.updateSettings(updateData);

      expect(result.enableWorkflows).toBe(false);
      expect(result.enableTimeTracking).toBe(false);
    });
  });
});
