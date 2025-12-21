import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllArticleGroups = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.query;
    
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const articleGroups = await prisma.articleGroup.findMany({
      where,
      include: {
        articles: {
          where: { isActive: true },
          select: { id: true, name: true, articleNumber: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(articleGroups);
  } catch (error) {
    console.error('Get all article groups error:', error);
    res.status(500).json({ error: 'Failed to get article groups' });
  }
};

export const getArticleGroupById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const articleGroup = await prisma.articleGroup.findUnique({
      where: { id },
      include: {
        articles: true
      }
    });

    if (!articleGroup) {
      return res.status(404).json({ error: 'Article group not found' });
    }

    res.json(articleGroup);
  } catch (error) {
    console.error('Get article group error:', error);
    res.status(500).json({ error: 'Failed to get article group' });
  }
};

export const createArticleGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const articleGroup = await prisma.articleGroup.create({
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(articleGroup);
  } catch (error) {
    console.error('Create article group error:', error);
    res.status(500).json({ error: 'Failed to create article group' });
  }
};

export const updateArticleGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const articleGroup = await prisma.articleGroup.update({
      where: { id },
      data: { name, description, isActive }
    });

    res.json(articleGroup);
  } catch (error) {
    console.error('Update article group error:', error);
    res.status(500).json({ error: 'Failed to update article group' });
  }
};

export const deleteArticleGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const articleGroup = await prisma.articleGroup.findUnique({
      where: { id },
      include: { articles: true }
    });

    if (!articleGroup) {
      return res.status(404).json({ error: 'Article group not found' });
    }

    if (articleGroup.articles.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete article group with articles. Please reassign or delete articles first.' 
      });
    }

    await prisma.articleGroup.delete({
      where: { id }
    });

    res.json({ message: 'Article group deleted successfully' });
  } catch (error) {
    console.error('Delete article group error:', error);
    res.status(500).json({ error: 'Failed to delete article group' });
  }
};
