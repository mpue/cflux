import fs from 'fs';
import path from 'path';
import { PHOTOS_DIR } from './bericht.service';

/**
 * Verkleinerte Fassungen der Beweisfotos fuer den Export.
 *
 * Die Fotos kommen direkt vom Handy und sind mehrere Megabyte gross, im
 * Dokument stehen sie aber in einem 110px-Kaestchen. Ohne Verkleinerung waechst
 * ein Gesamt-Wochenbericht auf hunderte Megabyte, weil jedes Bild als
 * base64-Data-URI im HTML landet und Chromium es voll aufloest.
 *
 * Dieselben Werte wie im eigenstaendigen Wochenbericht-Tool, damit Exporte aus
 * beiden Werkzeugen gleich aussehen.
 */

const THUMB_DIRNAME = 'thumbs';
const THUMB_MAX_PX = 700;
const THUMB_QUALITY = 75;

const thumbPath = (reportId: string, filename: string): string => {
  const base = path.basename(filename, path.extname(filename));
  return path.join(PHOTOS_DIR, reportId, THUMB_DIRNAME, `${base}.jpg`);
};

/** Pfad zur Verkleinerung, oder null wenn es keine gibt. */
export const findThumbnail = (reportId: string, filename: string | null | undefined): string | null => {
  if (!filename) return null;
  const target = thumbPath(reportId, filename);
  return fs.existsSync(target) ? target : null;
};

/**
 * Erzeugt die Verkleinerung, falls sie fehlt. Schlaegt das fehl (kaputte
 * Datei, nicht unterstuetztes Format), liefert die Funktion null — der Export
 * greift dann auf das Original zurueck statt das Foto wegzulassen.
 */
export const ensureThumbnail = async (
  reportId: string,
  filename: string | null | undefined
): Promise<string | null> => {
  if (!filename) return null;

  const source = path.join(PHOTOS_DIR, reportId, filename);
  const target = thumbPath(reportId, filename);

  if (!fs.existsSync(source)) return null;
  if (fs.existsSync(target)) return target;

  try {
    const sharp = require('sharp');
    fs.mkdirSync(path.dirname(target), { recursive: true });

    await sharp(source)
      // EXIF-Ausrichtung anwenden, sonst liegen Handyfotos quer.
      .rotate()
      .resize({ width: THUMB_MAX_PX, height: THUMB_MAX_PX, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY })
      .toFile(target);

    return target;
  } catch (error: any) {
    console.error(`Verkleinerung fehlgeschlagen (${reportId}/${filename}):`, error?.message);
    return null;
  }
};

/**
 * Sorgt dafuer, dass alle Fotos der Berichte verkleinert vorliegen. Der
 * Renderer ist synchron, deshalb passiert das als eigener Schritt davor.
 */
export const ensureThumbnails = async (
  reports: { id: string; photos: { filename: string }[] }[]
): Promise<void> => {
  for (const report of reports) {
    for (const photo of report.photos) {
      await ensureThumbnail(report.id, photo.filename);
    }
  }
};

/** Loescht die Verkleinerung zu einem geloeschten Foto. */
export const deleteThumbnail = (reportId: string, filename: string | null | undefined): void => {
  if (!filename) return;
  const target = thumbPath(reportId, filename);
  if (fs.existsSync(target)) fs.unlinkSync(target);
};
