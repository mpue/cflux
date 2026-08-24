import axios from 'axios';
import { prisma } from '../lib/prisma';

/**
 * Action1-Integration: Synchronisiert die installierte Software je Gerät
 * aus der Action1-Cloud-API in den DeviceSoftware-Assetkatalog.
 *
 * API-Referenz (verifiziert über das offizielle PSAction1-Modul):
 *  - Auth:      POST {base}/oauth2/token  (client_id, client_secret) -> { access_token, expires_in }
 *  - Endpoints: GET  {base}/endpoints/managed/{org}
 *  - Apps:      GET  {base}/apps/{org}/data/{endpointId}
 *  - Paginierung über offset/limit, Antwort mit { items: [...] }
 */

const REGION_BASE_URL: Record<string, string> = {
  NorthAmerica: 'https://app.action1.com/api/3.0',
  'NorthAmerica-2': 'https://app.na-2.action1.com/api/3.0',
  'NA-2': 'https://app.na-2.action1.com/api/3.0',
  Europe: 'https://app.eu.action1.com/api/3.0',
  Australia: 'https://app.au.action1.com/api/3.0'
};

interface Action1Config {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  orgId: string;
  autoCreateDevices: boolean;
  syncUpdates: boolean;
  syncVulnerabilities: boolean;
  vulnSeverities: string[]; // z.B. ['Critical', 'High']
}

interface Action1Endpoint {
  id: string;
  name?: string;
  serial?: string;
  status?: string;
  lastSeen?: string;
  ipAddress?: string;
  raw: any;
}

export interface SyncResult {
  deviceId: string;
  deviceName: string;
  matched: boolean;
  added: number;
  updated: number;
  removed: number;
  serialUpdated?: boolean;
  updatesCount?: number;
  vulnsCount?: number;
  error?: string;
}

export interface SyncSummary {
  devicesTotal: number;
  devicesMatched: number;
  devicesSkipped: number;
  devicesCreated: number;
  serialsUpdated: number;
  added: number;
  updated: number;
  removed: number;
  updatesTotal: number;
  vulnsTotal: number;
  results: SyncResult[];
}

// ── Hilfen ────────────────────────────────────────────────

/** Führt `fn` über alle Items mit begrenzter Parallelität aus (Reihenfolge des Ergebnisses = Reihenfolge der Items). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Wandelt einen axios-Fehler in eine aussagekräftige Meldung (Schritt, URL, Status, Antwort). */
function describeAxiosError(step: string, url: string, err: any): Error {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const statusText = err.response?.statusText || '';
    let body: any = err.response?.data;
    if (body && typeof body === 'object') {
      try { body = JSON.stringify(body); } catch { body = String(body); }
    }
    const bodyStr = body ? String(body).slice(0, 500) : '(leerer Antworttext)';

    if (status === 403) {
      return new Error(
        `Action1 „${step}" abgelehnt: HTTP 403 Forbidden (${url}). ` +
        `Häufigste Ursachen: (1) die API-Credentials haben nicht die nötige Rolle/Berechtigung in Action1, ` +
        `(2) falsche Organization ID, (3) falsche Region. Action1-Antwort: ${bodyStr}`
      );
    }
    if (status === 401) {
      return new Error(
        `Action1 „${step}" nicht autorisiert: HTTP 401 (${url}). ` +
        `Prüfe Client ID / Client Secret und die Region. Action1-Antwort: ${bodyStr}`
      );
    }
    return new Error(
      `Action1 „${step}": HTTP ${status ?? '?'} ${statusText} (${url}). Antwort: ${bodyStr}`
    );
  }
  return new Error(`Action1 „${step}": ${err?.message || 'Unbekannter Fehler'} (${url})`);
}

const pick = (obj: any, keys: string[]): string | undefined => {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return undefined;
};

// In-Memory-Token-Cache (pro clientId, mit früher Ablaufmarge)
let tokenCache: { clientId: string; token: string; expiresAt: number } | null = null;

