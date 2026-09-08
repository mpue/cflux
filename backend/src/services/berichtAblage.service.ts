import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { generateThumbnail, thumbnailFilenameFor } from './gotenberg.service';

/**
 * Ablage eines Rundgangsberichts im Dokumenten-Modul.
 *
 * Die Datei wird als Anhang an einen Knoten im Dokumentenbaum gehaengt, genau
 * wie ein Upload ueber die Dokumente-Oberflaeche — nur legt cflux den Pfad
 * selbst an, statt ihn auswaehlen zu lassen.
 */

/** Wurzel der automatischen Ablage. Darunter: Projekt, darunter Ordner/Jahr. */
export const ABLAGE_ROOT = 'Rundgangsberichte';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/attachments');
const THUMBNAIL_DIR = path.join(__dirname, '../../uploads/attachments-thumbnails');

export interface AblageTarget {
  nodeId: string;
  /** Pfad von der Wurzel bis zum Zielknoten, fuer die Rueckmeldung. */
  path: string[];
  /** Knoten, die diese Ablage neu angelegt hat. */
  created: string[];
}

/**
 * Sucht den Pfad im Dokumentenbaum und legt fehlende Ordner an.
 *
 * Verglichen wird ueber den Titel im selben Elternknoten — der Baum hat keine
 * eindeutigen Schluessel. Geloeschte Knoten zaehlen nicht mit, sonst haengte
 * eine zweite Ablage ihre Datei in den Papierkorb.
 */
export const ensureDocumentPath = async (
  segments: string[],
  userId: string
): Promise<AblageTarget> => {
  const created: string[] = [];
  let parentId: string | null = null;

  for (const rawTitle of segments) {
    const title = rawTitle.trim() || 'Ohne Titel';

    const existing: { id: string } | null = await prisma.documentNode.findFirst({
      where: { title, parentId, deletedAt: null },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      parentId = existing.id;
      continue;
    }

    // Neue Ordner ans Ende der Ebene.
    const last = await prisma.documentNode.findFirst({
      where: { parentId, deletedAt: null },
      select: { order: true },
      orderBy: { order: 'desc' },
    });

    const node: { id: string } = await prisma.documentNode.create({
      data: {
        title,
        type: 'FOLDER',
        contentType: 'HTML',
        content: '',
        parentId,
        order: (last?.order ?? -1) + 1,
        createdById: userId,
        updatedById: userId,
      },
      select: { id: true },
    });

    created.push(title);
    parentId = node.id;
  }

  if (!parentId) {
    throw new Error('Ablagepfad ist leer');
  }

  return { nodeId: parentId, path: segments, created };
};

export interface AttachResult {
  attachmentId: string;
  filename: string;
  fileSize: number;
  /** true, wenn eine gleichnamige Datei ersetzt und eine Version angelegt wurde. */
  replacedVersion: number | null;
}

/**
 * Haengt eine fertige Datei an einen Dokumentenknoten.
 *
 * Liegt dort schon ein Anhang mit demselben Anzeigenamen, wird er als neue
 * Version fortgeschrieben statt danebengelegt — sonst sammeln sich bei jedem
 * erneuten Ablegen desselben Berichts Dubletten an.
 */
export const attachFileToNode = async ({
  nodeId,
  sourcePath,
  displayName,
  mimeType,
  description,
  userId,
}: {
  nodeId: string;
  sourcePath: string;
  displayName: string;
  mimeType: string;
  description?: string | null;
  userId: string;
}): Promise<AttachResult> => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const storedName = `${uuidv4()}${path.extname(displayName)}`;
  const target = path.join(UPLOAD_DIR, storedName);

  // Verschieben statt kopieren, wo es geht: die Quelle ist eine Wegwerfdatei.
  try {
    fs.renameSync(sourcePath, target);
  } catch {
    // Anderes Dateisystem (Docker-Volume) — dann eben kopieren.
    fs.copyFileSync(sourcePath, target);
    fs.unlinkSync(sourcePath);
  }

  const fileSize = fs.statSync(target).size;
  const storedPath = `/uploads/attachments/${storedName}`;

  const existing = await prisma.documentNodeAttachment.findFirst({
    where: { documentNodeId: nodeId, originalFilename: displayName, deletedAt: null },
    orderBy: { version: 'desc' },
  });

  const attachment = existing
    ? await prisma.documentNodeAttachment.update({
        where: { id: existing.id },
        data: {
          filename: storedName,
          mimeType,
          fileSize,
          path: storedPath,
          pdfPath: null,
          description: description ?? existing.description,
          version: existing.version + 1,
          isActive: true,
          updatedById: userId,
        },
      })
    : await prisma.documentNodeAttachment.create({
        data: {
          documentNodeId: nodeId,
          filename: storedName,
          originalFilename: displayName,
          mimeType,
          fileSize,
          path: storedPath,
          pdfPath: null,
          description: description ?? null,
          version: 1,
          createdById: userId,
          updatedById: userId,
        },
      });

  await prisma.documentNodeAttachmentVersion.create({
    data: {
      attachmentId: attachment.id,
      filename: storedName,
      originalFilename: displayName,
      mimeType,
      fileSize,
      path: storedPath,
      version: attachment.version,
      changeReason: existing ? 'Erneut aus dem Berichte-Modul abgelegt' : 'Aus dem Berichte-Modul abgelegt',
      createdById: userId,
    },
  });

  // Vorschaubild im Hintergrund; eine fehlende Miniatur ist kein Fehlschlag.
  // Ein PDF rastert der Generator selbst, eine Konvertierung braucht es nicht.
  generateThumbnail(
    target,
    displayName,
    path.join(THUMBNAIL_DIR, thumbnailFilenameFor(storedName))
  ).catch((err) => console.warn('Thumbnail der Berichtsablage fehlgeschlagen:', err));

  return {
    attachmentId: attachment.id,
    filename: displayName,
    fileSize,
    replacedVersion: existing ? attachment.version : null,
  };
};
