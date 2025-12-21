import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber,
} from '../controllers/invoice.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all invoices (accessible by all authenticated users)
router.get('/', getAllInvoices);

// Get next invoice number (accessible by all authenticated users)
router.get('/next-number', getNextInvoiceNumber);

// Get invoice by ID (accessible by all authenticated users)
router.get('/:id', getInvoiceById);

// Create, update, delete - only for admins
router.post('/', authorize(UserRole.ADMIN), createInvoice);
router.put('/:id', authorize(UserRole.ADMIN), updateInvoice);
router.delete('/:id', authorize(UserRole.ADMIN), deleteInvoice);

export default router;