/** Liest & validiert die Action1-Konfiguration aus SystemSettings. */
async function loadConfig(): Promise<Action1Config> {
  const s = await prisma.systemSettings.findFirst();
  if (!s || !s.action1Enabled) {
    throw new Error('Action1-Integration ist nicht aktiviert');
  }
  const baseUrl = REGION_BASE_URL[s.action1Region || ''];
  if (!baseUrl) {
    throw new Error('Ungültige oder fehlende Action1-Region');
  }
  if (!s.action1ClientId || !s.action1ClientSecret || !s.action1OrgId) {
    throw new Error('Action1-Zugangsdaten (Client ID, Secret, Organization ID) unvollständig');
  }
  const vulnSeverities = (s.action1VulnSeverity || 'Critical,High')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);

  return {
    baseUrl,
    clientId: s.action1ClientId,
    clientSecret: s.action1ClientSecret,
    orgId: s.action1OrgId,
    autoCreateDevices: s.action1AutoCreateDevices,
    syncUpdates: s.action1SyncUpdates,
    syncVulnerabilities: s.action1SyncVulnerabilities,
    vulnSeverities
  };
}

/** Holt ein OAuth2-Token (mit Caching). */
async function getToken(cfg: Action1Config): Promise<string> {
  if (tokenCache && tokenCache.clientId === cfg.clientId && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret
  });

  const tokenUrl = `${cfg.baseUrl}/oauth2/token`;
  let res;
  try {
    res = await axios.post(tokenUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000
    });
  } catch (err) {
    throw describeAxiosError('Token anfordern', tokenUrl, err);
  }

  const token = res.data?.access_token;
  if (!token) {
    throw new Error('Action1-Authentifizierung fehlgeschlagen (kein access_token in der Antwort)');
  }
  const expiresIn = Number(res.data?.expires_in) || 3600;
  tokenCache = {
    clientId: cfg.clientId,
    token,
    expiresAt: Date.now() + (expiresIn - 30) * 1000 // 30s Puffer
  };
  return token;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** GET mit automatischem Retry bei HTTP 429 (Rate Limit) gemäß retry_after. */
async function action1Get(url: string, token: string, label: string): Promise<any> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const ra = Number(err.response.data?.details?.retry_after) || 1;
        await sleep((ra + 0.5) * 1000); // etwas Puffer über retry_after
        continue;
      }
      throw describeAxiosError(label, url, err);
    }
  }
  throw new Error(`Action1 „${label}": dauerhaft rate-limitiert (429) nach mehreren Versuchen`);
}

/** POST mit automatischem Retry bei HTTP 429 (Rate Limit). */
async function action1Post(url: string, token: string, body: any, label: string): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await axios.post(url, body, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 60000
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const ra = Number(err.response.data?.details?.retry_after) || 1;
        await sleep((ra + 0.5) * 1000);
        continue;
      }
      throw describeAxiosError(label, url, err);
    }
  }
  throw new Error(`Action1 „${label}": dauerhaft rate-limitiert (429)`);
}

/**
 * Paginierter GET über den `from`-Cursor der Action1-API (nicht `offset`, das ignoriert die API!).
 * Stoppt, wenn eine Seite weniger als `limit` liefert oder `total_items` erreicht ist.
 */
