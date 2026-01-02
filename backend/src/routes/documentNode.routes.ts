import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as documentNodeController from '../controllers/documentNode.controller';

const router = Router();

router.use(authenticate);

// Public routes (all authenticated users can read)
router.get('/tree', documentNodeController.getDocumentTree);
router.get('/:id', documentNodeController.getDocumentNodeById);
router.get('/:id/content', documentNodeController.getDocumentContent);
router.get('/:id/breadcrumb', documentNodeController.getBreadcrumb);

// Write routes (require INTRANET_WRITE permission)
router.post('/', documentNodeController.createDocumentNode);
router.put('/:id', documentNodeController.updateDocumentNode);
router.delete('/:id', documentNodeController.deleteDocumentNode);
router.post('/:id/move', documentNodeController.moveDocumentNode);

// Version history
router.get('/:id/versions', documentNodeController.getVersionHistory);
router.get('/:id/versions/:versionId', documentNodeController.getVersionContent);
router.post('/:id/restore/:versionId', documentNodeController.restoreVersion);

export default router;
