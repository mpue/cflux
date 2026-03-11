import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/auth';
import {
  getAllTasks,
  getTask,
  updateTask,
  triggerTask,
  getTaskExecutions,
} from '../controllers/scheduledTask.controller';

const router = Router();

// All routes require admin authentication
router.get('/', authenticate, requireAdmin, getAllTasks);
router.get('/:id', authenticate, requireAdmin, getTask);
router.put('/:id', authenticate, requireAdmin, updateTask);
router.post('/:id/trigger', authenticate, requireAdmin, triggerTask);
router.get('/:id/executions', authenticate, requireAdmin, getTaskExecutions);

export default router;
