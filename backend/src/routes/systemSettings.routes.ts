import express from 'express';
import {
  getSystemSettings,
  getPublicSettings,
  updateSystemSettings,
  testEmailSettings,
  uploadCompanyLogo,
} from '../controllers/systemSettings.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public route (ohne Auth) - für Login-Screen, etc.
router.get('/public', getPublicSettings);

// Admin routes
router.get('/', authenticate, authorize('ADMIN'), getSystemSettings);
router.put('/', authenticate, authorize('ADMIN'), updateSystemSettings);
router.post('/test-email', authenticate, authorize('ADMIN'), testEmailSettings);
router.post('/upload-logo', authenticate, authorize('ADMIN'), uploadCompanyLogo);

export default router;
