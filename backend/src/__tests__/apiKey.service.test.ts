import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  apiKeyService,
  scopesAllow,
  isApiKeyToken,
  API_KEY_PREFIX,
} from '../services/apiKey.service';

const prisma = new PrismaClient();

const USER_ID = 'user-1';

/** Legt einen aktiven User im Mock-Store an. */
const seedUser = async (overrides: Record<string, any> = {}) => {
  await (prisma.user.create as jest.Mock)({
    data: { id: USER_ID, email: 'a@b.de', role: 'USER', isActive: true, ...overrides },
  });
};

/**
 * Der Prisma-Mock kennt weder `include` noch Spalten-Defaults aus dem Schema.
 * Daher werden User-Relation und isActive nach dem Anlegen ergaenzt.
 */
const attachUser = async (id: string, user: Record<string, any>) => {
  await (prisma.apiKey.update as jest.Mock)({ where: { id }, data: { user, isActive: true } });
};

describe('scopesAllow', () => {
  it('erlaubt alles beim Wildcard-Scope', () => {
    expect(scopesAllow(['*'], 'payroll', 'write')).toBe(true);
  });

  it('schliesst read in write mit ein', () => {
    expect(scopesAllow(['devices:write'], 'devices', 'read')).toBe(true);
    expect(scopesAllow(['devices:write'], 'devices', 'write')).toBe(true);
  });

  it('leitet aus read kein write ab', () => {
    expect(scopesAllow(['devices:read'], 'devices', 'write')).toBe(false);
  });

  it('trennt Module sauber', () => {
    expect(scopesAllow(['devices:write'], 'payroll', 'read')).toBe(false);
  });

  it('lehnt leere Scopes ab', () => {
    expect(scopesAllow([], 'devices', 'read')).toBe(false);
  });
});

describe('isApiKeyToken', () => {
  it('unterscheidet API-Schluessel von JWTs', () => {
    expect(isApiKeyToken(`${API_KEY_PREFIX}abc`)).toBe(true);
    expect(isApiKeyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.x.y')).toBe(false);
  });
});

describe('apiKeyService.createApiKey', () => {
  beforeEach(async () => {
    await (prisma.apiKey.deleteMany as jest.Mock)({});
    await (prisma.user.deleteMany as jest.Mock)({});
    await seedUser();
  });

  it('gibt den Klartext zurueck und speichert nur den Hash', async () => {
    const { apiKey, plainKey } = await apiKeyService.createApiKey({
      name: 'Claude Connector',
      userId: USER_ID,
      scopes: ['devices:read'],
    });

    expect(plainKey.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(apiKey.keyHash).toBe(crypto.createHash('sha256').update(plainKey).digest('hex'));
    expect(apiKey.keyHash).not.toContain(plainKey);
    expect(plainKey.startsWith(apiKey.keyPrefix)).toBe(true);
  });

  it('ist per Default nur lesend', async () => {
    const { apiKey } = await apiKeyService.createApiKey({ name: 'k', userId: USER_ID });
    expect(apiKey.readOnly).toBe(true);
  });

  it('erzeugt bei jedem Aufruf einen anderen Schluessel', async () => {
    const a = await apiKeyService.createApiKey({ name: 'a', userId: USER_ID });
    const b = await apiKeyService.createApiKey({ name: 'b', userId: USER_ID });
    expect(a.plainKey).not.toBe(b.plainKey);
  });

  it('scheitert bei unbekanntem User', async () => {
    await expect(
      apiKeyService.createApiKey({ name: 'k', userId: 'does-not-exist' })
    ).rejects.toThrow('User not found');
  });
});

describe('apiKeyService.verifyApiKey', () => {
  beforeEach(async () => {
    await (prisma.apiKey.deleteMany as jest.Mock)({});
    await (prisma.user.deleteMany as jest.Mock)({});
    await seedUser();
  });

  const createValid = async () => {
    const { apiKey, plainKey } = await apiKeyService.createApiKey({
      name: 'k',
      userId: USER_ID,
      scopes: ['devices:read'],
    });
    await attachUser(apiKey.id, { id: USER_ID, email: 'a@b.de', role: 'USER', isActive: true });
    return { apiKey, plainKey };
  };

  it('loest einen gueltigen Schluessel auf', async () => {
    const { plainKey } = await createValid();
    const result = await apiKeyService.verifyApiKey(plainKey);

    expect(result).not.toBeNull();
    expect(result!.scopes).toEqual(['devices:read']);
  });

  it('lehnt einen unbekannten Schluessel ab', async () => {
    await createValid();
    expect(await apiKeyService.verifyApiKey(`${API_KEY_PREFIX}wrong`)).toBeNull();
  });

  it('lehnt einen JWT ab, ohne die Datenbank zu befragen', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockClear();

    expect(await apiKeyService.verifyApiKey('eyJhbGciOiJIUzI1NiJ9.x.y')).toBeNull();
    expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
  });

  it('lehnt einen widerrufenen Schluessel ab', async () => {
    const { apiKey, plainKey } = await createValid();
    await apiKeyService.revokeApiKey(apiKey.id);

    expect(await apiKeyService.verifyApiKey(plainKey)).toBeNull();
  });

  it('lehnt einen abgelaufenen Schluessel ab', async () => {
    const { apiKey, plainKey } = await createValid();
    await (prisma.apiKey.update as jest.Mock)({
      where: { id: apiKey.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await apiKeyService.verifyApiKey(plainKey)).toBeNull();
  });

  it('akzeptiert einen Schluessel mit Ablauf in der Zukunft', async () => {
    const { apiKey, plainKey } = await createValid();
    await (prisma.apiKey.update as jest.Mock)({
      where: { id: apiKey.id },
      data: { expiresAt: new Date(Date.now() + 60_000) },
    });

    expect(await apiKeyService.verifyApiKey(plainKey)).not.toBeNull();
  });

  it('lehnt den Schluessel eines deaktivierten Users ab', async () => {
    const { apiKey, plainKey } = await createValid();
    await attachUser(apiKey.id, { id: USER_ID, email: 'a@b.de', role: 'USER', isActive: false });

    expect(await apiKeyService.verifyApiKey(plainKey)).toBeNull();
  });
});