async function pagedGet(cfg: Action1Config, token: string, path: string): Promise<any[]> {
  const limit = 200;
  let from = 0;
  const collected: any[] = [];

  // Schutz gegen Endlosschleifen (bei 200/Seite reichen 500 Seiten für 100k Items)
  for (let page = 0; page < 500; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${cfg.baseUrl}${path}${sep}limit=${limit}&from=${from}`;
    const res = await action1Get(url, token, `GET ${path}`);
    const data = res.data;
    const items: any[] = Array.isArray(data) ? data : (data?.items || data?.data || []);
    if (items.length === 0) break;
    collected.push(...items);

    if (Array.isArray(data)) break; // nicht-paginierte Antwort
    const total = Number(data?.total_items);
    if (items.length < limit) break;              // letzte Seite
    if (!isNaN(total) && collected.length >= total) break; // alle geholt
    from += items.length;
  }
  return collected;
}

/** Verwaltete Endpoints der Organisation. */
async function getManagedEndpoints(cfg: Action1Config, token: string): Promise<Action1Endpoint[]> {
  const raw = await pagedGet(cfg, token, `/endpoints/managed/${cfg.orgId}`);
  return raw.map(e => ({
    id: pick(e, ['id', 'ID', 'endpoint_id']) || '',
    name: pick(e, ['name', 'hostname', 'computer_name', 'Name']),
    serial: pick(e, ['serial', 'serial_number', 'serialNumber', 'bios_serial', 'BIOS_serial']),
    status: pick(e, ['status', 'Status', 'connection_status']),
    lastSeen: pick(e, ['last_seen', 'lastSeen', 'last_seen_at']),
    ipAddress: pick(e, ['address', 'ip_address', 'ipAddress', 'ip']),
    raw: e
  })).filter(e => e.id);
}

/** Installierte Software eines Endpoints. */
async function getEndpointApps(cfg: Action1Config, token: string, endpointId: string): Promise<any[]> {
  return pagedGet(cfg, token, `/apps/${cfg.orgId}/data/${endpointId}`);
}

/** Einzelnes Endpoint-Objekt (enthält je nach API mehr Felder als die Liste, z.B. OS-Details). */
async function getEndpointDetail(cfg: Action1Config, token: string, endpointId: string): Promise<any> {
  const url = `${cfg.baseUrl}/endpoints/managed/${cfg.orgId}/${endpointId}`;
  const res = await action1Get(url, token, `GET /endpoints/managed/${cfg.orgId}/${endpointId}`);
  return res.data;
}

/** Organisationen, auf die die API-Credentials Zugriff haben. */
async function getOrganizations(cfg: Action1Config, token: string): Promise<Array<{ id: string; name?: string }>> {
  const raw = await pagedGet(cfg, token, `/organizations`);
  return raw
    .map(o => ({ id: pick(o, ['id', 'ID', 'org_id']) || '', name: pick(o, ['name', 'Name']) }))
    .filter(o => o.id);
}

// ── Fehlende Updates & Schwachstellen ─────────────────────
interface NormalizedUpdate {
  externalId: string;
  title: string;
  kb: string | null;
  severity: string | null;
  category: string | null;
  releaseDate: Date | null;
  packageId: string | null; // für Deploy (Action1 packages: { [package_id]: version })
  version: string | null;
}
interface NormalizedVuln {
  cveId: string;
  name: string | null;
  score: string | null;
  remediationStatus: string | null;
}

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Parst Action1-Zeitstempel im Format "YYYY-MM-DD_HH-MM-SS" (UTC). */
function parseAction1Timestamp(s?: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[_ T](\d{2})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`);
    return isNaN(d.getTime()) ? null : d;
  }
  return parseDate(s);
}

/**
 * Gerätezentriert: holt CVEs eines Endpoints direkt über den `endpoint_id`-Filter
 * (viel effizienter als je CVE die Endpoints zu iterieren) und leitet daraus die
 * fehlenden (sicherheitsrelevanten) Updates aus software[].available_updates ab.
 * Der org-weite /updates-Katalog hat keinen Geräte-Bezug und wird nicht genutzt.
 */
async function fetchDeviceVulnsAndUpdates(
  cfg: Action1Config,
  token: string,
  endpointId: string,
  severities: string[]
): Promise<{ vulns: NormalizedVuln[]; updates: NormalizedUpdate[] }> {
  const vulns: NormalizedVuln[] = [];
  const seenCve = new Set<string>();
  const updatesMap = new Map<string, NormalizedUpdate>();

  for (const sev of severities) {
    const items = await pagedGet(
      cfg,
      token,
      `/vulnerabilities/${cfg.orgId}?endpoint_id=${encodeURIComponent(endpointId)}&score=${encodeURIComponent(sev)}&remediation_status=All`
    );
    for (const v of items) {
      const cveId = pick(v, ['cve_id', 'cveId', 'CVE', 'id']);
      if (!cveId || seenCve.has(cveId)) continue;
      seenCve.add(cveId);

      const product = Array.isArray(v.software) ? pick(v.software[0], ['product_name', 'name']) : undefined;
      vulns.push({
        cveId,
        name: pick(v, ['name', 'title']) || product || null,
        score: sev,
        remediationStatus: pick(v, ['remediation_status', 'remediationStatus', 'status']) || null
      });

      // fehlende Updates aus available_updates ableiten
      const swList = Array.isArray(v.software) ? v.software : [];
      for (const sw of swList) {
        const ups = Array.isArray(sw.available_updates) ? sw.available_updates : [];
        for (const up of ups) {
          const title = pick(up, ['name', 'title']);
          if (!title) continue;
          const kbMatch = title.match(/KB\d+/i);
          const packageId = pick(up, ['package_id', 'version_id', 'id']) || null;
          const version = pick(up, ['version']) || 'Latest';
          const externalId = packageId || title;
          if (!updatesMap.has(externalId)) {
            updatesMap.set(externalId, {
              externalId,
              title,
              kb: kbMatch ? kbMatch[0].toUpperCase() : null,
              severity: null,
              category: 'Sicherheitsupdate',
              releaseDate: null,
              packageId,
              version
            });
          }
        }
      }
    }
  }

  return { vulns, updates: [...updatesMap.values()] };
}

