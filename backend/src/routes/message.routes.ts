import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMessages,
  getMessage,
  sendMessage,
  moveMessage,
  deleteMessage,
  toggleReadStatus,
  getUnreadCount,
  getMessageRecipients
} from '../controllers/message.controller';

const router = Router();

// Get all messages for a folder (inbox, sent, trash)
router.get('/', authenticate, getMessages);

// Get unread message count
router.get('/unread-count', authenticate, getUnreadCount);

// Get possible recipients
router.get('/recipients', authenticate, getMessageRecipients);

// Get single message
router.get('/:id', authenticate, getMessage);

// Send new message
router.post('/', authenticate, sendMessage);

// Move message to folder (inbox, sent, trash)
router.patch('/:id/move', authenticate, moveMessage);

// Toggle read/unread status
router.patch('/:id/read', authenticate, toggleReadStatus);

// Delete message permanently (from trash)
router.delete('/:id', authenticate, deleteMessage);

export default router;
