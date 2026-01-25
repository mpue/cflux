import nodemailer from 'nodemailer';
import { systemSettingsService } from './systemSettings.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private async getTransporter(): Promise<nodemailer.Transporter | null> {
    try {
      const settings = await systemSettingsService.getSettings();

      console.log('🔍 Email settings from DB:', {
        smtpEnabled: settings.smtpEnabled,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpFromEmail: settings.smtpFromEmail,
      });

      if (!settings.smtpEnabled || !settings.smtpHost || !settings.smtpPort) {
        console.log('ℹ️  Email service not configured (SMTP disabled or settings missing)');
        return null;
      }

      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure || false,
        auth: settings.smtpUser && settings.smtpPassword
          ? {
              user: settings.smtpUser,
              pass: settings.smtpPassword,
            }
          : undefined,
      });

      console.log('✅ Email transporter created successfully');
      return transporter;
    } catch (error) {
      console.error('❌ Failed to get email transporter:', error);
      return null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const transporter = await this.getTransporter();
    const settings = await systemSettingsService.getSettings();

    if (!transporter) {
      console.warn('⚠️  Email not sent - service not configured');
      console.log('Would send email to:', options.to);
      console.log('Subject:', options.subject);
      console.log('Body:', options.text || options.html);
      return false;
    }

    try {
      const mailOptions = {
        from: settings.smtpFromEmail 
          ? `"${settings.smtpFromName || 'CFlux'}" <${settings.smtpFromEmail}>`
          : 'noreply@cflux.local',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName: string
  ): Promise<boolean> {
    const settings = await systemSettingsService.getSettings();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/#/reset-password?token=${resetToken}`;

    const companyName = settings.companyName || 'CFlux';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(to right, #10b981, #0ea5e9); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
          .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${companyName} - Passwort zurücksetzen</h1>
          </div>
          <div class="content">
            <p>Hallo ${firstName},</p>
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
            <p>Klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
            </div>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style="word-break: break-all; background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Wichtig:</strong><br>
              Dieser Link ist nur 1 Stunde gültig und kann nur einmal verwendet werden.<br>
              Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte.
            </div>
          </div>
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
            <p>&copy; ${new Date().getFullYear()} ${companyName}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hallo ${firstName},

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.

Bitte öffnen Sie den folgenden Link in Ihrem Browser:
${resetUrl}

Dieser Link ist nur 1 Stunde gültig und kann nur einmal verwendet werden.

Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte.

Mit freundlichen Grüßen,
Ihr ${companyName} Team
    `.trim();

    return this.sendEmail({
      to: email,
      subject: `${companyName} - Passwort zurücksetzen`,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
