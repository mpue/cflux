import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { apiKeyService } from '../services/apiKey.service';
import { moduleService } from '../services/module.service';
import { publicApiScopeModules } from '../middleware/apiScope';
import { prisma } from '../lib/prisma';

/** Felder, die nach aussen gehen duerfen — keyHash bleibt immer intern. */
const PUBLIC_FIELDS = {
  id: true,
  name: true,
  keyPrefix: true,
  userId: true,
  scopes: true,
  readOnly: true,
  isActive: true,
  expiresAt: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
} as const;

const isAdmin = (req: AuthRequest) => req.user?.role === 'ADMIN';

/**
 * Prueft Scope-Strings gegen die Module, die ueber die Public API ueberhaupt
 * erreichbar sind. Ein Scope auf ein nicht freigegebenes Modul waere wirkungslos
 * und wuerde nur vortaeuschen, der Schluessel koenne dort etwas.
 */
const validateScopes = async (scopes: string[]): Promise<string | null> => {
  const validKeys = new Set(publicApiScopeModules());

  for (const scope of scopes) {
    if (scope === '*') continue;

    const [moduleKey, permission] = scope.split(':');
    if (!moduleKey || !permission) {
      return `Invalid scope format: "${scope}" (expected "<module>:read" or "<module>:write")`;
    }
    if (permission !== 'read' && permission !== 'write') {
      return `Invalid scope permission: "${scope}" (expected "read" or "write")`;
    }
    if (!validKeys.has(moduleKey)) {
      return `Module is not available via the public API: "${scope}"`;
    }
  }

  return null;
};

/** Die vergebbaren Scopes — nur Module, die per Public API erreichbar sind. */
export const getAvailableScopes = async (req: AuthRequest, res: Response) => {
  try {
    const modules = await moduleService.getAllModules(true);
    const names = new Map(
      modules.map((m: { key: string; name: string }) => [m.key, m.name] as const)
    );

    res.json(
      publicApiScopeModules().map((key) => ({
        module: key,
        name: names.get(key) ?? key,
        scopes: [`${key}:read`, `${key}:write`],
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getApiKeys = async (req: AuthRequest, res: Response) => {
  try {
    // Nicht-Admins sehen ausschliesslich ihre eigenen Schluessel
    const where = isAdmin(req) ? {} : { userId: req.user!.id };

    const keys = await prisma.apiKey.findMany({
      where,
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: 'desc' },
    });

    res.json(keys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const { name, userId, scopes, readOnly, expiresAt } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }

    // Nur Admins duerfen Schluessel im Namen anderer User ausstellen
    const targetUserId = userId && isAdmin(req) ? userId : req.user!.id;

    const requestedScopes: string[] = Array.isArray(scopes) ? scopes : [];
    const scopeError = await validateScopes(requestedScopes);
    if (scopeError) {
      return res.status(400).json({ error: scopeError });
    }

    // Der Wildcard-Scope ist Admins vorbehalten
    if (requestedScopes.includes('*') && !isAdmin(req)) {
      return res.status(403).json({ error: 'Wildcard scope requires admin privileges' });
    }

    const { apiKey, plainKey } = await apiKeyService.createApiKey({
      name,
      userId: targetUserId,
      scopes: requestedScopes,
      readOnly: readOnly !== false, // Default: nur lesend
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: req.user!.id,
    });

    const { keyHash, ...safeKey } = apiKey;

    // plainKey wird genau hier einmal ausgeliefert und ist danach nicht mehr abrufbar
    res.status(201).json({ ...safeKey, key: plainKey });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await apiKeyService.getApiKeyById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'API key not found' });
    }
    if (!isAdmin(req) && existing.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, scopes, readOnly, expiresAt } = req.body;

    if (scopes !== undefined) {
      if (!Array.isArray(scopes)) {
        return res.status(400).json({ error: 'scopes must be an array' });
      }
      const scopeError = await validateScopes(scopes);
      if (scopeError) {
        return res.status(400).json({ error: scopeError });
      }
      if (scopes.includes('*') && !isAdmin(req)) {
        return res.status(403).json({ error: 'Wildcard scope requires admin privileges' });
      }
    }

    const updated = await apiKeyService.updateApiKey(req.params.id, {
      ...(name !== undefined && { name }),
      ...(scopes !== undefined && { scopes }),
      ...(readOnly !== undefined && { readOnly }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
    });

    const { keyHash, ...safeKey } = updated;
    res.json(safeKey);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const revokeApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await apiKeyService.getApiKeyById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'API key not found' });
    }
    if (!isAdmin(req) && existing.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const revoked = await apiKeyService.revokeApiKey(req.params.id);

    const { keyHash, ...safeKey } = revoked;
    res.json(safeKey);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await apiKeyService.getApiKeyById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'API key not found' });
    }
    if (!isAdmin(req) && existing.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await apiKeyService.deleteApiKey(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
