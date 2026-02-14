import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as userController from '../controllers/user.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for avatar uploads
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.params.id}-${Date.now()}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder (JPEG, PNG, WebP, GIF) sind erlaubt'));
    }
  }
});

router.use(authenticate);

router.get('/me', userController.getCurrentUser);
router.post('/change-password', userController.changePassword);
router.get('/list', userController.getUsersList); // Basic user list for all authenticated users
router.get('/org-chart', authorize('ADMIN'), userController.getOrgChart);
router.get('/export', authorize('ADMIN'), userController.exportUsers);
router.post('/import', authorize('ADMIN'), userController.importUsers);
router.get('/', authorize('ADMIN'), userController.getAllUsers);
router.get('/:id', authorize('ADMIN'), userController.getUserById);
router.get('/:id/subordinates', authorize('ADMIN'), userController.getSubordinates);
router.post('/:id/avatar', authorize('ADMIN'), avatarUpload.single('avatar'), userController.uploadAvatar);
router.delete('/:id/avatar', authorize('ADMIN'), userController.deleteAvatar);
router.put('/:id', authorize('ADMIN'), userController.updateUser);
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

export default router;
