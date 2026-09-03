import { HandoverItemKind, HandoverProtocolStatus, HandoverProtocolType, EquipmentCondition } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Übergabeprotokoll-Service
 *
 * Ein Übergabeprotokoll dokumentiert die Ausgabe (HANDOVER) bzw. Rücknahme (RETURN)
 * von Betriebsmitteln an einen Mitarbeiter. Ein Protokoll kann mehrere Positionen
 * umfassen (Laptop + Handy + Dock + Zugangskarte), weil in der Praxis ein Blatt
 * unterschrieben wird und nicht eines pro Gerät.
 *
 * Das Anlegen eines Protokolls führt die Zuweisung des Assets gleich mit aus:
 * Bei HANDOVER werden offene Zuweisungen geschlossen und eine neue angelegt,
 * bei RETURN werden die offenen Zuweisungen geschlossen. Damit können Protokoll
 * und Asset-Historie nicht auseinanderlaufen.
 */

export const CONDITION_LABELS: Record<EquipmentCondition, string> = {
  NEW: 'Neu',
  GOOD: 'Gut',
  FAIR: 'Gebraucht',
  DAMAGED: 'Beschädigt',
};

export const TYPE_LABELS: Record<HandoverProtocolType, string> = {
  HANDOVER: 'Übergabe',
  RETURN: 'Rücknahme',
};

export const STATUS_LABELS: Record<HandoverProtocolStatus, string> = {
  DRAFT: 'Entwurf',
  SIGNED: 'Unterschrieben',
  CANCELLED: 'Storniert',
};

const NUMBER_PREFIX: Record<HandoverProtocolType, string> = {
  HANDOVER: 'UEB',
  RETURN: 'RUE',
};

export interface HandoverItemInput {
  kind?: HandoverItemKind;
  deviceId?: string | null;
  toolId?: string | null;
  equipmentId?: string | null;
  /** Nur für kind = OTHER erforderlich, sonst aus dem Asset übernommen */
  name?: string;
  category?: string | null;
  serialNumber?: string | null;
  inventoryNumber?: string | null;
  condition?: EquipmentCondition;
  accessories?: string | null;
  notes?: string | null;
}

export interface CreateProtocolInput {
  type?: HandoverProtocolType;
  userId?: string | null;
  employeeId?: string | null;
  handoverDate?: string | Date;
  location?: string | null;
  notes?: string | null;
  items: HandoverItemInput[];
}

const protocolInclude = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      device: { select: { id: true, name: true, serialNumber: true, category: true } },
      tool: { select: { id: true, name: true, inventoryNumber: true, category: true } },
      equipment: { select: { id: true, name: true, inventoryNumber: true, serialNumber: true, category: true } },
    },
  },
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeNumber: true,
      department: true,
      position: true,
    },
  },
  issuedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};

/**
 * Erzeugt die nächste Protokollnummer, z.B. UEB-2026-0001.
 * Die Nummer wird pro Jahr und Vorgangsart fortgeschrieben.
 */
