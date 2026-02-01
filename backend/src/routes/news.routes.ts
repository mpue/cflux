import { Router } from 'express';
import newsController from '../controllers/news.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ===== PUBLIC ROUTES (authenticated) =====

// Get dashboard news for current user
router.get('/dashboard', authenticate, newsController.getDashboardNews);

// Mark news item as read
router.post('/:id/read', authenticate, newsController.markAsRead);

// ===== ADMIN ROUTES =====

// News Sources
router.get('/sources', authenticate, requireAdmin, newsController.getAllSources);
router.get('/sources/:id', authenticate, requireAdmin, newsController.getSourceById);
router.post('/sources', authenticate, requireAdmin, newsController.createSource);
router.put('/sources/:id', authenticate, requireAdmin, newsController.updateSource);
router.delete('/sources/:id', authenticate, requireAdmin, newsController.deleteSource);
router.patch('/sources/:id/toggle-visibility', authenticate, requireAdmin, newsController.toggleSourceVisibility);

// News Items
router.get('/sources/:sourceId/items', authenticate, requireAdmin, newsController.getItemsBySource);
router.get('/items/:id', authenticate, requireAdmin, newsController.getItemById);
router.post('/items', authenticate, requireAdmin, newsController.createItem);
router.put('/items/:id', authenticate, requireAdmin, newsController.updateItem);
router.delete('/items/:id', authenticate, requireAdmin, newsController.deleteItem);
router.patch('/items/:id/toggle-pin', authenticate, requireAdmin, newsController.togglePin);

// RSS Feed Refresh
router.post('/refresh-feeds', authenticate, requireAdmin, newsController.refreshRssFeeds);

export default router;
