import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}

// Generate a test JWT token
export const generateTestToken = (userId: string, role: 'USER' | 'ADMIN' = 'USER'): string => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Mock authentication middleware that bypasses actual JWT verification
export const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Decode without verification for tests
    const decoded = jwt.decode(token) as { userId: string; role: string };
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role as 'USER' | 'ADMIN',
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Mock requireAdmin middleware
export const mockRequireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
