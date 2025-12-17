import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as locationController from '../controllers/location.controller';

const router = Router();

router.use(authenticate);

// Public routes (all authenticated users)
router.get('/active', locationController.getActiveLocations);

// Admin routes
router.get('/', authorize('ADMIN'), locationController.getAllLocations);
router.get('/:id', authorize('ADMIN'), locationController.getLocationById);
router.post('/', authorize('ADMIN'), locationController.createLocation);
router.put('/:id', authorize('ADMIN'), locationController.updateLocation);
router.delete('/:id', authorize('ADMIN'), locationController.deleteLocation);

export default router;
