import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import {
  getAllProtocols,
  getProtocolById,
  createProtocol,
  updateProtocol,
  signProtocol,
  cancelProtocol,
  deleteProtocol,
  getProtocolPdf,
  getSignedDocument,
} from '../controllers/handoverProtocol.controller';
import * as handoverService from '../services/handoverProtocol.service';

const router = express.Router();

// Ablage für eingescannte, unterschriebene Protokolle
const uploadDir = path.join(__dirname, '../../uploads/handover-protocols');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Erlaubt sind nur Scans und Fotos des unterschriebenen Protokolls. Die Endung
// stammt aus dieser Liste, nicht aus dem Dateinamen des Uploads.
const ALLOWED_UPLOADS: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/tiff': '.tif',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `signed-${uuidv4()}${ALLOWED_UPLOADS[file.mimetype] || '.bin'}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_UPLOADS[file.mimetype]) return cb(null, true);
    cb(new Error('Nur PDF-, PNG-, JPEG-, WebP- oder TIFF-Dateien sind erlaubt'));
  },
});

/**
 * Upload-Middleware mit eigener Fehlerbehandlung: abgelehnte Dateitypen und
 * Grössenüberschreitungen sollen als 400 mit Klartext ankommen, nicht als 500.
 */
const uploadSignedDocument = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  upload.single('signedDocument')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
      return res.status(400).json({ error: message });
    }
    next();
  });
};

router.use(authenticate);

// Eigene Protokolle – jeder Benutzer darf sehen, was er selbst quittiert hat
router.get('/mine', async (req: AuthRequest, res) => {
  try {
    const protocols = await handoverService.listProtocols({ userId: req.user!.id });
    res.json(protocols);
  } catch (error) {
    console.error('Fehler beim Laden der eigenen Übergabeprotokolle:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Übergabeprotokolle' });
  }
});

router.get('/', authorize('ADMIN'), getAllProtocols);
router.get('/:id', authorize('ADMIN'), getProtocolById);
router.get('/:id/pdf', authorize('ADMIN'), getProtocolPdf);
router.get('/:id/signed-document', authorize('ADMIN'), getSignedDocument);
router.post('/', authorize('ADMIN'), createProtocol);
router.put('/:id', authorize('ADMIN'), updateProtocol);
router.post('/:id/sign', authorize('ADMIN'), uploadSignedDocument, signProtocol);
router.post('/:id/cancel', authorize('ADMIN'), cancelProtocol);
router.delete('/:id', authorize('ADMIN'), deleteProtocol);

export default router;
