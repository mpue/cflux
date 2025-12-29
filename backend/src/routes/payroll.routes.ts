import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as payrollController from '../controllers/payroll.controller';

const router = Router();

router.use(authenticate);

// User routes - Mitarbeiter können ihre eigenen Abrechnungen sehen
router.get('/my-entries', payrollController.getMyPayrollEntries);

// Admin routes - Verwaltung von Lohnabrechnungen
router.get('/periods', authorize('ADMIN'), payrollController.getPayrollPeriods);
router.post('/periods', authorize('ADMIN'), payrollController.createPayrollPeriod);
router.get('/periods/:id', authorize('ADMIN'), payrollController.getPayrollPeriod);
router.put('/periods/:id', authorize('ADMIN'), payrollController.updatePayrollPeriod);
router.delete('/periods/:id', authorize('ADMIN'), payrollController.deletePayrollPeriod);

// Berechnung
router.post('/periods/:id/calculate', authorize('ADMIN'), payrollController.calculatePayrollForPeriod);

// Einzelne Abrechnungseinträge
router.post('/entries', authorize('ADMIN'), payrollController.upsertPayrollEntry);

// Gehaltskonfiguration
router.get('/salary-config/:userId', authorize('ADMIN'), payrollController.getSalaryConfiguration);
router.post('/salary-config', authorize('ADMIN'), payrollController.upsertSalaryConfiguration);

export default router;
