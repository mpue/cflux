/**
 * Duenner Client fuer die cflux Public API.
 *
 * Der Schluessel kommt aus der Umgebung und gehoert dem jeweiligen Kollegen —
 * jeder benutzt seinen eigenen. Dadurch handelt der Server immer im Namen des
 * Menschen, der ihn gestartet hat, und ein einzelner Schluessel laesst sich
 * widerrufen, ohne alle anderen zu treffen.
 */

export interface CfluxConfig {
  baseUrl: string;
  apiKey: string;
}

/** Fehler mit einer Erklaerung, mit der ein Mensch etwas anfangen kann. */
export class CfluxError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'CfluxError';
  }
}

/**
 * Uebersetzt die Antworten der Public API in verstaendliche Saetze.
 * Die API unterscheidet bewusst zwischen "Modul nicht freigegeben",
 * "Scope fehlt" und "nur lesend" — diese Unterscheidung geht sonst verloren.
 */
const describeFailure = async (res: Response, path: string): Promise<string> => {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Kein JSON — dann bleibt es beim Statuscode.
  }

  const detail = body?.message || body?.error;

  switch (res.status) {
    case 401:
      return (
        'Der API-Schlüssel wurde abgelehnt. Er ist unbekannt, widerrufen oder abgelaufen — ' +
        'oder der Benutzer, in dessen Namen er handelt, ist deaktiviert. ' +
        'Bitte in cflux unter System → API-Schlüssel prüfen.'
      );
    case 403:
      if (body?.error === 'Not available via the public API') {
        return `${path} ist nicht Teil der Public API und nur mit einem echten Login erreichbar.`;
      }
      if (body?.error === 'API key is read-only') {
        return (
          'Der Schlüssel ist als Nur-Lesen angelegt und darf nichts verändern. ' +
          'Zum Anlegen braucht es einen Schlüssel ohne dieses Kennzeichen — in cflux ' +
          'unter System → API-Schlüssel beim Schlüssel auf "Bearbeiten".'
        );
      }
      if (typeof detail === 'string' && detail.includes(':write')) {
        return (
          `Zugriff verweigert: ${detail}. ` +
          'Der Scope lässt sich in cflux beim Schlüssel unter "Bearbeiten" auf "Schreiben" setzen.'
        );
      }
      // Die Modulrechte des Benutzers selbst, unabhaengig vom Schluessel.
      if (body?.error?.startsWith?.('No permission to')) {
        return (
          `${body.error}. Der Schlüssel handelt im Namen eines Benutzers, dem in cflux ` +
          'das Schreibrecht für dieses Modul fehlt — ein Schlüssel kann nie mehr als dieser Benutzer.'
        );
      }
      return detail
        ? `Zugriff verweigert: ${detail}`
        : `Zugriff auf ${path} verweigert.`;
    case 400:
      return detail
        ? `cflux hat die Angaben abgelehnt: ${detail}`
        : `cflux hat die Angaben zu ${path} abgelehnt.`;
    case 404:
      return `Nicht gefunden: ${path}`;
    default:
      return detail
        ? `cflux antwortete mit ${res.status}: ${detail}`
        : `cflux antwortete mit ${res.status} auf ${path}.`;
  }
};

export class CfluxClient {
  constructor(private readonly config: CfluxConfig) {}

  private url(path: string): string {
    return `${this.config.baseUrl.replace(/\/+$/, '')}/api${path}`;
  }

  private headers(): Record<string, string> {
    // Bewusst der eigene Header und nicht Authorization: Bearer — so kollidiert
    // der Schluessel nicht mit einem Proxy, der Authorization selbst benutzt.
    return { 'X-API-Key': this.config.apiKey, Accept: 'application/json' };
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    let res: Response;
    try {
      res = await fetch(this.url(path), { ...init, headers: { ...this.headers(), ...init?.headers } });
    } catch (error: any) {
      throw new CfluxError(
        `cflux ist unter ${this.config.baseUrl} nicht erreichbar: ${error?.message ?? error}`
      );
    }

    if (!res.ok) {
      throw new CfluxError(await describeFailure(res, path), res.status);
    }

    return res;
  }

  async getJson<T = unknown>(path: string): Promise<T> {
    const res = await this.request(path);
    return (await res.json()) as T;
  }

  /**
   * Legt etwas an. Undefinierte Werte fliegen raus, damit ein nicht gesetztes
   * Feld nicht als ausdrueckliches null beim Server ankommt.
   */
  async postJson<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
    const payload = Object.fromEntries(
      Object.entries(body).filter(([, value]) => value !== undefined)
    );

    const res = await this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return (await res.json()) as T;
  }

  /** Laedt eine Datei und gibt sie mit ihrem vorgeschlagenen Namen zurueck. */
  async getFile(path: string): Promise<{ bytes: Buffer; filename: string | null }> {
    const res = await this.request(path);
    const disposition = res.headers.get('content-disposition') ?? '';
    const match = disposition.match(/filename="([^"]+)"/);

    return {
      bytes: Buffer.from(await res.arrayBuffer()),
      filename: match ? match[1] : null,
    };
  }
}

/** Liest die Konfiguration und sagt klar, was fehlt. */
export const configFromEnv = (): CfluxConfig => {
  const baseUrl = process.env.CFLUX_BASE_URL;
  const apiKey = process.env.CFLUX_API_KEY;

  const missing = [
    !baseUrl && 'CFLUX_BASE_URL (z.B. https://cflux.example)',
    !apiKey && 'CFLUX_API_KEY (der Schlüssel aus System → API-Schlüssel)',
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Konfiguration unvollständig, es fehlt: ${missing.join(', ')}`);
  }

  if (!apiKey!.startsWith('cflux_')) {
    throw new Error(
      'CFLUX_API_KEY sieht nicht wie ein cflux-Schlüssel aus — erwartet wird ein Wert, der mit "cflux_" beginnt.'
    );
  }

  return { baseUrl: baseUrl!, apiKey: apiKey! };
};
