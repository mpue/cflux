import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

export const getMyProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const assignments = await prisma.projectAssignment.findMany({
      where: { userId },
      include: {
        project: true
      }
    });

    const projects = assignments.map(a => a.project);

    res.json(projects);
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        isActive
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const assignUserToProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;

    const assignment = await prisma.projectAssignment.create({
      data: {
        userId,
        projectId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: true
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Assign user error:', error);
    res.status(500).json({ error: 'Failed to assign user to project' });
  }
};

export const unassignUserFromProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;

    await prisma.projectAssignment.deleteMany({
      where: {
        userId,
        projectId
      }
    });

    res.json({ message: 'User unassigned successfully' });
  } catch (error) {
    console.error('Unassign user error:', error);
    res.status(500).json({ error: 'Failed to unassign user' });
  }
};
