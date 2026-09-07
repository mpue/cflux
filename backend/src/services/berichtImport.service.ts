import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { prisma } from '../lib/prisma';
import { PHOTOS_DIR } from './bericht.service';

/**
 * Import eines Datenexports aus dem eigenstaendigen Wochenbericht-Tool.
 *
 * Erwartet das dort erzeugte ZIP: `wochenbericht.json` mit Ordnern und
 * Tagesblaettern, dazu die Originalfotos unter `photos/<sheetId>/<datei>`.
 * Die Berichte werden einem in cflux ausgewaehlten Projekt zugeordnet — das
 * Quelltool kennt nur einen freien Projekttext.
 */

const EXPECTED_FORMAT = 'wochenbericht-export';
const SUPPORTED_VERSION = 1;
const MANIFEST_NAME = 'wochenbericht.json';

interface SourcePhoto {
  id?: string;
  filename?: string;
  originalName?: string;
  path?: string;
  mimeType?: string;
  fileSize?: number;
}

interface SourceSheet {
  id?: string;
  weekday?: string;
  date?: string;
  titel?: string;
  projekt?: string;
  referent?: string;
  folderId?: string | null;
  rundgangDurchgefuehrt?: string;
  weitereTeilnehmer?: string;
  bereiche?: { name?: string; status?: string }[];
  feststellungen?: Record<string, any>[];
  photos?: SourcePhoto[];
}

export interface ImportOptions {
  projectId: string;
  createdById?: string | null;
  /** Bereits vorhandene Berichte (gleiches Projekt, Datum, Wochentag) auslassen. */
  skipDuplicates?: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  photos: number;
  findings: number;
  areas: number;
  /** Felder ohne Entsprechung in cflux, damit der Benutzer weiss was fehlt. */
  droppedFields: string[];
  warnings: string[];
  reports: { id: string; weekday: string; date: string }[];
}

export class ImportFormatError extends Error {}

const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};

const str = (value: unknown): string | null => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '' ? null : text;
};

/**
 * Dateinamen aus dem Archiv entschaerfen: nur der reine Name, keine Pfade.
 * Ohne das koennte ein praepariertes ZIP ueber `../` ausserhalb des
 * Foto-Verzeichnisses schreiben (Zip Slip).
 */
const safePhotoName = (filename: string): string | null => {
  const base = path.basename(filename).replace(/[/\\]/g, '');
  if (!base || base === '.' || base === '..') return null;
  if (!/^[A-Za-z0-9._-]+$/.test(base)) return null;
  return base;
};

const readManifest = (zip: AdmZip) => {
  const entry = zip.getEntry(MANIFEST_NAME);
  if (!entry) {
    throw new ImportFormatError(
      `Im Archiv fehlt ${MANIFEST_NAME}. Bitte den Datenexport aus dem Wochenbericht-Tool verwenden.`
    );
  }

  let manifest: any;
  try {
    manifest = JSON.parse(entry.getData().toString('utf-8'));
  } catch {
    throw new ImportFormatError(`${MANIFEST_NAME} ist beschädigt und konnte nicht gelesen werden.`);
  }

  if (manifest?.format !== EXPECTED_FORMAT) {
    throw new ImportFormatError('Das Archiv stammt nicht aus dem Wochenbericht-Tool.');
  }

  if (typeof manifest.version !== 'number' || manifest.version > SUPPORTED_VERSION) {
    throw new ImportFormatError(
      `Archiv-Version ${manifest.version} wird nicht unterstützt (unterstützt bis Version ${SUPPORTED_VERSION}).`
    );
  }

  if (!Array.isArray(manifest.sheets)) {
    throw new ImportFormatError('Das Archiv enthält keine Tagesblätter.');
  }

  return manifest;
};

/** Bericht mit gleichem Projekt, Datum und Wochentag gilt als bereits importiert. */
const findExistingReport = async (projectId: string, date: Date, weekday: string) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return prisma.report.findFirst({
    where: { projectId, weekday, date: { gte: dayStart, lte: dayEnd } },
    select: { id: true },
  });
};