/** Ersetzt die Update-Einträge eines Geräts (rein synchronisiert). */
async function replaceDeviceUpdates(deviceId: string, updates: NormalizedUpdate[]): Promise<number> {
  await prisma.deviceUpdate.deleteMany({ where: { deviceId } });
  if (updates.length === 0) return 0;
  const now = new Date();
  await prisma.deviceUpdate.createMany({
    data: updates.map(u => ({
      deviceId,
      externalId: u.externalId,
      title: u.title,
      kb: u.kb,
      severity: u.severity,
      category: u.category,
      releaseDate: u.releaseDate,
      lastSyncedAt: now
    }))
  });
  return updates.length;
}

/** Ersetzt die Schwachstellen-Einträge eines Geräts (rein synchronisiert). */
async function replaceDeviceVulns(deviceId: string, vulns: NormalizedVuln[]): Promise<number> {
  await prisma.deviceVulnerability.deleteMany({ where: { deviceId } });
  if (vulns.length === 0) return 0;
  const now = new Date();
  await prisma.deviceVulnerability.createMany({
    data: vulns.map(v => ({
      deviceId,
      cveId: v.cveId,
      name: v.name,
      score: v.score,
      remediationStatus: v.remediationStatus,
      lastSyncedAt: now
    }))
  });
  return vulns.length;
}

/** Ordnet ein cflux-Gerät einem Action1-Endpoint zu (Seriennummer, dann Name/Hostname). */
function matchEndpoint(
  device: { name: string; serialNumber: string | null; action1EndpointId: string | null },
  endpoints: Action1Endpoint[]
): Action1Endpoint | null {
  // 1) Bereits gespeicherte Zuordnung
  if (device.action1EndpointId) {
    const byId = endpoints.find(e => e.id === device.action1EndpointId);
    if (byId) return byId;
  }
  // 2) Seriennummer (case-insensitive)
  if (device.serialNumber) {
    const sn = device.serialNumber.trim().toLowerCase();
    const bySerial = endpoints.find(e => e.serial && e.serial.trim().toLowerCase() === sn);
    if (bySerial) return bySerial;
  }
  // 3) Gerätename == Hostname (case-insensitive)
  const dn = device.name.trim().toLowerCase();
  const byName = endpoints.find(e => e.name && e.name.trim().toLowerCase() === dn);
  if (byName) return byName;

  return null;
}

interface NormalizedSoftware {
  name: string;
  version: string | null;
  vendor: string | null;
  type: string; // "Software" | "Betriebssystem"
  externalId: string;
}

/** Leitet den Hersteller aus dem OS-Namen ab. */
function deriveOsVendor(osName: string): string | null {
  const n = osName.toLowerCase();
  if (/windows/.test(n)) return 'Microsoft';
  if (/mac ?os|os x|darwin/.test(n)) return 'Apple';
  if (/ubuntu|debian|linux|red ?hat|centos|fedora|suse/.test(n)) return 'Linux';
  return null;
}

/** Normalisiert eine Action1-App in einen Software-Eintrag. */
function normalizeApp(app: any): NormalizedSoftware | null {
  // /apps liefert ReportRow-Objekte; die eigentlichen Werte stecken in `fields`
  const f = app && typeof app.fields === 'object' && app.fields ? app.fields : app;
  const name = pick(f, ['Name', 'name', 'DisplayName', 'app_name', 'application']);
  if (!name) return null;
  const version = pick(f, ['Version', 'version']) || null;
  const vendor = pick(f, ['Vendor', 'vendor', 'Publisher', 'publisher']) || null;
  // stabiler Schlüssel (ReportRow-id ist nur ein Zeilenindex und ändert sich)
  const externalId = `${name}::${version || ''}`;
  return { name, version, vendor, type: 'Software', externalId };
}

