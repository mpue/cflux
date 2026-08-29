import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';
import { CfluxClient, CfluxError } from '../cflux.js';

/** Bausteine, die sich alle Werkzeuge teilen. */

/** Wohin PDF-Exporte geschrieben werden. */
export const downloadDir = resolve(process.env.CFLUX_DOWNLOAD_DIR ?? join(tmpdir(), 'cflux'));

export const asJson = (value: unknown): string => JSON.stringify(value, null, 2);

/**
 * Reicht Fehler als lesbaren Text zurueck, statt den Aufruf hart scheitern zu
 * lassen — im Chat ist ein Satz brauchbarer als ein Protokollabbruch.
 */
export const guard = async (fn: () => Promise<string>) => {
  try {
    return { content: [{ type: 'text' as const, text: await fn() }] };
  } catch (error: any) {
    const text =
      error instanceof CfluxError
        ? error.message
        : `Unerwarteter Fehler: ${error?.message ?? error}`;
    return { content: [{ type: 'text' as const, text }], isError: true };
  }
};

/**
 * Laedt eine Datei und legt sie lokal ab.
 *
 * Zurueck kommt der Pfad, nicht die Datei: ein Export oder ein Anhang wiegt
 * schnell mehrere hundert Kilobyte und gehoert nicht ins Kontextfenster.
 */
export const saveFile = async (
  client: CfluxClient,
  path: string,
  fallbackName: string
): Promise<string> => {
  const { bytes, filename } = await client.getFile(path);

  if (!existsSync(downloadDir)) {
    mkdirSync(downloadDir, { recursive: true });
  }

  // Der Dateiname kommt aus cflux; Pfadtrenner werden entfernt, damit er nicht
  // aus dem Zielverzeichnis herausfuehren kann.
  const safeName = (filename ?? fallbackName).replace(/[/\\]/g, '_');
  const target = join(downloadDir, safeName);
  writeFileSync(target, bytes);

  return `Gespeichert: ${target} (${Math.round(bytes.length / 1024)} KB)`;
};

/** Nur ein sprechender Name fuer die PDF-Aufrufer. */
export const savePdf = saveFile;

/** Grenze des Servers fuer Anhaenge. Hier vorab pruefen spart einen Upload ins Leere. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/**
 * Erkennt den Inhaltstyp an der Endung. cflux erzeugt aus manchen Typen eine
 * PDF-Vorschau, dafuer muss der Typ stimmen — ein pauschales
 * application/octet-stream verhindert das.
 */
const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
};

export interface LocalFile {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
}

/**
 * Liest eine Datei vom Rechner des Benutzers ein.
 *
 * Die Fehlermeldungen nennen den Pfad, weil ein falscher Pfad der mit Abstand
 * haeufigste Grund ist — und weil im Chat sonst unklar bleibt, wonach gesucht
 * wurde.
 */
export const readLocalFile = (path: string): LocalFile => {
  const resolved = resolve(path);

  if (!existsSync(resolved)) {
    throw new CfluxError(
      `Die Datei ${resolved} gibt es nicht. Bitte den vollständigen Pfad angeben.`
    );
  }

  const stat = statSync(resolved);
  if (stat.isDirectory()) {
    throw new CfluxError(`${resolved} ist ein Ordner, keine Datei.`);
  }
  if (stat.size === 0) {
    throw new CfluxError(`Die Datei ${resolved} ist leer.`);
  }
  if (stat.size > MAX_UPLOAD_BYTES) {
    const mb = (stat.size / 1024 / 1024).toFixed(1);
    throw new CfluxError(`Die Datei ist ${mb} MB gross; cflux nimmt höchstens 100 MB.`);
  }

  const filename = basename(resolved);

  return {
    bytes: readFileSync(resolved),
    filename,
    contentType: CONTENT_TYPES[extname(filename).toLowerCase()] ?? 'application/octet-stream',
  };
};
