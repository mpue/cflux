import { Incident, IncidentPriority, IncidentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { actionService } from './action.service';


export interface CreateIncidentDto {
  title: string;
  description: string;
  priority?: IncidentPriority;
  reportedById: string;
  assignedToId?: string;
  projectId?: string;
  category?: string;
  affectedSystem?: string;
  dueDate?: Date;
  tags?: string[];
  // EHS fields
  isEHSRelevant?: boolean;
  ehsCategory?: string;
  ehsSeverity?: string;
  incidentDate?: Date;
  location?: string;
}

export interface UpdateIncidentDto {
  title?: string;
  description?: string;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  assignedToId?: string;
  projectId?: string;
  category?: string;
  affectedSystem?: string;
  dueDate?: Date;
  solution?: string;
  notes?: string;
  tags?: string[];
}

export interface AddCommentDto {
  comment: string;
  userId: string;
}

export const incidentService = {
  async createIncident(data: CreateIncidentDto): Promise<Incident> {
    const incident = await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        reportedById: data.reportedById,
        assignedToId: data.assignedToId || undefined,
        projectId: data.projectId || undefined,
        category: data.category || undefined,
        affectedSystem: data.affectedSystem || undefined,
        dueDate: data.dueDate,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        // EHS fields
        isEHSRelevant: data.isEHSRelevant || false,
        ehsCategory: (data.ehsCategory || undefined) as any,
        ehsSeverity: (data.ehsSeverity || undefined) as any,
        incidentDate: data.incidentDate || (data.isEHSRelevant ? new Date() : undefined),
        location: data.location || undefined,
      },
      include: {
        reportedBy: {
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
    });

    // Trigger incident.created action
    try {
      await actionService.triggerAction('incident.created', {
        entityType: 'INCIDENT',
        entityId: incident.id,
        userId: data.reportedById,
        entityData: {
          title: incident.title,
          priority: incident.priority,
          category: incident.category,
          isEHSRelevant: incident.isEHSRelevant,
        },
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger incident.created:', actionError);
    }

    return incident;
  },

  async getAllIncidents(
    status?: IncidentStatus,
    priority?: IncidentPriority,
    assignedToId?: string,
    year?: number,
    projectId?: string
  ): Promise<Incident[]> {
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      where.OR = [
        {
          incidentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          incidentDate: null,
          reportedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      ];
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reportedBy: {
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
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { priority: 'desc' },
        { reportedAt: 'desc' },
      ],
    });

    return incidents;
  },

  async getIncidentById(id: string): Promise<Incident | null> {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reportedBy: {
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
        comments: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return incident;
  },

  async updateIncident(id: string, data: UpdateIncidentDto): Promise<Incident> {
    const updateData: any = { ...data };

    // Handle status changes with timestamps
    if (data.status === 'RESOLVED' && data.solution) {
      updateData.resolvedAt = new Date();
    } else if (data.status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    // Handle tags
    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags);
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: {
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
    });

    // Trigger incident.approved action when status changes to RESOLVED
    if (data.status === 'RESOLVED') {
      try {
        await actionService.triggerAction('incident.approved', {
          entityType: 'INCIDENT',
          entityId: incident.id,
          userId: incident.assignedToId || incident.reportedById,
          title: incident.title,
          status: incident.status,
          solution: incident.solution,
          resolvedAt: incident.resolvedAt?.toISOString()
        });
      } catch (actionError) {
        console.error('[Action] Failed to trigger incident.approved:', actionError);
      }
    }

    return incident;
  },

  async deleteIncident(id: string): Promise<void> {
    await prisma.incident.delete({
      where: { id },
    });
  },

  async addComment(incidentId: string, data: AddCommentDto): Promise<any> {
    const comment = await prisma.incidentComment.create({
      data: {
        incidentId,
        userId: data.userId,
        comment: data.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return comment;
  },

  async getComments(incidentId: string): Promise<any[]> {
    const comments = await prisma.incidentComment.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return comments;
  },

  async getStatistics(): Promise<any> {
    const [
      totalIncidents,
      openIncidents,
      inProgressIncidents,
      resolvedIncidents,
      criticalIncidents,
      highPriorityIncidents,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: 'OPEN' } }),
      prisma.incident.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.incident.count({ where: { status: 'RESOLVED' } }),
      prisma.incident.count({ where: { priority: 'CRITICAL' } }),
      prisma.incident.count({ where: { priority: 'HIGH' } }),
    ]);

    return {
      total: totalIncidents,
      open: openIncidents,
      inProgress: inProgressIncidents,
      resolved: resolvedIncidents,
      critical: criticalIncidents,
      high: highPriorityIncidents,
    };
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      prisma.incident.update({
        where: { id },
        data: { sortOrder: index },
      })
    );
    await prisma.$transaction(updates);
  },
};
