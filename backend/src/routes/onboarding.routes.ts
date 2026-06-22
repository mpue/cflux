import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import * as onboardingController from '../controllers/onboarding.controller';
import * as applicantController from '../controllers/applicant.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// File upload configuration for employee documents
const employeeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'employee-documents');
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

const employeeUpload = multer({
  storage: employeeStorage,
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

// File upload configuration for applicant documents
const applicantStorage = multer.diskStorage({
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

const applicantUpload = multer({
  storage: applicantStorage,
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

// Public: Get active jobs for job board (no auth required)
router.get('/jobs/public', onboardingController.getPublicJobs);

// Public: Get single job detail (no auth required)
router.get('/jobs/public/:jobId', onboardingController.getPublicJobById);

// Register as new applicant (public)
router.post('/applicants/register', applicantController.registerApplicant);

// Verify email (public)
router.get('/applicants/verify/:token', applicantController.verifyEmail);

// Login for applicants (public - simplified auth)
router.post('/applicants/login', applicantController.loginApplicant);

// Get single applicant by ID (public - for applicant portal)
router.get('/applicants/:id', applicantController.getApplicantById);

// Upload document (public for applicants self-service)
router.post(
  '/applicants/:id/documents',
  applicantUpload.single('file'),
  applicantController.uploadDocument
);

// Delete document (public for applicants self-service)
router.delete(
  '/applicants/:applicantId/documents/:documentId',
  applicantController.deleteApplicantDocument
);

// ==================== APPLICANTS (HR Access) ====================

// Get all applicants (HR only)
router.get(
  '/applicants',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  applicantController.getAllApplicants
);

// Manual email verification (admin only)
router.post(
  '/applicants/:id/verify-manual',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  applicantController.verifyEmailManual
);

// Download document (HR only)
router.get(
  '/applicants/documents/:documentId/download',
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

// Update applicant status
router.patch(
  '/applicants/:id/status',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  applicantController.updateApplicantStatus
);

// Reset applicant (Onboarding-Prozess zurücksetzen, Bewerber bleibt erhalten)
router.post(
  '/applicants/:id/reset',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  applicantController.resetApplicant
);

// Delete applicant (optional inkl. verknüpftem Mitarbeiter via ?deleteEmployee=true)
router.delete(
  '/applicants/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canDelete'),
  applicantController.deleteApplicant
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

// ==================== EMPLOYEES ====================

router.get(
  '/jobs',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getOnboardingJobs
);

router.get(
  '/jobs/:jobId',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getOnboardingJobById
);

router.post(
  '/jobs',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  onboardingController.createOnboardingJob
);

router.put(
  '/jobs/:jobId',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  onboardingController.updateOnboardingJob
);

router.delete(
  '/jobs/:jobId',
  authenticate,
  requireModuleAccess('onboarding', 'canDelete'),
  onboardingController.deleteOnboardingJob
);

// ==================== EMPLOYEES ====================

// Hire applicant (create employee record)
router.post(
  '/hire',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  onboardingController.hireApplicant
);

// Start onboarding wizard (employee + tutor + checklists)
router.post(
  '/start',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  onboardingController.startOnboarding
);

// Get all employees
router.get(
  '/employees',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getAllEmployees
);

// Get single employee
router.get(
  '/employees/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getEmployeeById
);

// Update employee
router.put(
  '/employees/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  onboardingController.updateEmployee
);

// ==================== EMPLOYEE DOCUMENTS ====================

// Upload employee document
router.post(
  '/employees/:id/documents',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  employeeUpload.single('file'),
  onboardingController.uploadEmployeeDocument
);

// Get employee documents
router.get(
  '/employees/:id/documents',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getEmployeeDocuments
);

// Update document status (e.g., mark as signed)
router.patch(
  '/documents/:documentId/status',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  onboardingController.updateDocumentStatus
);

// ==================== ONBOARDING TASKS ====================

// Create task
router.post(
  '/tasks',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  onboardingController.createTask
);

// Get employee tasks
router.get(
  '/employees/:id/tasks',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getEmployeeTasks
);

// Update task status
router.patch(
  '/tasks/:taskId/status',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  onboardingController.updateTaskStatus
);

// Assign task to user
router.patch(
  '/tasks/:taskId/assign',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  onboardingController.assignTask
);

// Get overdue tasks
router.get(
  '/tasks/overdue',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getOverdueTasks
);

// ==================== ONBOARDING PROGRESS ====================

// Get onboarding progress for an employee
router.get(
  '/employees/:id/progress',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getOnboardingProgress
);

// Mark employee as onboarded
router.patch(
  '/employees/:id/complete-onboarding',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  onboardingController.markAsOnboarded
);

// Get onboarding dashboard (all employees)
router.get(
  '/dashboard',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getOnboardingDashboard
);

export default router;
