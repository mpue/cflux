import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllTravelExpenses,
  getTravelExpenseById,
  createTravelExpense,
  updateTravelExpense,
  deleteTravelExpense,
  approveTravelExpense,
  rejectTravelExpense
} from '../controllers/travelExpense.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all travel expenses (Admin sees all, User sees own)
router.get('/', getAllTravelExpenses);

// Get travel expense by ID
router.get('/:id', getTravelExpenseById);

// Create travel expense
router.post('/', createTravelExpense);

// Update travel expense
router.put('/:id', updateTravelExpense);

// Delete travel expense
router.delete('/:id', deleteTravelExpense);

// Approve travel expense (Admin only)
router.post('/:id/approve', authorize('ADMIN'), approveTravelExpense);

// Reject travel expense (Admin only)
router.post('/:id/reject', authorize('ADMIN'), rejectTravelExpense);

export default router;
