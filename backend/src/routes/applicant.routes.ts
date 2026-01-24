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

// ==================== APPLICANTS (HR Access) ====================

// Get all applicants
router.get(
  '/applicants',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.getAllApplicants
);

// Get single applicant
router.get(
  '/applicants/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.getApplicantById
);

// Update applicant status
router.patch(
  '/applicants/:id/status',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  applicantController.updateApplicantStatus
);

// ==================== DOCUMENTS ====================

// Upload document (public for applicants, authenticated for HR)
router.post(
  '/applicants/:id/documents',
  upload.single('file'),
  applicantController.uploadDocument
);

// Get applicant documents
router.get(
  '/applicants/:id/documents',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.getApplicantDocuments
);

// Delete document
router.delete(
  '/documents/:documentId',
  authenticate,
  requireModuleAccess('onboarding', 'canDelete'),
  applicantController.deleteDocument
);

// Check required documents
router.get(
  '/applicants/:id/documents/check',
  applicantController.checkRequiredDocuments
);

// ==================== INTERVIEWS ====================

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
