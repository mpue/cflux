import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import { requireProjectAccess, hasProjectAccess } from '../middleware/projectAccess';
import { AuthRequest } from '../types/auth';
import { prisma } from '../lib/prisma';
import { PHOTOS_DIR } from '../services/bericht.service';
import * as berichtController from '../controllers/bericht.controller';

const router = Router();

const MODULE_KEY = 'berichte';

/**
 * Zugriffspruefung vor dem Multer-Upload: Ein Foto soll gar nicht erst auf der
 * Platte landen, wenn der Benutzer dem Projekt nicht zugeordnet ist.
 */
const ensureReportAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      select: { projectId: true },
    });

    if (!report) {
      return res.status(404).json({ error: 'Bericht nicht gefunden' });
    }

    if (!(await hasProjectAccess(req.user!, report.projectId))) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Sie sind diesem Projekt nicht zugeordnet',
      });
    }

    next();
  } catch (error) {
    console.error('Error checking report access:', error);
    res.status(500).json({ error: 'Zugriffsprüfung fehlgeschlagen' });
  }
};

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(PHOTOS_DIR, req.params.id);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) {
      return cb(new Error('Nur Bilddateien erlaubt'));
    }
    cb(null, true);
  },
});

/**
 * Import-Archive landen auf der Platte, nicht im Speicher: ein Export mit
 * mehreren hundert Originalfotos ist schnell ueber ein Gigabyte gross.
 * Der Controller raeumt die Datei nach dem Import wieder weg.
 */
// Bewusst NICHT unterhalb von uploads/: das Verzeichnis wird in index.ts per
// express.static ohne Authentifizierung ausgeliefert, und ein Importarchiv
// enthaelt saemtliche Fotos der Berichte.
const IMPORT_TMP_DIR = path.join(os.tmpdir(), 'cflux-report-imports');
const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024 * 1024;

const archiveUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(IMPORT_TMP_DIR, { recursive: true });
      cb(null, IMPORT_TMP_DIR);
    },
    filename: (_req, _file, cb) => cb(null, `${uuidv4()}.zip`),
  }),
  limits: { fileSize: MAX_ARCHIVE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!/zip/i.test(file.mimetype) && !/\.zip$/i.test(file.originalname)) {
      return cb(new Error('Es werden nur ZIP-Archive akzeptiert'));
    }
    cb(null, true);
  },
});

/**
 * Multer meldet Ueberschreitungen sonst an den globalen Fehler-Handler, der
 * pauschal "Internal server error" zurueckgibt — damit steht der Benutzer vor
 * einer Meldung, aus der sich nichts ableiten laesst.
 */
const handleUploadError = (
  err: any,
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `Das Archiv ist grösser als ${Math.round(MAX_ARCHIVE_BYTES / 1024 / 1024)} MB.`,
      });
    }
    return res.status(400).json({ error: `Upload fehlgeschlagen: ${err.message}` });
  }

  return res.status(400).json({ error: err.message || 'Upload fehlgeschlagen' });
};

router.use(authenticate);

// Projekte, denen der Benutzer zugeordnet ist (Auswahl beim Anlegen)
router.get('/projects', requireModuleAccess(MODULE_KEY, 'canView'), berichtController.getMyReportProjects);

// Import eines Wochenbericht-Datenexports (ZIP mit JSON + Fotos).
// requireProjectAccess laeuft nach Multer, weil die projectId im Multipart-Body steckt.
router.post(
  '/import',
  requireModuleAccess(MODULE_KEY, 'canCreate'),
  archiveUpload.single('archive'),
  handleUploadError,
  requireProjectAccess('body'),
  berichtController.importArchive
);

// --- Ordner (Gesamt-Wochenbericht) ---
// Vor /:id, sonst schluckt die Einzelbericht-Route den Pfad "folders".
router.get('/folders', requireModuleAccess(MODULE_KEY, 'canView'), berichtController.getFolders);
router.post(
  '/folders',
  requireModuleAccess(MODULE_KEY, 'canCreate'),
  requireProjectAccess('body'),
  berichtController.createFolder
);
router.get(
  '/folders/:id/export.html',
  requireModuleAccess(MODULE_KEY, 'canView'),
  berichtController.exportFolderHtml
);
router.get(
  '/folders/:id/export.pdf',
  requireModuleAccess(MODULE_KEY, 'canView'),
  berichtController.exportFolderPdf
);
router.put('/folders/:id', requireModuleAccess(MODULE_KEY, 'canEdit'), berichtController.renameFolder);
router.delete(
  '/folders/:id',
  requireModuleAccess(MODULE_KEY, 'canDelete'),
  berichtController.deleteFolder
);

// Liste (optional gefiltert per ?projectId=)
router.get('/', requireModuleAccess(MODULE_KEY, 'canView'), berichtController.getReports);

// Anlegen — Projektzuordnung wird gegen den Body geprueft
router.post(
  '/',
  requireModuleAccess(MODULE_KEY, 'canCreate'),
  requireProjectAccess('body'),
  berichtController.createReport
);

// Export (vor /:id, damit die Pfade nicht kollidieren)
router.get('/:id/export.html', requireModuleAccess(MODULE_KEY, 'canView'), berichtController.exportHtml);
router.get('/:id/export.pdf', requireModuleAccess(MODULE_KEY, 'canView'), berichtController.exportPdf);

// Fotos
router.post(
  '/:id/photos',
  requireModuleAccess(MODULE_KEY, 'canEdit'),
  ensureReportAccess,
  photoUpload.array('photos', 100),
  berichtController.uploadPhotos
);
router.get('/:id/photos/:photoId', requireModuleAccess(MODULE_KEY, 'canView'), berichtController.getPhoto);
router.delete(
  '/:id/photos/:photoId',
  requireModuleAccess(MODULE_KEY, 'canEdit'),
  berichtController.deletePhoto
);

// Einzelbericht
router.get('/:id', requireModuleAccess(MODULE_KEY, 'canView'), berichtController.getReportById);
router.put('/:id', requireModuleAccess(MODULE_KEY, 'canEdit'), berichtController.updateReport);
router.delete('/:id', requireModuleAccess(MODULE_KEY, 'canDelete'), berichtController.deleteReport);

export default router;
