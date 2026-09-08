import fs from 'fs';
import path from 'path';
import AdmZip, { IZipEntry } from 'adm-zip';
import { prisma } from '../lib/prisma';
import { PHOTOS_DIR } from './bericht.service';
import { ensureThumbnail } from './reportPhotoThumbs.service';

/**
 * Import eines Datenexports aus dem eigenstaendigen Wochenbericht-Tool.
 *
 * Erwartet das dort erzeugte ZIP: `wochenbericht.json` mit Ordnern und
 * Tagesblaettern, dazu die Originalfotos unter `photos/<sheetId>/<datei>`.
 * Die Berichte werden einem in cflux ausgewaehlten Projekt zugeordnet — das
 * Quelltool kennt nur einen freien Projekttext.
 */

/**
 * Formatkonstanten des Austauschformats. Exportiert, weil cflux dasselbe
 * Archiv inzwischen auch schreibt (berichtArchiveExport.service.ts) — die
 * beiden Seiten sollen nicht auseinanderlaufen.
 *
 * Achtung: dieselben Konstanten stehen ein zweites Mal in der eigenstaendigen
 * Wochenbericht-App (`export-archive.js`). Eine Strukturaenderung muss dort
 * mitgezogen werden, sonst liest cflux deren Archive nicht mehr.
 */
export const ARCHIVE_FORMAT = 'wochenbericht-export';
export const ARCHIVE_VERSION = 1;
export const MANIFEST_NAME = 'wochenbericht.json';

const EXPECTED_FORMAT = ARCHIVE_FORMAT;
const SUPPORTED_VERSION = ARCHIVE_VERSION;

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
  /** Neu angelegte Ordner; gleichnamige vorhandene werden wiederverwendet. */
  foldersCreated: number;
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

/** Schluessel der Duplikaterkennung: Wochentag plus Kalendertag. */
const duplicateKey = (weekday: string, date: Date): string =>
  `${weekday}|${date.toISOString().slice(0, 10)}`;

/**
 * Zaehlt je Schluessel, wie viele Berichte im Zielprojekt schon existieren.
 *
 * Bewusst als Zaehler und nicht als "gibt es schon ja/nein": ein Archiv kann
 * mehrere Tagesblaetter mit demselben Wochentag und Datum enthalten (im
 * Quelltool ganz normal, etwa zwei Rundgaenge an einem Tag). Mit einer reinen
 * Ja/Nein-Pruefung wuerde das zweite davon als Duplikat des ersten verschwinden.
 */
