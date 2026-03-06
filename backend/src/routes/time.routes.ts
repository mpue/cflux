import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as timeController from '../controllers/time.controller';

const router = Router();

router.use(authenticate);

// User time entries
router.post('/clock-in', timeController.clockIn);
router.post('/clock-out', timeController.clockOut);
router.post('/start-pause', timeController.startPause);
router.post('/end-pause', timeController.endPause);
router.get('/my-entries', timeController.getMyTimeEntries);
router.get('/current', timeController.getCurrentTimeEntry);
router.get('/logged-in-users', timeController.getLoggedInUsers);
router.put('/my-entries/:id', timeController.updateMyTimeEntry);
router.delete('/my-entries/:id', timeController.deleteMyTimeEntry);
router.post('/my-manual-entry', timeController.createMyManualEntry);

// Admin time corrections
router.post('/manual-entry', authorize('ADMIN'), timeController.createTimeEntry);
router.put('/:id', authorize('ADMIN'), timeController.updateTimeEntry);
router.delete('/:id', authorize('ADMIN'), timeController.deleteTimeEntry);
router.get('/user/:userId', authorize('ADMIN'), timeController.getUserTimeEntries);
router.get('/user/:userId/soll-ist', authorize('ADMIN'), timeController.getSollIstComparison);
router.put('/:id/allocations', authorize('ADMIN'), timeController.updateTimeAllocations);

export default router;