/** Erzeugt aus den Endpoint-Daten einen Betriebssystem-Eintrag. */
function normalizeOs(endpoint: Action1Endpoint): NormalizedSoftware | null {
  const osName = pick(endpoint.raw, [
    'os', 'OS', 'os_name', 'osName', 'operating_system', 'OperatingSystem', 'os_caption', 'platform', 'Platform'
  ]);
  if (!osName) return null;
  // Bewusst nur OS-spezifische Versions-/Build-Felder (nicht generisches "version" = Agent-Version)
  const osVersion = pick(endpoint.raw, [
    'os_version', 'osVersion', 'OSVersion', 'os_build', 'osBuild', 'os_build_number', 'build_number'
  ]) || null;
  return {
    name: osName,
    version: osVersion,
    vendor: deriveOsVendor(osName),
    type: 'Betriebssystem',
    externalId: `os::${endpoint.id}`
  };
}

/** Upsert normalisierter Action1-Einträge; manuelle Einträge bleiben unberührt. */
async function upsertSyncedSoftware(
  deviceId: string,
  entries: NormalizedSoftware[]
): Promise<{ added: number; updated: number; removed: number }> {
  const existing = await prisma.deviceSoftware.findMany({
    where: { deviceId, source: 'action1' }
  });
  const keyOf = (e: { externalId: string | null; name: string; version: string | null }) =>
    e.externalId || `${e.name}::${e.version || ''}`;
  const existingByKey = new Map(existing.map(e => [keyOf(e), e]));

  const seen = new Set<string>();
  let added = 0;
  let updated = 0;
  const now = new Date();

  for (const entry of entries) {
    if (seen.has(entry.externalId)) continue; // Duplikate innerhalb der Antwort überspringen
    seen.add(entry.externalId);

    const found = existingByKey.get(entry.externalId);
    if (found) {
      await prisma.deviceSoftware.update({
        where: { id: found.id },
        data: {
          name: entry.name,
          version: entry.version,
          vendor: entry.vendor,
          type: entry.type,
          externalId: entry.externalId,
          lastSyncedAt: now
        }
      });
      updated++;
    } else {
      await prisma.deviceSoftware.create({
        data: {
          deviceId,
          name: entry.name,
          version: entry.version,
          vendor: entry.vendor,
          type: entry.type,
          source: 'action1',
          externalId: entry.externalId,
          lastSyncedAt: now
        }
      });
      added++;
    }
  }

  // Veraltete Action1-Einträge entfernen, die nicht mehr vorhanden sind
  const stale = existing.filter(e => !seen.has(keyOf(e)));
  if (stale.length > 0) {
    await prisma.deviceSoftware.deleteMany({
      where: { id: { in: stale.map(s => s.id) } }
    });
  }

  return { added, updated, removed: stale.length };
}

/** Prüft die Verbindung schrittweise und liefert eine aussagekräftige Diagnose. */
export async function testConnection(): Promise<{ ok: boolean; endpoints: number; message: string }> {
  const cfg = await loadConfig();

  // Schritt 1: Token (isoliert Client-ID/Secret + Region)
  const token = await getToken(cfg);

  // Schritt 2: Organisationen (braucht keine Org-ID → isoliert Rolle/Berechtigung)
  const orgs = await getOrganizations(cfg, token);

  // Schritt 3: konfigurierte Org-ID gegen verfügbare abgleichen
  const match = orgs.find(o => o.id === cfg.orgId);
  if (!match) {
    const available = orgs.map(o => `${o.id}${o.name ? ` (${o.name})` : ''}`).join(', ');
    throw new Error(
      `Token & Zugriff ok, aber die konfigurierte Organization ID „${cfg.orgId}" wurde nicht gefunden. ` +
      `Verfügbare Organisationen: ${available || '(keine)'}`
    );
  }

  // Schritt 4: Endpoints der Organisation
  const endpoints = await getManagedEndpoints(cfg, token);
  return {
    ok: true,
    endpoints: endpoints.length,
    message:
      `Verbindung erfolgreich – Organisation „${match.name || match.id}", ` +
      `${endpoints.length} verwaltete Endpoints gefunden`
  };
}

/** Liefert die Action1-Endpoints (für UI/Diagnose). */
export async function listEndpoints(): Promise<Array<{ id: string; name?: string; serial?: string }>> {
  const cfg = await loadConfig();
  const token = await getToken(cfg);
  const endpoints = await getManagedEndpoints(cfg, token);
  return endpoints.map(e => ({ id: e.id, name: e.name, serial: e.serial }));
}

