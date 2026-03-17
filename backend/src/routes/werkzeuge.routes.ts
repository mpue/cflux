import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllTools,
  getToolById,
  getToolsByUser,
  createTool,
  updateTool,
  deleteTool,
  assignTool,
  returnTool
} from '../controllers/werkzeuge.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all tools (Admin only)
router.get('/', authorize('ADMIN'), getAllTools);

// Get tool by ID (Admin only)
router.get('/:id', authorize('ADMIN'), getToolById);

// Get tools by user
router.get('/user/:userId', getToolsByUser);

// Create tool (Admin only)
router.post('/', authorize('ADMIN'), createTool);

// Update tool (Admin only)
router.put('/:id', authorize('ADMIN'), updateTool);

// Delete tool (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteTool);

// Assign tool to user (Admin only)
router.post('/:id/assign', authorize('ADMIN'), assignTool);

// Return tool (unassign) (Admin only)
router.post('/:id/return', authorize('ADMIN'), returnTool);

export default router;
