import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get all todos with filters
export const getAllTodos = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      status, 
      priority, 
      projectId, 
      assignedToId, 
      category,
      startDate,
      endDate,
      search
    } = req.query;

    const where: any = { isActive: true };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (category) where.category = category;
    
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate as string);
      if (endDate) where.dueDate.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const todos = await prisma.eHSTodo.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        incident: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(todos);
  } catch (error) {
    console.error('Get all todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

// Get single todo by ID
export const getTodoById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const todo = await prisma.eHSTodo.findUnique({
      where: { id },
      include: {
        project: true,
        incident: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
};

// Create new todo
export const createTodo = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      projectId,
      incidentId,
      assignedToId,
      category,
      tags,
      progressPercent,
      notes,
      attachmentUrls
    } = req.body;

    const userId = req.user!.id;

    const todo = await prisma.eHSTodo.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'OPEN',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        incidentId,
        assignedToId,
        createdById: userId,
        category,
        tags: tags || [],
        progressPercent: progressPercent || 0,
        notes,
        attachmentUrls: attachmentUrls || []
      },
      include: {
        project: { select: { id: true, name: true } },
        incident: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
};

// Update todo
export const updateTodo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      completedAt,
      projectId,
      incidentId,
      assignedToId,
      category,
      tags,
      progressPercent,
      notes,
      attachmentUrls
    } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED' && !completedAt) {
        updateData.completedAt = new Date();
        updateData.progressPercent = 100;
      }
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (incidentId !== undefined) updateData.incidentId = incidentId;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (progressPercent !== undefined) updateData.progressPercent = progressPercent;
    if (notes !== undefined) updateData.notes = notes;
    if (attachmentUrls !== undefined) updateData.attachmentUrls = attachmentUrls;

    const todo = await prisma.eHSTodo.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        incident: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    res.json(todo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
};

// Soft delete todo
export const deleteTodo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const todo = await prisma.eHSTodo.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Todo deleted successfully', todo });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
};

// Get todos by project
export const getTodosByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const todos = await prisma.eHSTodo.findMany({
      where: { 
        projectId,
        isActive: true
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        incident: { select: { id: true, title: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    res.json(todos);
  } catch (error) {
    console.error('Get todos by project error:', error);
    res.status(500).json({ error: 'Failed to fetch project todos' });
  }
};

// Get todos by incident
export const getTodosByIncident = async (req: AuthRequest, res: Response) => {
  try {
    const { incidentId } = req.params;

    const todos = await prisma.eHSTodo.findMany({
      where: { 
        incidentId,
        isActive: true
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    res.json(todos);
  } catch (error) {
    console.error('Get todos by incident error:', error);
    res.status(500).json({ error: 'Failed to fetch incident todos' });
  }
};

// Get my assigned todos
export const getMyAssignedTodos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const todos = await prisma.eHSTodo.findMany({
      where: { 
        assignedToId: userId,
        isActive: true
      },
      include: {
        project: { select: { id: true, name: true } },
        incident: { select: { id: true, title: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    res.json(todos);
  } catch (error) {
    console.error('Get my assigned todos error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned todos' });
  }
};

// Get todos I created
export const getMyCreatedTodos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const todos = await prisma.eHSTodo.findMany({
      where: { 
        createdById: userId,
        isActive: true
      },
      include: {
        project: { select: { id: true, name: true } },
        incident: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    res.json(todos);
  } catch (error) {
    console.error('Get my created todos error:', error);
    res.status(500).json({ error: 'Failed to fetch created todos' });
  }
};

// Update todo status
export const updateTodoStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData: any = { status };
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.progressPercent = 100;
    }

    const todo = await prisma.eHSTodo.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        incident: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    res.json(todo);
  } catch (error) {
    console.error('Update todo status error:', error);
    res.status(500).json({ error: 'Failed to update todo status' });
  }
};

// Update todo progress
export const updateTodoProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { progressPercent } = req.body;

    const updateData: any = { progressPercent };
    
    if (progressPercent >= 100) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    const todo = await prisma.eHSTodo.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        incident: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    res.json(todo);
  } catch (error) {
    console.error('Update todo progress error:', error);
    res.status(500).json({ error: 'Failed to update todo progress' });
  }
};

// Get statistics
export const getTodoStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.query;
    
    const where: any = { isActive: true };
    if (projectId) where.projectId = projectId;

    const [
      total,
      open,
      inProgress,
      completed,
      cancelled,
      overdue,
      byPriority,
      byCategory
    ] = await Promise.all([
      prisma.eHSTodo.count({ where }),
      prisma.eHSTodo.count({ where: { ...where, status: 'OPEN' } }),
      prisma.eHSTodo.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.eHSTodo.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.eHSTodo.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.eHSTodo.count({ 
        where: { 
          ...where, 
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: new Date() }
        } 
      }),
      prisma.eHSTodo.groupBy({
        by: ['priority'],
        where,
        _count: true
      }),
      prisma.eHSTodo.groupBy({
        by: ['category'],
        where,
        _count: true
      })
    ]);

    const stats = {
      total,
      byStatus: {
        open,
        inProgress,
        completed,
        cancelled
      },
      overdue,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byCategory: byCategory.reduce((acc, item) => {
        if (item.category) {
          acc[item.category] = item._count;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get todo statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
