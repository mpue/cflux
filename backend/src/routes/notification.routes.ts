import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller';

const router = Router();

// Get all notifications
router.get('/', authenticate, getNotifications);

// Get unread count
router.get('/unread-count', authenticate, getUnreadCount);

// Mark all as read
router.patch('/read-all', authenticate, markAllAsRead);

// Mark single as read
router.patch('/:id/read', authenticate, markAsRead);

export default router;
