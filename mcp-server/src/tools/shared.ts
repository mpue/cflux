import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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
