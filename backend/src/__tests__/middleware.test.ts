import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, requireAdmin } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = 'test-jwt-secret-key-for-testing';

// A simple protected endpoint for testing
const app = express();
app.use(express.json());

app.get('/protected', authenticate, (req, res) => res.json({ ok: true }));
app.get('/admin-only', authenticate, requireAdmin, (req, res) => res.json({ ok: true }));
app.get('/manager', authenticate, authorize('ADMIN', 'MANAGER' as any), (req, res) =>
  res.json({ ok: true })
);
app.get(
  '/module-check',
  (req: any, res, next) => {
    // Mimic authenticate by decoding token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
      req.user = jwt.decode(token) as any;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },
  requireModuleAccess('time_tracking', 'canView'),
  (req, res) => res.json({ ok: true })
);

const makeToken = (payload: object) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

describe('Auth Middleware', () => {
  describe('authenticate', () => {
    it('should pass when a valid JWT is provided', async () => {
      const token = makeToken({ id: 'user-1', email: 'test@example.com', role: 'USER' });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 401 when no authorization header is provided', async () => {
      const response = await request(app).get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should return 401 when token is expired', async () => {
      const token = jwt.sign(
        { id: 'user-1', email: 'test@example.com', role: 'USER' },
        JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should return 401 when token is signed with wrong secret', async () => {
      const token = jwt.sign(
        { id: 'user-1', email: 'test@example.com', role: 'USER' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should return 401 for a malformed token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer not-a-valid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('requireAdmin', () => {
    it('should allow ADMIN users', async () => {
      const token = makeToken({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should deny non-ADMIN users with 403', async () => {
      const token = makeToken({ id: 'user-1', email: 'user@example.com', role: 'USER' });

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('authorize (role-based)', () => {
    it('should allow when role is in the permitted list', async () => {
      const token = makeToken({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

      const response = await request(app)
        .get('/manager')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should deny when role is not in the permitted list', async () => {
      const token = makeToken({ id: 'user-1', email: 'user@example.com', role: 'USER' });

      const response = await request(app)
        .get('/manager')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });
});

describe('requireModuleAccess Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow ADMIN users without checking DB', async () => {
    const token = makeToken({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

    const response = await request(app)
      .get('/module-check')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    // Should not check the database for ADMINs
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should check module access for regular users and allow when permitted', async () => {
    const token = makeToken({ id: 'user-1', email: 'user@example.com', role: 'USER' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'USER',
      userGroupMemberships: [
        {
          userGroup: {
            id: 'group-1',
            isActive: true,
            moduleAccess: [{ canView: true, canCreate: false, canEdit: false, canDelete: false }],
          },
        },
      ],
    });

    const response = await request(app)
      .get('/module-check')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should return 403 when user lacks module access', async () => {
    const token = makeToken({ id: 'user-1', email: 'user@example.com', role: 'USER' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'USER',
      userGroupMemberships: [
        {
          userGroup: {
            id: 'group-1',
            isActive: true,
            moduleAccess: [], // No access to any module
          },
        },
      ],
    });

    const response = await request(app)
      .get('/module-check')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Access denied');
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get('/module-check');

    expect(response.status).toBe(401);
  });
});
