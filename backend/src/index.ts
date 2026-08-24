import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import userGroupRoutes from './routes/userGroup.routes';
import moduleRoutes from './routes/module.routes';
import timeRoutes from './routes/time.routes';
import projectRoutes from './routes/project.routes';
import projectTaskRoutes from './routes/projectTask.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import articleGroupRoutes from './routes/articleGroup.routes';
import articleRoutes from './routes/article.routes';
import orderRoutes from './routes/order.routes';
import costCenterRoutes from './routes/costCenter.routes';
import inventoryRoutes from './routes/inventory.routes';
import projectBudgetRoutes from './routes/projectBudget.routes';
import invoiceRoutes from './routes/invoice.routes';
import invoiceTemplateRoutes from './routes/invoiceTemplate.routes';
import reminderRoutes from './routes/reminder.routes';
import absenceRoutes from './routes/absence.routes';
import reportRoutes from './routes/report.routes';
import backupRoutes from './routes/backup.routes';
import locationRoutes from './routes/location.routes';
import complianceRoutes from './routes/compliance.routes';
import uploadRoutes from './routes/upload.routes';
import incidentRoutes from './routes/incident.routes';
import ehsRoutes from './routes/ehs.routes';
import ehsTodoRoutes from './routes/ehsTodo.routes';
import workflowRoutes from './routes/workflow.routes';
import systemSettingsRoutes from './routes/systemSettings.routes';
import payrollRoutes from './routes/payroll.routes';
import projectTimeAllocationRoutes from './routes/projectTimeAllocation.routes';
import deviceRoutes from './routes/device.routes';
import contactRoutes from './routes/contact.routes';
import travelExpenseRoutes from './routes/travelExpense.routes';
import messageRoutes from './routes/message.routes';
import documentNodeRoutes from './routes/documentNode.routes';
import documentNodeAttachmentRoutes from './routes/documentNodeAttachment.routes';
import mediaRoutes from './routes/media.routes';
import actionRoutes from './routes/action.routes';
import { actionService } from './services/action.service';
import projectReportsRoutes from './routes/projectReports.routes';
import dashboardLayoutRoutes from './routes/dashboardLayout.routes';
import zeitmodellRoutes from './routes/zeitmodell.routes';
import elearningRoutes from './routes/elearning.routes';
import applicantRoutes from './routes/applicant.routes';
import onboardingRoutes from './routes/onboarding.routes';
import equipmentTrainingRoutes from './routes/equipment-training.routes';
import jobFunctionRoutes from './routes/jobFunction.routes';
import checklistRoutes from './routes/checklist.routes';
import newsRoutes from './routes/news.routes';
import departmentRoutes from './routes/department.routes';
import storyRoutes from './routes/story.routes';
import werkzeugeRoutes from './routes/werkzeuge.routes';
import calendarRoutes from './routes/calendar.routes';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { backupScheduler } from './services/backupScheduler.service';
import { action1Scheduler } from './services/action1Scheduler.service';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Parse CORS origins from environment (comma-separated list)
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS : '+origin));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/course-thumbnails', express.static(path.join(__dirname, '../uploads/course-thumbnails')));
app.use('/uploads/course-content', express.static(path.join(__dirname, '../uploads/course-content')));
app.use('/uploads/course-pdfs', express.static(path.join(__dirname, '../uploads/course-pdfs')));
app.use('/uploads/certificates', express.static(path.join(__dirname, '../uploads/certificates')));
app.use('/uploads/applicant-documents', express.static(path.join(__dirname, '../uploads/applicant-documents')));
app.use('/uploads/employee-documents', express.static(path.join(__dirname, '../uploads/employee-documents')));
app.use('/uploads/handover-protocols', express.static(path.join(__dirname, '../uploads/handover-protocols')));
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-groups', userGroupRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-tasks', projectTaskRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/article-groups', articleGroupRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/cost-centers', costCenterRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/project-budgets', projectBudgetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoice-templates', invoiceTemplateRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/ehs', ehsRoutes);
app.use('/api/ehs-todos', ehsTodoRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/project-time-allocations', projectTimeAllocationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/travel-expenses', travelExpenseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/intranet', documentNodeRoutes);
app.use('/api/document-nodes', documentNodeAttachmentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/project-reports', projectReportsRoutes);
app.use('/api/dashboard-layout', dashboardLayoutRoutes);
app.use('/api/zeitmodelle', zeitmodellRoutes);
app.use('/api/elearning', elearningRoutes);
// Legacy route for backward compatibility
app.use('/api/applicants', applicantRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/equipment-training', equipmentTrainingRoutes);
app.use('/api/job-functions', jobFunctionRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/werkzeuge', werkzeugeRoutes);
app.use('/api/calendar', calendarRoutes);

// Version endpoint
app.get('/api/version', (req, res) => {
  try {
    const versionPath = path.join(__dirname, '..', 'version.json');
    const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    res.json({
      version: `${version.major}.${version.minor}.${version.patch}`,
      build: version.build,
      display: `${version.major}.${version.minor}.${version.patch} Build ${version.build}`
    });
  } catch {
    res.json({ version: '0.0.0', build: 0, display: 'unknown' });
  }
});

// System statistics endpoint (authenticated)
app.get('/api/system-stats', authenticate as any, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalTimeEntries,
      timeEntriesToday,
      totalInvoices,
      totalOrders,
      totalIncidents,
      openIncidents,
      totalDocuments,
      totalMessages,
      unreadMessages,
      recentActions,
      actionsToday,
      totalModules,
      totalUserGroups,
      currentlyClockedIn,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.timeEntry.count(),
      prisma.timeEntry.count({ where: { clockIn: { gte: today } } }),
      prisma.invoice.count(),
      prisma.order.count(),
      prisma.incident.count(),
      prisma.incident.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.documentNode.count({ where: { deletedAt: null } }),
      prisma.message.count(),
      prisma.message.count({ where: { isRead: false } }),
      prisma.actionLog.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.actionLog.count({ where: { createdAt: { gte: today } } }),
      prisma.module.count(),
      prisma.userGroup.count(),
      prisma.timeEntry.count({ where: { status: 'CLOCKED_IN' } }),
    ]);

    res.json({
      users: { total: totalUsers, active: activeUsers },
      projects: { total: totalProjects, active: activeProjects },
      timeEntries: { total: totalTimeEntries, today: timeEntriesToday, currentlyClockedIn },
      invoices: { total: totalInvoices },
      orders: { total: totalOrders },
      incidents: { total: totalIncidents, open: openIncidents },
      documents: { total: totalDocuments },
      messages: { total: totalMessages, unread: unreadMessages },
      actions: { last30Days: recentActions, today: actionsToday },
      modules: { total: totalModules },
      userGroups: { total: totalUserGroups },
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Systemstatistiken' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Seed system actions on startup
  actionService.seedSystemActions().then((actions) => {
    console.log(`System actions seeded: ${actions.length} actions`);
  }).catch(err => {
    console.error('Failed to seed system actions:', err);
  });

  // Start automatic backup scheduler
  backupScheduler.start().catch(err => {
    console.error('Failed to start backup scheduler:', err);
  });

  // Start Action1 auto-sync scheduler
  action1Scheduler.start().catch(err => {
    console.error('Failed to start Action1 sync scheduler:', err);
  });
});
