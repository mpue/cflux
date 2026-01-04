import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/media');

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// All routes require authentication
router.use(authenticate);

// Get all media files (with optional filters)
router.get('/', mediaController.getAllMedia);

// Get statistics
router.get('/statistics', mediaController.getStatistics);

// Get media by ID
router.get('/:id', mediaController.getMediaById);

// Upload new media file
router.post('/', upload.single('file'), mediaController.uploadMedia);

// Update media metadata
router.put('/:id', mediaController.updateMedia);

// Delete media
router.delete('/:id', mediaController.deleteMedia);

// Download media file
router.get('/:id/download', mediaController.downloadMedia);

// Get media by tags
router.get('/tags/:tag', mediaController.getMediaByTag);

export default router;
