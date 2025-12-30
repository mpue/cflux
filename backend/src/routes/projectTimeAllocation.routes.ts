import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as allocationController from '../controllers/projectTimeAllocation.controller';

const router = Router();

router.use(authenticate);

// Get allocations for a time entry
router.get('/time-entry/:timeEntryId', allocationController.getAllocationsForTimeEntry);

// Set allocations for a time entry (creates or updates all allocations)
router.post('/time-entry/:timeEntryId', allocationController.setAllocationsForTimeEntry);

// Delete a specific allocation
router.delete('/:allocationId', allocationController.deleteAllocation);

// Get project time statistics (admin or filtered by user)
router.get('/stats', allocationController.getProjectTimeStats);

export default router;
