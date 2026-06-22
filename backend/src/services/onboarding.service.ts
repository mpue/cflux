import { ApplicantStatus, DocumentStatus, OnboardingTaskStatus, OnboardingDocumentType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import checklistService from './checklist.service';
import { emailService } from './email.service';

/**
 * Versendet die Willkommens-Mail an einen neu angelegten Mitarbeiter-Account.
 * Fehler beim Mailversand dürfen die Einstellung/das Onboarding nicht abbrechen,
 * daher wird hier defensiv gefangen und nur geloggt.
 */
async function sendWelcomeEmailSafe(
  employee: { email: string; firstName: string; lastName: string },
  tempPassword: string
): Promise<void> {
  try {
    await emailService.sendWelcomeEmail({
      email: employee.email,
      firstName: employee.firstName,
      tempPassword,
    });
  } catch (error) {
    console.error('❌ Willkommens-Mail konnte nicht versendet werden:', error);
  }
}


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

  // Falls bereits ein Mitarbeiter mit dieser E-Mail existiert (z. B. über den
  // Onboarding-Wizard angelegt oder ein vorheriger, teilweise fehlgeschlagener
  // Einstellungsversuch), diesen wiederverwenden statt einen neuen anzulegen –
  // sonst verletzt employee.create() den Unique-Constraint auf email.
  const existingEmployee = await prisma.employee.findUnique({
    where: { email: applicant.email },
  });

  // Create employee record (oder bestehenden aktualisieren)
  const employee = existingEmployee
    ? await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          phone: applicant.phone,
          position: applicant.position,
          department: data.department,
          supervisorId: data.supervisorId,
          startDate: data.startDate,
          probationEndDate: data.probationEndDate,
        },
      })
    : await prisma.employee.create({
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

  // Benutzerkonto (Login) für den neuen Mitarbeiter anlegen und verknüpfen
  const userResult = await ensureUserForEmployee(employee.id);

  // Willkommens-Mail mit Login-Link und Zugangsdaten versenden (nur wenn ein
  // neuer User-Account mit temporärem Passwort angelegt wurde). Das Passwort
  // muss beim ersten Login geändert werden (requiresPasswordChange).
  if (userResult.created && userResult.tempPassword) {
    await sendWelcomeEmailSafe(employee, userResult.tempPassword);
  }

  // Create default onboarding tasks (nur für neu angelegte Mitarbeiter, um
  // doppelte Aufgaben bei bereits existierenden Mitarbeitern zu vermeiden)
  if (!existingEmployee) {
    await createDefaultOnboardingTasks(employee.id, data.startDate);
  }

  // Mitarbeiter inkl. verknüpftem Benutzerkonto zurückgeben
  return prisma.employee.findUnique({
    where: { id: employee.id },
    include: {
      user: { select: { id: true, email: true } },
    },
  });
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

export async function markAsOnboarded(employeeId: string) {
  return prisma.employee.update({
    where: { id: employeeId },
    data: {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    },
  });
}

export async function getOnboardingDashboard() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true, onboardingCompleted: false },
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

// ==================== ONBOARDING WIZARD (START ONBOARDING) ====================

/**
 * Stellt sicher, dass ein Mitarbeiter einen verknüpften User-Account besitzt.
 * Checklisten-Instanzen referenzieren User (nicht Employee), daher wird bei
 * Bedarf ein User mit zufälligem Passwort (Passwortänderung erforderlich) angelegt.
 * Existiert bereits ein User mit derselben E-Mail, wird dieser verknüpft.
 * Gibt die User-ID zurück.
 */
async function ensureUserForEmployee(
  employeeId: string
): Promise<{ userId: string; tempPassword?: string; created: boolean }> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new Error('Mitarbeiter nicht gefunden');
  }
  if (employee.userId) {
    return { userId: employee.userId, created: false };
  }

  let user = await prisma.user.findUnique({ where: { email: employee.email } });
  let tempPassword: string | undefined;
  let created = false;
  if (!user) {
    tempPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    user = await prisma.user.create({
      data: {
        email: employee.email,
        password: hashedPassword,
        firstName: employee.firstName,
        lastName: employee.lastName,
        requiresPasswordChange: true,
      },
    });
    created = true;
  }

  await prisma.employee.update({
    where: { id: employee.id },
    data: { userId: user.id },
  });

  return { userId: user.id, tempPassword, created };
}

