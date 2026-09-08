import fs from 'fs';
import os from 'os';
import path from 'path';

// Die Miniatur braucht sharp und gehoert nicht zur Ablagelogik.
jest.mock('../services/gotenberg.service', () => ({
  generateThumbnail: jest.fn().mockResolvedValue(true),
  thumbnailFilenameFor: (name: string) => `${name}.jpg`,
}));

jest.mock('../lib/prisma', () => ({
  prisma: {
    documentNode: { findFirst: jest.fn(), create: jest.fn() },
    documentNodeAttachment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    documentNodeAttachmentVersion: { create: jest.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { ensureDocumentPath, attachFileToNode } from '../services/berichtAblage.service';

const USER = 'user-1';

describe('ensureDocumentPath', () => {
  beforeEach(() => jest.clearAllMocks());

  it('legt jeden fehlenden Ordner an und hängt ihn unter den vorigen', async () => {
    (prisma.documentNode.findFirst as jest.Mock).mockResolvedValue(null);
    let seq = 0;
    (prisma.documentNode.create as jest.Mock).mockImplementation(() =>
      Promise.resolve({ id: `node-${++seq}` })
    );

    const target = await ensureDocumentPath(['Rundgangsberichte', 'Novartis WSJ', 'KW 35'], USER);

    expect(target.nodeId).toBe('node-3');
    expect(target.created).toEqual(['Rundgangsberichte', 'Novartis WSJ', 'KW 35']);

    const calls = (prisma.documentNode.create as jest.Mock).mock.calls;
    expect(calls[0][0].data).toMatchObject({
      title: 'Rundgangsberichte',
      type: 'FOLDER',
      parentId: null,
      createdById: USER,
    });
    // Jeder Ordner haengt unter dem zuvor angelegten.
    expect(calls[1][0].data.parentId).toBe('node-1');
    expect(calls[2][0].data.parentId).toBe('node-2');
  });

  it('verwendet vorhandene Ordner weiter, statt daneben neue anzulegen', async () => {
    (prisma.documentNode.findFirst as jest.Mock)
      // Ebene 1 gibt es schon …
      .mockResolvedValueOnce({ id: 'vorhanden-1' })
      // … Ebene 2 auch …
      .mockResolvedValueOnce({ id: 'vorhanden-2' })
      // … Ebene 3 fehlt, danach die Abfrage nach dem letzten order-Wert.
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ order: 4 });
    (prisma.documentNode.create as jest.Mock).mockResolvedValue({ id: 'node-neu' });

    const target = await ensureDocumentPath(['Rundgangsberichte', 'Novartis WSJ', 'KW 36'], USER);

    expect(target.nodeId).toBe('node-neu');
    expect(target.created).toEqual(['KW 36']);
    expect(prisma.documentNode.create).toHaveBeenCalledTimes(1);
    // Neue Ordner landen hinter dem letzten der Ebene.
    expect((prisma.documentNode.create as jest.Mock).mock.calls[0][0].data.order).toBe(5);
  });

  it('sucht nur unter nicht gelöschten Knoten', async () => {
    (prisma.documentNode.findFirst as jest.Mock).mockResolvedValue({ id: 'x' });

    await ensureDocumentPath(['Rundgangsberichte'], USER);

    expect((prisma.documentNode.findFirst as jest.Mock).mock.calls[0][0].where).toMatchObject({
      title: 'Rundgangsberichte',
      parentId: null,
      deletedAt: null,
    });
  });
});

describe('attachFileToNode', () => {
  let tmpDir: string;

  const sourceFile = (content = 'pdf-bytes'): string => {
    const file = path.join(tmpDir, `quelle-${Math.random()}.pdf`);
    fs.writeFileSync(file, content);
    return file;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ablage-'));
    (prisma.documentNodeAttachmentVersion.create as jest.Mock).mockResolvedValue({});
  });

  it('legt einen neuen Anhang an und schreibt die Datei weg', async () => {
    (prisma.documentNodeAttachment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.documentNodeAttachment.create as jest.Mock).mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'anhang-1', ...data })
    );

    const source = sourceFile();
    const result = await attachFileToNode({
      nodeId: 'node-1',
      sourcePath: source,
      displayName: 'Bericht_Mi.pdf',
      mimeType: 'application/pdf',
      userId: USER,
    });

    expect(result).toMatchObject({
      attachmentId: 'anhang-1',
      filename: 'Bericht_Mi.pdf',
      fileSize: 9,
      replacedVersion: null,
    });

    // Die Wegwerfdatei ist verschoben, nicht kopiert.
    expect(fs.existsSync(source)).toBe(false);

    const data = (prisma.documentNodeAttachment.create as jest.Mock).mock.calls[0][0].data;
    expect(data).toMatchObject({ documentNodeId: 'node-1', version: 1, createdById: USER });
    expect(data.path).toMatch(/^\/uploads\/attachments\/[0-9a-f-]+\.pdf$/);
    expect(fs.existsSync(path.join(__dirname, '../../uploads/attachments', data.filename))).toBe(true);

    fs.unlinkSync(path.join(__dirname, '../../uploads/attachments', data.filename));
  });

  it('schreibt eine gleichnamige Datei als neue Version fort, statt sie zu duplizieren', async () => {
    (prisma.documentNodeAttachment.findFirst as jest.Mock).mockResolvedValue({
      id: 'anhang-1',
      version: 2,
      description: 'alte Beschreibung',
    });
    (prisma.documentNodeAttachment.update as jest.Mock).mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'anhang-1', ...data })
    );

    const result = await attachFileToNode({
      nodeId: 'node-1',
      sourcePath: sourceFile(),
      displayName: 'Bericht_Mi.pdf',
      mimeType: 'application/pdf',
      userId: USER,
    });

    expect(prisma.documentNodeAttachment.create).not.toHaveBeenCalled();
    expect(result.replacedVersion).toBe(3);

    const update = (prisma.documentNodeAttachment.update as jest.Mock).mock.calls[0][0];
    expect(update.where).toEqual({ id: 'anhang-1' });
    expect(update.data).toMatchObject({ version: 3, isActive: true, updatedById: USER });

    // Die Versionshistorie bekommt den neuen Stand, nicht die alte Nummer.
    const version = (prisma.documentNodeAttachmentVersion.create as jest.Mock).mock.calls[0][0].data;
    expect(version).toMatchObject({ attachmentId: 'anhang-1', version: 3 });

    fs.unlinkSync(path.join(__dirname, '../../uploads/attachments', update.data.filename));
  });
});