async function nextProtocolNumber(type: HandoverProtocolType): Promise<string> {
  const prefix = `${NUMBER_PREFIX[type]}-${new Date().getFullYear()}-`;
  const last = await prisma.handoverProtocol.findFirst({
    where: { protocolNumber: { startsWith: prefix } },
    orderBy: { protocolNumber: 'desc' },
    select: { protocolNumber: true },
  });
  const lastSeq = last ? parseInt(last.protocolNumber.slice(prefix.length), 10) : 0;
  const next = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

/** Ergänzt eine Position um die Stammdaten des referenzierten Assets (Momentaufnahme). */
async function resolveItem(input: HandoverItemInput) {
  const kind = input.kind ?? (input.deviceId ? 'DEVICE' : input.toolId ? 'TOOL' : input.equipmentId ? 'EQUIPMENT' : 'OTHER');

  const base = {
    kind: kind as HandoverItemKind,
    deviceId: null as string | null,
    toolId: null as string | null,
    equipmentId: null as string | null,
    condition: input.condition ?? EquipmentCondition.GOOD,
    accessories: input.accessories?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  if (kind === 'DEVICE') {
    if (!input.deviceId) throw new Error('Position ohne Gerät');
    const device = await prisma.device.findUnique({ where: { id: input.deviceId } });
    if (!device) throw new Error(`Gerät ${input.deviceId} nicht gefunden`);
    return {
      ...base,
      deviceId: device.id,
      name: input.name?.trim() || device.name,
      category: input.category ?? device.category,
      serialNumber: input.serialNumber ?? device.serialNumber,
      inventoryNumber: input.inventoryNumber ?? null,
    };
  }

  if (kind === 'TOOL') {
    if (!input.toolId) throw new Error('Position ohne Werkzeug');
    const tool = await prisma.tool.findUnique({ where: { id: input.toolId } });
    if (!tool) throw new Error(`Werkzeug ${input.toolId} nicht gefunden`);
    return {
      ...base,
      toolId: tool.id,
      name: input.name?.trim() || tool.name,
      category: input.category ?? tool.category,
      serialNumber: input.serialNumber ?? null,
      inventoryNumber: input.inventoryNumber ?? tool.inventoryNumber,
    };
  }

  if (kind === 'EQUIPMENT') {
    if (!input.equipmentId) throw new Error('Position ohne Ausrüstung');
    const equipment = await prisma.equipment.findUnique({ where: { id: input.equipmentId } });
    if (!equipment) throw new Error(`Ausrüstung ${input.equipmentId} nicht gefunden`);
    return {
      ...base,
      equipmentId: equipment.id,
      name: input.name?.trim() || equipment.name,
      category: input.category ?? equipment.category,
      serialNumber: input.serialNumber ?? equipment.serialNumber,
      inventoryNumber: input.inventoryNumber ?? equipment.inventoryNumber,
    };
  }

  if (!input.name?.trim()) throw new Error('Freie Positionen brauchen eine Bezeichnung');
  return {
    ...base,
    name: input.name.trim(),
    category: input.category?.trim() || null,
    serialNumber: input.serialNumber?.trim() || null,
    inventoryNumber: input.inventoryNumber?.trim() || null,
  };
}

export async function listProtocols(filters?: {
  userId?: string;
  employeeId?: string;
  deviceId?: string;
  type?: HandoverProtocolType;
  status?: HandoverProtocolStatus;
  search?: string;
}) {
  const where: any = {};
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;
  if (filters?.deviceId) where.items = { some: { deviceId: filters.deviceId } };
  if (filters?.search) {
    const q = filters.search;
    where.OR = [
      { protocolNumber: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
      { user: { firstName: { contains: q, mode: 'insensitive' } } },
      { user: { lastName: { contains: q, mode: 'insensitive' } } },
      { items: { some: { name: { contains: q, mode: 'insensitive' } } } },
      { items: { some: { serialNumber: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  return prisma.handoverProtocol.findMany({
    where,
    include: protocolInclude,
    orderBy: [{ handoverDate: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getProtocolById(id: string) {
  return prisma.handoverProtocol.findUnique({ where: { id }, include: protocolInclude });
}

export async function createProtocol(input: CreateProtocolInput, issuedById: string) {
  if (!input.items || input.items.length === 0) {
    throw new Error('Ein Protokoll braucht mindestens eine Position');
  }
  if (!input.userId && !input.employeeId) {
    throw new Error('Empfänger (Benutzer oder Mitarbeiter) ist erforderlich');
  }

  const type = input.type ?? HandoverProtocolType.HANDOVER;
  const items: Array<Awaited<ReturnType<typeof resolveItem>>> = [];
  for (const raw of input.items) {
    items.push(await resolveItem(raw));
  }

  // Empfänger auflösen: Benutzerkonto und Mitarbeiterdatensatz gehören zusammen,
  // sind in cflux aber getrennte Objekte. Fehlende Seite nachschlagen.
  let userId = input.userId ?? null;
  let employeeId = input.employeeId ?? null;
  if (userId && !employeeId) {
    employeeId = (await prisma.employee.findUnique({ where: { userId }, select: { id: true } }))?.id ?? null;
  }
  if (employeeId && !userId) {
    userId = (await prisma.employee.findUnique({ where: { id: employeeId }, select: { userId: true } }))?.userId ?? null;
  }

  // Geräte und Werkzeuge hängen am Benutzerkonto – ohne Konto ist keine Zuweisung möglich
  const needsUser = items.some((i) => i.kind === 'DEVICE' || i.kind === 'TOOL');
  if (needsUser && !userId) {
    throw new Error('Für Geräte- und Werkzeugpositionen ist ein Benutzerkonto als Empfänger erforderlich');
  }
  const needsEmployee = items.some((i) => i.kind === 'EQUIPMENT');
  if (needsEmployee && !employeeId) {
    throw new Error('Für Ausrüstungspositionen ist ein Mitarbeiterdatensatz als Empfänger erforderlich');
  }

  const handoverDate = input.handoverDate ? new Date(input.handoverDate) : new Date();

  return prisma.$transaction(async (tx) => {
    const protocol = await tx.handoverProtocol.create({
      data: {
        protocolNumber: await nextProtocolNumber(type),
        type,
        userId,
        employeeId,
        handoverDate,
        location: input.location?.trim() || null,
        notes: input.notes?.trim() || null,
        issuedById,
        items: { create: items },
      },
      include: protocolInclude,
    });

    // ---- Asset-Seite mitführen ----
    for (const item of protocol.items) {
      if (item.kind === 'DEVICE' && item.deviceId) {
        if (type === HandoverProtocolType.HANDOVER) {
          await tx.deviceAssignment.updateMany({
            where: { deviceId: item.deviceId, returnedAt: null },
            data: { returnedAt: handoverDate },
          });
          await tx.deviceAssignment.create({
            data: {
              deviceId: item.deviceId,
              userId: userId!,
              assignedAt: handoverDate,
              notes: item.notes,
              handoverProtocolId: protocol.id,
            },
          });
          await tx.device.update({ where: { id: item.deviceId }, data: { userId } });
        } else {
          await tx.deviceAssignment.updateMany({
            where: { deviceId: item.deviceId, returnedAt: null },
            data: { returnedAt: handoverDate, returnProtocolId: protocol.id },
          });
          await tx.device.update({ where: { id: item.deviceId }, data: { userId: null } });
        }
      }

      if (item.kind === 'TOOL' && item.toolId) {
        if (type === HandoverProtocolType.HANDOVER) {
          await tx.toolAssignment.updateMany({
            where: { toolId: item.toolId, returnedAt: null },
            data: { returnedAt: handoverDate },
          });
          await tx.toolAssignment.create({
            data: { toolId: item.toolId, userId: userId!, assignedAt: handoverDate, notes: item.notes },
          });
          await tx.tool.update({ where: { id: item.toolId }, data: { assignedToId: userId } });
        } else {
          await tx.toolAssignment.updateMany({
            where: { toolId: item.toolId, returnedAt: null },
            data: { returnedAt: handoverDate },
          });
          await tx.tool.update({ where: { id: item.toolId }, data: { assignedToId: null } });
        }
      }

      if (item.kind === 'EQUIPMENT' && item.equipmentId) {
        if (type === HandoverProtocolType.HANDOVER) {
          await tx.equipmentAssignment.create({
            data: {
              equipmentId: item.equipmentId,
              employeeId: employeeId!,
              assignedById: issuedById,
              assignedAt: handoverDate,
              condition: item.condition,
              notes: item.notes,
            },
          });
        } else {
          await tx.equipmentAssignment.updateMany({
            where: { equipmentId: item.equipmentId, employeeId: employeeId!, returnedAt: null },
            data: { returnedAt: handoverDate, returnCondition: item.condition, returnNotes: item.notes },
          });
        }
      }
    }

    return protocol;
  });
}

/**
 * Kopfdaten und Positionsdetails eines Entwurfs ändern.
 * Welche Assets im Protokoll stehen, bleibt fix – dafür Protokoll stornieren
 * und neu erfassen, damit die Asset-Historie stimmig bleibt.
 */
export async function updateProtocol(
  id: string,
  data: {
    handoverDate?: string | Date;
    location?: string | null;
    notes?: string | null;
    items?: Array<{ id: string; condition?: EquipmentCondition; accessories?: string | null; notes?: string | null }>;
  }
) {
  const existing = await prisma.handoverProtocol.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw new Error('Protokoll nicht gefunden');
  if (existing.status !== HandoverProtocolStatus.DRAFT) {
    throw new Error('Nur Entwürfe können geändert werden');
  }

  return prisma.$transaction(async (tx) => {
    await tx.handoverProtocol.update({
      where: { id },
      data: {
        ...(data.handoverDate ? { handoverDate: new Date(data.handoverDate) } : {}),
        ...(data.location !== undefined ? { location: data.location?.trim() || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
        // Ein geändertes Protokoll braucht ein neues PDF
        pdfPath: null,
        pdfGeneratedAt: null,
      },
    });

    for (const item of data.items ?? []) {
      await tx.handoverProtocolItem.update({
        where: { id: item.id },
        data: {
          ...(item.condition ? { condition: item.condition } : {}),
          ...(item.accessories !== undefined ? { accessories: item.accessories?.trim() || null } : {}),
          ...(item.notes !== undefined ? { notes: item.notes?.trim() || null } : {}),
        },
      });
    }

    return tx.handoverProtocol.findUnique({ where: { id }, include: protocolInclude });
  });
}

export async function markSigned(
  id: string,
  data: {
    signedAt?: string | Date;
    signedDocumentPath?: string | null;
    signatureRecipientPath?: string | null;
    signatureIssuerPath?: string | null;
  }
) {
  const existing = await prisma.handoverProtocol.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw new Error('Protokoll nicht gefunden');
  if (existing.status === HandoverProtocolStatus.CANCELLED) {
    throw new Error('Storniertes Protokoll kann nicht unterschrieben werden');
  }

  return prisma.handoverProtocol.update({
    where: { id },
    data: {
      status: HandoverProtocolStatus.SIGNED,
      signedAt: data.signedAt ? new Date(data.signedAt) : new Date(),
      ...(data.signedDocumentPath !== undefined ? { signedDocumentPath: data.signedDocumentPath } : {}),
      ...(data.signatureRecipientPath !== undefined ? { signatureRecipientPath: data.signatureRecipientPath } : {}),
      ...(data.signatureIssuerPath !== undefined ? { signatureIssuerPath: data.signatureIssuerPath } : {}),
    },
    include: protocolInclude,
  });
}

/**
 * Storniert das Dokument. Die Asset-Zuweisungen bleiben unverändert – sie werden
 * bewusst nicht zurückgedreht, weil ein storniertes Protokoll nichts darüber sagt,
 * wo das Gerät physisch liegt. Korrekturen laufen über Zuweisen/Zurückgeben.
 */
export async function cancelProtocol(id: string, reason?: string) {
  const existing = await prisma.handoverProtocol.findUnique({ where: { id }, select: { notes: true } });
  if (!existing) throw new Error('Protokoll nicht gefunden');

  const notes = reason?.trim()
    ? [existing.notes, `Storniert: ${reason.trim()}`].filter(Boolean).join('\n')
    : existing.notes;

  return prisma.handoverProtocol.update({
    where: { id },
    data: { status: HandoverProtocolStatus.CANCELLED, notes },
    include: protocolInclude,
  });
}

export async function deleteProtocol(id: string) {
  const existing = await prisma.handoverProtocol.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw new Error('Protokoll nicht gefunden');
  if (existing.status === HandoverProtocolStatus.SIGNED) {
    throw new Error('Unterschriebene Protokolle können nicht gelöscht werden – bitte stornieren');
  }
  await prisma.handoverProtocol.delete({ where: { id } });
}

export async function setPdfPath(id: string, pdfPath: string) {
  return prisma.handoverProtocol.update({
    where: { id },
    data: { pdfPath, pdfGeneratedAt: new Date() },
  });
}
