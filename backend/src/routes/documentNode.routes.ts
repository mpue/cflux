import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import * as documentNodeController from '../controllers/documentNode.controller';
import * as documentImportController from '../controllers/documentImport.controller';

const router = Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Nur ZIP-Dateien sind erlaubt'));
    }
  },
});

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

// Import route
router.post('/import/zip', upload.single('file'), documentImportController.importZip);

// Version history
router.get('/:id/versions', documentNodeController.getVersionHistory);
router.get('/:id/versions/:versionId', documentNodeController.getVersionContent);
router.post('/:id/restore/:versionId', documentNodeController.restoreVersion);

export default router;
