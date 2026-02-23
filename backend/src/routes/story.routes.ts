import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as storyController from '../controllers/story.controller';

const router = Router();

router.use(authenticate);

// Get stories by project (any authenticated user)
router.get('/project/:projectId', storyController.getStoriesByProject);

// Get single story
router.get('/:id', storyController.getStory);

// Create story (admin only)
router.post('/', authorize('ADMIN'), storyController.createStory);

// Update story (admin only)
router.put('/:id', authorize('ADMIN'), storyController.updateStory);

// Delete story (admin only)
router.delete('/:id', authorize('ADMIN'), storyController.deleteStory);

export default router;
