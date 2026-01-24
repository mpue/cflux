import { PrismaClient, ApplicantStatus, InterviewType, OnboardingDocumentType } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

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

  // TODO: Send verification email
  // await sendVerificationEmail(applicant.email, verificationToken);

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

export async function updateApplicantStatus(applicantId: string, status: ApplicantStatus) {
  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status },
  });

  // TODO: Send notification email to applicant
  // await sendStatusUpdateEmail(applicant.email, status);

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
}) {
  const interview = await prisma.applicantInterview.create({
    data,
  });

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
