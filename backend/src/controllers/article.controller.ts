import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllArticles = async (req: AuthRequest, res: Response) => {
  try {
    const { search, isActive, articleGroupId } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { articleNumber: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (articleGroupId) {
      where.articleGroupId = articleGroupId as string;
    }
    
    const articles = await prisma.article.findMany({
      where,
      include: {
        articleGroup: true
      },
      orderBy: { articleNumber: 'asc' }
    });

    res.json(articles);
  } catch (error) {
    console.error('Get all articles error:', error);
    res.status(500).json({ error: 'Failed to get articles' });
  }
};

export const getArticleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        articleGroup: true
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to get article' });
  }
};

export const createArticle = async (req: AuthRequest, res: Response) => {
  try {
    const {
      articleNumber,
      name,
      description,
      articleGroupId,
      price,
      unit,
      vatRate,
      notes,
      isActive
    } = req.body;

    if (!articleNumber || !name) {
      return res.status(400).json({ error: 'Article number and name are required' });
    }

    const article = await prisma.article.create({
      data: {
        articleNumber,
        name,
        description,
        articleGroupId,
        price: price || 0,
        unit: unit || 'Stück',
        vatRate: vatRate !== undefined ? vatRate : 7.7,
        notes,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        articleGroup: true
      }
    });

    res.status(201).json(article);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
};

export const updateArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      articleNumber,
      name,
      description,
      articleGroupId,
      price,
      unit,
      vatRate,
      notes,
      isActive
    } = req.body;

    const article = await prisma.article.update({
      where: { id },
      data: {
        articleNumber,
        name,
        description,
        articleGroupId,
        price,
        unit,
        vatRate,
        notes,
        isActive
      },
      include: {
        articleGroup: true
      }
    });

    res.json(article);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

export const deleteArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await prisma.article.delete({
      where: { id }
    });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
};