export const importWochenberichtArchive = async (
  archive: Buffer,
  { projectId, createdById = null, skipDuplicates = true }: ImportOptions
): Promise<ImportResult> => {
  let zip: AdmZip;
  try {
    zip = new AdmZip(archive);
  } catch {
    throw new ImportFormatError('Die Datei ist kein lesbares ZIP-Archiv.');
  }

  const manifest = readManifest(zip);
  const sheets: SourceSheet[] = manifest.sheets;

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    photos: 0,
    findings: 0,
    areas: 0,
    droppedFields: [],
    warnings: [],
    reports: [],
  };

  // Das Quelltool kennt Felder, fuer die es in cflux keine Entsprechung gibt.
  if (sheets.some((sheet) => str(sheet.titel))) {
    result.droppedFields.push('Titel des Berichts');
  }
  if (Array.isArray(manifest.folders) && manifest.folders.length > 0) {
    result.droppedFields.push(`Ordnerzuordnung (${manifest.folders.length} Ordner)`);
  }
  if (sheets.some((sheet) => str(sheet.projekt))) {
    result.droppedFields.push('Projekttext des Quelltools (ersetzt durch das gewählte Projekt)');
  }

  for (const sheet of sheets) {
    const weekday = str(sheet.weekday) || 'Mo';
    const date = toDate(sheet.date);

    if (!date) {
      result.warnings.push(`Tagesblatt ohne gültiges Datum übersprungen (${sheet.id || 'ohne ID'}).`);
      result.skipped += 1;
      continue;
    }

    if (skipDuplicates && (await findExistingReport(projectId, date, weekday))) {
      result.skipped += 1;
      continue;
    }

    // Fotos zuerst aus dem Archiv holen — ein Bericht ohne die zugehoerigen
    // Bilddateien waere nur halb importiert.
    const photoFiles: { newName: string; content: Buffer; source: SourcePhoto }[] = [];

    for (const photo of sheet.photos || []) {
      const entryPath = photo.path || `photos/${sheet.id}/${photo.filename}`;
      const entry = zip.getEntry(entryPath);
      const safeName = safePhotoName(photo.filename || '');

      if (!entry || !safeName) {
        result.warnings.push(`Foto fehlt im Archiv: ${entryPath}`);
        continue;
      }

      photoFiles.push({ newName: safeName, content: entry.getData(), source: photo });
    }

    const created = await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          projectId,
          weekday,
          date,
          referent: str(sheet.referent),
          rundgangDurchgefuehrt: str(sheet.rundgangDurchgefuehrt),
          weitereTeilnehmer: str(sheet.weitereTeilnehmer),
          createdById,
        },
        select: { id: true },
      });

      if (sheet.bereiche?.length) {
        await tx.reportArea.createMany({
          data: sheet.bereiche.map((area, index) => ({
            reportId: report.id,
            name: str(area.name) || '',
            status: area.status || '',
            sortOrder: index,
          })),
        });
        result.areas += sheet.bereiche.length;
      }

      // Alte Foto-ID -> neue ID, damit die Feststellungen ihr Beweisfoto behalten.
      const photoIdMap = new Map<string, string>();

      for (const file of photoFiles) {
        const photo = await tx.reportPhoto.create({
          data: {
            reportId: report.id,
            filename: file.newName,
            originalName: file.source.originalName || file.newName,
            mimeType: file.source.mimeType || null,
            fileSize: file.content.length,
            uploadedById: createdById,
          },
          select: { id: true },
        });
        if (file.source.id) photoIdMap.set(file.source.id, photo.id);
      }

      for (const [index, finding] of (sheet.feststellungen || []).entries()) {
        const sourcePhotoId = typeof finding.photoId === 'string' ? finding.photoId : null;

        await tx.reportFinding.create({
          data: {
            reportId: report.id,
            position: index,
            feststellung: str(finding.feststellung),
            bereich: str(finding.bereich),
            klassifizierung: str(finding.klassifizierung),
            ampel: str(finding.ampel),
            stopp: str(finding.stopp),
            massnahme: str(finding.massnahme),
            verantwortlich: str(finding.verantwortlich),
            termin: toDate(finding.termin),
            status: str(finding.status),
            erledigtAm: toDate(finding.erledigtAm),
            enablon: str(finding.enablon),
            photoId: (sourcePhotoId && photoIdMap.get(sourcePhotoId)) || null,
          },
        });
      }

      return report;
    });

    // Bilddateien erst nach erfolgreicher Transaktion ablegen, damit ein
    // Fehlschlag keine verwaisten Dateien hinterlaesst.
    const targetDir = path.join(PHOTOS_DIR, created.id);
    try {
      fs.mkdirSync(targetDir, { recursive: true });
      for (const file of photoFiles) {
        fs.writeFileSync(path.join(targetDir, file.newName), file.content);
      }
      result.photos += photoFiles.length;
    } catch (error: any) {
      result.warnings.push(
        `Fotos zu ${weekday}, ${sheet.date} konnten nicht gespeichert werden: ${error?.message}`
      );
    }

    result.imported += 1;
    result.findings += (sheet.feststellungen || []).length;
    result.reports.push({ id: created.id, weekday, date: date.toISOString().slice(0, 10) });
  }

  return result;
};
