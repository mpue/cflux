import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import * as projectTaskController from '../controllers/projectTask.controller';

const router = Router();

// All routes require authentication and project access
router.use(authenticate);

// Get all tasks for a project
router.get(
  '/project/:projectId',
  requireModuleAccess('projects', 'canView'),
  projectTaskController.getTasksByProject
);

// Get single task
router.get(
  '/:id',
  requireModuleAccess('projects', 'canView'),
  projectTaskController.getTaskById
);

// Create new task
router.post(
  '/',
  requireModuleAccess('projects', 'canCreate'),
  projectTaskController.createTask
);

// Update task
router.put(
  '/:id',
  requireModuleAccess('projects', 'canEdit'),
  projectTaskController.updateTask
);

// Delete task
router.delete(
  '/:id',
  requireModuleAccess('projects', 'canDelete'),
  projectTaskController.deleteTask
);

// Get task dependencies
router.get(
  '/:id/dependencies',
  requireModuleAccess('projects', 'canView'),
  projectTaskController.getTaskDependencies
);

// Get tasks that depend on this task
router.get(
  '/:id/dependents',
  requireModuleAccess('projects', 'canView'),
  projectTaskController.getDependentTasks
);

export default router;
