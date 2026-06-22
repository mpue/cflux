import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import checklistController from '../controllers/checklist.controller';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';

const router = Router();

// File upload configuration for checklist item attachments
const attachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'checklist-item-attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB pro Datei
});

// All routes require authentication and checklist module access
router.use(authenticate);

// ==================== Templates ====================

// Create template (requires create permission)
router.post(
  '/templates',
  requireModuleAccess('checklists', 'canCreate'),
  checklistController.createTemplate
);

// Get all templates (requires view permission)
router.get(
  '/templates',
  requireModuleAccess('checklists', 'canView'),
  checklistController.getTemplates
);

// Get template by ID (requires view permission)
router.get(
  '/templates/:id',
  requireModuleAccess('checklists', 'canView'),
  checklistController.getTemplateById
);

// Update template (requires edit permission)
router.put(
  '/templates/:id',
  requireModuleAccess('checklists', 'canEdit'),
  checklistController.updateTemplate
);

// Delete template (requires delete permission)
router.delete(
  '/templates/:id',
  requireModuleAccess('checklists', 'canDelete'),
  checklistController.deleteTemplate
);

// ==================== Template Items ====================

// Create template item (requires edit permission on template)
router.post(
  '/templates/items',
  requireModuleAccess('checklists', 'canEdit'),
  checklistController.createTemplateItem
);

// Update template item (requires edit permission)
router.put(
  '/templates/items/:id',
  requireModuleAccess('checklists', 'canEdit'),
  checklistController.updateTemplateItem
);

// Delete template item (requires edit permission)
router.delete(
  '/templates/items/:id',
  requireModuleAccess('checklists', 'canEdit'),
  checklistController.deleteTemplateItem
);

// Reorder template items (requires edit permission)
router.post(
  '/templates/:templateId/reorder',
  requireModuleAccess('checklists', 'canEdit'),
  checklistController.reorderTemplateItems
);

// ==================== Item Attachments ====================

// Upload one or more attachments for a checklist item (requires edit permission)
router.post(
  '/items/:itemId/attachments',
  requireModuleAccess('checklists', 'canEdit'),
  attachmentUpload.array('files', 10),
  checklistController.uploadItemAttachments
);

// List attachments of a checklist item (requires view permission)
router.get(
  '/items/:itemId/attachments',
  requireModuleAccess('checklists', 'canView'),
  checklistController.getItemAttachments
);

// Download an attachment (requires view permission)
router.get(
  '/attachments/:attachmentId/download',
  requireModuleAccess('checklists', 'canView'),
  checklistController.downloadAttachment
);

// Delete an attachment (requires edit permission)
router.delete(
  '/attachments/:attachmentId',
  requireModuleAccess('checklists', 'canEdit'),
  checklistController.deleteAttachment
);

// ==================== Instances ====================

// Create instance (requires create permission)
router.post(
  '/instances',
  requireModuleAccess('checklists', 'canCreate'),
  checklistController.createInstance
);

// Get all instances (requires view permission)
router.get(
  '/instances',
  requireModuleAccess('checklists', 'canView'),
  checklistController.getInstances
);

// Get my instances (user's own checklists)
router.get(
  '/instances/my',
  requireModuleAccess('checklists', 'canView'),
  checklistController.getMyInstances
);

// Get assigned instances (checklists assigned to me to supervise)
router.get(
  '/instances/assigned',
  requireModuleAccess('checklists', 'canView'),
  checklistController.getAssignedInstances
);

// Get instance by ID (requires view permission)
router.get(
  '/instances/:id',
  requireModuleAccess('checklists', 'canView'),
  checklistController.getInstanceById
);

// Update instance (requires edit permission)
router.put(
  '/instances/:id',
  requireModuleAccess('checklists', 'canEdit'),
  checklistController.updateInstance
);

// Delete instance (requires delete permission)
router.delete(
  '/instances/:id',
  requireModuleAccess('checklists', 'canDelete'),
  checklistController.deleteInstance
);

// ==================== Item Completion ====================

// Complete/update item (requires edit permission or own instance)
router.post(
  '/items/complete',
  requireModuleAccess('checklists', 'canView'), // Any user can complete their own items
  checklistController.completeItem
);

// ==================== Statistics ====================

// Get statistics (requires view permission)
router.get(
  '/statistics',
  requireModuleAccess('checklists', 'canView'),
  checklistController.getStatistics
);

export default router;
