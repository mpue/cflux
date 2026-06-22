import { ChecklistType, ChecklistItemType, ChecklistStatus, CalendarEventType, CalendarAttendeeStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emailService } from './email.service';
import { systemSettingsService } from './systemSettings.service';


export interface CreateTemplateDto {
  name: string;
  description?: string;
  type: ChecklistType;
  category?: string;
  estimatedDuration?: number;
  responsibleRole?: string;
  createdById: string;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  type?: ChecklistType;
  category?: string;
  estimatedDuration?: number;
  responsibleRole?: string;
  isActive?: boolean;
}

export interface CreateTemplateItemDto {
  templateId: string;
  title: string;
  description?: string;
  order: number;
  itemType: ChecklistItemType;
  required?: boolean;
  assignedRole?: string;
  dueAfterDays?: number;
  dueDayOffset?: number;
  conditionalParentId?: string;
  showIfParentValue?: string;
  externalLink?: string;
  notifyUserIds?: string[];
}

export interface UpdateTemplateItemDto {
  title?: string;
  description?: string;
  order?: number;
  itemType?: ChecklistItemType;
  required?: boolean;
  assignedRole?: string;
  dueAfterDays?: number;
  dueDayOffset?: number;
  conditionalParentId?: string;
  showIfParentValue?: string;
  externalLink?: string;
  notifyUserIds?: string[];
}

export interface CreateInstanceDto {
  templateId: string;
  userId: string;
  assignedToId?: string;
  responsibleIds?: string[]; // Weitere Verantwortliche (zusätzlich zum Hauptverantwortlichen)
  startDate?: Date;
  targetEndDate?: Date;
  notes?: string;
  projectId?: string;
}

export interface UpdateInstanceDto {
  status?: ChecklistStatus;
  targetEndDate?: Date;
  assignedToId?: string;
  responsibleIds?: string[];
  notes?: string;
}

export interface CompleteItemDto {
  instanceId: string;
  itemId: string;
  completed: boolean;
  completedById: string;
  textValue?: string;
  numberValue?: number;
  dateValue?: Date;
  boolValue?: boolean;
  jsonValue?: any;
  fileUrl?: string;
  comment?: string;
}

class ChecklistService {
  // ==================== Templates ====================
  
