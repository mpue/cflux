import { Router } from 'express';
import {
  getAllReminders,
  getReminderById,
  getRemindersByInvoice,
  createReminder,
  updateReminder,
  deleteReminder,
  sendReminder,
  markReminderAsPaid,
  getOverdueInvoices,
  getReminderSettings,
  updateReminderSettings,
  getReminderStats
} from '../controllers/reminder.controller';
import { generateReminderPdf } from '../controllers/reminderPdf.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticate);

// Mahnungen
router.get('/', getAllReminders);
router.get('/stats', getReminderStats);
router.get('/overdue-invoices', getOverdueInvoices);
router.get('/:id', getReminderById);
router.get('/:id/pdf', generateReminderPdf);
router.get('/invoice/:invoiceId', getRemindersByInvoice);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);
router.post('/:id/send', sendReminder);
router.post('/:id/mark-paid', markReminderAsPaid);

// Einstellungen
router.get('/settings/current', getReminderSettings);
router.put('/settings/:id', updateReminderSettings);

export default router;