/** Synchronisiert ein einzelnes Gerät. */
export async function syncDevice(deviceId: string): Promise<SyncResult> {
  const cfg = await loadConfig();
  const token = await getToken(cfg);
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) {
    throw new Error('Gerät nicht gefunden');
  }
  const endpoints = await getManagedEndpoints(cfg, token);
  return syncOneDevice(cfg, token, device, endpoints);
}

export interface DeployResult {
  policyId: string | null;
  policyName: string;
  packages: Array<{ title: string; packageId: string | null; version: string | null }>;
}

/**
 * Rollt die fehlenden (sicherheitsrelevanten) Updates EINES Geräts über Action1 aus.
 * Erzeugt eine Policy-Instanz (deploy_update) für genau diesen Endpoint, OHNE Auto-Reboot.
 * Achtung: installiert real Updates auf dem Zielgerät.
 */
export async function deployDeviceUpdates(deviceId: string, autoReboot = false): Promise<DeployResult> {
  const cfg = await loadConfig();
  const token = await getToken(cfg);

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) throw new Error('Gerät nicht gefunden');
  if (!device.action1EndpointId) {
    throw new Error('Gerät ist keinem Action1-Endpoint zugeordnet (erst synchronisieren)');
  }

  // Aktuelle fehlende Updates frisch ermitteln (package_id + version)
  const severities = cfg.vulnSeverities.length ? cfg.vulnSeverities : ['Critical', 'High'];
  const { updates } = await fetchDeviceVulnsAndUpdates(cfg, token, device.action1EndpointId, severities);
  const deployable = updates.filter(u => u.packageId);
  if (deployable.length === 0) {
    throw new Error('Keine ausrollbaren Updates mit Paket-ID für dieses Gerät gefunden');
  }

  const packages = deployable.map(u => ({ [u.packageId as string]: u.version || 'Latest' }));
  const policyName = `cflux: Updates für ${device.name}`.slice(0, 120);

  const policy = {
    name: policyName,
    retry_minutes: '1440',
    endpoints: [{ id: device.action1EndpointId, type: 'Endpoint' }],
    actions: [
      {
        name: 'Deploy Update',
        template_id: 'deploy_update',
        params: {
          display_summary: `${packages.length} Update(s) via cflux`,
          packages,
          require_update_approval: 'no',
          scope: 'Specified',
          reboot_options: { auto_reboot: autoReboot ? 'yes' : 'no' }
        }
      }
    ]
  };

  const url = `${cfg.baseUrl}/policies/instances/${cfg.orgId}`;
  const res = await action1Post(url, token, policy, 'Deploy Update');

  return {
    policyId: res.data?.id || null,
    policyName,
    packages: deployable.map(u => ({ title: u.title, packageId: u.packageId, version: u.version }))
  };
}

