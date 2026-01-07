import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getEHSKPIDashboard, 
  getEHSStatistics, 
  updateMonthlyData,
  calculateMonthlyKPIs,
  generateEHSPDFReport
} from '../controllers/ehs.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/ehs/dashboard - Get KPI dashboard for current/specific month
router.get('/dashboard', getEHSKPIDashboard);

// GET /api/ehs/statistics - Get multi-year statistics
router.get('/statistics', getEHSStatistics);

// GET /api/ehs/pdf-report - Generate PDF report
router.get('/pdf-report', generateEHSPDFReport);

// POST /api/ehs/monthly-data - Update monthly work data (hours, workers, etc.)
router.post('/monthly-data', updateMonthlyData);

// POST /api/ehs/calculate-kpis - Calculate KPIs from incidents
router.post('/calculate-kpis', calculateMonthlyKPIs);

export default router;
