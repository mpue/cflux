import { EquipmentCondition, TrainingStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';


/**
 * Equipment Service
 * Handles equipment catalog and assignments
 */

// ==================== EQUIPMENT CATALOG ====================

export async function getAllEquipment(filters?: {
  category?: string;
  isActive?: boolean;
}) {
  return prisma.equipment.findMany({
    where: {
      ...(filters?.category && { category: filters.category }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    include: {
      _count: {
        select: {
          assignments: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getEquipmentById(equipmentId: string) {
  return prisma.equipment.findUnique({
    where: { id: equipmentId },
    include: {
      assignments: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });
}

export async function createEquipment(data: {
  name: string;
  category: string;
  description?: string;
  inventoryNumber?: string;
  serialNumber?: string;
}) {
  return prisma.equipment.create({
    data,
  });
}

export async function updateEquipment(equipmentId: string, data: any) {
  return prisma.equipment.update({
    where: { id: equipmentId },
    data,
  });
}

// ==================== EQUIPMENT ASSIGNMENTS ====================

export async function assignEquipment(data: {
  equipmentId: string;
  employeeId: string;
  assignedById: string;
  condition?: EquipmentCondition;
  notes?: string;
}) {
  // Check if equipment is already assigned and not returned
  const existingAssignment = await prisma.equipmentAssignment.findFirst({
    where: {
      equipmentId: data.equipmentId,
      returnedAt: null,
    },
  });

  if (existingAssignment) {
    throw new Error('Ausrüstung ist bereits vergeben');
  }

  return prisma.equipmentAssignment.create({
    data: {
      ...data,
      condition: data.condition || EquipmentCondition.GOOD,
    },
  });
}

export async function getEmployeeEquipment(employeeId: string) {
  return prisma.equipmentAssignment.findMany({
    where: {
      employeeId,
      returnedAt: null,
    },
    include: {
      equipment: true,
      assignedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });
}

export async function returnEquipment(
  assignmentId: string,
  data: {
    returnCondition: EquipmentCondition;
    returnNotes?: string;
  }
) {
  return prisma.equipmentAssignment.update({
    where: { id: assignmentId },
    data: {
      returnedAt: new Date(),
      ...data,
    },
  });
}

export async function generateHandoverProtocol(assignmentId: string): Promise<string> {
  const assignment = await prisma.equipmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      equipment: true,
      employee: true,
      assignedBy: true,
    },
  });

  if (!assignment) {
    throw new Error('Zuweisung nicht gefunden');
  }

  const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'handover-protocols');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `handover-${assignmentId}-${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  // Title
  doc.fontSize(20).text('Übergabeprotokoll', { align: 'center' });
  doc.moveDown();

  // Employee Info
  doc.fontSize(14).text('Mitarbeiter:', { underline: true });
  doc.fontSize(12).text(`Name: ${assignment.employee.firstName} ${assignment.employee.lastName}`);
  doc.text(`E-Mail: ${assignment.employee.email}`);
  doc.moveDown();

  // Equipment Info
  doc.fontSize(14).text('Ausrüstung:', { underline: true });
  doc.fontSize(12).text(`Name: ${assignment.equipment.name}`);
  doc.text(`Kategorie: ${assignment.equipment.category}`);
  if (assignment.equipment.inventoryNumber) {
    doc.text(`Inventarnummer: ${assignment.equipment.inventoryNumber}`);
  }
  if (assignment.equipment.serialNumber) {
    doc.text(`Seriennummer: ${assignment.equipment.serialNumber}`);
  }
  doc.moveDown();

  // Assignment Details
  doc.fontSize(14).text('Übergabedetails:', { underline: true });
  doc.fontSize(12).text(`Datum: ${assignment.assignedAt.toLocaleDateString('de-DE')}`);
  doc.text(`Zustand: ${assignment.condition}`);
  if (assignment.notes) {
    doc.text(`Anmerkungen: ${assignment.notes}`);
  }
  doc.moveDown();

  // Assigned By
  doc.fontSize(12).text(
    `Übergeben von: ${assignment.assignedBy.firstName} ${assignment.assignedBy.lastName}`
  );
  doc.moveDown(2);

  // Signature Lines
  doc.fontSize(10);
  doc.text('_________________________________', 100, doc.y);
  doc.text('Unterschrift Mitarbeiter', 100, doc.y + 5);

  doc.text('_________________________________', 350, doc.y - 20);
  doc.text('Unterschrift Verantwortlicher', 350, doc.y + 5);

  doc.end();

  // Update assignment with protocol path
  await prisma.equipmentAssignment.update({
    where: { id: assignmentId },
    data: { handoverProtocolPath: `/uploads/handover-protocols/${fileName}` },
  });

  return `/uploads/handover-protocols/${fileName}`;
}

// ==================== TRAINING CATALOG ====================

export async function getAllTrainingCatalog(filters?: {
  type?: string;
  isActive?: boolean;
  isRecurring?: boolean;
}) {
  return prisma.trainingCatalog.findMany({
    where: {
      ...(filters?.type && { type: filters.type }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.isRecurring !== undefined && { isRecurring: filters.isRecurring }),
    },
    include: {
      _count: {
        select: {
          trainingSessions: true,
        },
      },
    },
    orderBy: { title: 'asc' },
  });
}

export async function getTrainingCatalogById(catalogId: string) {
  return prisma.trainingCatalog.findUnique({
    where: { id: catalogId },
    include: {
      trainingSessions: {
        include: {
          trainer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              completions: true,
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
      },
    },
  });
}

export async function createTrainingCatalog(data: {
  title: string;
  description?: string;
  type: string;
  autoAssignForPositions?: string[];
  daysAfterStart?: number;
  isRecurring?: boolean;
  recurringMonths?: number;
}) {
  return prisma.trainingCatalog.create({
    data,
  });
}

export async function updateTrainingCatalog(catalogId: string, data: any) {
  return prisma.trainingCatalog.update({
    where: { id: catalogId },
    data,
  });
}

// ==================== TRAINING SESSIONS ====================

export async function createTrainingSession(data: {
  catalogId: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  meetingLink?: string;
  trainerId: string;
  maxParticipants?: number;
}) {
  return prisma.trainingSession.create({
    data,
  });
}

export async function getAllTrainingSessions(filters?: {
  catalogId?: string;
  trainerId?: string;
  status?: TrainingStatus;
  fromDate?: Date;
  toDate?: Date;
}) {
  return prisma.trainingSession.findMany({
    where: {
      ...(filters?.catalogId && { catalogId: filters.catalogId }),
      ...(filters?.trainerId && { trainerId: filters.trainerId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.fromDate && { scheduledAt: { gte: filters.fromDate } }),
      ...(filters?.toDate && { scheduledAt: { lte: filters.toDate } }),
    },
    include: {
      catalog: true,
      trainer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          completions: true,
        },
      },
    },
    orderBy: { scheduledAt: 'desc' },
  });
}

export async function getTrainingSessionById(sessionId: string) {
  return prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: {
      catalog: true,
      trainer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      completions: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function updateTrainingSession(sessionId: string, data: any) {
  return prisma.trainingSession.update({
    where: { id: sessionId },
    data,
  });
}

// ==================== TRAINING COMPLETIONS ====================

export async function assignEmployeeToTraining(data: {
  sessionId: string;
  employeeId: string;
}) {
  // Check if already assigned
  const existing = await prisma.trainingCompletion.findUnique({
    where: {
      sessionId_employeeId: {
        sessionId: data.sessionId,
        employeeId: data.employeeId,
      },
    },
  });

  if (existing) {
    throw new Error('Mitarbeiter ist bereits dieser Schulung zugewiesen');
  }

  return prisma.trainingCompletion.create({
    data,
  });
}

export async function markTrainingCompleted(
  completionId: string,
  data: {
    attended: boolean;
    certificatePath?: string;
  }
) {
  return prisma.trainingCompletion.update({
    where: { id: completionId },
    data: {
      ...data,
      completedAt: new Date(),
    },
  });
}

export async function getEmployeeTrainings(employeeId: string) {
  return prisma.trainingCompletion.findMany({
    where: { employeeId },
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
    orderBy: { createdAt: 'desc' },
  });
}

export async function autoAssignTrainings(employeeId: string, position: string, startDate: Date) {
  const catalogs = await prisma.trainingCatalog.findMany({
    where: {
      isActive: true,
      autoAssignForPositions: {
        has: position,
      },
    },
  });

  const assignments = [];
  for (const catalog of catalogs) {
    // Find upcoming sessions
    const sessions = await prisma.trainingSession.findMany({
      where: {
        catalogId: catalog.id,
        status: TrainingStatus.PLANNED,
        scheduledAt: {
          gte: startDate,
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 1,
    });

    if (sessions.length > 0) {
      const assignment = await prisma.trainingCompletion.create({
        data: {
          sessionId: sessions[0].id,
          employeeId,
        },
      });
      assignments.push(assignment);
    }
  }

  return assignments;
}