/** Interner Sync eines Geräts gegen eine bereits geladene Endpoint-Liste. */
async function syncOneDevice(
  cfg: Action1Config,
  token: string,
  device: { id: string; name: string; serialNumber: string | null; action1EndpointId: string | null },
  endpoints: Action1Endpoint[]
): Promise<SyncResult> {
  const match = matchEndpoint(device, endpoints);
  if (!match) {
    return {
      deviceId: device.id,
      deviceName: device.name,
      matched: false,
      added: 0,
      updated: 0,
      removed: 0,
      error: 'Kein passender Action1-Endpoint gefunden'
    };
  }

  // Zuordnung, Seriennummer und Verbindungsstatus aus Action1 übernehmen
  const deviceUpdate: {
    action1EndpointId?: string;
    serialNumber?: string;
    action1Status?: string | null;
    action1LastSeen?: Date | null;
    action1IpAddress?: string | null;
  } = {
    action1Status: match.status || null,
    action1LastSeen: parseAction1Timestamp(match.lastSeen),
    action1IpAddress: match.ipAddress || null
  };
  if (device.action1EndpointId !== match.id) {
    deviceUpdate.action1EndpointId = match.id;
  }
  let serialUpdated = false;
  if (match.serial && match.serial !== device.serialNumber) {
    // Seriennummer ist @unique → Konflikt mit anderem Gerät abfangen
    const clash = await prisma.device.findUnique({ where: { serialNumber: match.serial } });
    if (!clash || clash.id === device.id) {
      deviceUpdate.serialNumber = match.serial;
      serialUpdated = true;
    } else {
      console.warn(
        `[Action1] Seriennummer „${match.serial}" ist bereits Gerät ${clash.id} zugeordnet – ` +
        `Übernahme für „${device.name}" (${device.id}) übersprungen`
      );
    }
  }
  if (Object.keys(deviceUpdate).length > 0) {
    await prisma.device.update({ where: { id: device.id }, data: deviceUpdate });
  }

  const apps = await getEndpointApps(cfg, token, match.id);
  const entries: NormalizedSoftware[] = apps
    .map(normalizeApp)
    .filter((e): e is NormalizedSoftware => e !== null);

  // Betriebssystem als eigenen Eintrag aus den Endpoint-Daten voranstellen.
  // Fallback: falls die Liste keine OS-Felder enthält, das Endpoint-Detail nachladen.
  let os = normalizeOs(match);
  if (!os) {
    try {
      const detail = await getEndpointDetail(cfg, token, match.id);
      os = normalizeOs({ id: match.id, name: match.name, serial: match.serial, raw: detail });
    } catch (err) {
      console.warn(`[Action1] OS-Detail für ${match.id} nicht abrufbar:`, (err as Error).message);
    }
  }
  if (os) entries.unshift(os);

  const counts = await upsertSyncedSoftware(device.id, entries);

  // Fehlende Updates & Schwachstellen gerätezentriert abrufen
  let updatesCount: number | undefined;
  let vulnsCount: number | undefined;
  if ((cfg.syncVulnerabilities || cfg.syncUpdates) && cfg.vulnSeverities.length > 0) {
    const { vulns, updates } = await fetchDeviceVulnsAndUpdates(cfg, token, match.id, cfg.vulnSeverities);
    if (cfg.syncVulnerabilities) vulnsCount = await replaceDeviceVulns(device.id, vulns);
    if (cfg.syncUpdates) updatesCount = await replaceDeviceUpdates(device.id, updates);
  }

  return {
    deviceId: device.id,
    deviceName: device.name,
    matched: true,
    serialUpdated,
    updatesCount,
    vulnsCount,
    ...counts
  };
}

/** Legt ein neues cflux-Gerät aus einem Action1-Endpoint an. */
async function createDeviceFromEndpoint(endpoint: Action1Endpoint): Promise<{ id: string; name: string; serialNumber: string | null; action1EndpointId: string | null } | null> {
  const name = endpoint.name || endpoint.serial || `Action1-${endpoint.id}`;
  const manufacturer = pick(endpoint.raw, ['manufacturer', 'system_manufacturer', 'Manufacturer', 'vendor']) || null;
  const model = pick(endpoint.raw, ['model', 'system_model', 'Model', 'product']) || null;

  // Seriennummer nur setzen, wenn vorhanden und noch nicht vergeben (Feld ist @unique)
  let serialNumber: string | null = endpoint.serial || null;
  if (serialNumber) {
    const clash = await prisma.device.findUnique({ where: { serialNumber } });
    if (clash) serialNumber = null;
  }

  try {
    const device = await prisma.device.create({
      data: {
        name,
        serialNumber,
        manufacturer,
        model,
        notes: 'Automatisch aus Action1 importiert',
        action1EndpointId: endpoint.id,
        action1Status: endpoint.status || null,
        action1LastSeen: parseAction1Timestamp(endpoint.lastSeen),
        action1IpAddress: endpoint.ipAddress || null,
        isActive: true
      },
      select: { id: true, name: true, serialNumber: true, action1EndpointId: true }
    });
    return device;
  } catch (err) {
    console.error(`[Action1] Gerät für Endpoint ${endpoint.id} konnte nicht angelegt werden:`, (err as Error).message);
    return null;
  }
}

