import { PrismaClient, Incident, IncidentPriority, IncidentStatus } from '@prisma/client';

const prisma = new PrismaClient();

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
        assignedToId: data.assignedToId,
        projectId: data.projectId,
        category: data.category,
        affectedSystem: data.affectedSystem,
        dueDate: data.dueDate,
        tags: data.tags ? JSON.stringify(data.tags) : null,
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

    return incident;
  },

  async getAllIncidents(
    status?: IncidentStatus,
    priority?: IncidentPriority,
    assignedToId?: string
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
        },
      },
      orderBy: [
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
    });

    return comment;
  },

  async getComments(incidentId: string): Promise<any[]> {
    const comments = await prisma.incidentComment.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
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
};
