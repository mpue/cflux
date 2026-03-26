import { PrismaClient } from '@prisma/client';
import { systemSettingsService } from '../services/systemSettings.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

describe('systemSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('returns existing settings when present', async () => {
      const existing = { id: 'settings-1', companyName: 'cflux' };
      (prisma.systemSettings.findFirst as jest.Mock).mockResolvedValue(existing);

      const result = await systemSettingsService.getSettings();

      expect(prisma.systemSettings.findFirst).toHaveBeenCalled();
      expect(prisma.systemSettings.create).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('creates default settings when none exist', async () => {
      const created = { id: 'settings-1' };
      (prisma.systemSettings.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.systemSettings.create as jest.Mock).mockResolvedValue(created);

      const result = await systemSettingsService.getSettings();

      expect(prisma.systemSettings.create).toHaveBeenCalledWith({ data: {} });
      expect(result).toEqual(created);
    });
  });

  describe('updateSettings', () => {
    it('updates settings on existing record', async () => {
      (prisma.systemSettings.findFirst as jest.Mock).mockResolvedValue({ id: 'settings-1' });
      (prisma.systemSettings.update as jest.Mock).mockResolvedValue({
        id: 'settings-1',
        companyName: 'New Name',
      });

      const result = await systemSettingsService.updateSettings({ companyName: 'New Name' });

      expect(prisma.systemSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'settings-1' },
          data: expect.objectContaining({ companyName: 'New Name' }),
        })
      );
      expect(result.companyName).toBe('New Name');
    });
  });

  describe('testEmailSettings', () => {
    it('returns success when verify and sendMail succeed', async () => {
      const verify = jest.fn().mockResolvedValue(undefined);
      const sendMail = jest.fn().mockResolvedValue({});
      nodemailer.createTransport.mockReturnValue({ verify, sendMail });

      const result = await systemSettingsService.testEmailSettings({
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'user',
        smtpPassword: 'pass',
        smtpFromEmail: 'noreply@example.com',
        smtpFromName: 'cflux',
        testRecipient: 'test@example.com',
      });

      expect(verify).toHaveBeenCalled();
      expect(sendMail).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('returns failure when verify fails', async () => {
      const verify = jest.fn().mockRejectedValue(new Error('SMTP failed'));
      const sendMail = jest.fn();
      nodemailer.createTransport.mockReturnValue({ verify, sendMail });

      const result = await systemSettingsService.testEmailSettings({
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'user',
        smtpPassword: 'pass',
        smtpFromEmail: 'noreply@example.com',
        smtpFromName: 'cflux',
        testRecipient: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('SMTP failed');
      expect(sendMail).not.toHaveBeenCalled();
    });
  });

  describe('uploadLogo', () => {
    it('updates company logo on settings record', async () => {
      (prisma.systemSettings.findFirst as jest.Mock).mockResolvedValue({ id: 'settings-1' });
      (prisma.systemSettings.update as jest.Mock).mockResolvedValue({
        id: 'settings-1',
        companyLogo: 'base64logo',
      });

      const result = await systemSettingsService.uploadLogo('base64logo');

      expect(prisma.systemSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'settings-1' },
          data: expect.objectContaining({ companyLogo: 'base64logo' }),
        })
      );
      expect(result.companyLogo).toBe('base64logo');
    });
  });

  describe('getPublicSettings', () => {
    it('returns only public fields', async () => {
      (prisma.systemSettings.findFirst as jest.Mock).mockResolvedValue({
        id: 'settings-1',
        companyName: 'cflux',
        companyLogo: 'logo',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        invoicePrefix: 'INV',
        invoiceTermsDays: 30,
        googleMapsApiKey: 'public-key',
        smtpPassword: 'secret',
      });

      const result = await systemSettingsService.getPublicSettings();

      expect(result).toEqual({
        companyName: 'cflux',
        companyLogo: 'logo',
        currency: 'CHF',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        language: 'de',
        timezone: 'Europe/Zurich',
        invoicePrefix: 'INV',
        invoiceTermsDays: 30,
        googleMapsApiKey: 'public-key',
      });
      expect((result as any).smtpPassword).toBeUndefined();
    });
  });
});
