import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getAllTemplates,
  getTemplateById,
  getDefaultTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from '../controllers/invoiceTemplate.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all templates (accessible by all authenticated users)
router.get('/', getAllTemplates);

// Get default template (accessible by all authenticated users)
router.get('/default', getDefaultTemplate);

// Get template by ID (accessible by all authenticated users)
router.get('/:id', getTemplateById);

// Admin-only routes
router.post('/', authorize(UserRole.ADMIN), createTemplate);
router.put('/:id', authorize(UserRole.ADMIN), updateTemplate);
router.put('/:id/set-default', authorize(UserRole.ADMIN), setDefaultTemplate);
router.delete('/:id', authorize(UserRole.ADMIN), deleteTemplate);

export default router;
