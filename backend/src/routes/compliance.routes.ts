import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getHolidays,
  syncHolidays,
  createHoliday,
  deleteHoliday,
  getCantons,
  getViolations,
  resolveViolation,
  getOvertimeBalance,
  getComplianceSettings,
  updateComplianceSettings,
  getComplianceStats
} from '../controllers/compliance.controller';

const router = Router();

// Feiertage
router.get('/holidays', authenticate, getHolidays);
router.post('/holidays/sync', authenticate, requireAdmin, syncHolidays);
router.post('/holidays', authenticate, requireAdmin, createHoliday);
router.delete('/holidays/:id', authenticate, requireAdmin, deleteHoliday);

// Kantone
router.get('/cantons', authenticate, getCantons);

// Violations
router.get('/violations', authenticate, getViolations);
router.patch('/violations/:id/resolve', authenticate, requireAdmin, resolveViolation);
router.get('/violations/stats', authenticate, requireAdmin, getComplianceStats);

// Überstunden
router.get('/overtime', authenticate, getOvertimeBalance);

// Settings
router.get('/settings', authenticate, requireAdmin, getComplianceSettings);
router.put('/settings', authenticate, requireAdmin, updateComplianceSettings);

export default router;