/** Synchronisiert alle Geräte. */
export async function syncAllDevices(): Promise<SyncSummary> {
  const cfg = await loadConfig();
  const token = await getToken(cfg);
  const endpoints = await getManagedEndpoints(cfg, token);

  const selectFields = { id: true, name: true, serialNumber: true, action1EndpointId: true } as const;
  const devices = await prisma.device.findMany({ select: selectFields });

  // Bereits durch bestehende Geräte belegte Endpoints ermitteln
  const claimed = new Set<string>();
  for (const device of devices) {
    const m = matchEndpoint(device, endpoints);
    if (m) claimed.add(m.id);
  }

  // Unbekannte Endpoints als neue Geräte anlegen (falls aktiviert)
  let devicesCreated = 0;
  const allDevices = [...devices];
  if (cfg.autoCreateDevices) {
    for (const ep of endpoints) {
      if (claimed.has(ep.id)) continue;
      const created = await createDeviceFromEndpoint(ep);
      if (created) {
        allDevices.push(created);
        claimed.add(ep.id);
        devicesCreated++;
      }
    }
  }

  // Bei CVE/Update-Sync geringere Parallelität wegen Action1-Rate-Limit (429)
  const crawlActive = (cfg.syncVulnerabilities || cfg.syncUpdates) && cfg.vulnSeverities.length > 0;
  const concurrency = crawlActive ? 3 : 6;
  console.log(`[Action1][diag] Flags: syncUpdates=${cfg.syncUpdates}, syncVulnerabilities=${cfg.syncVulnerabilities}, severities=${cfg.vulnSeverities.join('/')}, concurrency=${concurrency}, devices=${allDevices.length}`);

  // Pro-Gerät-Sync mit begrenzter Parallelität (Netzwerk + DB)
  const results: SyncResult[] = await mapLimit(allDevices, concurrency, async (device) => {
    try {
      return await syncOneDevice(cfg, token, device, endpoints);
    } catch (err: any) {
      return {
        deviceId: device.id,
        deviceName: device.name,
        matched: false,
        added: 0,
        updated: 0,
        removed: 0,
        error: err?.message || 'Sync-Fehler'
      };
    }
  });

  await prisma.systemSettings.updateMany({ data: { action1LastSyncAt: new Date() } });

  const matched = results.filter(r => r.matched);
  return {
    devicesTotal: allDevices.length,
    devicesMatched: matched.length,
    devicesSkipped: results.length - matched.length,
    devicesCreated,
    serialsUpdated: results.filter(r => r.serialUpdated).length,
    added: results.reduce((a, r) => a + r.added, 0),
    updated: results.reduce((a, r) => a + r.updated, 0),
    removed: results.reduce((a, r) => a + r.removed, 0),
    updatesTotal: results.reduce((a, r) => a + (r.updatesCount || 0), 0),
    vulnsTotal: results.reduce((a, r) => a + (r.vulnsCount || 0), 0),
    results
  };
}

// ── Hintergrund-Job (verhindert HTTP-Timeouts/504 bei vielen Geräten) ──
export interface SyncJobStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  summary: SyncSummary | null;
  error: string | null;
}

let jobStatus: SyncJobStatus = {
  running: false,
  startedAt: null,
  finishedAt: null,
  summary: null,
  error: null
};

export function getSyncStatus(): SyncJobStatus {
  return jobStatus;
}

/** Startet die Synchronisation im Hintergrund (fire-and-forget) und liefert sofort zurück. */
export function startBackgroundSync(): { started: boolean; alreadyRunning: boolean } {
  if (jobStatus.running) {
    return { started: false, alreadyRunning: true };
  }

  jobStatus = {
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    summary: null,
    error: null
  };

  // Bewusst nicht awaiten – der HTTP-Request kehrt sofort zurück
  syncAllDevices()
    .then(summary => {
      jobStatus = {
        running: false,
        startedAt: jobStatus.startedAt,
        finishedAt: new Date().toISOString(),
        summary,
        error: null
      };
      console.log(
        `✅ [Action1-Sync] Hintergrund-Job fertig – ${summary.devicesMatched}/${summary.devicesTotal} Geräte, ` +
          `${summary.devicesCreated} neu, +${summary.added}/~${summary.updated}/-${summary.removed}`
      );
    })
    .catch(err => {
      jobStatus = {
        running: false,
        startedAt: jobStatus.startedAt,
        finishedAt: new Date().toISOString(),
        summary: null,
        error: err?.message || 'Action1-Synchronisation fehlgeschlagen'
      };
      console.error('❌ [Action1-Sync] Hintergrund-Job fehlgeschlagen:', err?.message || err);
    });

  return { started: true, alreadyRunning: false };
}
