import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import * as onboardingController from '../controllers/onboarding.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// File upload configuration
const storage = multer.diskStorage({
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

// ==================== EMPLOYEES ====================

// Hire applicant (create employee record)
router.post(
  '/hire',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  onboardingController.hireApplicant
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
  upload.single('file'),
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

// Get onboarding dashboard (all employees)
router.get(
  '/dashboard',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  onboardingController.getOnboardingDashboard
);

export default router;
