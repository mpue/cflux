import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import * as applicantController from '../controllers/applicant.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'applicant-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|docx|doc|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Nur PDF, DOCX, JPG und PNG Dateien sind erlaubt'));
    }
  }
});

// ==================== APPLICANTS (Public routes for applicant self-service) ====================

// Register as new applicant (public)
router.post('/register', applicantController.registerApplicant);

// Verify email (public)
router.get('/verify/:token', applicantController.verifyEmail);

// Login for applicants (public - simplified auth)
router.post('/login', applicantController.loginApplicant);

// Get single applicant by ID (public - for applicant portal)
router.get('/:id', applicantController.getApplicantById);

// Manual email verification (admin only)
router.post(
  '/:id/verify-manual',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  applicantController.verifyEmailManual
);

// Upload document (public for applicants self-service)
router.post(
  '/:id/documents',
  upload.single('file'),
  applicantController.uploadDocument
);

// Delete document (public for applicants self-service)
router.delete(
  '/:applicantId/documents/:documentId',
  applicantController.deleteApplicantDocument
);

// Download document (HR only)
router.get(
  '/admin/documents/:documentId/download',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.downloadDocument
);

// Get applicant documents (HR only)
router.get(
  '/applicants/:id/documents',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.getApplicantDocuments
);

// ==================== APPLICANTS (HR Access) ====================

// Get all applicants (HR only)
router.get(
  '/admin/applicants',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.getAllApplicants
);

// Update applicant status
router.patch(
  '/applicants/:id/status',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  applicantController.updateApplicantStatus
);

// ==================== INTERVIEWS (HR Access) ====================

// Schedule interview
router.post(
  '/interviews',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  applicantController.scheduleInterview
);

// Get applicant interviews
router.get(
  '/applicants/:id/interviews',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.getApplicantInterviews
);

// Update interview (notes, rating, etc.)
router.patch(
  '/interviews/:interviewId',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  applicantController.updateInterview
);

// ==================== NOTES ====================

// Add note to applicant
router.post(
  '/applicants/:id/notes',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  applicantController.addNote
);

// Get applicant notes
router.get(
  '/applicants/:id/notes',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.getApplicantNotes
);

// Delete note
router.delete(
  '/notes/:noteId',
  authenticate,
  requireModuleAccess('onboarding', 'canDelete'),
  applicantController.deleteNote
);

export default router;
