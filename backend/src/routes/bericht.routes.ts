import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
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

router.use(authenticate);

// Projekte, denen der Benutzer zugeordnet ist (Auswahl beim Anlegen)
router.get('/projects', requireModuleAccess(MODULE_KEY, 'canView'), berichtController.getMyReportProjects);

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
