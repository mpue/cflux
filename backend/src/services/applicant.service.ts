import { ApplicantStatus, InterviewType, OnboardingDocumentType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { emailService } from './email.service';
import { systemSettingsService } from './systemSettings.service';


/**
 * Applicant Service
 * Handles applicant registration, document management, and interview scheduling
 */

// ==================== APPLICANTS ====================

export async function registerApplicant(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
}) {
  // Check if email already exists
  const existing = await prisma.applicant.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error('Bewerber mit dieser E-Mail existiert bereits');
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const applicant = await prisma.applicant.create({
    data: {
      ...data,
      verificationToken,
      status: ApplicantStatus.NEW,
    },
  });

  // Send verification email
  try {
    await sendVerificationEmail(applicant.email, applicant.firstName, verificationToken);
    console.log(`✅ Verification email sent to ${applicant.email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail the registration if email fails
  }

  return applicant;
}

export async function verifyApplicantEmail(token: string) {
  const applicant = await prisma.applicant.findUnique({
    where: { verificationToken: token },
  });

  if (!applicant) {
    throw new Error('Ungültiger Verifizierungslink');
  }

  return prisma.applicant.update({
    where: { id: applicant.id },
    data: {
      emailVerified: true,
      verificationToken: null,
    },
  });
}
export async function verifyApplicantEmailManual(applicantId: string) {
  return prisma.applicant.update({
    where: { id: applicantId },
    data: {
      emailVerified: true,
      verificationToken: null,
    },
  });
}
export async function getAllApplicants(filters?: {
  status?: ApplicantStatus;
  position?: string;
}) {
  return prisma.applicant.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.position && { position: filters.position }),
    },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
      interviews: {
        orderBy: { scheduledAt: 'desc' },
      },
      _count: {
        select: {
          documents: true,
          interviews: true,
          notes: true,
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  });
}

export async function getApplicantById(applicantId: string) {
  return prisma.applicant.findUnique({
    where: { id: applicantId },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
      interviews: {
        orderBy: { scheduledAt: 'desc' },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      employee: true,
    },
  });
}

export async function getApplicantByEmail(email: string) {
  return prisma.applicant.findUnique({
    where: { email },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
      interviews: {
        orderBy: { scheduledAt: 'desc' },
      },
    },
  });
}

/**
 * Entfernt den zu einem Mitarbeiter gehörenden Onboarding-Datenbestand:
 * - Checklisten-Instanzen, bei denen der Mitarbeiter der/die Betroffene ist
 *   (inkl. zugehöriger Completions via Cascade)
 * - den Mitarbeiter selbst (Onboarding-Tasks, Mitarbeiter-Dokumente,
 *   Equipment-/Trainings-Zuordnungen etc. werden per DB-Cascade entfernt)
 *
 * Der zugehörige User-Account (Login) bleibt bestehen und wird bei einer
 * erneuten Einstellung über die E-Mail wiederverwendet.
 */
async function purgeEmployeeOnboarding(employeeId: string): Promise<void> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    return;
  }

  // Checklisten-Instanzen des Mitarbeiters (als betroffener User) löschen
  if (employee.userId) {
    await prisma.checklistInstance.deleteMany({ where: { userId: employee.userId } });
  }

  // Mitarbeiter löschen – abhängige Datensätze kaskadieren bzw. werden auf NULL gesetzt
  await prisma.employee.delete({ where: { id: employeeId } });
}

/**
 * Setzt einen Bewerber zurück, sodass ein fehlerhafter Onboarding-Prozess neu
 * gestartet werden kann. Der Bewerber bleibt erhalten, aber:
 * - der verknüpfte Mitarbeiter inkl. Onboarding-Daten wird entfernt
 * - die Verknüpfung wird gelöst (employeeId = null)
 * - der Status wird auf einen vor-Einstellungs-Status zurückgesetzt
 *   (Standard: IN_REVIEW)
 */
export async function resetApplicant(
  applicantId: string,
  options?: { status?: ApplicantStatus }
) {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
  });
  if (!applicant) {
    throw new Error('Bewerber nicht gefunden');
  }

  // Verknüpften Mitarbeiter + Onboarding-Daten entfernen
  if (applicant.employeeId) {
    // Zuerst die Verknüpfung lösen, damit das Löschen des Mitarbeiters nicht
    // durch den Fremdschlüssel des Bewerbers blockiert wird
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { employeeId: null },
    });
    await purgeEmployeeOnboarding(applicant.employeeId);
  }

  // Status zurücksetzen (ohne Status-Mail an den Bewerber)
  return prisma.applicant.update({
    where: { id: applicantId },
    data: { status: options?.status ?? ApplicantStatus.IN_REVIEW },
  });
}

/**
 * Löscht einen Bewerber vollständig. Dokumente, Interviews und Notizen werden
 * per DB-Cascade entfernt. Optional wird auch der verknüpfte Mitarbeiter inkl.
 * Onboarding-Daten gelöscht (z. B. um einen fehlerhaften Prozess komplett zu
 * bereinigen).
 */
export async function deleteApplicant(
  applicantId: string,
  options?: { deleteEmployee?: boolean }
) {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
  });
  if (!applicant) {
    throw new Error('Bewerber nicht gefunden');
  }

  const employeeId = applicant.employeeId;

  // Bewerber löschen (Dokumente/Interviews/Notizen kaskadieren). Dadurch wird
  // auch der Fremdschlüssel auf den Mitarbeiter aufgelöst.
  await prisma.applicant.delete({ where: { id: applicantId } });

  // Optional den verknüpften Mitarbeiter inkl. Onboarding-Daten entfernen
  if (options?.deleteEmployee && employeeId) {
    await purgeEmployeeOnboarding(employeeId);
  }

  return { id: applicantId, deletedEmployee: Boolean(options?.deleteEmployee && employeeId) };
}

export async function updateApplicantStatus(applicantId: string, status: ApplicantStatus) {
  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status },
    include: { interviews: true },
  });

  // Send notification email to applicant
  try {
    await sendStatusUpdateEmail(
      applicant.email,
      applicant.firstName,
      status,
      applicant.position
    );
    console.log(`✅ Status update email sent to ${applicant.email} (${status})`);
  } catch (error) {
    console.error('Failed to send status update email:', error);
  }

  return applicant;
}

// ==================== DOCUMENTS ====================

export async function uploadApplicantDocument(data: {
  applicantId: string;
  documentType: OnboardingDocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}) {
  return prisma.applicantDocument.create({
    data,
  });
}

export async function getApplicantDocuments(applicantId: string) {
  return prisma.applicantDocument.findMany({
    where: { applicantId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function deleteApplicantDocument(documentId: string) {
  return prisma.applicantDocument.delete({
    where: { id: documentId },
  });
}

export async function getDocumentById(documentId: string) {
  return prisma.applicantDocument.findUnique({
    where: { id: documentId },
  });
}

export async function checkRequiredDocuments(applicantId: string) {
  const documents = await prisma.applicantDocument.findMany({
    where: { applicantId },
    select: { documentType: true },
  });

  const requiredTypes: OnboardingDocumentType[] = ['CV', 'CERTIFICATE', 'COVER_LETTER'];
  const uploadedTypes = documents.map(doc => doc.documentType);

  return {
    allUploaded: requiredTypes.every(type => uploadedTypes.includes(type)),
    missing: requiredTypes.filter(type => !uploadedTypes.includes(type)),
    uploaded: uploadedTypes,
  };
}

// ==================== INTERVIEWS ====================

export async function scheduleInterview(data: {
  applicantId: string;
  interviewType: InterviewType;
  scheduledAt: Date;
  duration: number;
  location?: string;
  meetingLink?: string;
  interviewerIds: string[];
  notes?: string;
}) {
  const interview = await prisma.applicantInterview.create({
    data,
    include: {
      applicant: true,
    },
  });

  // Update applicant status to INTERVIEW_SCHEDULED
  await prisma.applicant.update({
    where: { id: data.applicantId },
    data: { status: ApplicantStatus.INTERVIEW_SCHEDULED },
  });

  // Send interview invitation email to applicant
  try {
    await sendInterviewInvitationEmail(
      interview.applicant.email,
      interview.applicant.firstName,
      interview.applicant.position,
      data.interviewType,
      data.scheduledAt,
      data.location || data.meetingLink,
      data.notes
    );
    console.log(`✅ Interview invitation sent to ${interview.applicant.email}`);
  } catch (error) {
    console.error('Failed to send interview invitation:', error);
  }

  // TODO: Send calendar invitations to interviewers
  // await sendCalendarInvitations(interview);

  return interview;
}

export async function getApplicantInterviews(applicantId: string) {
  return prisma.applicantInterview.findMany({
    where: { applicantId },
    orderBy: { scheduledAt: 'desc' },
  });
}

export async function updateInterview(
  interviewId: string,
  data: {
    notes?: string;
    rating?: number;
    recommendation?: string;
  }
) {
  return prisma.applicantInterview.update({
    where: { id: interviewId },
    data,
  });
}

export async function sendInterviewReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  const interviews = await prisma.applicantInterview.findMany({
    where: {
      scheduledAt: {
        gte: tomorrow,
        lte: endOfTomorrow,
      },
      reminderSent: false,
    },
    include: {
      applicant: true,
    },
  });

  for (const interview of interviews) {
    // TODO: Send reminder email
    // await sendInterviewReminder(interview);
    
    await prisma.applicantInterview.update({
      where: { id: interview.id },
      data: { reminderSent: true },
    });
  }

  return interviews.length;
}

// ==================== NOTES ====================

export async function addApplicantNote(data: {
  applicantId: string;
  authorId: string;
  content: string;
  isInternal?: boolean;
}) {
  return prisma.applicantNote.create({
    data: {
      ...data,
      isInternal: data.isInternal ?? true,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function getApplicantNotes(applicantId: string, includeInternal: boolean = true) {
  return prisma.applicantNote.findMany({
    where: {
      applicantId,
      ...(includeInternal ? {} : { isInternal: false }),
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteApplicantNote(noteId: string) {
  return prisma.applicantNote.delete({
    where: { id: noteId },
  });
}

// ==================== EMAIL NOTIFICATIONS ====================

async function sendVerificationEmail(email: string, firstName: string, token: string) {
  const settings = await systemSettingsService.getSettings();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
  const verifyUrl = `${frontendUrl}/#/applicant/verify?token=${token}`;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Willkommen bei ${companyName}!</h1>
        </div>
        <div class="content">
          <p>Hallo ${firstName},</p>
          <p>vielen Dank für Ihre Bewerbung bei ${companyName}!</p>
          <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Button klicken:</p>
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="button">E-Mail bestätigen</a>
          </div>
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px;">
            ${verifyUrl}
          </p>
          <p>Nach der Bestätigung können Sie Ihre Bewerbungsunterlagen hochladen und den Status Ihrer Bewerbung verfolgen.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Willkommen bei ${companyName}!

Hallo ${firstName},

vielen Dank für Ihre Bewerbung bei ${companyName}!

Bitte bestätigen Sie Ihre E-Mail-Adresse über diesen Link:
${verifyUrl}

Nach der Bestätigung können Sie Ihre Bewerbungsunterlagen hochladen und den Status Ihrer Bewerbung verfolgen.

Mit freundlichen Grüßen,
Ihr ${companyName} Team
  `.trim();

  return emailService.sendEmail({
    to: email,
    subject: `${companyName} - E-Mail bestätigen`,
    html,
    text,
  });
}

async function sendStatusUpdateEmail(
  email: string,
  firstName: string,
  status: ApplicantStatus,
  position: string
) {
  const settings = await systemSettingsService.getSettings();
  const companyName = settings.companyName || 'CFlux';

  const statusMessages: Record<ApplicantStatus, { title: string; message: string }> = {
    NEW: {
      title: 'Bewerbung eingegangen',
      message: 'Wir haben Ihre Bewerbung erhalten und werden sie in Kürze prüfen.',
    },
    IN_REVIEW: {
      title: 'Bewerbung in Prüfung',
      message: 'Ihre Bewerbung wird derzeit von unserem Team geprüft.',
    },
    INTERVIEW_SCHEDULED: {
      title: 'Vorstellungsgespräch geplant',
      message: 'Wir freuen uns, Sie zu einem Vorstellungsgespräch einzuladen! Details finden Sie in Ihrem Bewerberportal.',
    },
    OFFER: {
      title: 'Vertragsangebot',
      message: 'Herzlichen Glückwunsch! Wir möchten Ihnen gerne ein Vertragsangebot unterbreiten.',
    },
    HIRED: {
      title: 'Einstellung bestätigt',
      message: 'Herzlich Willkommen im Team! Weitere Informationen zum Onboarding folgen in Kürze.',
    },
    REJECTED: {
      title: 'Absage',
      message: 'Vielen Dank für Ihr Interesse. Leider müssen wir Ihnen mitteilen, dass wir uns für andere Kandidaten entschieden haben.',
    },
  };

  const statusInfo = statusMessages[status];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${statusInfo.title}</h1>
        </div>
        <div class="content">
          <p>Hallo ${firstName},</p>
          <p><strong>Ihre Bewerbung als ${position}</strong></p>
          <p>${statusInfo.message}</p>
          ${status === 'INTERVIEW_SCHEDULED' ? `
            <p>Sie können alle Details in Ihrem Bewerberportal einsehen:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/#/applicant/login" 
                 style="display: inline-block; background: linear-gradient(to right, #10b981, #0ea5e9); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Zum Bewerberportal
              </a>
            </div>
          ` : ''}
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${statusInfo.title}

Hallo ${firstName},

Ihre Bewerbung als ${position}

${statusInfo.message}

${status === 'INTERVIEW_SCHEDULED' ? `Sie können alle Details in Ihrem Bewerberportal einsehen: ${process.env.FRONTEND_URL || 'http://localhost:3002'}/#/applicant/login` : ''}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen,
Ihr ${companyName} Team
  `.trim();

  return emailService.sendEmail({
    to: email,
    subject: `${companyName} - ${statusInfo.title}`,
    html,
    text,
  });
}

async function sendInterviewInvitationEmail(
  email: string,
  firstName: string,
  position: string,
  interviewType: InterviewType,
  scheduledAt: Date,
  location?: string,
  notes?: string
) {
  const settings = await systemSettingsService.getSettings();
  const companyName = settings.companyName || 'CFlux';

  const typeLabels: Record<InterviewType, string> = {
    PHONE: 'Telefoninterview',
    VIDEO_CALL: 'Videointerview',
    IN_PERSON: 'Persönliches Gespräch',
    ASSESSMENT: 'Assessment',
    TRIAL_WORK: 'Probearbeit',
  };

  const formattedDate = new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(scheduledAt);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: linear-gradient(to right, #10b981, #0ea5e9); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎉 Einladung zum Vorstellungsgespräch</h1>
        </div>
        <div class="content">
          <p>Hallo ${firstName},</p>
          <p>wir freuen uns, Sie zu einem <strong>${typeLabels[interviewType]}</strong> für die Position <strong>${position}</strong> einzuladen!</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📅 Termin-Details</h3>
            <p><strong>Datum & Zeit:</strong> ${formattedDate}</p>
            <p><strong>Art:</strong> ${typeLabels[interviewType]}</p>
            ${location ? `<p><strong>Ort/Link:</strong> ${location}</p>` : ''}
            ${notes ? `<p><strong>Hinweise:</strong> ${notes}</p>` : ''}
          </div>

          <p>Bitte bestätigen Sie den Termin über Ihr Bewerberportal:</p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/#/applicant/login" class="button">
              Zum Bewerberportal
            </a>
          </div>

          <p>Wir freuen uns auf das Gespräch mit Ihnen!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🎉 Einladung zum Vorstellungsgespräch

Hallo ${firstName},

wir freuen uns, Sie zu einem ${typeLabels[interviewType]} für die Position ${position} einzuladen!

📅 Termin-Details:
Datum & Zeit: ${formattedDate}
Art: ${typeLabels[interviewType]}
${location ? `Ort/Link: ${location}` : ''}
${notes ? `Hinweise: ${notes}` : ''}

Bitte bestätigen Sie den Termin über Ihr Bewerberportal:
${process.env.FRONTEND_URL || 'http://localhost:3002'}/#/applicant/login

Wir freuen uns auf das Gespräch mit Ihnen!

Mit freundlichen Grüßen,
Ihr ${companyName} Team
  `.trim();

  return emailService.sendEmail({
    to: email,
    subject: `${companyName} - Einladung zum Vorstellungsgespräch`,
    html,
    text,
  });
}
