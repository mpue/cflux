import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import * as equipmentTrainingController from '../controllers/equipment-training.controller';

const router = Router();

// ==================== EQUIPMENT CATALOG ====================

// Get all equipment
router.get(
  '/equipment',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.getAllEquipment
);

// Get single equipment
router.get(
  '/equipment/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.getEquipmentById
);

// Create equipment
router.post(
  '/equipment',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  equipmentTrainingController.createEquipment
);

// Update equipment
router.put(
  '/equipment/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  equipmentTrainingController.updateEquipment
);

// ==================== EQUIPMENT ASSIGNMENTS ====================

// Assign equipment to employee
router.post(
  '/equipment/assign',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  equipmentTrainingController.assignEquipment
);

// Get employee equipment
router.get(
  '/equipment/employee/:employeeId',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.getEmployeeEquipment
);

// Return equipment
router.patch(
  '/equipment/assignments/:assignmentId/return',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  equipmentTrainingController.returnEquipment
);

// Generate handover protocol
router.post(
  '/equipment/assignments/:assignmentId/protocol',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.generateHandoverProtocol
);

// ==================== TRAINING CATALOG ====================

// Get all training catalog
router.get(
  '/training/catalog',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.getAllTrainingCatalog
);

// Get single training catalog
router.get(
  '/training/catalog/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.getTrainingCatalogById
);

// Create training catalog
router.post(
  '/training/catalog',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  equipmentTrainingController.createTrainingCatalog
);

// Update training catalog
router.put(
  '/training/catalog/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  equipmentTrainingController.updateTrainingCatalog
);

// ==================== TRAINING SESSIONS ====================

// Create training session
router.post(
  '/training/sessions',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  equipmentTrainingController.createTrainingSession
);

// Get all training sessions
router.get(
  '/training/sessions',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.getAllTrainingSessions
);

// Get single training session
router.get(
  '/training/sessions/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.getTrainingSessionById
);

// Update training session
router.put(
  '/training/sessions/:id',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  equipmentTrainingController.updateTrainingSession
);

// ==================== TRAINING COMPLETIONS ====================

// Assign employee to training
router.post(
  '/training/assign',
  authenticate,
  requireModuleAccess('onboarding', 'canCreate'),
  equipmentTrainingController.assignEmployeeToTraining
);

// Mark training completed
router.patch(
  '/training/completions/:completionId',
  authenticate,
  requireModuleAccess('onboarding', 'canEdit'),
  equipmentTrainingController.markTrainingCompleted
);

// Get employee trainings
router.get(
  '/training/employee/:employeeId',
  authenticate,
  requireModuleAccess('onboarding', 'canView'),
  equipmentTrainingController.getEmployeeTrainings
);

export default router;
