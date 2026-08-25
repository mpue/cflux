import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { apiKeyService, isApiKeyToken } from '../services/apiKey.service';

export { AuthRequest };

/** Methoden, die ein Read-Only-Schluessel nicht ausfuehren darf. */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];

    // API-Schluessel alternativ ueber X-API-Key
    const apiKeyHeader = req.headers['x-api-key'];
    if (!token && typeof apiKeyHeader === 'string') {
      token = apiKeyHeader;
    }

    // Fallback: support token as query parameter (for file downloads/previews).
    // Bewusst nur fuer JWTs — API-Schluessel landen sonst in Server- und Proxy-Logs.
    if (!token && typeof req.query.token === 'string' && !isApiKeyToken(req.query.token)) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (isApiKeyToken(token)) {
      const apiKey = await apiKeyService.verifyApiKey(token);

      if (!apiKey) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      if (apiKey.readOnly && WRITE_METHODS.includes(req.method)) {
        return res.status(403).json({ error: 'API key is read-only' });
      }

      req.user = {
        id: apiKey.user.id,
        email: apiKey.user.email,
        role: apiKey.user.role,
      };
      req.apiKey = {
        id: apiKey.id,
        name: apiKey.name,
        scopes: apiKey.scopes,
        readOnly: apiKey.readOnly,
      };

      void apiKeyService.touchLastUsed(apiKey);

      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: UserRole;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Sperrt eine Route fuer API-Schluessel. Fuer alles, was ausschliesslich ein
 * eingeloggter Mensch tun darf — etwa die Verwaltung der Schluessel selbst.
 */
export const denyApiKey = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.apiKey) {
    return res.status(403).json({ error: 'This endpoint is not available for API keys' });
  }

  next();
};
