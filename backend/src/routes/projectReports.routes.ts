import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import * as projectReportsController from '../controllers/projectReports.controller';

const router = Router();

// Alle Routes erfordern Authentifizierung und Projekt-Reports Modul Zugriff
router.use(authenticate);
router.use(requireModuleAccess('project_reports', 'canView'));

/**
 * GET /api/project-reports/overview
 * Projekt-Übersicht Report mit Budget und Zeit-Statistiken
 */
router.get('/overview', projectReportsController.getProjectOverview);

/**
 * GET /api/project-reports/time-tracking
 * Detaillierter Zeiterfassung Report für ein Projekt
 */
router.get('/time-tracking', projectReportsController.getTimeTrackingReport);

export default router;
