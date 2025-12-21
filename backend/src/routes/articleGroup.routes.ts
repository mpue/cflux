import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as articleGroupController from '../controllers/articleGroup.controller';

const router = Router();

router.use(authenticate);

router.get('/', articleGroupController.getAllArticleGroups);
router.get('/:id', articleGroupController.getArticleGroupById);

router.post('/', authorize('ADMIN'), articleGroupController.createArticleGroup);
router.put('/:id', authorize('ADMIN'), articleGroupController.updateArticleGroup);
router.delete('/:id', authorize('ADMIN'), articleGroupController.deleteArticleGroup);

export default router;
