import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { upload, uploadLogo, deleteUpload } from '../controllers/upload.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Upload logo
router.post('/logo', upload.single('logo'), uploadLogo);

// Delete upload
router.delete('/:filename', deleteUpload);

export default router;
