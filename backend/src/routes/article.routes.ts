import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as articleController from '../controllers/article.controller';

const router = Router();

router.use(authenticate);

router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.getArticleById);

router.post('/', authorize('ADMIN'), articleController.createArticle);
router.put('/:id', authorize('ADMIN'), articleController.updateArticle);
router.delete('/:id', authorize('ADMIN'), articleController.deleteArticle);

export default router;
