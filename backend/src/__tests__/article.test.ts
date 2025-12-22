import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} from '../controllers/article.controller';
import { generateTestToken, mockAuthMiddleware } from './helpers';

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);

app.post('/api/articles', createArticle);
app.get('/api/articles', getAllArticles);
app.get('/api/articles/:id', getArticleById);
app.put('/api/articles/:id', updateArticle);
app.delete('/api/articles/:id', deleteArticle);

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    article: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Article Controller', () => {
  const adminToken = generateTestToken('admin-1', 'admin@example.com', 'ADMIN');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/articles', () => {
    it('should create a new article', async () => {
      const mockArticle = {
        id: '1',
        number: 'ART-001',
        name: 'Test Article',
        description: 'Test Description',
        unit: 'hours',
        price: 150.0,
        articleGroupId: 'group-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          number: 'ART-001',
          name: 'Test Article',
          description: 'Test Description',
          unit: 'hours',
          price: 150.0,
          articleGroupId: 'group-1',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Article');
    });
  });

  describe('GET /api/articles', () => {
    it('should get all articles', async () => {
      const mockArticles = [
        { id: '1', name: 'Article 1', price: 100 },
        { id: '2', name: 'Article 2', price: 200 },
      ];

      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const response = await request(app)
        .get('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/articles/:id', () => {
    it('should get article by id', async () => {
      const mockArticle = {
        id: '1',
        name: 'Test Article',
        price: 150,
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app)
        .get('/api/articles/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Article');
    });

    it('should return 404 if article not found', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/articles/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/articles/:id', () => {
    it('should update article', async () => {
      const mockArticle = {
        id: '1',
        name: 'Updated Article',
        price: 200,
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.article.update as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app)
        .put('/api/articles/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Article', price: 200 });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Article');
    });
  });

  describe('DELETE /api/articles/:id', () => {
    it('should delete article', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.article.delete as jest.Mock).mockResolvedValue({ id: '1' });

      const response = await request(app)
        .delete('/api/articles/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });
  });
});
