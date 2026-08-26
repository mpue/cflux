import crypto from 'crypto';
import { ApiKey, User } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * API-Schluessel fuer die Public API.
 *
 * Ein Schluessel handelt immer im Namen eines Users und kann nie mehr als
 * dieser User selbst: die Rollen- und Modulpruefung laeuft unveraendert weiter.
 * Die Scopes des Schluessels schraenken zusaetzlich ein.
 *
 * Format: cflux_<43 Zeichen base64url>. Gespeichert wird nur der SHA-256-Hash,
 * der Klartext ist ausschliesslich bei der Erstellung sichtbar.
 */

export const API_KEY_PREFIX = 'cflux_';

/** Laenge des gespeicherten, anzeigbaren Praefix (z.B. "cflux_a1b2c3d4"). */
const DISPLAY_PREFIX_LENGTH = API_KEY_PREFIX.length + 8;

/** lastUsedAt wird hoechstens alle 60s geschrieben, nicht bei jedem Request. */
const LAST_USED_THROTTLE_MS = 60_000;

export type ScopePermission = 'read' | 'write';

export interface CreateApiKeyInput {
  name: string;
  userId: string;
  scopes?: string[];
  readOnly?: boolean;
  expiresAt?: Date | null;
  createdById?: string | null;
}

export type ApiKeyWithUser = ApiKey & { user: User };

/** SHA-256 statt bcrypt: die Pruefung laeuft bei jedem API-Request. */
const hashKey = (plainKey: string): string =>
  crypto.createHash('sha256').update(plainKey).digest('hex');

export const isApiKeyToken = (token: string): boolean =>
  token.startsWith(API_KEY_PREFIX);

/**
 * Prueft, ob ein Scope-Satz eine Modul-Berechtigung abdeckt.
 * "devices:write" schliesst "devices:read" mit ein, "*" deckt alles ab.
 */
export const scopesAllow = (
  scopes: string[],
  moduleKey: string,
  permission: ScopePermission
): boolean => {
  if (scopes.includes('*')) return true;
  if (scopes.includes(`${moduleKey}:write`)) return true;
  return permission === 'read' && scopes.includes(`${moduleKey}:read`);
};

export const apiKeyService = {
  /**
   * Legt einen Schluessel an und gibt den Klartext genau einmal zurueck.
   */
  async createApiKey(input: CreateApiKeyInput): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const plainKey = `${API_KEY_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        name: input.name,
        keyPrefix: plainKey.slice(0, DISPLAY_PREFIX_LENGTH),
        keyHash: hashKey(plainKey),
        userId: input.userId,
        scopes: input.scopes ?? [],
        readOnly: input.readOnly ?? true,
        expiresAt: input.expiresAt ?? null,
        createdById: input.createdById ?? null,
      },
    });

    return { apiKey, plainKey };
  },

  async listApiKeys(userId?: string): Promise<ApiKey[]> {
    return prisma.apiKey.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getApiKeyById(id: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({ where: { id } });
  },

  /** Deaktiviert den Schluessel dauerhaft; der Datensatz bleibt fuer die Nachvollziehbarkeit. */
  async revokeApiKey(id: string): Promise<ApiKey> {
    return prisma.apiKey.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });
  },

  async updateApiKey(
    id: string,
    data: { name?: string; scopes?: string[]; readOnly?: boolean; expiresAt?: Date | null }
  ): Promise<ApiKey> {
    return prisma.apiKey.update({ where: { id }, data });
  },

  async deleteApiKey(id: string): Promise<void> {
    await prisma.apiKey.delete({ where: { id } });
  },

  /**
   * Loest einen Klartext-Schluessel auf. Liefert null, wenn der Schluessel
   * unbekannt, widerrufen, abgelaufen oder der User deaktiviert ist.
   */
  async verifyApiKey(plainKey: string): Promise<ApiKeyWithUser | null> {
    if (!isApiKeyToken(plainKey)) return null;

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash: hashKey(plainKey) },
      include: { user: true },
    });

    if (!apiKey) return null;
    if (!apiKey.isActive || apiKey.revokedAt) return null;
    if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= Date.now()) return null;
    if (!apiKey.user.isActive) return null;

    return apiKey;
  },

  /** Schreibt lastUsedAt gedrosselt; Fehler duerfen den Request nicht kippen. */
  async touchLastUsed(apiKey: ApiKey): Promise<void> {
    if (apiKey.lastUsedAt && Date.now() - apiKey.lastUsedAt.getTime() < LAST_USED_THROTTLE_MS) {
      return;
    }
    try {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      console.error('Failed to update API key lastUsedAt:', error);
    }
  },
};
