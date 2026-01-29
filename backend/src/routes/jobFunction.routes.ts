import { Router } from 'express';
import jobFunctionController from '../controllers/jobFunction.controller';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all job functions
router.get(
  '/',
  requireModuleAccess('job_functions', 'canView'),
  jobFunctionController.getAllJobFunctions
);

// Get categories
router.get(
  '/categories',
  requireModuleAccess('job_functions', 'canView'),
  jobFunctionController.getCategories
);

// Get departments
router.get(
  '/departments',
  requireModuleAccess('job_functions', 'canView'),
  jobFunctionController.getDepartments
);

// Get job functions by category
router.get(
  '/category/:category',
  requireModuleAccess('job_functions', 'canView'),
  jobFunctionController.getJobFunctionsByCategory
);

// Get job functions by department
router.get(
  '/department/:department',
  requireModuleAccess('job_functions', 'canView'),
  jobFunctionController.getJobFunctionsByDepartment
);

// Create new job function
router.post(
  '/',
  requireModuleAccess('job_functions', 'canCreate'),
  jobFunctionController.createJobFunction
);

// Assign job function to user
router.post(
  '/assign',
  requireModuleAccess('job_functions', 'canEdit'),
  jobFunctionController.assignJobFunctionToUser
);

// Get job function by ID
router.get(
  '/:id',
  requireModuleAccess('job_functions', 'canView'),
  jobFunctionController.getJobFunctionById
);

// Get documents for job function
router.get(
  '/:id/documents',
  requireModuleAccess('job_functions', 'canView'),
  jobFunctionController.getDocuments
);

// Add document to job function
router.post(
  '/:id/documents',
  requireModuleAccess('job_functions', 'canEdit'),
  jobFunctionController.addDocument
);

// Remove document from job function
router.delete(
  '/:id/documents/:documentId',
  requireModuleAccess('job_functions', 'canEdit'),
  jobFunctionController.removeDocument
);

// Update job function
router.put(
  '/:id',
  requireModuleAccess('job_functions', 'canEdit'),
  jobFunctionController.updateJobFunction
);

// Delete job function
router.delete(
  '/:id',
  requireModuleAccess('job_functions', 'canDelete'),
  jobFunctionController.deleteJobFunction
);

// Remove job function from user
router.delete(
  '/user/:userId',
  requireModuleAccess('job_functions', 'canEdit'),
  jobFunctionController.removeJobFunctionFromUser
);

export default router;
