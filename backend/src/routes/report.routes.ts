import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.use(authenticate);

// User reports
router.get('/my-summary', reportController.getMySummary);

// Admin reports
router.get('/user-summary/:userId', authorize('ADMIN'), reportController.getUserSummary);
router.get('/all-users-summary', authorize('ADMIN'), reportController.getAllUsersSummary);
router.get('/project-summary/:projectId', authorize('ADMIN'), reportController.getProjectSummary);

export default router;
