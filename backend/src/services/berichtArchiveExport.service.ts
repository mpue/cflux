import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';
import archiver from 'archiver';
import { PHOTOS_DIR, ReportWithRelations } from './bericht.service';
import { ARCHIVE_FORMAT, ARCHIVE_VERSION, MANIFEST_NAME } from './berichtImport.service';

/**
 * Datenexport der Rundgangsberichte im Austauschformat `wochenbericht-export`
 * — dasselbe ZIP, das berichtImport.service.ts wieder einliest.
 *
 * Gegenstueck zum Import, damit Berichte zwischen cflux-Instanzen (oder in ein
 * Backup) wandern koennen, ohne ueber die Datenbank zu gehen.
 *
 * Das Archiv wird gestreamt und nicht im Speicher gebaut: ein realer
 * Wochenbericht bringt ueber 200 Originalfotos und damit mehrere hundert
 * Megabyte mit.
 */

export interface ArchiveFolder {
  id: string;
  name: string;
}

/** Datum als reines yyyy-MM-dd — der Import liest es mit `new Date()`. */
const isoDate = (value: Date | string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

/** Leere Strings statt null, so schreibt es auch das Quelltool. */
const text = (value: string | null | undefined): string => value ?? '';

const sheetPhotoPath = (reportId: string, filename: string): string =>
  `photos/${reportId}/${filename}`;

/**
 * Manifest des Archivs. Die Feldnamen sind der Vertrag mit dem Import: was
 * hier anders heisst, kommt beim Einlesen nicht an.
 */
export const buildManifest = (
  reports: ReportWithRelations[],
  folders: ArchiveFolder[]
): Record<string, unknown> => ({
  format: ARCHIVE_FORMAT,
  version: ARCHIVE_VERSION,
  exportedAt: new Date().toISOString(),
  /** Nur zur Orientierung beim Draufschauen — der Import waehlt sein Projekt selbst. */
  source: 'cflux',
  folders: folders.map((folder) => ({ id: folder.id, name: folder.name })),
  sheets: reports.map((report) => ({
    id: report.id,
    weekday: report.weekday,
    date: isoDate(report.date),
    titel: text(report.titel),
    projekt: report.project?.name ?? '',
    folderId: report.folder?.id ?? null,
    referent: text(report.referent),
    rundgangDurchgefuehrt: text(report.rundgangDurchgefuehrt),
    weitereTeilnehmer: text(report.weitereTeilnehmer),
    bereiche: report.areas.map((area) => ({
      name: text(area.name),
      status: text(area.status),
    })),
    feststellungen: report.findings.map((finding) => ({
      feststellung: text(finding.feststellung),
      bereich: text(finding.bereich),
      klassifizierung: text(finding.klassifizierung),
      ampel: text(finding.ampel),
      stopp: text(finding.stopp),
      massnahme: text(finding.massnahme),
      verantwortlich: text(finding.verantwortlich),
      termin: isoDate(finding.termin),
      status: text(finding.status),
      erledigtAm: isoDate(finding.erledigtAm),
      kontrolle: text(finding.kontrolle),
      photoId: finding.photoId ?? null,
    })),
    photos: report.photos.map((photo) => ({
      id: photo.id,
      filename: photo.filename,
      originalName: photo.originalName,
      path: sheetPhotoPath(report.id, photo.filename),
      mimeType: photo.mimeType ?? null,
      fileSize: photo.fileSize ?? null,
    })),
  })),
});

export interface ArchiveResult {
  /** Fotos, die in der Datenbank stehen, aber nicht mehr auf der Platte liegen. */
  missingPhotos: string[];
}

/**
 * Schreibt das Archiv in den uebergebenen Stream (in der Regel die Antwort).
 *
 * Die Fotos werden ohne Kompression abgelegt: JPEG ist bereits komprimiert,
 * Deflate kostet dort nur Zeit. Das Manifest ist Text und wird gepackt.
 */
export const streamWochenberichtArchive = async (
  target: Writable,
  reports: ReportWithRelations[],
  folders: ArchiveFolder[]
): Promise<ArchiveResult> => {
  const missingPhotos: string[] = [];
  const archive = archiver('zip', { zlib: { level: 6 }, store: false });

  const finished = new Promise<void>((resolve, reject) => {
    archive.on('error', reject);
    archive.on('warning', (err) => {
      // Fehlende Dateien meldet archiver als Warnung; alles andere ist echt.
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
      reject(err);
    });
    target.on('error', reject);
    target.on('close', resolve);
    target.on('finish', resolve);
  });

  archive.pipe(target);

  archive.append(JSON.stringify(buildManifest(reports, folders), null, 2), {
    name: MANIFEST_NAME,
  });

  for (const report of reports) {
    for (const photo of report.photos) {
      const source = path.join(PHOTOS_DIR, report.id, photo.filename);

      if (!fs.existsSync(source)) {
        missingPhotos.push(`${report.id}/${photo.filename}`);
        continue;
      }

      // store: true = ohne Deflate ablegen. JPEG ist bereits komprimiert,
      // ein zweiter Durchlauf kostet nur Zeit. Der Typ von archive.file()
      // kennt die ZIP-spezifische Option nicht, sie ist aber gueltig.
      archive.file(source, {
        name: sheetPhotoPath(report.id, photo.filename),
        store: true,
      } as archiver.ZipEntryData);
    }
  }

  await archive.finalize();
  await finished;

  return { missingPhotos };
};

/** Dateiname des Datenexports; parallel zu folderExportFilename im PDF-Export. */
export const archiveFilename = (label: string): string => {
  const name = label.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60);
  return `Wochenbericht_Daten_${name || 'Export'}.zip`;
};
