import { emailService } from '../services/email.service';
import { systemSettingsService } from '../services/systemSettings.service';
import nodemailer from 'nodemailer';

// Mock dependencies
jest.mock('nodemailer');
jest.mock('../services/systemSettings.service');

describe('Email Service', () => {
  const mockSendMail = jest.fn();
  const mockTransporter = {
    sendMail: mockSendMail,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  describe('sendEmail', () => {
    it('should send email successfully when SMTP is configured', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'user@example.com',
        smtpPassword: 'password123',
        smtpFromEmail: 'noreply@example.com',
        smtpFromName: 'Test Company',
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          text: 'Test content',
        })
      );
    });

    it('should return false when SMTP is not enabled', async () => {
      const mockSettings = {
        smtpEnabled: false,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should return false when SMTP host is missing', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: null,
        smtpPort: 587,
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should return false when SMTP port is missing', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: null,
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'user@example.com',
        smtpPassword: 'password123',
        smtpFromEmail: 'noreply@example.com',
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(false);
    });

    it('should strip HTML tags for text fallback when not provided', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpFromEmail: 'noreply@example.com',
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Hello <strong>World</strong></p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello World',
        })
      );
    });

    it('should use default from address when not configured', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpFromEmail: null,
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@cflux.local',
        })
      );
    });

    it('should use custom from name when configured', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpFromEmail: 'noreply@example.com',
        smtpFromName: 'My Company',
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"My Company" <noreply@example.com>',
        })
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct content', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpFromEmail: 'noreply@example.com',
        companyName: 'Test Company',
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123',
        'John'
      );

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Company - Passwort zurücksetzen',
        })
      );

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hallo John');
      expect(callArgs.html).toContain('reset-token-123');
      expect(callArgs.html).toContain('Passwort zurücksetzen');
    });

    it('should use default company name when not configured', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpFromEmail: 'noreply@example.com',
        companyName: null,
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123',
        'Jane'
      );

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('CFlux');
      expect(callArgs.html).toContain('CFlux');
    });

    it('should include reset URL with token in both HTML and text', async () => {
      const mockSettings = {
        smtpEnabled: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpFromEmail: 'noreply@example.com',
        companyName: 'Test Company',
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-abc',
        'Alice'
      );

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('reset-password?token=reset-token-abc');
      expect(callArgs.text).toContain('reset-password?token=reset-token-abc');
    });

    it('should return false when SMTP is not configured', async () => {
      const mockSettings = {
        smtpEnabled: false,
        smtpHost: null,
        smtpPort: null,
        companyName: 'Test Company',
      };

      (systemSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123',
        'Bob'
      );

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
