import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as absenceController from '../controllers/absence.controller';

const router = Router();

router.use(authenticate);

// User absence requests
router.post('/', absenceController.createAbsenceRequest);
router.get('/my-requests', absenceController.getMyAbsenceRequests);

// Admin absence management
router.get('/', authorize('ADMIN'), absenceController.getAllAbsenceRequests);
router.put('/:id/approve', authorize('ADMIN'), absenceController.approveAbsenceRequest);
router.put('/:id/reject', authorize('ADMIN'), absenceController.rejectAbsenceRequest);
router.delete('/:id', authorize('ADMIN'), absenceController.deleteAbsenceRequest);

export default router;
