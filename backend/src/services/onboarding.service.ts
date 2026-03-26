import { ApplicantStatus, DocumentStatus, OnboardingTaskStatus, OnboardingDocumentType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';


/**
 * Onboarding Service
 * Handles employee creation from applicants, document management, and task tracking
 */

// ==================== EMPLOYEE MANAGEMENT ====================

export async function hireApplicant(data: {
  applicantId: string;
  department?: string;
  supervisorId?: string;
  startDate: Date;
  probationEndDate?: Date;
}) {
  // Get applicant
  const applicant = await prisma.applicant.findUnique({
    where: { id: data.applicantId },
    include: { documents: true },
  });

  if (!applicant) {
    throw new Error('Bewerber nicht gefunden');
  }

  if (applicant.status === ApplicantStatus.HIRED) {
    throw new Error('Bewerber wurde bereits eingestellt');
  }

  // Create employee record
  const employee = await prisma.employee.create({
    data: {
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      email: applicant.email,
      phone: applicant.phone,
      position: applicant.position,
      department: data.department,
      supervisorId: data.supervisorId,
      startDate: data.startDate,
      probationEndDate: data.probationEndDate,
    },
  });

  // Update applicant status and link to employee
  await prisma.applicant.update({
    where: { id: applicant.id },
    data: {
      status: ApplicantStatus.HIRED,
      employeeId: employee.id,
    },
  });

  // Create default onboarding tasks
  await createDefaultOnboardingTasks(employee.id, data.startDate);

  return employee;
}

export async function getAllEmployees(filters?: {
  department?: string;
  isActive?: boolean;
}) {
  return prisma.employee.findMany({
    where: {
      ...(filters?.department && { department: filters.department }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      supervisor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          documents: true,
          tasks: true,
          equipmentAssignments: true,
          trainingCompletions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      supervisor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      applicant: {
        select: {
          id: true,
          appliedAt: true,
          position: true,
        },
      },
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
      tasks: {
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          completedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      equipmentAssignments: {
        where: { returnedAt: null },
        include: {
          equipment: true,
        },
      },
      trainingCompletions: {
        include: {
          session: {
            include: {
              catalog: true,
              trainer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function updateEmployee(employeeId: string, data: any) {
  return prisma.employee.update({
    where: { id: employeeId },
    data,
  });
}

// ==================== ONBOARDING JOBS ====================

export async function getOnboardingJobs(filters?: { isActive?: boolean }) {
  return prisma.onboardingJob.findMany({
    where: {
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    orderBy: [
      { sortOrder: 'asc' },
      { title: 'asc' },
    ],
  });
}

export async function getOnboardingJobById(jobId: string) {
  return prisma.onboardingJob.findUnique({
    where: { id: jobId },
  });
}

export async function createOnboardingJob(data: {
  title: string;
  description?: string;
  department?: string;
  employmentType?: string;
  location?: string;
  workload?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return prisma.onboardingJob.create({
    data,
  });
}

export async function updateOnboardingJob(
  jobId: string,
  data: {
    title?: string;
    description?: string;
    department?: string;
    employmentType?: string;
    location?: string;
    workload?: string;
    requirements?: string;
    responsibilities?: string;
    benefits?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  return prisma.onboardingJob.update({
    where: { id: jobId },
    data,
  });
}

export async function deleteOnboardingJob(jobId: string) {
  return prisma.onboardingJob.delete({
    where: { id: jobId },
  });
}

// ==================== EMPLOYEE DOCUMENTS ====================

export async function uploadEmployeeDocument(data: {
  employeeId: string;
  documentType: OnboardingDocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
}) {
  return prisma.employeeDocument.create({
    data: {
      ...data,
      status: DocumentStatus.UPLOADED,
    },
  });
}

export async function getEmployeeDocuments(employeeId: string) {
  return prisma.employeeDocument.findMany({
    where: { employeeId },
    include: {
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function updateDocumentStatus(documentId: string, status: DocumentStatus) {
  return prisma.employeeDocument.update({
    where: { id: documentId },
    data: {
      status,
      ...(status === DocumentStatus.SIGNED && { signedAt: new Date() }),
    },
  });
}

// ==================== ONBOARDING TASKS ====================

async function createDefaultOnboardingTasks(employeeId: string, startDate: Date) {
  const defaultTasks = [
    {
      title: 'Sozialversicherung anmelden',
      description: 'Anmeldung bei der Sozialversicherung durchführen',
      category: 'REGISTRATION',
      dueDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before start
    },
    {
      title: 'Krankenversicherung anmelden',
      description: 'Anmeldung bei der Krankenversicherung',
      category: 'REGISTRATION',
      dueDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Arbeitsvertrag unterzeichnen',
      description: 'Arbeitsvertrag vom Mitarbeiter unterzeichnen lassen',
      category: 'DOCUMENT',
      dueDate: new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days before start
    },
    {
      title: 'Email-Account erstellen',
      description: 'Email-Account und Active Directory Setup',
      category: 'IT_SETUP',
      dueDate: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before start
    },
    {
      title: 'VPN-Zugang einrichten',
      description: 'VPN-Zugang und 2FA konfigurieren',
      category: 'IT_SETUP',
      dueDate: new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Arbeitsplatz vorbereiten',
      description: 'Laptop, Monitor und Zubehör bereitstellen',
      category: 'EQUIPMENT',
      dueDate: new Date(startDate.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day before start
    },
    {
      title: 'Firmenpräsentation',
      description: 'Einführung in die Firma und Unternehmenskultur',
      category: 'TRAINING',
      dueDate: new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day after start
    },
    {
      title: 'DSGVO-Schulung',
      description: 'Compliance-Training Datenschutz',
      category: 'TRAINING',
      dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week after start
    },
  ];

  const tasks = await Promise.all(
    defaultTasks.map(task =>
      prisma.onboardingTask.create({
        data: {
          employeeId,
          ...task,
        },
      })
    )
  );

  return tasks;
}

export async function createOnboardingTask(data: {
  employeeId: string;
  title: string;
  description?: string;
  category: string;
  assignedToId?: string;
  dueDate?: Date;
}) {
  return prisma.onboardingTask.create({
    data,
  });
}

export async function getEmployeeTasks(employeeId: string) {
  return prisma.onboardingTask.findMany({
    where: { employeeId },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      completedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function updateTaskStatus(
  taskId: string,
  status: OnboardingTaskStatus,
  completedById?: string
) {
  return prisma.onboardingTask.update({
    where: { id: taskId },
    data: {
      status,
      ...(status === OnboardingTaskStatus.COMPLETED && {
        completedAt: new Date(),
        completedById,
      }),
    },
  });
}

export async function assignTask(taskId: string, assignedToId: string) {
  return prisma.onboardingTask.update({
    where: { id: taskId },
    data: { assignedToId },
  });
}

export async function getOverdueTasks() {
  const now = new Date();
  return prisma.onboardingTask.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: OnboardingTaskStatus.COMPLETED },
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });
}

// ==================== ONBOARDING PROGRESS ====================

export async function getOnboardingProgress(employeeId: string) {
  const tasks = await prisma.onboardingTask.findMany({
    where: { employeeId },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === OnboardingTaskStatus.COMPLETED).length;
  const overdueTasks = tasks.filter(
    t => t.dueDate && t.dueDate < new Date() && t.status !== OnboardingTaskStatus.COMPLETED
  ).length;

  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    progressPercentage,
    tasks,
  };
}

export async function getOnboardingDashboard() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: {
      tasks: true,
    },
  });

  const dashboard = employees.map(employee => {
    const tasks = employee.tasks;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === OnboardingTaskStatus.COMPLETED).length;
    const overdueTasks = tasks.filter(
      t => t.dueDate && t.dueDate < new Date() && t.status !== OnboardingTaskStatus.COMPLETED
    ).length;

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        startDate: employee.startDate,
      },
      progress: {
        totalTasks,
        completedTasks,
        overdueTasks,
        progressPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
    };
  });

  return dashboard;
}
