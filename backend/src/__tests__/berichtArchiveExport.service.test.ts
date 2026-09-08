import fs from 'fs';
import os from 'os';
import path from 'path';

const TMP_PHOTOS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'bericht-archive-'));

// Export und Import lesen beide PHOTOS_DIR aus bericht.service — im Test soll
// das ein Wegwerf-Verzeichnis sein, nicht der echte uploads-Ordner.
jest.mock('../services/bericht.service', () => ({
  PHOTOS_DIR: TMP_PHOTOS_DIR,
}));

// Die Verkleinerungen brauchen sharp; das gehoert nicht zum Austauschformat.
jest.mock('../services/reportPhotoThumbs.service', () => ({
  ensureThumbnail: jest.fn().mockResolvedValue(null),
  findThumbnail: jest.fn().mockReturnValue(null),
}));

jest.mock('../lib/prisma', () => ({
  prisma: {
    report: { findMany: jest.fn(), create: jest.fn() },
    reportFolder: { findFirst: jest.fn(), create: jest.fn() },
    reportArea: { createMany: jest.fn() },
    reportPhoto: { create: jest.fn() },
    reportFinding: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '../lib/prisma';
import {
  buildManifest,
  streamWochenberichtArchive,
  archiveFilename,
} from '../services/berichtArchiveExport.service';
import { importWochenberichtArchive } from '../services/berichtImport.service';

const REPORT_ID = 'report-quelle-1';
const PHOTO_ID = 'photo-quelle-1';
const PHOTO_FILE = 'a1b2c3.jpg';
const FOLDER = { id: 'folder-1', name: 'KW 35' };

/** Ein Bericht in der Form, die reportInclude liefert. */
const buildReport = (): any => ({
  id: REPORT_ID,
  weekday: 'Di',
  date: new Date('2026-08-25T00:00:00.000Z'),
  titel: 'Rundgang Bau 3',
  folder: FOLDER,
  project: { id: 'p1', name: 'Novartis WSJ' },
  referent: 'M. Püski',
  rundgangDurchgefuehrt: 'Ja',
  weitereTeilnehmer: 'A. Muster',
  areas: [
    { id: 'a1', name: 'PPE / PSA', status: 'i.O.', sortOrder: 0 },
    { id: 'a2', name: 'Elektro', status: 'Abweichung', sortOrder: 1 },
  ],
  findings: [
    {
      id: 'f1',
      position: 0,
      feststellung: 'Geländer fehlt',
      bereich: 'Arbeiten in der Höhe',
      klassifizierung: 'Unsafe Condition (unsicherer Zustand)',
      ampel: 'Rot',
      stopp: 'Ja',
      massnahme: 'Geländer montieren',
      verantwortlich: 'Polier',
      termin: new Date('2026-08-27T00:00:00.000Z'),
      status: 'Offen',
      erledigtAm: null,
      kontrolle: 'KW36 durch SiKo geprüft',
      photoId: PHOTO_ID,
    },
  ],
  photos: [
    {
      id: PHOTO_ID,
      filename: PHOTO_FILE,
      originalName: 'IMG_0001.jpg',
      mimeType: 'image/jpeg',
      fileSize: 10,
    },
  ],
});

/** Legt die Bilddatei ab, die der Export vom Dateisystem holt. */
const writeSourcePhoto = (content = 'jpeg-bytes') => {
  const dir = path.join(TMP_PHOTOS_DIR, REPORT_ID);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, PHOTO_FILE), content);
};

const exportToFile = async (reports: any[], folders = [FOLDER]): Promise<string> => {
  const file = path.join(TMP_PHOTOS_DIR, `export-${Date.now()}-${Math.random()}.zip`);
  const out = fs.createWriteStream(file);
  await streamWochenberichtArchive(out, reports, folders);
  return file;
};

describe('buildManifest', () => {
  it('schreibt Format und Version, die der Import erwartet', () => {
    const manifest = buildManifest([buildReport()], [FOLDER]) as any;

    expect(manifest.format).toBe('wochenbericht-export');
    expect(manifest.version).toBe(1);
    expect(manifest.folders).toEqual([{ id: 'folder-1', name: 'KW 35' }]);
  });

  it('legt die Fotos unter dem Pfad ab, unter dem der Import sie sucht', () => {
    const manifest = buildManifest([buildReport()], [FOLDER]) as any;

    expect(manifest.sheets[0].photos[0].path).toBe(`photos/${REPORT_ID}/${PHOTO_FILE}`);
  });

  it('kürzt Datumsfelder auf den Kalendertag', () => {
    const manifest = buildManifest([buildReport()], [FOLDER]) as any;

    expect(manifest.sheets[0].date).toBe('2026-08-25');
    expect(manifest.sheets[0].feststellungen[0].termin).toBe('2026-08-27');
    expect(manifest.sheets[0].feststellungen[0].erledigtAm).toBeNull();
  });
});

describe('archiveFilename', () => {
  it('entschärft Sonderzeichen im Ordnernamen', () => {
    expect(archiveFilename('KW 35 / Bau 3')).toBe('Wochenbericht_Daten_KW_35_Bau_3.zip');
    expect(archiveFilename('')).toBe('Wochenbericht_Daten_Export.zip');
  });
});

describe('Export → Import (Round-Trip)', () => {
  let createdReport: any;
  let createdAreas: any[];
  let createdFindings: any[];
  let createdFolders: any[];

  beforeEach(() => {
    jest.clearAllMocks();
    createdAreas = [];
    createdFindings = [];
    createdFolders = [];
    writeSourcePhoto();

    (prisma.report.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.reportFolder.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.reportFolder.create as jest.Mock).mockImplementation(({ data }: any) => {
      createdFolders.push(data);
      return Promise.resolve({ id: 'neuer-ordner-1' });
    });
    (prisma.report.create as jest.Mock).mockImplementation(({ data }: any) => {
      createdReport = data;
      return Promise.resolve({ id: 'neuer-bericht-1' });
    });
    (prisma.reportArea.createMany as jest.Mock).mockImplementation(({ data }: any) => {
      createdAreas.push(...data);
      return Promise.resolve({ count: data.length });
    });
    (prisma.reportPhoto.create as jest.Mock).mockResolvedValue({ id: 'neues-foto-1' });
    (prisma.reportFinding.create as jest.Mock).mockImplementation(({ data }: any) => {
      createdFindings.push(data);
      return Promise.resolve({ id: 'neue-feststellung-1' });
    });
    (prisma.$transaction as jest.Mock).mockImplementation((fn: any) => fn(prisma));
  });

  it('liest die Kopfdaten des exportierten Berichts wieder ein', async () => {
    const archive = await exportToFile([buildReport()]);
    const result = await importWochenberichtArchive(archive, { projectId: 'ziel-projekt' });

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(createdReport).toMatchObject({
      projectId: 'ziel-projekt',
      weekday: 'Di',
      titel: 'Rundgang Bau 3',
      referent: 'M. Püski',
      rundgangDurchgefuehrt: 'Ja',
      weitereTeilnehmer: 'A. Muster',
      folderId: 'neuer-ordner-1',
    });
    expect(createdReport.date).toEqual(new Date('2026-08-25'));
    expect(createdFolders).toEqual([{ projectId: 'ziel-projekt', name: 'KW 35' }]);
  });

  it('bringt Bereiche und Feststellungen samt Kontrolle-Spalte zurück', async () => {
    const archive = await exportToFile([buildReport()]);
    await importWochenberichtArchive(archive, { projectId: 'ziel-projekt' });

    expect(createdAreas).toHaveLength(2);
    expect(createdAreas[0]).toMatchObject({ name: 'PPE / PSA', status: 'i.O.', sortOrder: 0 });

    expect(createdFindings).toHaveLength(1);
    expect(createdFindings[0]).toMatchObject({
      feststellung: 'Geländer fehlt',
      bereich: 'Arbeiten in der Höhe',
      klassifizierung: 'Unsafe Condition (unsicherer Zustand)',
      ampel: 'Rot',
      stopp: 'Ja',
      massnahme: 'Geländer montieren',
      verantwortlich: 'Polier',
      status: 'Offen',
      kontrolle: 'KW36 durch SiKo geprüft',
    });
    expect(createdFindings[0].termin).toEqual(new Date('2026-08-27'));
    expect(createdFindings[0].erledigtAm).toBeNull();
  });

  it('schreibt das Foto wieder auf die Platte und hängt es an die Feststellung', async () => {
    const archive = await exportToFile([buildReport()]);
    const result = await importWochenberichtArchive(archive, { projectId: 'ziel-projekt' });

    expect(result.photos).toBe(1);
    expect(createdFindings[0].photoId).toBe('neues-foto-1');

    const target = path.join(TMP_PHOTOS_DIR, 'neuer-bericht-1', PHOTO_FILE);
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target).toString()).toBe('jpeg-bytes');
  });

  it('meldet Fotos, die in der Datenbank stehen aber nicht mehr auf der Platte liegen', async () => {
    fs.rmSync(path.join(TMP_PHOTOS_DIR, REPORT_ID, PHOTO_FILE));

    const file = path.join(TMP_PHOTOS_DIR, 'export-ohne-foto.zip');
    const out = fs.createWriteStream(file);
    const { missingPhotos } = await streamWochenberichtArchive(out, [buildReport()], [FOLDER]);

    expect(missingPhotos).toEqual([`${REPORT_ID}/${PHOTO_FILE}`]);

    // Das Archiv bleibt lesbar, nur ohne dieses Bild.
    const result = await importWochenberichtArchive(file, { projectId: 'ziel-projekt' });
    expect(result.imported).toBe(1);
    expect(result.photos).toBe(0);
    expect(result.warnings.some((w) => w.includes(PHOTO_FILE))).toBe(true);
  });
});
