import express from 'express';
import * as projectBudgetController from '../controllers/projectBudget.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Budget-Routen
router.get('/', authenticate, projectBudgetController.getAllProjectBudgets);
router.get('/:id', authenticate, projectBudgetController.getProjectBudgetById);
router.get('/project/:projectId', authenticate, projectBudgetController.getProjectBudgetByProjectId);
router.post('/', authenticate, projectBudgetController.createProjectBudget);
router.put('/:id', authenticate, projectBudgetController.updateProjectBudget);
router.post('/:id/recalculate', authenticate, projectBudgetController.recalculateBudget);
router.delete('/:id', authenticate, projectBudgetController.deleteProjectBudget);

// Budget-Item-Routen
router.post('/:id/items', authenticate, projectBudgetController.addBudgetItem);
router.put('/items/:itemId', authenticate, projectBudgetController.updateBudgetItem);
router.delete('/items/:itemId', authenticate, projectBudgetController.deleteBudgetItem);

// Zeiteinträge
router.get('/:id/time-entries', authenticate, projectBudgetController.getBudgetTimeEntries);

export default router;
