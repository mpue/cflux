import { PrismaClient, ChecklistType, ChecklistItemType, ChecklistStatus } from '@prisma/client';

const prisma = new PrismaClient();

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
}

export interface CreateInstanceDto {
  templateId: string;
  userId: string;
  assignedToId?: string;
  startDate?: Date;
  targetEndDate?: Date;
  notes?: string;
  projectId?: string;
}

export interface UpdateInstanceDto {
  status?: ChecklistStatus;
  targetEndDate?: Date;
  assignedToId?: string;
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
    return prisma.checklistItem.create({
      data,
    });
  }

  async updateTemplateItem(id: string, data: UpdateTemplateItemDto) {
    return prisma.checklistItem.update({
      where: { id },
      data,
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

    // Create instance with completions for all items
    const instance = await prisma.checklistInstance.create({
      data: {
        templateId: data.templateId,
        userId: data.userId,
        assignedToId: data.assignedToId,
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
    return prisma.checklistInstance.update({
      where: { id },
      data,
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
