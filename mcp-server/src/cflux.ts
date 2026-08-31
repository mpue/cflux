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

/**
 * Warum ein Zugriff scheiterte — fuer Aufrufer, die daraus etwas ableiten
 * muessen. Die 403-Faelle sehen von aussen alle gleich aus, meinen aber sehr
 * Verschiedenes; wer darauf reagiert, soll das nicht am deutschen Satz
 * festmachen muessen.
 */
export type CfluxReason = 'missing-scope' | 'needs-admin';

/** Fehler mit einer Erklaerung, mit der ein Mensch etwas anfangen kann. */
export class CfluxError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly reason?: CfluxReason
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
const describeFailure = async (
  res: Response,
  path: string
): Promise<{ message: string; reason?: CfluxReason }> => {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Kein JSON — dann bleibt es beim Statuscode.
  }

  const detail = body?.message || body?.error;
  const sagt = (message: string, reason?: CfluxReason) => ({ message, reason });

  switch (res.status) {
    case 401:
      return sagt(
        'Der API-Schlüssel wurde abgelehnt. Er ist unbekannt, widerrufen oder abgelaufen — ' +
          'oder der Benutzer, in dessen Namen er handelt, ist deaktiviert. ' +
          'Bitte in cflux unter System → API-Schlüssel prüfen.'
      );

    case 403:
      if (body?.error === 'Not available via the public API') {
        return sagt(
          `${path} ist nicht Teil der Public API und nur mit einem echten Login erreichbar.`
        );
      }
      if (body?.error === 'API key is read-only') {
        return sagt(
          'Der Schlüssel ist als Nur-Lesen angelegt und darf nichts verändern. ' +
            'Zum Anlegen braucht es einen Schlüssel ohne dieses Kennzeichen — in cflux ' +
            'unter System → API-Schlüssel beim Schlüssel auf "Bearbeiten".'
        );
      }
      if (typeof detail === 'string' && detail.includes('missing scope')) {
        const schreiben = detail.includes(':write');
        return sagt(
          `Zugriff verweigert: ${detail}.` +
            (schreiben
              ? ' Der Scope lässt sich in cflux beim Schlüssel unter "Bearbeiten" auf "Schreiben" setzen.'
              : ' Der Scope lässt sich in cflux beim Schlüssel unter "Bearbeiten" nachtragen.'),
          'missing-scope'
        );
      }
      // Zugriff auf einen einzelnen Datensatz, nicht auf das Modul: bei
      // Intranet-Dokumenten entscheiden darueber die Gruppenrechte.
      if (
        typeof body?.error === 'string' &&
        /^No permission to (access|approve|reject|publish|modify) this/.test(body.error)
      ) {
        return sagt(
          'Kein Zugriff auf diesen Eintrag. Der Benutzer, zu dem der Schlüssel gehört, ist in ' +
            'keiner Gruppe mit ausreichender Rechtestufe — bei Intranet-Dokumenten zählt dabei ' +
            'auch das Recht auf dem Ordner darüber. Freigeben, Ablehnen und Veröffentlichen ' +
            'verlangen die Stufe ADMIN, Ändern die Stufe WRITE.'
        );
      }
      // Die Modulrechte des Benutzers selbst, unabhaengig vom Schluessel.
      if (body?.error?.startsWith?.('No permission to')) {
        return sagt(
          `${body.error}. Der Schlüssel handelt im Namen eines Benutzers, dem in cflux ` +
            'das Recht für dieses Modul fehlt — ein Schlüssel kann nie mehr als dieser Benutzer.'
        );
      }
      // authorize() liefert nur "Forbidden" — das sagt nicht, was fehlt.
      if (body?.error === 'Forbidden') {
        return sagt(
          `Zugriff auf ${path} verweigert. Dieser Endpunkt verlangt zusätzlich zur ` +
            'Modulfreigabe die Rolle ADMIN — der Benutzer, zu dem der Schlüssel gehört, ' +
            'hat sie nicht. Beim Geräteregister betrifft das fast alles; ohne Adminrolle ' +
            'bleibt nur cflux_list_user_devices.',
          'needs-admin'
        );
      }
      return sagt(
        detail ? `Zugriff verweigert: ${detail}` : `Zugriff auf ${path} verweigert.`
      );

    case 400:
      return sagt(
        detail
          ? `cflux hat die Angaben abgelehnt: ${detail}`
          : `cflux hat die Angaben zu ${path} abgelehnt.`
      );

    case 404:
      return sagt(`Nicht gefunden: ${path}`);

    default:
      return sagt(
        detail
          ? `cflux antwortete mit ${res.status}: ${detail}`
          : `cflux antwortete mit ${res.status} auf ${path}.`
      );
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
      const { message, reason } = await describeFailure(res, path);
      throw new CfluxError(message, res.status, reason);
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

  /**
   * Schickt eine Datei als multipart/form-data.
   *
   * Der Content-Type wird bewusst nicht selbst gesetzt: fetch ergaenzt beim
   * Uebergeben eines FormData die noetige boundary, und ein handgesetzter
   * Header wuerde sie ueberschreiben.
   */
  async postFile<T = unknown>(
    path: string,
    file: { bytes: Uint8Array; filename: string; contentType: string },
    fields: Record<string, string> = {}
  ): Promise<T> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([file.bytes as unknown as BlobPart], { type: file.contentType }),
      file.filename
    );
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }

    const res = await this.request(path, { method: 'POST', body: form });
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
