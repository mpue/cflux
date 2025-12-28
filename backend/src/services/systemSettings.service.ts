import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SystemSettingsData {
  // Company Information
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyTaxId?: string;

  // System Settings
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  language?: string;
  timezone?: string;

  // Backup Settings
  autoBackupEnabled?: boolean;
  backupInterval?: string;
  backupTime?: string;
  backupRetention?: number;

  // Email Settings
  smtpEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;

  // Invoice Settings
  invoicePrefix?: string;
  invoiceNumberStart?: number;
  invoiceNumberPadding?: number;
  invoiceTermsDays?: number;
  invoiceFooter?: string;

  // Feature Flags
  enableWorkflows?: boolean;
  enableIncidents?: boolean;
  enableCompliance?: boolean;
  enableTimeTracking?: boolean;
}

class SystemSettingsService {
  // Get system settings (returns the first/only record, creates if not exists)
  async getSettings() {
    let settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.systemSettings.create({
        data: {},
      });
    }
    
    return settings;
  }

  // Update system settings
  async updateSettings(data: SystemSettingsData) {
    const existing = await this.getSettings();
    
    return await prisma.systemSettings.update({
      where: { id: existing.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  // Test email configuration
  async testEmailSettings(settings: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
    smtpFromEmail: string;
    smtpFromName: string;
    testRecipient: string;
  }) {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    try {
      await transporter.verify();
      
      // Send test email
      await transporter.sendMail({
        from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
        to: settings.testRecipient,
        subject: 'Test E-Mail von cflux',
        html: '<p>Dies ist eine Test-E-Mail. Ihre SMTP-Konfiguration funktioniert korrekt!</p>',
      });

      return { success: true, message: 'Test-E-Mail erfolgreich versendet' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Upload company logo (Base64)
  async uploadLogo(base64Data: string) {
    const existing = await this.getSettings();
    
    return await prisma.systemSettings.update({
      where: { id: existing.id },
      data: {
        companyLogo: base64Data,
        updatedAt: new Date(),
      },
    });
  }

  // Get public settings (without sensitive data)
  async getPublicSettings() {
    const settings = await this.getSettings();
    
    return {
      companyName: settings.companyName,
      companyLogo: settings.companyLogo,
      currency: settings.currency,
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
      language: settings.language,
      timezone: settings.timezone,
      invoicePrefix: settings.invoicePrefix,
      invoiceTermsDays: settings.invoiceTermsDays,
    };
  }
}

export const systemSettingsService = new SystemSettingsService();