const countExistingByKey = async (
  projectId: string,
  dates: Date[]
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  if (!dates.length) return counts;

  const times = dates.map((date) => date.getTime());
  const from = new Date(Math.min(...times));
  const to = new Date(Math.max(...times));
  to.setUTCHours(23, 59, 59, 999);

  const existing = await prisma.report.findMany({
    where: { projectId, date: { gte: from, lte: to } },
    select: { weekday: true, date: true },
  });

  for (const report of existing) {
    const key = duplicateKey(report.weekday, report.date);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
};

/**
 * @param archivePath Pfad zur hochgeladenen ZIP-Datei. Bewusst ein Pfad und
 *   kein Puffer: Archive mit mehreren hundert Originalfotos sind schnell ueber
 *   ein Gigabyte gross. adm-zip liest die Datei zwar ebenfalls am Stueck ein,
 *   aber so liegt sie nur einmal im Speicher statt zusaetzlich als
 *   Multer-Puffer. Die Fotos selbst werden einzeln ausgepackt.
 */
export const importWochenberichtArchive = async (
  archivePath: string,
  { projectId, createdById = null, skipDuplicates = true }: ImportOptions
): Promise<ImportResult> => {
  let zip: AdmZip;
  try {
    zip = new AdmZip(archivePath);
  } catch {
    throw new ImportFormatError('Die Datei ist kein lesbares ZIP-Archiv.');
  }

  const manifest = readManifest(zip);
  const sheets: SourceSheet[] = manifest.sheets;

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    foldersCreated: 0,
    photos: 0,
    findings: 0,
    areas: 0,
    droppedFields: [],
    warnings: [],
    reports: [],
  };

  // Ordner des Archivs auf cflux-Ordner im Zielprojekt abbilden. Gleichnamige
  // Ordner werden wiederverwendet, damit ein zweiter Import nicht "KW35 (2)"
  // danebenlegt.
  const folderIdMap = new Map<string, string>();

  for (const folder of Array.isArray(manifest.folders) ? manifest.folders : []) {
    const name = str(folder?.name);
    if (!folder?.id || !name) continue;

    const existing = await prisma.reportFolder.findFirst({
      where: { projectId, name },
      select: { id: true },
    });

    const target =
      existing ?? (await prisma.reportFolder.create({ data: { projectId, name }, select: { id: true } }));

    folderIdMap.set(folder.id as string, target.id);
    if (!existing) result.foldersCreated += 1;
  }

  // Das Quelltool kennt Felder, fuer die es in cflux keine Entsprechung gibt.
  if (sheets.some((sheet) => str(sheet.projekt))) {
    result.droppedFields.push('Projekttext des Quelltools (ersetzt durch das gewählte Projekt)');
  }

  // Die Enablon-Spalte gibt es im Bericht nicht mehr; aeltere Archive fuehren
  // sie noch mit und sollen das nicht stillschweigend verlieren.
  if (
    sheets.some((sheet) =>
      (sheet.feststellungen || []).some((finding: Record<string, unknown>) => str(finding.enablon))
    )
  ) {
    result.droppedFields.push('Enablon-Nummer der Feststellungen (Spalte entfällt)');
  }

  const existingByKey = skipDuplicates
    ? await countExistingByKey(
        projectId,
        sheets.map((sheet) => toDate(sheet.date)).filter((date): date is Date => date !== null)
      )
    : new Map<string, number>();

  for (const sheet of sheets) {
    const weekday = str(sheet.weekday) || 'Mo';
    const date = toDate(sheet.date);

    if (!date) {
      result.warnings.push(`Tagesblatt ohne gültiges Datum übersprungen (${sheet.id || 'ohne ID'}).`);
      result.skipped += 1;
      continue;
    }

    // Pro vorhandenem Bericht wird genau ein Tagesblatt ausgelassen. Enthaelt
    // das Archiv mehr Blaetter zu einem Tag als die Datenbank Berichte, landen
    // die zusaetzlichen im Import.
    const key = duplicateKey(weekday, date);
    const stillExisting = existingByKey.get(key) || 0;

    if (stillExisting > 0) {
      existingByKey.set(key, stillExisting - 1);
      result.skipped += 1;
      continue;
    }

    // Nur die Eintraege heraussuchen — ausgepackt wird spaeter, ein Bild nach
    // dem anderen. Ein Bericht mit 200 Fotos soll nicht 200 Puffer halten.
    const photoFiles: { newName: string; entry: IZipEntry; source: SourcePhoto }[] = [];

    for (const photo of sheet.photos || []) {
      const entryPath = photo.path || `photos/${sheet.id}/${photo.filename}`;
      const entry = zip.getEntry(entryPath);
      const safeName = safePhotoName(photo.filename || '');

      if (!entry || !safeName) {
        result.warnings.push(`Foto fehlt im Archiv: ${entryPath}`);
        continue;
      }

      photoFiles.push({ newName: safeName, entry, source: photo });
    }

    const created = await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          projectId,
          weekday,
          date,
          titel: str(sheet.titel),
          folderId: (sheet.folderId && folderIdMap.get(sheet.folderId)) || null,
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
            fileSize: file.entry.header.size,
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
            kontrolle: str(finding.kontrolle),
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
        // getData() packt genau diesen einen Eintrag aus; der Puffer ist nach
        // dem Schreiben wieder frei.
        fs.writeFileSync(path.join(targetDir, file.newName), file.entry.getData());
        // Gleich verkleinern — sonst zieht der erste Export das nach und
        // laeuft bei hunderten Fotos in den Timeout.
        await ensureThumbnail(created.id, file.newName);
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
