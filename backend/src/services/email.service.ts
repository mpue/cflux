import nodemailer from 'nodemailer';
import { systemSettingsService } from './systemSettings.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
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
        attachments: options.attachments,
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

  async sendChecklistInvitation(options: {
    subjectUser: { email: string; firstName: string; lastName: string };
    executor?: { email: string; firstName: string; lastName: string } | null;
    checklistName: string;
    dueDate: Date;
    notes?: string;
    companyName?: string;
  }): Promise<void> {
    const company = options.companyName || 'CFlux';
    const dueDateStr = options.dueDate.toLocaleDateString('de-CH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const ics = generateICS({
      summary: `Checkliste fällig: ${options.checklistName}`,
      description: options.notes,
      date: options.dueDate,
      organizer: company,
      attendees: [
        options.subjectUser.email,
        ...(options.executor ? [options.executor.email] : []),
      ],
    });

    // Email to subject user
    await this.sendEmail({
      to: options.subjectUser.email,
      subject: `${company} – Checkliste: ${options.checklistName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#10b981,#0ea5e9);color:white;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">Checkliste zugewiesen</h2>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
            <p>Hallo ${options.subjectUser.firstName},</p>
            <p>Es wurde eine Checkliste für Sie erstellt:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;font-weight:bold;width:140px">Checkliste</td><td style="padding:8px">${options.checklistName}</td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold">Fällig bis</td><td style="padding:8px">${dueDateStr}</td></tr>
              ${options.executor ? `<tr><td style="padding:8px;font-weight:bold">Zuständig</td><td style="padding:8px">${options.executor.firstName} ${options.executor.lastName}</td></tr>` : ''}
              ${options.notes ? `<tr style="background:#fff"><td style="padding:8px;font-weight:bold">Notizen</td><td style="padding:8px">${options.notes}</td></tr>` : ''}
            </table>
            <p style="color:#6b7280;font-size:13px">Den Kalendertermin finden Sie als Anhang (ICS-Datei).</p>
          </div>
        </div>
      `,
      attachments: [{ filename: 'checkliste.ics', content: ics, contentType: 'text/calendar; method=REQUEST' }],
    });

    // Email to executor (if different)
    if (options.executor && options.executor.email !== options.subjectUser.email) {
      await this.sendEmail({
        to: options.executor.email,
        subject: `${company} – Checkliste zur Bearbeitung: ${options.checklistName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#10b981,#0ea5e9);color:white;padding:20px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">Checkliste zugewiesen – zur Bearbeitung</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
              <p>Hallo ${options.executor.firstName},</p>
              <p>Sie wurden als zuständige Person für folgende Checkliste eingetragen:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;font-weight:bold;width:140px">Checkliste</td><td style="padding:8px">${options.checklistName}</td></tr>
                <tr style="background:#fff"><td style="padding:8px;font-weight:bold">Betroffener</td><td style="padding:8px">${options.subjectUser.firstName} ${options.subjectUser.lastName}</td></tr>
                <tr><td style="padding:8px;font-weight:bold">Fällig bis</td><td style="padding:8px">${dueDateStr}</td></tr>
                ${options.notes ? `<tr style="background:#fff"><td style="padding:8px;font-weight:bold">Notizen</td><td style="padding:8px">${options.notes}</td></tr>` : ''}
              </table>
              <p style="color:#6b7280;font-size:13px">Den Kalendertermin finden Sie als Anhang (ICS-Datei).</p>
            </div>
          </div>
        `,
        attachments: [{ filename: 'checkliste.ics', content: ics, contentType: 'text/calendar; method=REQUEST' }],
      });
    }
  }

  async sendChecklistItemNotification(options: {
    notifyUser: { email: string; firstName: string; lastName: string };
    checklistName: string;
    itemTitle: string;
    startDate: Date;
    companyName?: string;
  }): Promise<void> {
    const company = options.companyName || 'CFlux';
    const dateStr = options.startDate.toLocaleDateString('de-CH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const ics = generateICS({
      summary: `Checkliste zugewiesen: ${options.checklistName}`,
      description: `Punkt: ${options.itemTitle}`,
      date: options.startDate,
      organizer: company,
      attendees: [options.notifyUser.email],
    });

    await this.sendEmail({
      to: options.notifyUser.email,
      subject: `${company} – Checkliste zugewiesen: ${options.checklistName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#10b981,#0ea5e9);color:white;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">Checkliste zugewiesen – Benachrichtigung</h2>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
            <p>Hallo ${options.notifyUser.firstName},</p>
            <p>Eine Checkliste wurde zugewiesen. Sie wurden als Benachrichtigungsempfänger für folgenden Punkt eingetragen:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;font-weight:bold;width:140px">Checkliste</td><td style="padding:8px">${options.checklistName}</td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold">Punkt</td><td style="padding:8px">${options.itemTitle}</td></tr>
              <tr><td style="padding:8px;font-weight:bold">Startdatum</td><td style="padding:8px">${dateStr}</td></tr>
            </table>
            <p style="color:#6b7280;font-size:13px">Den Kalendertermin finden Sie als Anhang (ICS-Datei).</p>
          </div>
        </div>
      `,
      attachments: [{ filename: 'checkliste-benachrichtigung.ics', content: ics, contentType: 'text/calendar; method=REQUEST' }],
    });
  }
}

function generateICS(options: {
  summary: string;
  description?: string;
  date: Date;
  organizer: string;
  attendees: string[];
}): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const nextDay = new Date(options.date);
  nextDay.setDate(nextDay.getDate() + 1);
  const uid = `checklist-${Date.now()}@cflux`;
  const now = new Date();
  const dtstamp = `${formatDate(now)}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}Z`;

  const attendeeLines = options.attendees
    .map((email) => `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${email}`)
    .join('\r\n');

  const description = options.description
    ? `DESCRIPTION:${options.description.replace(/\n/g, '\\n')}`
    : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CFlux//CFlux//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${formatDate(options.date)}`,
    `DTEND;VALUE=DATE:${formatDate(nextDay)}`,
    `SUMMARY:${options.summary}`,
    ...(description ? [description] : []),
    `ORGANIZER;CN=${options.organizer}:mailto:noreply@cflux.local`,
    attendeeLines,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export const emailService = new EmailService();
