import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';


// Get all stories for a project
export const getStoriesByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { includeInactive } = req.query;

    const where: any = { projectId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const stories = await prisma.story.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { timeEntries: true }
        }
      }
    });

    res.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
};

// Get a single story by ID
export const getStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { timeEntries: true }
        }
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(story);
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ error: 'Failed to get story' });
  }
};

// Create a new story
export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, name, description, color } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({ error: 'projectId and name are required' });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const story = await prisma.story.create({
      data: {
        projectId,
        name,
        description: description || null,
        color: color || null,
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { timeEntries: true }
        }
      }
    });

    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
};

// Update a story
export const updateStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, isActive } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const story = await prisma.story.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { timeEntries: true }
        }
      }
    });

    res.json(story);
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: 'Failed to update story' });
  }
};

// Delete a story
export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if story has time entries
    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        _count: { select: { timeEntries: true } }
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story._count.timeEntries > 0) {
      // Soft delete: deactivate instead of hard delete
      await prisma.story.update({
        where: { id },
        data: { isActive: false }
      });
      return res.json({ message: 'Story deactivated (has time entries)', deactivated: true });
    }

    await prisma.story.delete({ where: { id } });
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
};
