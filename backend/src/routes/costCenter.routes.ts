import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as costCenterController from '../controllers/costCenter.controller';

const router = Router();

router.use(authenticate);

// All routes require authentication
router.get('/', costCenterController.getAllCostCenters);
router.get('/:id', costCenterController.getCostCenterById);
router.get('/:id/stats', costCenterController.getCostCenterStats);

// Admin only routes
router.post('/', authorize('ADMIN'), costCenterController.createCostCenter);
router.put('/:id', authorize('ADMIN'), costCenterController.updateCostCenter);
router.delete('/:id', authorize('ADMIN'), costCenterController.deleteCostCenter);

export default router;
