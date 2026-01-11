import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as documentNodeAttachmentController from '../controllers/documentNodeAttachment.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Multer configuration for file uploads
const uploadDir = path.join(__dirname, '../../uploads/attachments');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// All routes require authentication
router.use(authenticate);

// Get attachments for a document node
router.get('/:nodeId/attachments', documentNodeAttachmentController.getNodeAttachments);

// Upload new attachment (with multer middleware)
router.post('/:nodeId/attachments', upload.single('file'), documentNodeAttachmentController.uploadAttachment);

// Get specific attachment versions
router.get('/attachments/:attachmentId/versions', documentNodeAttachmentController.getAttachmentVersions);

// Download attachment file
router.get('/attachments/:attachmentId/download', documentNodeAttachmentController.downloadAttachment);

// Download specific version
router.get('/attachments/:attachmentId/versions/:versionId/download', documentNodeAttachmentController.downloadAttachmentVersion);

// Update attachment metadata
router.patch('/attachments/:attachmentId', documentNodeAttachmentController.updateAttachmentMetadata);

// Delete attachment
router.delete('/attachments/:attachmentId', documentNodeAttachmentController.deleteAttachment);

export default router;
