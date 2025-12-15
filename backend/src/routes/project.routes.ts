import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as projectController from '../controllers/project.controller';

const router = Router();

router.use(authenticate);

router.get('/', projectController.getAllProjects);
router.get('/my-projects', projectController.getMyProjects);

router.post('/', authorize('ADMIN'), projectController.createProject);
router.put('/:id', authorize('ADMIN'), projectController.updateProject);
router.delete('/:id', authorize('ADMIN'), projectController.deleteProject);
router.post('/:id/assign', authorize('ADMIN'), projectController.assignUserToProject);
router.delete('/:id/unassign/:userId', authorize('ADMIN'), projectController.unassignUserFromProject);

export default router;
