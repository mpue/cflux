import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.use(authenticate);

// User reports
router.get('/my-summary', reportController.getMySummary);
router.get('/my-pdf', reportController.generateMyPDFReport);

// Admin reports
router.get('/user-summary/:userId', authorize('ADMIN'), reportController.getUserSummary);
router.get('/user-pdf/:userId', authorize('ADMIN'), reportController.generateUserPDFReport);
router.get('/all-users-summary', authorize('ADMIN'), reportController.getAllUsersSummary);
router.get('/project-summary/:projectId', authorize('ADMIN'), reportController.getProjectSummary);

// Advanced analytics
router.get('/absence-analytics', authorize('ADMIN'), reportController.getAbsenceAnalytics);
router.get('/attendance-by-month', authorize('ADMIN'), reportController.getAttendanceByMonth);
router.get('/overtime-report', authorize('ADMIN'), reportController.getOvertimeReport);
router.get('/project-time-by-user', authorize('ADMIN'), reportController.getProjectTimeByUser);

// Detailed time bookings reports
router.get('/time-bookings', authorize('ADMIN'), reportController.getDetailedTimeBookings);
router.get('/user-time-bookings/:userId', authorize('ADMIN'), reportController.getUserTimeBookingsReport);
router.get('/time-bookings-pdf', authorize('ADMIN'), reportController.generateTimeBookingsPDFReport);
router.get('/user-time-bookings-pdf/:userId', authorize('ADMIN'), reportController.generateUserTimeBookingsPDFReport);

export default router;
