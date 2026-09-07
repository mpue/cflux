import fs from 'fs';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';

const TMP_PHOTOS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'bericht-import-'));

// bericht.service legt beim Import seinen echten uploads-Ordner an — im Test
// soll stattdessen ein temporaeres Verzeichnis beschrieben werden.
jest.mock('../services/bericht.service', () => ({
  PHOTOS_DIR: TMP_PHOTOS_DIR,
}));

jest.mock('../lib/prisma', () => ({
  prisma: {
    report: { findFirst: jest.fn(), create: jest.fn() },
    reportArea: { createMany: jest.fn() },
    reportPhoto: { create: jest.fn() },
    reportFinding: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '../lib/prisma';
import {
  importWochenberichtArchive,
  ImportFormatError,
} from '../services/berichtImport.service';

const PROJECT_ID = 'project-1';
const SHEET_ID = 'sheet-1';
const PHOTO_ID = 'photo-old-1';

const buildArchive = (overrides: Record<string, any> = {}) => {
  const zip = new AdmZip();

  const manifest = {
    format: 'wochenbericht-export',
    version: 1,
    exportedAt: '2026-09-07T00:00:00.000Z',
    folders: [],
    sheets: [
      {
        id: SHEET_ID,
        weekday: 'Di',
        date: '2026-08-25',
        titel: '',
        projekt: 'Novartis',
        referent: 'Ecki',
        rundgangDurchgefuehrt: 'Ja',
        weitereTeilnehmer: '',
        bereiche: [
          { name: 'Arbeiten in der Höhe', status: 'i.O.' },
          { name: 'PPE / PSA', status: 'Abweichung' },
        ],
        feststellungen: [
          {
            feststellung: 'Geländer fehlt',
            bereich: 'Arbeiten in der Höhe',
            klassifizierung: 'Unsafe Condition',
            ampel: 'Rot',
            stopp: 'Ja',
            massnahme: 'Geländer montieren',
            verantwortlich: 'Polier',
            termin: '2026-08-27',
            status: 'Offen',
            erledigtAm: '',
            enablon: '',
            photoId: PHOTO_ID,
          },
        ],
        photos: [
          {
            id: PHOTO_ID,
            filename: 'abc-123.jpg',
            originalName: 'IMG_0001.jpg',
            path: `photos/${SHEET_ID}/abc-123.jpg`,
            mimeType: 'image/jpeg',
          },
        ],
      },
    ],
    ...overrides,
  };

  zip.addFile('wochenbericht.json', Buffer.from(JSON.stringify(manifest), 'utf-8'));
  zip.addFile(`photos/${SHEET_ID}/abc-123.jpg`, Buffer.from('jpeg-bytes'));
  return zip.toBuffer();
};

describe('importWochenberichtArchive', () => {
  const createdPhotos: any[] = [];
  const createdFindings: any[] = [];
  const createdAreas: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    createdPhotos.length = 0;
    createdFindings.length = 0;
    createdAreas.length = 0;

    (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.report.create as jest.Mock).mockResolvedValue({ id: 'new-report-1' });
    (prisma.reportArea.createMany as jest.Mock).mockImplementation(({ data }: any) => {
      createdAreas.push(...data);
      return Promise.resolve({ count: data.length });
    });
    (prisma.reportPhoto.create as jest.Mock).mockImplementation(({ data }: any) => {
      createdPhotos.push(data);
      return Promise.resolve({ id: `new-photo-${createdPhotos.length}` });
    });
    (prisma.reportFinding.create as jest.Mock).mockImplementation(({ data }: any) => {
      createdFindings.push(data);
      return Promise.resolve(data);
    });
    // Die Transaktion reicht denselben Prisma-Mock durch.
    (prisma.$transaction as jest.Mock).mockImplementation((fn: any) => fn(prisma));
  });

  it('legt Bericht, Bereiche, Fotos und Feststellungen an', async () => {
    const result = await importWochenberichtArchive(buildArchive(), { projectId: PROJECT_ID });

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.photos).toBe(1);
    expect(result.findings).toBe(1);
    expect(result.areas).toBe(2);
    expect(result.warnings).toHaveLength(0);

    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: PROJECT_ID,
          weekday: 'Di',
          referent: 'Ecki',
          rundgangDurchgefuehrt: 'Ja',
          weitereTeilnehmer: null,
        }),
      })
    );

    expect(createdAreas[1]).toMatchObject({ name: 'PPE / PSA', status: 'Abweichung', sortOrder: 1 });
  });

  it('bildet die Foto-Zuordnung der Feststellungen auf die neuen IDs ab', async () => {
    await importWochenberichtArchive(buildArchive(), { projectId: PROJECT_ID });

    expect(createdFindings[0].photoId).toBe('new-photo-1');
    expect(createdFindings[0].termin).toEqual(new Date('2026-08-27'));
    // Leere Strings aus dem Quelltool werden zu null, nicht zu ''.
    expect(createdFindings[0].erledigtAm).toBeNull();
    expect(createdFindings[0].enablon).toBeNull();
  });

  it('schreibt die Bilddateien unter die neue Bericht-ID', async () => {
    await importWochenberichtArchive(buildArchive(), { projectId: PROJECT_ID });

    const target = path.join(TMP_PHOTOS_DIR, 'new-report-1', 'abc-123.jpg');
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target).toString()).toBe('jpeg-bytes');
  });

  it('überspringt bereits vorhandene Berichte', async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

    const result = await importWochenberichtArchive(buildArchive(), { projectId: PROJECT_ID });

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it('importiert trotz Duplikat, wenn skipDuplicates aus ist', async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

    const result = await importWochenberichtArchive(buildArchive(), {
      projectId: PROJECT_ID,
      skipDuplicates: false,
    });

    expect(result.imported).toBe(1);
  });

  it('meldet Felder, für die es in cflux keine Entsprechung gibt', async () => {
    const archive = buildArchive({
      folders: [{ id: 'f1', name: 'KW 35' }],
      sheets: [
        {
          id: SHEET_ID,
          weekday: 'Mi',
          date: '2026-08-26',
          titel: 'Rückbau Halle 4',
          projekt: 'Novartis',
          bereiche: [],
          feststellungen: [],
          photos: [],
        },
      ],
    });

    const result = await importWochenberichtArchive(archive, { projectId: PROJECT_ID });

    expect(result.droppedFields).toEqual(
      expect.arrayContaining([
        'Titel des Berichts',
        'Ordnerzuordnung (1 Ordner)',
        expect.stringContaining('Projekttext'),
      ])
    );
  });

  it('entschärft Pfadangriffe im Dateinamen (Zip Slip)', async () => {
    const zip = new AdmZip();
    zip.addFile(
      'wochenbericht.json',
      Buffer.from(
        JSON.stringify({
          format: 'wochenbericht-export',
          version: 1,
          folders: [],
          sheets: [
            {
              id: SHEET_ID,
              weekday: 'Do',
              date: '2026-08-27',
              bereiche: [],
              feststellungen: [],
              photos: [
                {
                  id: 'p1',
                  filename: '../../../evil.txt',
                  path: 'photos/evil',
                  originalName: 'evil.txt',
                },
              ],
            },
          ],
        }),
        'utf-8'
      )
    );
    zip.addFile('photos/evil', Buffer.from('pwned'));

    await importWochenberichtArchive(zip.toBuffer(), { projectId: PROJECT_ID });

    // Der Traversal-Anteil wird abgeschnitten, die Datei landet im Berichtsordner.
    expect(fs.existsSync(path.join(TMP_PHOTOS_DIR, 'new-report-1', 'evil.txt'))).toBe(true);
    expect(fs.existsSync(path.resolve(TMP_PHOTOS_DIR, '../../../evil.txt'))).toBe(false);
    expect(createdPhotos[0].filename).toBe('evil.txt');
  });

  it('überspringt Fotos mit unbrauchbarem Dateinamen', async () => {
    const zip = new AdmZip();
    zip.addFile(
      'wochenbericht.json',
      Buffer.from(
        JSON.stringify({
          format: 'wochenbericht-export',
          version: 1,
          folders: [],
          sheets: [
            {
              id: SHEET_ID,
              weekday: 'Fr',
              date: '2026-08-28',
              bereiche: [],
              feststellungen: [],
              photos: [{ id: 'p1', filename: '..', path: 'photos/x', originalName: 'x' }],
            },
          ],
        }),
        'utf-8'
      )
    );
    zip.addFile('photos/x', Buffer.from('data'));

    const result = await importWochenberichtArchive(zip.toBuffer(), { projectId: PROJECT_ID });

    expect(result.photos).toBe(0);
    expect(result.warnings[0]).toContain('Foto fehlt im Archiv');
  });

  it('weist fremde Archive ab', async () => {
    const zip = new AdmZip();
    zip.addFile('wochenbericht.json', Buffer.from(JSON.stringify({ format: 'etwas-anderes' })));

    await expect(
      importWochenberichtArchive(zip.toBuffer(), { projectId: PROJECT_ID })
    ).rejects.toBeInstanceOf(ImportFormatError);
  });

  it('weist Archive ohne Manifest ab', async () => {
    const zip = new AdmZip();
    zip.addFile('irgendwas.txt', Buffer.from('nix'));

    await expect(
      importWochenberichtArchive(zip.toBuffer(), { projectId: PROJECT_ID })
    ).rejects.toThrow(/wochenbericht\.json/);
  });
});
