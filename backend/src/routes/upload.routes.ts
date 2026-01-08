import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { upload, uploadLogo, deleteUpload } from '../controllers/upload.controller';

const router = Router();

// General file upload - requires authentication only
router.post('/', authenticate, upload.single('file'), uploadLogo);

// All routes below require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Upload logo
router.post('/logo', upload.single('logo'), uploadLogo);

// Delete upload
router.delete('/:filename', deleteUpload);

export default router;
