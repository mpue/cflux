import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';


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
    const { name, description, status, customerId, defaultHourlyRate, sollBeginn, sollEnde, sollPauseDauer, sollArbeitszeit, cuttingAktiv, cuttingTolerance } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'PLANNING',
        customerId: customerId || null,
        defaultHourlyRate: defaultHourlyRate ? parseFloat(defaultHourlyRate) : null,
        sollBeginn: sollBeginn || null,
        sollEnde: sollEnde || null,
        sollPauseDauer: sollPauseDauer !== undefined && sollPauseDauer !== '' ? parseInt(sollPauseDauer.toString()) : 60,
        sollArbeitszeit: sollArbeitszeit !== undefined && sollArbeitszeit !== '' ? parseFloat(sollArbeitszeit.toString()) : null,
        cuttingAktiv: cuttingAktiv !== undefined ? cuttingAktiv : true,
        cuttingTolerance: cuttingTolerance !== undefined && cuttingTolerance !== '' ? parseFloat(cuttingTolerance.toString()) : 0,
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
    const { name, description, isActive, status, customerId, defaultHourlyRate, startDate, endDate, progress, sollBeginn, sollEnde, sollPauseDauer, sollArbeitszeit, cuttingAktiv, cuttingTolerance } = req.body;

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (status !== undefined) updateData.status = status;
    if (customerId !== undefined) updateData.customerId = customerId || null;
    if (defaultHourlyRate !== undefined) updateData.defaultHourlyRate = defaultHourlyRate ? parseFloat(defaultHourlyRate) : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (progress !== undefined) updateData.progress = progress !== null ? parseInt(progress.toString()) : 0;
    if (sollBeginn !== undefined) updateData.sollBeginn = sollBeginn || null;
    if (sollEnde !== undefined) updateData.sollEnde = sollEnde || null;
    if (sollPauseDauer !== undefined) updateData.sollPauseDauer = sollPauseDauer !== '' ? parseInt(sollPauseDauer.toString()) : 60;
    if (sollArbeitszeit !== undefined) updateData.sollArbeitszeit = sollArbeitszeit !== '' ? parseFloat(sollArbeitszeit.toString()) : null;
    if (cuttingAktiv !== undefined) updateData.cuttingAktiv = cuttingAktiv;
    if (cuttingTolerance !== undefined) updateData.cuttingTolerance = cuttingTolerance !== '' ? parseFloat(cuttingTolerance.toString()) : 0;

    const project = await prisma.project.update({
      where: { id },
      data: updateData
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
