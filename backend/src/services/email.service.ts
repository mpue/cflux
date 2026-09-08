import nodemailer from 'nodemailer';
import { systemSettingsService } from './systemSettings.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: string;
    contentType?: string;
    path?: string;
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

  async sendWelcomeEmail(options: {
    email: string;
    firstName: string;
    tempPassword: string;
  }): Promise<boolean> {
    const settings = await systemSettingsService.getSettings();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/#/login`;
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
          .credentials { background: white; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .credentials td { padding: 6px 8px; }
          .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Willkommen bei ${companyName}!</h1>
          </div>
          <div class="content">
            <p>Hallo ${options.firstName},</p>
            <p>Herzlich willkommen im Team! Für Sie wurde ein Zugang zu ${companyName} eingerichtet.</p>
            <p>Mit den folgenden Zugangsdaten können Sie sich anmelden:</p>
            <div class="credentials">
              <table>
                <tr><td style="font-weight:bold;width:140px">Benutzername</td><td style="font-family:monospace">${options.email}</td></tr>
                <tr><td style="font-weight:bold">Passwort</td><td style="font-family:monospace">${options.tempPassword}</td></tr>
              </table>
            </div>
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Jetzt anmelden</a>
            </div>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style="word-break: break-all; background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px;">
              ${loginUrl}
            </p>
            <div class="warning">
              <strong>🔒 Wichtig:</strong><br>
              Aus Sicherheitsgründen müssen Sie beim ersten Login Ihr Passwort ändern.
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
Hallo ${options.firstName},

Herzlich willkommen im Team! Für Sie wurde ein Zugang zu ${companyName} eingerichtet.

Ihre Zugangsdaten:
  Benutzername: ${options.email}
  Passwort: ${options.tempPassword}

Anmelden unter:
${loginUrl}

WICHTIG: Aus Sicherheitsgründen müssen Sie beim ersten Login Ihr Passwort ändern.

Mit freundlichen Grüßen,
Ihr ${companyName} Team
    `.trim();

    return this.sendEmail({
      to: options.email,
      subject: `Willkommen bei ${companyName} – Ihre Zugangsdaten`,
      html,
      text,
    });
  }

  /**
   * Mail an einen bestehenden Benutzer, dessen Passwort ein Administrator
   * zurueckgesetzt hat. Abgrenzung zu sendWelcomeEmail: dort geht es um einen
   * neu eingerichteten Zugang, hier um einen bestehenden.
   */
  async sendOneTimePasswordEmail(options: {
    email: string;
    firstName: string;
    tempPassword: string;
    issuedBy?: string;
  }): Promise<boolean> {
    const settings = await systemSettingsService.getSettings();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/#/login`;
    const companyName = settings.companyName || 'CFlux';
    const issuedByLine = options.issuedBy
      ? `<p>Zurückgesetzt von: ${options.issuedBy}</p>`
      : '';

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
          .credentials { background: white; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .credentials td { padding: 6px 8px; }
          .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Ihr Passwort wurde zurückgesetzt</h1>
          </div>
          <div class="content">
            <p>Hallo ${options.firstName},</p>
            <p>für Ihren Zugang zu ${companyName} wurde ein neues Einmal-Passwort vergeben. Das bisherige Passwort ist damit ungültig.</p>
            <div class="credentials">
              <table>
                <tr><td style="font-weight:bold;width:140px">Benutzername</td><td style="font-family:monospace">${options.email}</td></tr>
                <tr><td style="font-weight:bold">Einmal-Passwort</td><td style="font-family:monospace">${options.tempPassword}</td></tr>
              </table>
            </div>
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Jetzt anmelden</a>
            </div>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style="word-break: break-all; background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px;">
              ${loginUrl}
            </p>
            <div class="warning">
              <strong>🔒 Wichtig:</strong><br>
              Beim nächsten Login müssen Sie dieses Passwort durch ein eigenes ersetzen.
              Falls Sie diese Zurücksetzung nicht erwartet haben, melden Sie sich bitte umgehend bei Ihrem Administrator.
            </div>
            ${issuedByLine}
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
Hallo ${options.firstName},

für Ihren Zugang zu ${companyName} wurde ein neues Einmal-Passwort vergeben.
Das bisherige Passwort ist damit ungültig.

  Benutzername: ${options.email}
  Einmal-Passwort: ${options.tempPassword}

Anmelden unter:
${loginUrl}

WICHTIG: Beim nächsten Login müssen Sie dieses Passwort durch ein eigenes ersetzen.
Falls Sie diese Zurücksetzung nicht erwartet haben, melden Sie sich bitte umgehend
bei Ihrem Administrator.

Mit freundlichen Grüßen,
Ihr ${companyName} Team
    `.trim();

    return this.sendEmail({
      to: options.email,
      subject: `${companyName} – Ihr neues Einmal-Passwort`,
      html,
      text,
    });
  }

  async sendChecklistInvitation(options: {
    subjectUser: { email: string; firstName: string; lastName: string };
    executors?: Array<{ email: string; firstName: string; lastName: string }> | null;
    checklistName: string;
    dueDate: Date;
    notes?: string;
    companyName?: string;
    itemAttachments?: Array<{ filename: string; path: string }>;
  }): Promise<void> {
    const company = options.companyName || 'CFlux';
    const dueDateStr = options.dueDate.toLocaleDateString('de-CH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Verantwortliche ohne den betroffenen Mitarbeiter (Doppel-E-Mail vermeiden)
    const executors = (options.executors || []).filter(
      (e) => e.email !== options.subjectUser.email
    );

    const ics = generateICS({
      summary: `Checkliste fällig: ${options.checklistName}`,
      description: options.notes,
      date: options.dueDate,
      organizer: company,
      attendees: [
        options.subjectUser.email,
        ...executors.map((e) => e.email),
      ],
    });

    // Gemeinsame Anhänge: ICS-Termin + alle Datei-Anhänge der Checklisten-Punkte
    const attachments = [
      { filename: 'checkliste.ics', content: ics, contentType: 'text/calendar; method=REQUEST' },
      ...(options.itemAttachments || []).map((a) => ({ filename: a.filename, path: a.path })),
    ];

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
              ${executors.length ? `<tr><td style="padding:8px;font-weight:bold">Zuständig</td><td style="padding:8px">${executors.map((e) => `${e.firstName} ${e.lastName}`).join(', ')}</td></tr>` : ''}
              ${options.notes ? `<tr style="background:#fff"><td style="padding:8px;font-weight:bold">Notizen</td><td style="padding:8px">${options.notes}</td></tr>` : ''}
            </table>
            <p style="color:#6b7280;font-size:13px">Den Kalendertermin finden Sie als Anhang (ICS-Datei).</p>
          </div>
        </div>
      `,
      attachments,
    });

    // Email an jede/n Verantwortliche/n
    for (const executor of executors) {
      await this.sendEmail({
        to: executor.email,
        subject: `${company} – Checkliste zur Bearbeitung: ${options.checklistName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#10b981,#0ea5e9);color:white;padding:20px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">Checkliste zugewiesen – zur Bearbeitung</h2>
            </div>
            <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
              <p>Hallo ${executor.firstName},</p>
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
        attachments,
      });
    }
  }

  async sendCourseAssignmentEmail(options: {
    recipient: { email: string; firstName: string; lastName: string };
    courseTitle: string;
    courseUrl: string;
    assignedBy?: string;
    dueDate?: Date | null;
    notes?: string | null;
    companyName?: string;
  }): Promise<boolean> {
    const company = options.companyName || 'CFlux';
    const dueDateStr = options.dueDate
      ? options.dueDate.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Kein Fälligkeitsdatum';

    return this.sendEmail({
      to: options.recipient.email,
      subject: `${company} – Kurs zugewiesen: ${options.courseTitle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#10b981,#0ea5e9);color:white;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">Neuer Kurs zugewiesen</h2>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px">
            <p>Hallo ${options.recipient.firstName},</p>
            <p>Ihnen wurde der folgende Kurs zugewiesen:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;font-weight:bold;width:160px">Kurs</td><td style="padding:8px">${options.courseTitle}</td></tr>
              <tr style="background:#fff"><td style="padding:8px;font-weight:bold">Fällig bis</td><td style="padding:8px">${dueDateStr}</td></tr>
              ${options.assignedBy ? `<tr><td style="padding:8px;font-weight:bold">Zugewiesen von</td><td style="padding:8px">${options.assignedBy}</td></tr>` : ''}
              ${options.notes ? `<tr style="background:#fff"><td style="padding:8px;font-weight:bold">Hinweis</td><td style="padding:8px">${options.notes}</td></tr>` : ''}
            </table>
            <p style="margin:24px 0">
              <a href="${options.courseUrl}" style="display:inline-block;background:linear-gradient(to right,#10b981,#0ea5e9);color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600">Kurs jetzt öffnen</a>
            </p>
            <p style="color:#6b7280;font-size:13px">Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>${options.courseUrl}</p>
          </div>
        </div>
      `,
    });
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
