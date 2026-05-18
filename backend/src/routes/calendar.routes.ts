import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/calendar?from=...&to=...
router.get('/', calendarController.getEvents);

// GET /api/calendar/:id
router.get('/:id', calendarController.getEventById);

// POST /api/calendar
router.post('/', calendarController.createEvent);

// PUT /api/calendar/:id
router.put('/:id', calendarController.updateEvent);

// DELETE /api/calendar/:id
router.delete('/:id', calendarController.deleteEvent);

// POST /api/calendar/:id/respond  { status: "ACCEPTED"|"DECLINED"|"PENDING" }
router.post('/:id/respond', calendarController.respondToInvite);

export default router;
