import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user.service';
import { BaseModal } from '../common/BaseModal';
import {
  ApiKey,
  ApiKeyStatus,
  AvailableScope,
  ClientPackage,
  CreatedApiKey,
  apiKeyService,
  getApiKeyStatus,
} from '../../services/apiKey.service';

/**
 * Verwaltung der API-Schlüssel für die Public API.
 *
 * Ein Schlüssel handelt im Namen eines Users und kann nie mehr als dieser —
 * die Scopes schränken zusätzlich ein. Erreichbar sind ohnehin nur die Module,
 * die serverseitig freigegeben sind; /api-keys/scopes liefert genau diese Liste.
 */

/** Zugriff je Modul. 'write' schließt 'read' mit ein. */
type ModuleAccess = 'none' | 'read' | 'write';

interface KeyFormState {
  name: string;
  userId: string;
  readOnly: boolean;
  wildcard: boolean;
  expiresAt: string;
  access: Record<string, ModuleAccess>;
}

const emptyForm = (userId: string): KeyFormState => ({
  name: '',
  userId,
  readOnly: true,
  wildcard: false,
  expiresAt: '',
  access: {},
});

/** Baut aus der Formularauswahl die Scope-Strings für das Backend. */
const buildScopes = (form: KeyFormState): string[] => {
  if (form.wildcard) return ['*'];

  return Object.entries(form.access)
    .filter(([, access]) => access !== 'none')
    .map(([moduleKey, access]) => `${moduleKey}:${access}`)
    .sort();
};

/** Liest vorhandene Scopes zurück ins Formular. */
const parseScopes = (scopes: string[]): Pick<KeyFormState, 'wildcard' | 'access'> => {
  if (scopes.includes('*')) return { wildcard: true, access: {} };

  const access: Record<string, ModuleAccess> = {};
  for (const scope of scopes) {
    const [moduleKey, permission] = scope.split(':');
    if (permission === 'read' || permission === 'write') {
      access[moduleKey] = permission;
    }
  }
  return { wildcard: false, access };
};

/** Für <input type="date"> — leer, wenn kein Ablauf gesetzt ist. */
const toDateInput = (iso: string | null): string => (iso ? iso.slice(0, 10) : '');

/**
 * Ankreuzfelder brauchen ihre natürliche Breite: die globale Regel
 * `.form-group input { width: 100% }` zieht sonst auch Checkbox und Radio
 * über die ganze Zeile und schiebt die Beschriftung an den rechten Rand.
 */
const CHOICE_INPUT: React.CSSProperties = { width: 'auto', flex: '0 0 auto', margin: 0 };

const STATUS_LABEL: Record<ApiKeyStatus, { text: string; color: string }> = {
  active: { text: '● Aktiv', color: '#16a34a' },
  revoked: { text: '● Widerrufen', color: '#dc2626' },
  expired: { text: '● Abgelaufen', color: '#d97706' },
};

const formatDateTime = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString('de-DE') : '—';

