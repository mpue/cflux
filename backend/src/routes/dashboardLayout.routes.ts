import express from 'express';
import { dashboardLayoutController } from '../controllers/dashboardLayout.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get my dashboard layout
router.get('/my-layout', dashboardLayoutController.getMyLayout);

// Save my dashboard layout
router.put('/my-layout', dashboardLayoutController.saveMyLayout);

// Reset my dashboard layout to default
router.delete('/my-layout', dashboardLayoutController.resetMyLayout);

export default router;
