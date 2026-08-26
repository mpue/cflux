import api from './api';

/**
 * API-Schlüssel für die Public API.
 *
 * Der Klartext-Schlüssel existiert nur im Antwortobjekt von createApiKey —
 * das Backend speichert lediglich den SHA-256-Hash. Wer ihn dort nicht abliest,
 * kommt nicht mehr heran und braucht einen neuen Schlüssel.
 */

export interface ApiKey {
  id: string;
  name: string;
  /** Sichtbarer Anfang des Schlüssels, z.B. "cflux_a1b2c3d4" */
  keyPrefix: string;
  userId: string;
  scopes: string[];
  readOnly: boolean;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/** Nur bei der Erstellung: enthält zusätzlich den Klartext. */
export interface CreatedApiKey extends ApiKey {
  key: string;
}

export interface AvailableScope {
  module: string;
  name: string;
  scopes: string[];
}

export interface CreateApiKeyInput {
  name: string;
  /** Nur Admins dürfen Schlüssel im Namen eines anderen Users ausstellen. */
  userId?: string;
  scopes: string[];
  readOnly: boolean;
  expiresAt?: string | null;
}

export interface UpdateApiKeyInput {
  name?: string;
  scopes?: string[];
  readOnly?: boolean;
  expiresAt?: string | null;
}

/** Das fertig gebaute MCP-Client-Paket, sofern eines bereitliegt. */
export type ClientPackage =
  | { available: false }
  | {
      available: true;
      platform: 'windows';
      filename: string;
      version: string;
      size: number;
      builtAt: string;
    };

export const apiKeyService = {
  getApiKeys: async (): Promise<ApiKey[]> => {
    const response = await api.get('/api-keys');
    return response.data;
  },

  /** Die vergebbaren Scopes — nur Module, die per Public API erreichbar sind. */
  getAvailableScopes: async (): Promise<AvailableScope[]> => {
    const response = await api.get('/api-keys/scopes');
    return response.data;
  },

  getClientPackage: async (): Promise<ClientPackage> => {
    const response = await api.get('/api-keys/client');
    return response.data;
  },

  /**
   * Lädt das Client-Paket über den Blob-Weg, damit der Authorization-Header
   * mitgeht — ein einfacher Link könnte ihn nicht setzen.
   */
  downloadClientPackage: async (filename: string): Promise<void> => {
    const response = await api.get('/api-keys/client/download', { responseType: 'blob' });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  createApiKey: async (input: CreateApiKeyInput): Promise<CreatedApiKey> => {
    const response = await api.post('/api-keys', input);
    return response.data;
  },

  updateApiKey: async (id: string, input: UpdateApiKeyInput): Promise<ApiKey> => {
    const response = await api.put(`/api-keys/${id}`, input);
    return response.data;
  },

  /** Deaktiviert den Schlüssel dauerhaft, behält ihn aber für die Nachvollziehbarkeit. */
  revokeApiKey: async (id: string): Promise<ApiKey> => {
    const response = await api.post(`/api-keys/${id}/revoke`);
    return response.data;
  },

  deleteApiKey: async (id: string): Promise<void> => {
    await api.delete(`/api-keys/${id}`);
  },
};

/** Zeigt an, warum ein Schlüssel gerade nicht funktioniert. */
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

export const getApiKeyStatus = (key: ApiKey): ApiKeyStatus => {
  if (!key.isActive || key.revokedAt) return 'revoked';
  if (key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now()) return 'expired';
  return 'active';
};
