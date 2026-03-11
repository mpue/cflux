import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getRooms,
  getOrCreateDirect,
  createGroup,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../controllers/chat.controller';

const router = Router();

// Get all chat rooms for the current user
router.get('/rooms', authenticate, getRooms);

// Get unread chat message count
router.get('/unread-count', authenticate, getUnreadCount);

// Create or get direct chat room
router.post('/rooms/direct', authenticate, getOrCreateDirect);

// Create group chat room
router.post('/rooms/group', authenticate, createGroup);

// Get messages for a room
router.get('/rooms/:roomId/messages', authenticate, getMessages);

// Send message to a room
router.post('/rooms/:roomId/messages', authenticate, sendMessage);

// Mark room as read
router.post('/rooms/:roomId/read', authenticate, markAsRead);

export default router;