/**
 * Startet ein neues Onboarding für einen Mitarbeiter:
 * - wählt einen bestehenden Mitarbeiter oder legt einen neuen an
 * - bestimmt den Hauptverantwortlichen (Tutor) aus den Mitarbeitern
 * - erstellt für jede gewählte Checklisten-Vorlage eine Instanz, die dem Tutor
 *   für diesen Mitarbeiter zugewiesen wird
 * - markiert den Mitarbeiter als "Onboarding gestartet" (aktiv, nicht abgeschlossen)
 */
export async function startOnboarding(data: {
  employeeId?: string;
  newEmployee?: {
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
    department?: string;
  };
  tutorEmployeeId: string;
  responsibleEmployeeIds?: string[]; // Weitere Verantwortliche (zusätzlich zum Tutor)
  templateIds: string[];
  startDate?: Date;
  targetEndDate?: Date;
  notes?: string;
}) {
  if (!data.tutorEmployeeId) {
    throw new Error('Ein Hauptverantwortlicher (Tutor) muss ausgewählt werden');
  }
  if (!Array.isArray(data.templateIds) || data.templateIds.length === 0) {
    throw new Error('Mindestens eine Checkliste muss ausgewählt werden');
  }

  const startDate = data.startDate || new Date();

  // 1. Mitarbeiter bestimmen oder neu anlegen
  let employee;
  if (data.employeeId) {
    employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new Error('Mitarbeiter nicht gefunden');
    }
  } else if (data.newEmployee) {
    const { firstName, lastName, email } = data.newEmployee;
    if (!firstName || !lastName || !email) {
      throw new Error('Vorname, Nachname und E-Mail sind für neue Mitarbeiter erforderlich');
    }
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Ein Mitarbeiter mit dieser E-Mail existiert bereits');
    }
    employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        position: data.newEmployee.position,
        department: data.newEmployee.department,
        startDate,
        isActive: true,
        onboardingCompleted: false,
      },
    });
    await createDefaultOnboardingTasks(employee.id, startDate);
  } else {
    throw new Error('Es muss ein Mitarbeiter ausgewählt oder ein neuer angelegt werden');
  }

  // 2. Sicherstellen, dass Mitarbeiter und Tutor je einen User-Account haben
  const employeeUserResult = await ensureUserForEmployee(employee.id);
  const employeeUserId = employeeUserResult.userId;

  // Willkommens-Mail an den neuen Mitarbeiter (nur wenn ein neuer User-Account
  // mit temporärem Passwort angelegt wurde)
  if (employeeUserResult.created && employeeUserResult.tempPassword) {
    await sendWelcomeEmailSafe(employee, employeeUserResult.tempPassword);
  }

  const tutor = await prisma.employee.findUnique({ where: { id: data.tutorEmployeeId } });
  if (!tutor) {
    throw new Error('Hauptverantwortlicher (Tutor) nicht gefunden');
  }
  const tutorUserId = (await ensureUserForEmployee(tutor.id)).userId;

  // 2b. Weitere Verantwortliche bestimmen (ohne Tutor-Duplikat) und je einen
  //     User-Account sicherstellen
  const responsibleEmployeeIds = Array.from(
    new Set((data.responsibleEmployeeIds || []).filter((id) => id && id !== data.tutorEmployeeId))
  );
  const responsibleUserIds: string[] = [];
  for (const respEmployeeId of responsibleEmployeeIds) {
    const resp = await prisma.employee.findUnique({ where: { id: respEmployeeId } });
    if (!resp) {
      throw new Error('Verantwortliche/r nicht gefunden');
    }
    responsibleUserIds.push((await ensureUserForEmployee(resp.id)).userId);
  }

  // 3. Pro gewählter Checkliste eine Instanz für den Mitarbeiter erstellen,
  //    zugewiesen an den Tutor (Hauptverantwortlicher) und weitere Verantwortliche
  const instances = [];
  for (const templateId of data.templateIds) {
    const instance = await checklistService.createInstance({
      templateId,
      userId: employeeUserId,
      assignedToId: tutorUserId,
      responsibleIds: responsibleUserIds,
      startDate,
      targetEndDate: data.targetEndDate,
      notes: data.notes,
    });
    instances.push(instance);
  }

  // 4. Mitarbeiter als "Onboarding gestartet" markieren
  const updatedEmployee = await prisma.employee.update({
    where: { id: employee.id },
    data: {
      isActive: true,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      ...(employee.startDate ? {} : { startDate }),
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  return {
    employee: updatedEmployee,
    tutor: {
      id: tutor.id,
      firstName: tutor.firstName,
      lastName: tutor.lastName,
      userId: tutorUserId,
    },
    instances,
  };
}
