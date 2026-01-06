import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import * as documentNodeController from '../controllers/documentNode.controller';
import * as documentImportController from '../controllers/documentImport.controller';
import * as documentNodeAttachmentController from '../controllers/documentNodeAttachment.controller';
import * as documentNodeSearchController from '../controllers/documentNodeSearch.controller';

const router = Router();

// Configure multer for memory storage (ZIP imports)
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

// Configure multer for attachment uploads
const attachmentDir = path.join(__dirname, '../../uploads/attachments');
if (!fs.existsSync(attachmentDir)) {
  fs.mkdirSync(attachmentDir, { recursive: true });
}

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  }
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for attachments
  }
});

router.use(authenticate);

// Search routes (must be before :id routes)
router.get('/search', documentNodeSearchController.searchIntranet);
router.get('/search/suggestions', documentNodeSearchController.getSearchSuggestions);

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

// Group permissions
router.get('/:id/permissions', documentNodeController.getGroupPermissions);
router.put('/:id/permissions', documentNodeController.setGroupPermissions);

// Attachment routes
router.get('/:nodeId/attachments', documentNodeAttachmentController.getNodeAttachments);
router.post('/:nodeId/attachments', attachmentUpload.single('file'), documentNodeAttachmentController.uploadAttachment);
router.put('/attachments/:attachmentId', attachmentUpload.single('file'), documentNodeAttachmentController.updateAttachment);
router.patch('/attachments/:attachmentId/metadata', documentNodeAttachmentController.updateAttachmentMetadata);
router.delete('/attachments/:attachmentId', documentNodeAttachmentController.deleteAttachment);
router.get('/attachments/:attachmentId/download', documentNodeAttachmentController.downloadAttachment);
router.get('/attachments/:attachmentId/versions', documentNodeAttachmentController.getAttachmentVersions);
router.get('/attachments/versions/:versionId/download', documentNodeAttachmentController.downloadAttachmentVersion);

export default router;