  async createTemplate(data: CreateTemplateDto) {
    return prisma.checklistTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        estimatedDuration: data.estimatedDuration,
        responsibleRole: data.responsibleRole,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
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

  async getTemplates(filters?: { type?: ChecklistType; isActive?: boolean }) {
    return prisma.checklistTemplate.findMany({
      where: {
        type: filters?.type,
        isActive: filters?.isActive,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            items: true,
            instances: true,
          },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async getTemplateById(id: string) {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            notifyUsers: { select: { id: true, firstName: true, lastName: true, email: true } },
            attachments: {
              select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        instances: {
          select: {
            id: true,
            status: true,
            startDate: true,
            user: {
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

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  async updateTemplate(id: string, data: UpdateTemplateDto) {
    return prisma.checklistTemplate.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async deleteTemplate(id: string) {
    // Soft delete
    return prisma.checklistTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== Template Items ====================

  async createTemplateItem(data: CreateTemplateItemDto) {
    const { notifyUserIds, ...itemData } = data;
    return prisma.checklistItem.create({
      data: {
        ...itemData,
        ...(notifyUserIds?.length ? {
          notifyUsers: { connect: notifyUserIds.map((id) => ({ id })) },
        } : {}),
      },
      include: {
        notifyUsers: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async updateTemplateItem(id: string, data: UpdateTemplateItemDto) {
    const { notifyUserIds, ...itemData } = data;
    return prisma.checklistItem.update({
      where: { id },
      data: {
        ...itemData,
        ...(notifyUserIds !== undefined ? {
          notifyUsers: { set: notifyUserIds.map((uid) => ({ id: uid })) },
        } : {}),
      },
      include: {
        notifyUsers: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async deleteTemplateItem(id: string) {
    return prisma.checklistItem.delete({
      where: { id },
    });
  }

  async reorderTemplateItems(templateId: string, itemIds: string[]) {
    // Update order of all items in transaction
    return prisma.$transaction(
      itemIds.map((itemId, index) =>
        prisma.checklistItem.update({
          where: { id: itemId },
          data: { order: index },
        })
      )
    );
  }

  // ==================== Item Attachments ====================

  async addItemAttachment(data: {
    itemId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedById?: string;
  }) {
    // Sicherstellen, dass der Checklisten-Punkt existiert
    const item = await prisma.checklistItem.findUnique({ where: { id: data.itemId } });
    if (!item) {
      throw new Error('Checklisten-Punkt nicht gefunden');
    }
    return prisma.checklistItemAttachment.create({
      data: {
        itemId: data.itemId,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        uploadedById: data.uploadedById,
      },
      select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
    });
  }

  async getItemAttachments(itemId: string) {
    return prisma.checklistItemAttachment.findMany({
      where: { itemId },
      select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAttachmentById(id: string) {
    return prisma.checklistItemAttachment.findUnique({ where: { id } });
  }

  async deleteItemAttachment(id: string) {
    return prisma.checklistItemAttachment.delete({ where: { id } });
  }

  // ==================== Instances ====================

  async createInstance(data: CreateInstanceDto) {
    // Get template with items
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: data.templateId },
      include: { items: true },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Weitere Verantwortliche (ohne Hauptverantwortlichen-Duplikat)
    const responsibleIds = (data.responsibleIds || []).filter(
      (id) => id && id !== data.assignedToId
    );

    // Create instance with completions for all items
    const instance = await prisma.checklistInstance.create({
      data: {
        templateId: data.templateId,
        userId: data.userId,
        assignedToId: data.assignedToId,
        ...(responsibleIds.length
          ? { responsibles: { connect: responsibleIds.map((id) => ({ id })) } }
          : {}),
        startDate: data.startDate || new Date(),
        targetEndDate: data.targetEndDate,
        notes: data.notes,
        projectId: data.projectId,
        totalItems: template.items.length,
        completedItems: 0,
        progressPercent: 0,
        completions: {
          create: template.items.map((item) => ({
            itemId: item.id,
            completed: false,
          })),
        },
      },
      include: {
        template: true,
        user: {
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
        responsibles: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        completions: {
          include: {
            item: true,
          },
          orderBy: {
            item: {
              order: 'asc',
            },
          },
        },
      },
    });

    // Create calendar event and send email invitations if targetEndDate is set
    if (data.targetEndDate) {
      const dueDate = new Date(data.targetEndDate);
      dueDate.setHours(0, 0, 0, 0);

      // Alle Verantwortlichen (Haupt- + weitere), ohne den betroffenen Mitarbeiter
      const executorIds = Array.from(
        new Set([data.assignedToId, ...responsibleIds].filter((id): id is string => !!id))
      ).filter((id) => id !== data.userId);

      await prisma.calendarEvent.create({
        data: {
          title: `Checkliste fällig: ${template.name}`,
          description: data.notes ? `Notizen: ${data.notes}` : undefined,
          // All-Day-Event: Start und Ende auf denselben Tag setzen. Ein Ende um
          // 23:59:59 würde bei abweichender Server-/Browser-Zeitzone auf den
          // Folgetag rutschen und der Termin an zwei Tagen erscheinen.
          startDate: dueDate,
          endDate: dueDate,
          allDay: true,
          eventType: CalendarEventType.TASK,
          isPrivate: true,
          createdById: data.userId,
          ...(executorIds.length ? {
            attendees: {
              create: executorIds.map((userId) => ({
                userId,
                status: CalendarAttendeeStatus.ACCEPTED,
              })),
            },
          } : {}),
        },
      });

      // Fetch user details for email invitations
      const userIds = [data.userId, ...executorIds];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      const subjectUser = users.find((u) => u.id === data.userId);
      const executors = executorIds
        .map((id) => users.find((u) => u.id === id))
        .filter((u): u is NonNullable<typeof u> => !!u);

      if (subjectUser) {
        const settings = await systemSettingsService.getSettings();
        // Anhänge aller Checklisten-Punkte dieser Vorlage gebündelt mitsenden
        const attachmentRecords = await prisma.checklistItemAttachment.findMany({
          where: { item: { templateId: data.templateId } },
          select: { fileName: true, filePath: true },
        });
        const itemAttachments = attachmentRecords.map((a) => ({
          filename: a.fileName,
          path: a.filePath,
        }));
        emailService.sendChecklistInvitation({
          subjectUser,
          executors,
          checklistName: template.name,
          dueDate,
          notes: data.notes,
          companyName: settings.companyName || 'CFlux',
          itemAttachments,
        }).catch((err) => console.error('Failed to send checklist invitation email:', err));
      }
    }

    // Send ICS notifications to users configured on individual items
    const itemsWithNotify = await prisma.checklistItem.findMany({
      where: { templateId: data.templateId, notifyUsers: { some: {} } },
      include: {
        notifyUsers: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (itemsWithNotify.length > 0) {
      const settings = await systemSettingsService.getSettings();
      const startDate = instance.startDate instanceof Date ? instance.startDate : new Date(instance.startDate);
      for (const item of itemsWithNotify) {
        for (const notifyUser of item.notifyUsers) {
          emailService.sendChecklistItemNotification({
            notifyUser,
            checklistName: template.name,
            itemTitle: item.title,
            startDate,
            companyName: settings.companyName || 'CFlux',
          }).catch((err) => console.error('Failed to send item notification email:', err));
        }
      }
    }

    return instance;
  }

  async getInstances(filters?: {
    userId?: string;
    assignedToId?: string;
    status?: ChecklistStatus;
    templateId?: string;
  }) {
    return prisma.checklistInstance.findMany({
      where: {
        userId: filters?.userId,
        assignedToId: filters?.assignedToId,
        status: filters?.status,
        templateId: filters?.templateId,
      },
      include: {
        template: true,
        user: {
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
        responsibles: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInstanceById(id: string) {
    const instance = await prisma.checklistInstance.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
        },
        user: {
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
        responsibles: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        completions: {
          include: {
            item: true,
            completedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            item: {
              order: 'asc',
            },
          },
        },
      },
    });

    if (!instance) {
      throw new Error('Instance not found');
    }

    return instance;
  }

  async updateInstance(id: string, data: UpdateInstanceDto) {
    const { responsibleIds, ...instanceData } = data;
    return prisma.checklistInstance.update({
      where: { id },
      data: {
        ...instanceData,
        ...(responsibleIds !== undefined
          ? { responsibles: { set: responsibleIds.map((rid) => ({ id: rid })) } }
          : {}),
      },
      include: {
        template: true,
        user: {
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
        responsibles: {
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

  async deleteInstance(id: string) {
    return prisma.checklistInstance.delete({
      where: { id },
    });
  }

  // ==================== Item Completion ====================

  async completeItem(data: CompleteItemDto) {
    const completion = await prisma.checklistItemCompletion.update({
      where: {
        instanceId_itemId: {
          instanceId: data.instanceId,
          itemId: data.itemId,
        },
      },
      data: {
        completed: data.completed,
        completedAt: data.completed ? new Date() : null,
        completedById: data.completed ? data.completedById : null,
        textValue: data.textValue,
        numberValue: data.numberValue,
        dateValue: data.dateValue,
        boolValue: data.boolValue,
        jsonValue: data.jsonValue,
        fileUrl: data.fileUrl,
        comment: data.comment,
      },
      include: {
        item: true,
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Recalculate progress
    await this.recalculateProgress(data.instanceId);

    return completion;
  }

  private async recalculateProgress(instanceId: string) {
    const instance = await prisma.checklistInstance.findUnique({
      where: { id: instanceId },
      include: {
        completions: true,
      },
    });

    if (!instance) {
      throw new Error('Instance not found');
    }

    const totalItems = instance.completions.length;
    const completedItems = instance.completions.filter((c) => c.completed).length;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const newStatus =
      progressPercent === 100
        ? ChecklistStatus.COMPLETED
        : progressPercent > 0
        ? ChecklistStatus.IN_PROGRESS
        : ChecklistStatus.NOT_STARTED;

    await prisma.checklistInstance.update({
      where: { id: instanceId },
      data: {
        totalItems,
        completedItems,
        progressPercent,
        status: newStatus,
        completedDate: progressPercent === 100 ? new Date() : null,
      },
    });
  }

  // ==================== Statistics ====================

  async getStatistics() {
    const [
      totalTemplates,
      activeTemplates,
      totalInstances,
      inProgressInstances,
      completedInstances,
      overdueInstances,
    ] = await Promise.all([
      prisma.checklistTemplate.count(),
      prisma.checklistTemplate.count({ where: { isActive: true } }),
      prisma.checklistInstance.count(),
      prisma.checklistInstance.count({ where: { status: ChecklistStatus.IN_PROGRESS } }),
      prisma.checklistInstance.count({ where: { status: ChecklistStatus.COMPLETED } }),
      prisma.checklistInstance.count({ where: { status: ChecklistStatus.OVERDUE } }),
    ]);

    return {
      totalTemplates,
      activeTemplates,
      totalInstances,
      inProgressInstances,
      completedInstances,
      overdueInstances,
    };
  }
}

export default new ChecklistService();
