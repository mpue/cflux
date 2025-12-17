import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  uploadBackup,
  exportData
} from '../controllers/backup.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'application/sql' || 
        file.originalname.endsWith('.json') || 
        file.originalname.endsWith('.sql')) {
      cb(null, true);
    } else {
      cb(new Error('Only .sql and .json files are allowed'));
    }
  }
});

// All backup routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Create a new backup
router.post('/create', createBackup);

// List all backups
router.get('/list', listBackups);

// Download a specific backup
router.get('/download/:filename', downloadBackup);

// Delete a specific backup
router.delete('/:filename', deleteBackup);

// Restore a backup
router.post('/restore/:filename', restoreBackup);

// Upload a backup file
router.post('/upload', upload.single('backup'), uploadBackup);

// Export data as JSON
router.get('/export', exportData);

export default router;
