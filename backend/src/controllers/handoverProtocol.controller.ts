import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { HandoverProtocolStatus, HandoverProtocolType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import * as handoverService from '../services/handoverProtocol.service';
import { generateHandoverProtocolPdfBuffer } from '../services/handoverProtocolPdf.service';

const PDF_DIR = path.join(__dirname, '../../uploads/handover-protocols');

/** Fehlermeldungen aus dem Service sind für die Oberfläche gedacht -> 400 statt 500. */
const respondError = (res: Response, error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : fallback;
  const isValidation =
    error instanceof Error &&
    !/prisma|unexpected|undefined/i.test(message) &&
    message.length < 200;
  console.error(`${fallback}:`, error);
  res.status(isValidation ? 400 : 500).json({ error: isValidation ? message : fallback });
};

export const getAllProtocols = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, employeeId, deviceId, type, status, search } = req.query;
    const protocols = await handoverService.listProtocols({
      userId: userId as string | undefined,
      employeeId: employeeId as string | undefined,
      deviceId: deviceId as string | undefined,
      type: type as HandoverProtocolType | undefined,
      status: status as HandoverProtocolStatus | undefined,
      search: search as string | undefined,
    });
    res.json(protocols);
  } catch (error) {
    respondError(res, error, 'Fehler beim Laden der Übergabeprotokolle');
  }
};

export const getProtocolById = async (req: AuthRequest, res: Response) => {
  try {
    const protocol = await handoverService.getProtocolById(req.params.id);
    if (!protocol) {
      return res.status(404).json({ error: 'Protokoll nicht gefunden' });
    }
    res.json(protocol);
  } catch (error) {
    respondError(res, error, 'Fehler beim Laden des Übergabeprotokolls');
  }
};

export const createProtocol = async (req: AuthRequest, res: Response) => {
  try {
    const protocol = await handoverService.createProtocol(req.body, req.user!.id);
    res.status(201).json(protocol);
  } catch (error) {
    respondError(res, error, 'Fehler beim Anlegen des Übergabeprotokolls');
  }
};

export const updateProtocol = async (req: AuthRequest, res: Response) => {
  try {
    const protocol = await handoverService.updateProtocol(req.params.id, req.body);
    res.json(protocol);
  } catch (error) {
    respondError(res, error, 'Fehler beim Aktualisieren des Übergabeprotokolls');
  }
};

export const signProtocol = async (req: AuthRequest, res: Response) => {
  try {
    // Unterschriebenes Protokoll kann als Scan hochgeladen werden (Papierweg)
    const file = (req as any).file as { filename: string } | undefined;
    const protocol = await handoverService.markSigned(req.params.id, {
      signedAt: req.body?.signedAt,
      ...(file ? { signedDocumentPath: `/uploads/handover-protocols/${file.filename}` } : {}),
      ...(req.body?.signatureRecipientPath !== undefined
        ? { signatureRecipientPath: req.body.signatureRecipientPath }
        : {}),
      ...(req.body?.signatureIssuerPath !== undefined
        ? { signatureIssuerPath: req.body.signatureIssuerPath }
        : {}),
    });
    res.json(protocol);
  } catch (error) {
    respondError(res, error, 'Fehler beim Erfassen der Unterschrift');
  }
};

export const cancelProtocol = async (req: AuthRequest, res: Response) => {
  try {
    const protocol = await handoverService.cancelProtocol(req.params.id, req.body?.reason);
    res.json(protocol);
  } catch (error) {
    respondError(res, error, 'Fehler beim Stornieren des Übergabeprotokolls');
  }
};

export const deleteProtocol = async (req: AuthRequest, res: Response) => {
  try {
    await handoverService.deleteProtocol(req.params.id);
    res.json({ message: 'Protokoll gelöscht' });
  } catch (error) {
    respondError(res, error, 'Fehler beim Löschen des Übergabeprotokolls');
  }
};

/**
 * Erzeugt das Protokoll-PDF, legt es unter /uploads/handover-protocols ab
 * und liefert es direkt aus. Das Verzeichnis wird bewusst nicht statisch
 * ausgeliefert (Personendaten, vorhersagbare Dateinamen) – der Abruf läuft
 * ausschliesslich über diesen Endpunkt.
 */
export const getProtocolPdf = async (req: AuthRequest, res: Response) => {
  try {
    const protocol = await handoverService.getProtocolById(req.params.id);
    if (!protocol) {
      return res.status(404).json({ error: 'Protokoll nicht gefunden' });
    }

    const settings = await prisma.systemSettings.findFirst();
    const buffer = await generateHandoverProtocolPdfBuffer(protocol, settings);

    if (!fs.existsSync(PDF_DIR)) {
      fs.mkdirSync(PDF_DIR, { recursive: true });
    }
    const fileName = `${protocol.protocolNumber}.pdf`;
    fs.writeFileSync(path.join(PDF_DIR, fileName), buffer);
    await handoverService.setPdfPath(protocol.id, `/uploads/handover-protocols/${fileName}`);

    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    respondError(res, error, 'Fehler beim Erzeugen des Protokoll-PDFs');
  }
};

/**
 * Liefert das eingescannte, unterschriebene Protokoll aus. Bewusst über die API
 * statt über den statischen Upload-Pfad, damit der Zugriff authentifiziert bleibt.
 */
export const getSignedDocument = async (req: AuthRequest, res: Response) => {
  try {
    const protocol = await handoverService.getProtocolById(req.params.id);
    if (!protocol) {
      return res.status(404).json({ error: 'Protokoll nicht gefunden' });
    }
    if (!protocol.signedDocumentPath) {
      return res.status(404).json({ error: 'Kein unterschriebenes Dokument hinterlegt' });
    }

    // Nur Dateinamen aus dem Protokollverzeichnis zulassen – kein Pfad aus der Anfrage
    const fileName = path.basename(protocol.signedDocumentPath);
    const filePath = path.join(PDF_DIR, fileName);
    if (!filePath.startsWith(PDF_DIR + path.sep) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }

    const extension = path.extname(fileName).toLowerCase();
    const contentType =
      extension === '.pdf'
        ? 'application/pdf'
        : extension === '.png'
        ? 'image/png'
        : extension === '.jpg' || extension === '.jpeg'
        ? 'image/jpeg'
        : 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${protocol.protocolNumber}-unterschrieben${extension}"`);
    res.sendFile(filePath);
  } catch (error) {
    respondError(res, error, 'Fehler beim Laden des unterschriebenen Protokolls');
  }
};
