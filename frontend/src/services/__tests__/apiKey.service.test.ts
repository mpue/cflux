import { ApiKey, apiKeyService, getApiKeyStatus } from '../apiKey.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

const baseKey: ApiKey = {
  id: 'key-1',
  name: 'Claude Connector',
  keyPrefix: 'cflux_a1b2c3d4',
  userId: 'user-1',
  scopes: ['projects:read'],
  readOnly: true,
  isActive: true,
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('apiKeyService - Lesen', () => {
  it('holt die Schlüsselliste', async () => {
    mockedApi.get.mockResolvedValue({ data: [baseKey] });

    const result = await apiKeyService.getApiKeys();

    expect(mockedApi.get).toHaveBeenCalledWith('/api-keys');
    expect(result).toEqual([baseKey]);
  });

  it('holt die vergebbaren Scopes', async () => {
    const scopes = [{ module: 'projects', name: 'Projekte', scopes: ['projects:read', 'projects:write'] }];
    mockedApi.get.mockResolvedValue({ data: scopes });

    const result = await apiKeyService.getAvailableScopes();

    expect(mockedApi.get).toHaveBeenCalledWith('/api-keys/scopes');
    expect(result).toEqual(scopes);
  });

  it('reicht einen Fehler durch', async () => {
    mockedApi.get.mockRejectedValue(new Error('Network Error'));

    await expect(apiKeyService.getApiKeys()).rejects.toThrow('Network Error');
  });
});

describe('apiKeyService - Anlegen', () => {
  it('legt einen Schlüssel an und liefert den Klartext', async () => {
    mockedApi.post.mockResolvedValue({
      data: { ...baseKey, key: 'cflux_a1b2c3d4geheim' },
    });

    const result = await apiKeyService.createApiKey({
      name: 'Claude Connector',
      scopes: ['projects:read'],
      readOnly: true,
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/api-keys', {
      name: 'Claude Connector',
      scopes: ['projects:read'],
      readOnly: true,
    });
    expect(result.key).toBe('cflux_a1b2c3d4geheim');
  });

  it('gibt einen abweichenden Benutzer mit', async () => {
    mockedApi.post.mockResolvedValue({ data: { ...baseKey, key: 'cflux_x' } });

    await apiKeyService.createApiKey({
      name: 'Fremd',
      userId: 'user-2',
      scopes: ['*'],
      readOnly: false,
      expiresAt: '2026-12-31T00:00:00.000Z',
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/api-keys', {
      name: 'Fremd',
      userId: 'user-2',
      scopes: ['*'],
      readOnly: false,
      expiresAt: '2026-12-31T00:00:00.000Z',
    });
  });
});

describe('apiKeyService - Ändern, Widerrufen, Löschen', () => {
  it('ändert einen Schlüssel', async () => {
    mockedApi.put.mockResolvedValue({ data: { ...baseKey, name: 'Neu' } });

    const result = await apiKeyService.updateApiKey('key-1', { name: 'Neu' });

    expect(mockedApi.put).toHaveBeenCalledWith('/api-keys/key-1', { name: 'Neu' });
    expect(result.name).toBe('Neu');
  });

  it('widerruft einen Schlüssel', async () => {
    mockedApi.post.mockResolvedValue({
      data: { ...baseKey, isActive: false, revokedAt: '2026-08-20T09:00:00.000Z' },
    });

    const result = await apiKeyService.revokeApiKey('key-1');

    expect(mockedApi.post).toHaveBeenCalledWith('/api-keys/key-1/revoke');
    expect(result.isActive).toBe(false);
  });

  it('löscht einen Schlüssel', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await apiKeyService.deleteApiKey('key-1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/api-keys/key-1');
  });
});

describe('getApiKeyStatus', () => {
  it('erkennt einen aktiven Schlüssel', () => {
    expect(getApiKeyStatus(baseKey)).toBe('active');
  });

  it('erkennt einen widerrufenen Schlüssel', () => {
    expect(getApiKeyStatus({ ...baseKey, isActive: false })).toBe('revoked');
    expect(getApiKeyStatus({ ...baseKey, revokedAt: '2026-08-20T09:00:00.000Z' })).toBe('revoked');
  });

  it('erkennt einen abgelaufenen Schlüssel', () => {
    expect(getApiKeyStatus({ ...baseKey, expiresAt: '2020-01-01T00:00:00.000Z' })).toBe('expired');
  });

  it('lässt ein Ablaufdatum in der Zukunft aktiv', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(getApiKeyStatus({ ...baseKey, expiresAt: future })).toBe('active');
  });

  it('meldet einen widerrufenen und abgelaufenen Schlüssel als widerrufen', () => {
    // Der Widerruf ist die stärkere Aussage — er war eine Entscheidung.
    expect(
      getApiKeyStatus({ ...baseKey, isActive: false, expiresAt: '2020-01-01T00:00:00.000Z' })
    ).toBe('revoked');
  });
});
