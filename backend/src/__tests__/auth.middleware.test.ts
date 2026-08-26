import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { authenticate, denyApiKey } from '../middleware/auth';
import { AuthRequest } from '../types/auth';
import { apiKeyService, API_KEY_PREFIX } from '../services/apiKey.service';

/**
 * Prueft den Punkt, an dem die Public API tatsaechlich abgesichert wird.
 * Die reine Scope-Logik liegt in apiScope.test.ts — hier geht es darum, dass
 * authenticate sie auch wirklich anwendet, bevor req.user gesetzt wird.
 */

jest.mock('../services/apiKey.service', () => {
  const actual = jest.requireActual('../services/apiKey.service');
  return {
    ...actual,
    apiKeyService: {
      verifyApiKey: jest.fn(),
      touchLastUsed: jest.fn().mockResolvedValue(undefined),
    },
  };
});

const verifyApiKey = apiKeyService.verifyApiKey as jest.Mock;

const JWT_SECRET = 'test-secret';

const buildRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & { status: jest.Mock; json: jest.Mock };
};

const buildReq = (overrides: Partial<AuthRequest> = {}): AuthRequest =>
  ({
    headers: {},
    query: {},
    method: 'GET',
    originalUrl: '/api/projects',
    ...overrides,
  }) as AuthRequest;

/** Ein aufgeloester Schluessel, wie verifyApiKey ihn liefern wuerde. */
const resolvedKey = (overrides: Record<string, any> = {}) => ({
  id: 'key-1',
  name: 'Test Key',
  scopes: ['projects:read'],
  readOnly: true,
  lastUsedAt: null,
  user: { id: 'user-1', email: 'a@b.de', role: 'USER', isActive: true },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = JWT_SECRET;
});

describe('authenticate — ohne Token', () => {
  it('lehnt einen Request ohne Token ab', async () => {
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authenticate — JWT', () => {
  it('laesst einen gueltigen JWT ohne Scope-Pruefung durch', async () => {
    const token = jwt.sign({ id: 'user-1', email: 'a@b.de', role: 'ADMIN' }, JWT_SECRET);
    const req = buildReq({
      headers: { authorization: `Bearer ${token}` },
      originalUrl: '/api/backup/export',
    });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    // Ein eingeloggter Admin darf weiterhin ueberall hin — die Freigabeliste
    // gilt ausschliesslich fuer Schluessel.
    expect(next).toHaveBeenCalled();
    expect(req.user?.id).toBe('user-1');
    expect(req.apiKey).toBeUndefined();
    expect(verifyApiKey).not.toHaveBeenCalled();
  });

  it('lehnt einen manipulierten JWT ab', async () => {
    const token = jwt.sign({ id: 'user-1', email: 'a@b.de', role: 'ADMIN' }, 'falsches-secret');
    const req = buildReq({ headers: { authorization: `Bearer ${token}` } });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authenticate — API-Schluessel', () => {
  it('akzeptiert den Schluessel im X-API-Key-Header', async () => {
    verifyApiKey.mockResolvedValue(resolvedKey());
    const req = buildReq({ headers: { 'x-api-key': `${API_KEY_PREFIX}abc` } });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'user-1', email: 'a@b.de', role: 'USER' });
    expect(req.apiKey?.id).toBe('key-1');
  });

  it('akzeptiert den Schluessel auch als Bearer-Token', async () => {
    verifyApiKey.mockResolvedValue(resolvedKey());
    const req = buildReq({ headers: { authorization: `Bearer ${API_KEY_PREFIX}abc` } });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.apiKey?.id).toBe('key-1');
  });

  it('nimmt einen Schluessel nicht aus der Query entgegen', async () => {
    // Sonst landet er in Server- und Proxy-Logs.
    const req = buildReq({ query: { token: `${API_KEY_PREFIX}abc` } as any });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(verifyApiKey).not.toHaveBeenCalled();
  });

  it('lehnt einen ungueltigen Schluessel ab', async () => {
    verifyApiKey.mockResolvedValue(null);
    const req = buildReq({ headers: { 'x-api-key': `${API_KEY_PREFIX}abc` } });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('blockt schreibende Methoden bei einem Read-Only-Schluessel', async () => {
    verifyApiKey.mockResolvedValue(resolvedKey({ readOnly: true, scopes: ['projects:write'] }));
    const req = buildReq({ headers: { 'x-api-key': `${API_KEY_PREFIX}abc` }, method: 'POST' });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key is read-only' });
    expect(next).not.toHaveBeenCalled();
  });

  it('vermerkt die Nutzung des Schluessels', async () => {
    verifyApiKey.mockResolvedValue(resolvedKey());
    const req = buildReq({ headers: { 'x-api-key': `${API_KEY_PREFIX}abc` } });

    await authenticate(req, buildRes(), jest.fn());

    expect(apiKeyService.touchLastUsed).toHaveBeenCalled();
  });
});

describe('authenticate — Deny-by-default', () => {
  it('sperrt einen nicht freigegebenen Pfad trotz Wildcard-Scope', async () => {
    verifyApiKey.mockResolvedValue(resolvedKey({ scopes: ['*'] }));
    const req = buildReq({
      headers: { 'x-api-key': `${API_KEY_PREFIX}abc` },
      originalUrl: '/api/backup/export',
    });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Not available via the public API' })
    );
    expect(next).not.toHaveBeenCalled();
    // Entscheidend: req.user bleibt leer, nachgelagerte Handler sehen keinen User.
    expect(req.user).toBeUndefined();
  });

  it('sperrt einen freigegebenen Pfad ohne passenden Scope', async () => {
    verifyApiKey.mockResolvedValue(resolvedKey({ scopes: ['invoices:read'] }));
    const req = buildReq({
      headers: { 'x-api-key': `${API_KEY_PREFIX}abc` },
      originalUrl: '/api/projects/42',
    });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'API key is missing scope: projects:read' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('sperrt gesperrte Pfade auch fuer den Schluessel eines Admins', async () => {
    verifyApiKey.mockResolvedValue(
      resolvedKey({
        scopes: ['*'],
        readOnly: false,
        user: { id: 'admin-1', email: 'admin@b.de', role: 'ADMIN', isActive: true },
      })
    );
    const req = buildReq({
      headers: { 'x-api-key': `${API_KEY_PREFIX}abc` },
      originalUrl: '/api/users',
      method: 'DELETE',
    });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('laesst einen freigegebenen Pfad mit passendem Scope durch', async () => {
    verifyApiKey.mockResolvedValue(resolvedKey({ scopes: ['projects:read'] }));
    const req = buildReq({
      headers: { 'x-api-key': `${API_KEY_PREFIX}abc` },
      originalUrl: '/api/projects/42?include=tasks',
    });
    const res = buildRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('denyApiKey', () => {
  it('laesst einen eingeloggten User durch', () => {
    const req = buildReq({ user: { id: 'user-1', email: 'a@b.de', role: 'USER' } } as any);
    const res = buildRes();
    const next = jest.fn();

    denyApiKey(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('sperrt einen API-Schluessel aus', () => {
    // Ein Schluessel darf sich nicht selbst verlaengern oder neue ausstellen.
    const req = buildReq({
      user: { id: 'user-1', email: 'a@b.de', role: 'ADMIN' },
      apiKey: { id: 'key-1', name: 'k', scopes: ['*'], readOnly: false },
    } as any);
    const res = buildRes();
    const next = jest.fn();

    denyApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