export const ApiKeysTab: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [availableScopes, setAvailableScopes] = useState<AvailableScope[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clientPackage, setClientPackage] = useState<ClientPackage>({ available: false });
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiKey | null>(null);
  const [form, setForm] = useState<KeyFormState>(emptyForm(''));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Nur direkt nach dem Anlegen gesetzt — danach ist der Klartext weg. */
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [keyList, scopeList, pkg] = await Promise.all([
        apiKeyService.getApiKeys(),
        apiKeyService.getAvailableScopes(),
        // Fehlt das Paket, bleibt es beim Vorgabewert und die Oberflaeche
        // blendet den Knopf aus, statt einen toten Link anzubieten.
        apiKeyService.getClientPackage().catch(() => ({ available: false }) as ClientPackage),
      ]);
      setKeys(keyList);
      setAvailableScopes(scopeList);
      setClientPackage(pkg);

      if (isAdmin) {
        setUsers(await userService.getAllUsersAdmin());
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Die API-Schlüssel konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(user?.id ?? ''));
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (key: ApiKey) => {
    setEditing(key);
    setForm({
      name: key.name,
      userId: key.userId,
      readOnly: key.readOnly,
      expiresAt: toDateInput(key.expiresAt),
      ...parseScopes(key.scopes),
    });
    setFormError(null);
    setShowForm(true);
  };

  const setModuleAccess = (moduleKey: string, access: ModuleAccess) => {
    setForm((prev) => ({ ...prev, access: { ...prev.access, [moduleKey]: access } }));
  };

  const selectedCount = useMemo(
    () => Object.values(form.access).filter((a) => a !== 'none').length,
    [form.access]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const scopes = buildScopes(form);
    if (scopes.length === 0) {
      setFormError('Bitte mindestens ein Modul freigeben — sonst kann der Schlüssel nichts.');
      return;
    }

    setSaving(true);
    try {
      // Ein leeres Datum bedeutet: kein Ablauf. Das Backend erwartet dann null.
      const expiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString() : null;

      if (editing) {
        await apiKeyService.updateApiKey(editing.id, {
          name: form.name,
          scopes,
          readOnly: form.readOnly,
          expiresAt,
        });
      } else {
        const created = await apiKeyService.createApiKey({
          name: form.name,
          ...(isAdmin && form.userId !== user?.id ? { userId: form.userId } : {}),
          scopes,
          readOnly: form.readOnly,
          expiresAt,
        });
        setCreatedKey(created);
        setCopied(false);
      }

      setShowForm(false);
      await load();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Der Schlüssel konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (key: ApiKey) => {
    if (!window.confirm(
      `Schlüssel "${key.name}" widerrufen?\n\n` +
      'Er verliert sofort seine Gültigkeit. Der Eintrag bleibt für die Nachvollziehbarkeit bestehen.'
    )) {
      return;
    }

    try {
      await apiKeyService.revokeApiKey(key.id);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Der Schlüssel konnte nicht widerrufen werden');
    }
  };

  const handleDelete = async (key: ApiKey) => {
    if (!window.confirm(
      `Schlüssel "${key.name}" endgültig löschen?\n\n` +
      'Damit verschwindet auch die Spur, dass es ihn gab. Zum reinen Sperren besser "Widerrufen" benutzen.'
    )) {
      return;
    }

    try {
      await apiKeyService.deleteApiKey(key.id);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Der Schlüssel konnte nicht gelöscht werden');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClientDownload = async () => {
    if (!clientPackage.available) return;

    setDownloading(true);
    try {
      await apiKeyService.downloadClientPackage(clientPackage.filename);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Das Client-Paket konnte nicht geladen werden');
    } finally {
      setDownloading(false);
    }
  };

  const scopeSummary = (key: ApiKey) => {
    if (key.scopes.includes('*')) {
      return <span style={{ fontWeight: 600 }}>Alle Module</span>;
    }
    if (key.scopes.length === 0) {
      return <span style={{ color: '#999' }}>keine</span>;
    }
    return (
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {key.scopes.map((scope) => (
          <code
            key={scope}
            style={{
              fontSize: '11px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              padding: '1px 5px',
            }}
          >
            {scope}
          </code>
        ))}
      </span>
    );
  };

  /** Der Download-Knopf — im Tab und noch einmal direkt nach dem Anlegen. */
  const clientDownloadButton = (variant: 'primary' | 'secondary') =>
    clientPackage.available ? (
      <button
        type="button"
        className={`btn btn-${variant}`}
        onClick={handleClientDownload}
        disabled={downloading}
        style={{ whiteSpace: 'nowrap' }}
      >
        {downloading ? 'Wird geladen …' : '⬇ Windows-Paket'}
      </button>
    ) : null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 6px' }}>🔌 API-Schlüssel</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', maxWidth: '640px' }}>
            Für externe Integrationen. Ein Schlüssel handelt im Namen eines Benutzers und
            kommt nur an die Module, die hier freigegeben sind — alles andere bleibt dem
            Login vorbehalten.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ whiteSpace: 'nowrap' }}>
          + Neuer Schlüssel
        </button>
      </div>

      {clientPackage.available && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          <div style={{ color: '#075985' }}>
            <strong>Client für Claude Desktop (Windows)</strong>
            <div style={{ marginTop: '2px', color: '#0369a1' }}>
              Version {clientPackage.version} · {(clientPackage.size / 1024 / 1024).toFixed(0)} MB ·
              gebaut am {new Date(clientPackage.builtAt).toLocaleDateString('de-DE')} — enthält
              alles Nötige, es muss nichts installiert werden.
            </div>
          </div>
          {clientDownloadButton('primary')}
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Lade API-Schlüssel …</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Schlüssel</th>
                {isAdmin && <th>Benutzer</th>}
                <th>Zugriff</th>
                <th>Scopes</th>
                <th>Status</th>
                <th>Zuletzt benutzt</th>
                <th>Läuft ab</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 8}
                    style={{ textAlign: 'center', padding: '2rem', color: '#999' }}
                  >
                    Noch keine API-Schlüssel angelegt
                  </td>
                </tr>
              )}
              {keys.map((key) => {
                const status = getApiKeyStatus(key);
                return (
                  <tr key={key.id} style={status === 'active' ? undefined : { opacity: 0.6 }}>
                    <td style={{ fontWeight: 500 }}>{key.name}</td>
                    <td>
                      <code style={{ fontSize: '12px' }}>{key.keyPrefix}…</code>
                    </td>
                    {isAdmin && (
                      <td style={{ fontSize: '13px' }}>
                        {key.user ? (
                          <>
                            <div>{key.user.firstName} {key.user.lastName}</div>
                            <div style={{ color: '#666', fontSize: '12px' }}>{key.user.email}</div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {key.readOnly ? '🔒 Nur lesen' : '✏️ Lesen + schreiben'}
                    </td>
                    <td style={{ maxWidth: '260px' }}>{scopeSummary(key)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: STATUS_LABEL[status].color, fontWeight: 600, fontSize: '13px' }}>
                      {STATUS_LABEL[status].text}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {formatDateTime(key.lastUsedAt)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('de-DE') : '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(key)}>
                        Bearbeiten
                      </button>{' '}
                      {status === 'active' && (
                        <>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleRevoke(key)}>
                            Widerrufen
                          </button>{' '}
                        </>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(key)}>
                        Löschen
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Anlegen / Bearbeiten */}
      {showForm && (
        <BaseModal isOpen onClose={() => setShowForm(false)} maxWidth="720px">
          <h2>{editing ? 'Schlüssel bearbeiten' : 'Neuer API-Schlüssel'}</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                required
                value={form.name}
                placeholder="z.B. Claude Connector"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {isAdmin && !editing && (
              <div className="form-group">
                <label>Handelt im Namen von</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.lastName}, {u.firstName} ({u.email})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6b7280' }}>
                  Der Schlüssel kann nie mehr als dieser Benutzer selbst.
                </small>
              </div>
            )}

            <div className="form-group">
              <label>Läuft ab am</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
              <small style={{ color: '#6b7280' }}>Leer lassen für unbegrenzte Gültigkeit.</small>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={CHOICE_INPUT}
                  checked={form.readOnly}
                  onChange={(e) => setForm({ ...form, readOnly: e.target.checked })}
                />
                <span>Nur-Lesen-Schlüssel</span>
              </label>
              <small style={{ color: '#6b7280' }}>
                Blockt POST, PUT, PATCH und DELETE unabhängig von den Scopes — der Notausschalter
                für Integrationen, die nur Daten abholen sollen.
              </small>
            </div>

            {isAdmin && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={CHOICE_INPUT}
                    checked={form.wildcard}
                    onChange={(e) => setForm({ ...form, wildcard: e.target.checked })}
                  />
                  <span>Alle freigegebenen Module (<code>*</code>)</span>
                </label>
                <small style={{ color: '#6b7280' }}>
                  Gilt für alle Module aus der Liste unten — sperrte Bereiche wie Backup oder
                  Benutzerverwaltung bleiben auch damit unerreichbar.
                </small>
              </div>
            )}

            {!form.wildcard && (
              <div className="form-group">
                <label>
                  Module{' '}
                  <span style={{ fontWeight: 400, color: '#6b7280' }}>
                    ({selectedCount} von {availableScopes.length} freigegeben)
                  </span>
                </label>

                <div
                  style={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                >
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Modul</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Kein</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Lesen</th>
                        <th style={{ width: '110px', textAlign: 'center' }}>Schreiben</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableScopes.map((scope) => {
                        const current = form.access[scope.module] ?? 'none';
                        return (
                          <tr key={scope.module}>
                            <td>
                              <div style={{ fontSize: '14px' }}>{scope.name}</div>
                              <code style={{ fontSize: '11px', color: '#6b7280' }}>
                                {scope.module}
                              </code>
                            </td>
                            {(['none', 'read', 'write'] as ModuleAccess[]).map((access) => (
                              <td key={access} style={{ textAlign: 'center' }}>
                                <input
                                  type="radio"
                                  style={CHOICE_INPUT}
                                  name={`access-${scope.module}`}
                                  checked={current === access}
                                  // Bei einem Nur-Lesen-Schlüssel wäre ein write-Scope
                                  // wirkungslos — gar nicht erst anbieten.
                                  disabled={access === 'write' && form.readOnly}
                                  onChange={() => setModuleAccess(scope.module, access)}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {form.readOnly && (
                  <small style={{ color: '#6b7280' }}>
                    „Schreiben“ ist deaktiviert, solange der Schlüssel auf Nur-Lesen steht.
                  </small>
                )}
              </div>
            )}

            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px',
                  borderRadius: '8px',
                  margin: '16px 0',
                  fontSize: '14px',
                }}
              >
                {formError}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Wird gespeichert …' : editing ? 'Speichern' : 'Schlüssel erzeugen'}
              </button>
            </div>
          </form>
        </BaseModal>
      )}

      {/* Klartext genau einmal anzeigen */}
      {createdKey && (
        <BaseModal isOpen onClose={() => setCreatedKey(null)} maxWidth="580px">
          <h2>🔑 Schlüssel erzeugt</h2>

          <div
            style={{
              background: '#fffbeb',
              borderLeft: '4px solid #f59e0b',
              padding: '12px',
              borderRadius: '4px',
              margin: '16px 0',
              fontSize: '14px',
              color: '#92400e',
            }}
          >
            Der Schlüssel lässt sich <strong>nur jetzt</strong> ablesen. Gespeichert wird nur
            sein Hash — wer ihn hier nicht sichert, braucht einen neuen.
          </div>

          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
            {createdKey.name}
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <code
              style={{
                flex: 1,
                padding: '12px',
                background: '#f3f4f6',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '14px',
                wordBreak: 'break-all',
                color: '#111827',
              }}
            >
              {createdKey.key}
            </code>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCopy(createdKey.key)}
            >
              {copied ? '✓ Kopiert' : 'Kopieren'}
            </button>
          </div>

          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px' }}>
            Verwendung — entweder als eigener Header oder als Bearer-Token:
          </p>
          <pre
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              overflowX: 'auto',
              margin: 0,
            }}
          >
{`X-API-Key: ${createdKey.key}
Authorization: Bearer ${createdKey.key}`}
          </pre>

          {clientPackage.available && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '16px',
                padding: '12px 16px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#075985',
              }}
            >
              <span>
                Für Claude Desktop unter Windows gibt es den fertigen Client — entpacken,
                Schlüssel eintragen, fertig.
              </span>
              {clientDownloadButton('secondary')}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => setCreatedKey(null)}>
              Fertig
            </button>
          </div>
        </BaseModal>
      )}
    </div>
  );
};

export default ApiKeysTab;
