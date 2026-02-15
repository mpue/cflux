import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Maps backup JSON key names → Prisma client accessor names.
 * Single source of truth for all backed-up tables (99 total).
 */
const TABLE_MAP: Record<string, string> = {
  // Auth & Organisation
  systemSettings: 'systemSettings',
  departments: 'department',
  users: 'user',
  userGroups: 'userGroup',
  userGroupMemberships: 'userGroupMembership',
  modules: 'module',
  moduleAccess: 'moduleAccess',

  // HR / Onboarding
  employees: 'employee',
  applicants: 'applicant',
  applicantDocuments: 'applicantDocument',
  applicantInterviews: 'applicantInterview',
  applicantNotes: 'applicantNote',
  employeeDocuments: 'employeeDocument',
  onboardingTasks: 'onboardingTask',

  // Job Functions
  jobFunctions: 'jobFunction',
  jobFunctionDocuments: 'jobFunctionDocument',

  // Stammdaten
  customers: 'customer',
  suppliers: 'supplier',
  articleGroups: 'articleGroup',
  articles: 'article',
  costCenters: 'costCenter',

  // Inventory
  inventoryItems: 'inventoryItem',
  inventoryMovements: 'inventoryMovement',

  // Projects
  projects: 'project',
  projectTasks: 'projectTask',
  taskDependencies: 'taskDependency',
  locations: 'location',
  projectAssignments: 'projectAssignment',

  // Time Tracking
  timeEntries: 'timeEntry',
  projectTimeAllocations: 'projectTimeAllocation',
  absenceRequests: 'absenceRequest',
  holidays: 'holiday',
  overtimeBalances: 'overtimeBalance',

  // Compliance
  complianceViolations: 'complianceViolation',
  complianceSettings: 'complianceSettings',

  // Invoices & Reminders
  invoiceTemplates: 'invoiceTemplate',
  invoices: 'invoice',
  invoiceItems: 'invoiceItem',
  reminders: 'reminder',
  reminderSettings: 'reminderSettings',

  // Incidents
  incidents: 'incident',
  incidentComments: 'incidentComment',

  // Automation
  systemActions: 'systemAction',
  workflowTriggers: 'workflowTrigger',
  actionLogs: 'actionLog',

  // Workflows
  workflows: 'workflow',
  workflowSteps: 'workflowStep',
  invoiceTemplateWorkflows: 'invoiceTemplateWorkflow',
  workflowInstances: 'workflowInstance',
  workflowInstanceSteps: 'workflowInstanceStep',

  // Payroll
  payrollPeriods: 'payrollPeriod',
  payrollEntries: 'payrollEntry',
  salaryConfigurations: 'salaryConfiguration',

  // Devices
  devices: 'device',
  deviceAssignments: 'deviceAssignment',

  // Travel
  travelExpenses: 'travelExpense',

  // Messages
  messages: 'message',

  // Intranet / Documents
  documentNodeTypeRegistries: 'documentNodeTypeRegistry',
  documentNodes: 'documentNode',
  documentNodeGroupPermissions: 'documentNodeGroupPermission',
  documentVersions: 'documentVersion',
  documentNodeAttachments: 'documentNodeAttachment',
  documentNodeAttachmentVersions: 'documentNodeAttachmentVersion',

  // Media
  media: 'media',

  // Orders
  orders: 'order',
  orderItems: 'orderItem',
  orderDeliveries: 'orderDelivery',
  orderDeliveryItems: 'orderDeliveryItem',

  // EHS
  ehsMonthlyData: 'eHSMonthlyData',
  ehsTodos: 'eHSTodo',

  // Budget
  projectBudgets: 'projectBudget',
  projectBudgetItems: 'projectBudgetItem',

  // Dashboard
  userDashboardLayouts: 'userDashboardLayout',

  // Zeitmodelle
  zeitmodelle: 'zeitmodell',
  zeitmodellEintraege: 'zeitmodellEintrag',
  mitarbeiterZeitmodelle: 'mitarbeiterZeitmodell',
  zeitmodellAenderungen: 'zeitmodellAenderung',

  // E-Learning
  courses: 'course',
  courseCategories: 'courseCategory',
  lessons: 'lesson',
  quizzes: 'quiz',
  questions: 'question',
  answers: 'answer',
  enrollments: 'enrollment',
  lessonProgress: 'lessonProgress',
  quizAttempts: 'quizAttempt',
  questionResponses: 'questionResponse',
  courseAssignments: 'courseAssignment',

  // Training
  trainingCatalogs: 'trainingCatalog',
  trainingSessions: 'trainingSession',
  trainingCompletions: 'trainingCompletion',

  // Equipment
  equipments: 'equipment',
  equipmentAssignments: 'equipmentAssignment',

  // Checklists
  checklistTemplates: 'checklistTemplate',
  checklistItems: 'checklistItem',
  checklistInstances: 'checklistInstance',
  checklistItemCompletions: 'checklistItemCompletion',

  // News
  newsSources: 'newsSource',
  newsItems: 'newsItem',
};

const TABLE_COUNT = Object.keys(TABLE_MAP).length;

// Helper: dynamically access prisma model
const prismaModel = (accessor: string) => (prisma as any)[accessor];

// ============================================================
// CREATE BACKUP
// ============================================================
export const createBackup = async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    console.log(`📦 Creating backup of ${TABLE_COUNT} tables...`);

    // Fetch all tables in parallel batches to avoid overwhelming the DB
    const data: Record<string, any[]> = {};
    const keys = Object.keys(TABLE_MAP);
    const BATCH_SIZE = 15;

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(key => prismaModel(TABLE_MAP[key]).findMany())
      );
      batch.forEach((key, idx) => {
        data[key] = results[idx];
      });
    }

    const backup = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      schemaInfo: {
        tablesCount: TABLE_COUNT,
        description: 'Complete database backup — all modules including E-Learning, Onboarding, Checklists, News, Orders, EHS, Budget, Zeitmodelle, and more'
      },
      data,
      statistics: {
        usersCount: data.users?.length ?? 0,
        userGroupsCount: data.userGroups?.length ?? 0,
        employeesCount: data.employees?.length ?? 0,
        customersCount: data.customers?.length ?? 0,
        suppliersCount: data.suppliers?.length ?? 0,
        articlesCount: data.articles?.length ?? 0,
        projectsCount: data.projects?.length ?? 0,
        locationsCount: data.locations?.length ?? 0,
        timeEntriesCount: data.timeEntries?.length ?? 0,
        absenceRequestsCount: data.absenceRequests?.length ?? 0,
        invoicesCount: data.invoices?.length ?? 0,
        incidentsCount: data.incidents?.length ?? 0,
        workflowsCount: data.workflows?.length ?? 0,
        ordersCount: data.orders?.length ?? 0,
        coursesCount: data.courses?.length ?? 0,
        applicantsCount: data.applicants?.length ?? 0,
        documentNodesCount: data.documentNodes?.length ?? 0,
        documentVersionsCount: data.documentVersions?.length ?? 0,
        documentAttachmentsCount: data.documentNodeAttachments?.length ?? 0,
        documentPermissionsCount: data.documentNodeGroupPermissions?.length ?? 0,
        checklistTemplatesCount: data.checklistTemplates?.length ?? 0,
        newsItemsCount: data.newsItems?.length ?? 0,
        messagesCount: data.messages?.length ?? 0,
        mediaCount: data.media?.length ?? 0,
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

    console.log(`✅ Backup created: ${filename} (${TABLE_COUNT} tables)`);

    res.json({
      message: 'Backup created successfully',
      filename,
      timestamp: new Date().toISOString(),
      size: fs.statSync(filepath).size,
      statistics: backup.statistics
    });
  } catch (error: any) {
    console.error('Backup creation error:', error);
    res.status(500).json({ error: 'Failed to create backup', details: error.message });
  }
};

// ============================================================
// LIST / DOWNLOAD / DELETE BACKUPS
// ============================================================
export const listBackups = async (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.json') || file.endsWith('.sql'))
      .map(file => {
        const fp = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(fp);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());

    res.json(files);
  } catch (error: any) {
    console.error('List backups error:', error);
    res.status(500).json({ error: 'Failed to list backups', details: error.message });
  }
};

export const downloadBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    res.download(filepath, filename);
  } catch (error: any) {
    console.error('Download backup error:', error);
    res.status(500).json({ error: 'Failed to download backup', details: error.message });
  }
};

export const deleteBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    fs.unlinkSync(filepath);
    res.json({ message: 'Backup deleted successfully' });
  } catch (error: any) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: 'Failed to delete backup', details: error.message });
  }
};

// ============================================================
// RESTORE BACKUP
// ============================================================
export const restoreBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    console.log('🔄 Starting database restore...');
    console.log(`📦 Backup version: ${backupData.version}`);
    console.log(`📅 Backup date: ${backupData.timestamp}`);

    // ──────────────────────────────────────────────────────────
    // STEP 1: Delete all existing data (children before parents)
    // ──────────────────────────────────────────────────────────
    console.log('🗑️  Deleting existing data...');

    // Break circular FK references on User first
    await prisma.user.updateMany({
      data: { jobFunctionId: null, supervisorId: null, userGroupId: null }
    });

    // Checklists
    await prisma.checklistItemCompletion.deleteMany();
    await prisma.checklistInstance.deleteMany();
    await prisma.checklistItem.deleteMany();
    await prisma.checklistTemplate.deleteMany();

    // E-Learning
    await prisma.questionResponse.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.courseAssignment.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();
    await prisma.courseCategory.deleteMany();

    // Onboarding / Training
    await prisma.trainingCompletion.deleteMany();
    await prisma.trainingSession.deleteMany();
    await prisma.trainingCatalog.deleteMany();
    await prisma.equipmentAssignment.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.onboardingTask.deleteMany();
    await prisma.employeeDocument.deleteMany();
    await prisma.applicantNote.deleteMany();
    await prisma.applicantInterview.deleteMany();
    await prisma.applicantDocument.deleteMany();
    await prisma.applicant.deleteMany();

    // Job Functions
    await prisma.jobFunctionDocument.deleteMany();
    await prisma.jobFunction.deleteMany();

    // News
    await prisma.newsItem.deleteMany();
    await prisma.newsSource.deleteMany();

    // Zeitmodelle
    await prisma.zeitmodellAenderung.deleteMany();
    await prisma.mitarbeiterZeitmodell.deleteMany();
    await prisma.zeitmodellEintrag.deleteMany();
    await prisma.zeitmodell.deleteMany();

    // Dashboard
    await prisma.userDashboardLayout.deleteMany();

    // Budget
    await prisma.projectBudgetItem.deleteMany();
    await prisma.projectBudget.deleteMany();

    // EHS
    await prisma.eHSTodo.deleteMany();
    await prisma.eHSMonthlyData.deleteMany();

    // Orders
    await prisma.orderDeliveryItem.deleteMany();
    await prisma.orderDelivery.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    // Media
    await prisma.media.deleteMany();

    // Document Attachments
    await prisma.documentNodeAttachmentVersion.deleteMany();
    await prisma.documentNodeAttachment.deleteMany();

    // Automation
    await prisma.actionLog.deleteMany();
    await prisma.workflowTrigger.deleteMany();
    await prisma.systemAction.deleteMany();

    // Workflows
    await prisma.workflowInstanceStep.deleteMany();
    await prisma.workflowInstance.deleteMany();
    await prisma.invoiceTemplateWorkflow.deleteMany();
    await prisma.workflowStep.deleteMany();

    // Incidents
    await prisma.incidentComment.deleteMany();
    await prisma.incident.deleteMany();

    // Reminders
    await prisma.reminderSettings.deleteMany();
    await prisma.reminder.deleteMany();

    // Invoices
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.invoiceTemplate.deleteMany();

    // Travel, Messages, Payroll, Devices
    await prisma.travelExpense.deleteMany();
    await prisma.message.deleteMany();
    await prisma.payrollEntry.deleteMany();
    await prisma.payrollPeriod.deleteMany();
    await prisma.salaryConfiguration.deleteMany();
    await prisma.deviceAssignment.deleteMany();
    await prisma.device.deleteMany();

    // Compliance
    await prisma.complianceViolation.deleteMany();
    await prisma.complianceSettings.deleteMany();

    // Time Tracking
    await prisma.overtimeBalance.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.absenceRequest.deleteMany();
    await prisma.projectTimeAllocation.deleteMany();
    await prisma.timeEntry.deleteMany();

    // Project Tasks
    await prisma.taskDependency.deleteMany();
    await prisma.projectTask.deleteMany();

    // Projects
    await prisma.projectAssignment.deleteMany();
    await prisma.location.deleteMany();
    await prisma.project.deleteMany();

    // Inventory
    await prisma.inventoryMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();

    // Articles
    await prisma.article.deleteMany();
    await prisma.articleGroup.deleteMany();

    // Cost Centers
    await prisma.costCenter.deleteMany();

    // Suppliers / Customers
    await prisma.supplier.deleteMany();
    await prisma.customer.deleteMany();

    // Intranet
    await prisma.documentNodeGroupPermission.deleteMany();
    await prisma.documentVersion.deleteMany();
    await prisma.documentNode.deleteMany();
    await prisma.documentNodeTypeRegistry.deleteMany();

    // Workflows (parent)
    await prisma.workflow.deleteMany();

    // Auth & Module
    await prisma.moduleAccess.deleteMany();
    await prisma.module.deleteMany();
    await prisma.userGroupMembership.deleteMany();
    await prisma.userGroup.deleteMany();
    await prisma.systemSettings.deleteMany();

    // Employee, Department, User (last)
    await prisma.employee.deleteMany();
    await prisma.department.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ All existing data deleted');

    // ──────────────────────────────────────────────────────────
    // STEP 2: Restore data (parents before children)
    // ──────────────────────────────────────────────────────────
    console.log('📥 Restoring data from backup...');

    let restoredCount = 0;

    /**
     * Restore a table from backup data.
     */
    const restoreTable = async (dataKey: string, accessor: string, label?: string): Promise<number> => {
      const items = backupData.data[dataKey];
      if (!items?.length) return 0;
      for (const item of items) {
        await prismaModel(accessor).create({ data: item });
      }
      const count = items.length;
      console.log(`  ✓ ${label || dataKey}: ${count}`);
      return count;
    };

    /**
     * Restore a self-referencing table sorted by parent hierarchy.
     */
    const restoreHierarchical = async (
      dataKey: string,
      accessor: string,
      parentField: string = 'parentId',
      label?: string
    ): Promise<number> => {
      const items = backupData.data[dataKey];
      if (!items?.length) return 0;

      const sorted: any[] = [];
      const ids = new Set(items.map((n: any) => n.id));
      const added = new Set<string>();

      // Add root nodes first
      for (const node of items) {
        if (node[parentField] === null || !ids.has(node[parentField])) {
          sorted.push(node);
          added.add(node.id);
        }
      }

      // Add children layer by layer
      let changed = true;
      while (changed && sorted.length < items.length) {
        changed = false;
        for (const node of items) {
          if (!added.has(node.id) && (node[parentField] === null || added.has(node[parentField]))) {
            sorted.push(node);
            added.add(node.id);
            changed = true;
          }
        }
      }

      // Append any orphaned nodes
      for (const node of items) {
        if (!added.has(node.id)) sorted.push(node);
      }

      for (const node of sorted) {
        await prismaModel(accessor).create({ data: node });
      }
      const count = items.length;
      console.log(`  ✓ ${label || dataKey}: ${count}`);
      return count;
    };

    /**
     * Restore a table, stripping certain FK fields for later application.
     */
    const restoreWithDeferredFKs = async (
      dataKey: string,
      accessor: string,
      fieldsToStrip: string[],
      label?: string
    ): Promise<{ id: string; updates: Record<string, any> }[]> => {
      const items = backupData.data[dataKey];
      if (!items?.length) return [];
      const deferred: { id: string; updates: Record<string, any> }[] = [];

      for (const item of items) {
        const record = { ...item };
        const updates: Record<string, any> = {};
        for (const field of fieldsToStrip) {
          if (record[field] !== undefined && record[field] !== null) {
            updates[field] = record[field];
            record[field] = null;
          }
        }
        if (Object.keys(updates).length > 0) {
          deferred.push({ id: record.id, updates });
        }
        await prismaModel(accessor).create({ data: record });
      }
      const count = items.length;
      console.log(`  ✓ ${label || dataKey}: ${count}`);
      restoredCount += count;
      return deferred;
    };

    // ── Phase 1: Independent base tables ────────────────────
    restoredCount += await restoreTable('systemSettings', 'systemSettings', 'SystemSettings');
    restoredCount += await restoreTable('departments', 'department', 'Departments');
    restoredCount += await restoreTable('holidays', 'holiday', 'Holidays');
    restoredCount += await restoreTable('complianceSettings', 'complianceSettings', 'ComplianceSettings');
    restoredCount += await restoreTable('reminderSettings', 'reminderSettings', 'ReminderSettings');
    restoredCount += await restoreTable('payrollPeriods', 'payrollPeriod', 'PayrollPeriods');
    restoredCount += await restoreTable('articleGroups', 'articleGroup', 'ArticleGroups');
    restoredCount += await restoreTable('locations', 'location', 'Locations');
    restoredCount += await restoreTable('trainingCatalogs', 'trainingCatalog', 'TrainingCatalogs');
    restoredCount += await restoreTable('equipments', 'equipment', 'Equipments');
    restoredCount += await restoreTable('documentNodeTypeRegistries', 'documentNodeTypeRegistry', 'DocumentNodeTypeRegistries');
    restoredCount += await restoreTable('invoiceTemplates', 'invoiceTemplate', 'InvoiceTemplates');

    // ── Phase 2: UserGroups ─────────────────────────────────
    restoredCount += await restoreTable('userGroups', 'userGroup', 'UserGroups');

    // ── Phase 3: Users (strip circular FKs, apply later) ────
    const userDeferredFKs = await restoreWithDeferredFKs(
      'users', 'user',
      ['jobFunctionId', 'supervisorId'],
      'Users'
    );

    // ── Phase 4: UserGroupMemberships, Modules, ModuleAccess ─
    restoredCount += await restoreTable('userGroupMemberships', 'userGroupMembership', 'UserGroupMemberships');
    restoredCount += await restoreTable('modules', 'module', 'Modules');
    restoredCount += await restoreTable('moduleAccess', 'moduleAccess', 'ModuleAccess');

    // ── Phase 5: Employees (depends on User, Department) ─────
    restoredCount += await restoreTable('employees', 'employee', 'Employees');

    // ── Phase 6: JobFunctions (depends on User) ──────────────
    restoredCount += await restoreTable('jobFunctions', 'jobFunction', 'JobFunctions');

    // Apply deferred User FK updates (jobFunctionId, supervisorId)
    if (userDeferredFKs.length > 0) {
      for (const { id, updates } of userDeferredFKs) {
        await prisma.user.update({ where: { id }, data: updates });
      }
      console.log(`  ✓ User FK updates applied: ${userDeferredFKs.length}`);
    }

    // ── Phase 7: Customers, Suppliers, CostCenters, Articles ─
    restoredCount += await restoreTable('customers', 'customer', 'Customers');
    restoredCount += await restoreTable('suppliers', 'supplier', 'Suppliers');
    restoredCount += await restoreTable('costCenters', 'costCenter', 'CostCenters');
    restoredCount += await restoreTable('articles', 'article', 'Articles');

    // ── Phase 8: Inventory ───────────────────────────────────
    restoredCount += await restoreTable('inventoryItems', 'inventoryItem', 'InventoryItems');
    restoredCount += await restoreTable('inventoryMovements', 'inventoryMovement', 'InventoryMovements');

    // ── Phase 9: Projects ────────────────────────────────────
    restoredCount += await restoreTable('projects', 'project', 'Projects');
    restoredCount += await restoreTable('projectAssignments', 'projectAssignment', 'ProjectAssignments');
    restoredCount += await restoreTable('projectTasks', 'projectTask', 'ProjectTasks');
    restoredCount += await restoreTable('taskDependencies', 'taskDependency', 'TaskDependencies');

    // ── Phase 10: Time Tracking ──────────────────────────────
    restoredCount += await restoreTable('timeEntries', 'timeEntry', 'TimeEntries');
    restoredCount += await restoreTable('projectTimeAllocations', 'projectTimeAllocation', 'ProjectTimeAllocations');
    restoredCount += await restoreTable('absenceRequests', 'absenceRequest', 'AbsenceRequests');
    restoredCount += await restoreTable('overtimeBalances', 'overtimeBalance', 'OvertimeBalances');

    // ── Phase 11: Compliance ─────────────────────────────────
    restoredCount += await restoreTable('complianceViolations', 'complianceViolation', 'ComplianceViolations');

    // ── Phase 12: Invoices ───────────────────────────────────
    restoredCount += await restoreTable('invoices', 'invoice', 'Invoices');
    restoredCount += await restoreTable('invoiceItems', 'invoiceItem', 'InvoiceItems');
    restoredCount += await restoreTable('reminders', 'reminder', 'Reminders');

    // ── Phase 13: Incidents ──────────────────────────────────
    restoredCount += await restoreTable('incidents', 'incident', 'Incidents');
    restoredCount += await restoreTable('incidentComments', 'incidentComment', 'IncidentComments');

    // ── Phase 14: Workflows ──────────────────────────────────
    restoredCount += await restoreTable('workflows', 'workflow', 'Workflows');
    restoredCount += await restoreTable('workflowSteps', 'workflowStep', 'WorkflowSteps');
    restoredCount += await restoreTable('invoiceTemplateWorkflows', 'invoiceTemplateWorkflow', 'InvoiceTemplateWorkflows');
    restoredCount += await restoreTable('workflowInstances', 'workflowInstance', 'WorkflowInstances');
    restoredCount += await restoreTable('workflowInstanceSteps', 'workflowInstanceStep', 'WorkflowInstanceSteps');

    // ── Phase 15: Automation ─────────────────────────────────
    restoredCount += await restoreTable('systemActions', 'systemAction', 'SystemActions');
    restoredCount += await restoreTable('workflowTriggers', 'workflowTrigger', 'WorkflowTriggers');
    restoredCount += await restoreTable('actionLogs', 'actionLog', 'ActionLogs');

    // ── Phase 16: Intranet / Documents ───────────────────────
    restoredCount += await restoreHierarchical('documentNodes', 'documentNode', 'parentId', 'DocumentNodes');
    restoredCount += await restoreTable('documentVersions', 'documentVersion', 'DocumentVersions');
    restoredCount += await restoreTable('documentNodeGroupPermissions', 'documentNodeGroupPermission', 'DocumentNodeGroupPermissions');
    restoredCount += await restoreTable('documentNodeAttachments', 'documentNodeAttachment', 'DocumentNodeAttachments');
    restoredCount += await restoreTable('documentNodeAttachmentVersions', 'documentNodeAttachmentVersion', 'DocumentNodeAttachmentVersions');
    restoredCount += await restoreTable('jobFunctionDocuments', 'jobFunctionDocument', 'JobFunctionDocuments');

    // ── Phase 17: Media ──────────────────────────────────────
    restoredCount += await restoreTable('media', 'media', 'Media');

    // ── Phase 18: Orders ─────────────────────────────────────
    restoredCount += await restoreTable('orders', 'order', 'Orders');
    restoredCount += await restoreTable('orderItems', 'orderItem', 'OrderItems');
    restoredCount += await restoreTable('orderDeliveries', 'orderDelivery', 'OrderDeliveries');
    restoredCount += await restoreTable('orderDeliveryItems', 'orderDeliveryItem', 'OrderDeliveryItems');

    // ── Phase 19: EHS ────────────────────────────────────────
    restoredCount += await restoreTable('ehsMonthlyData', 'eHSMonthlyData', 'EHSMonthlyData');
    restoredCount += await restoreTable('ehsTodos', 'eHSTodo', 'EHSTodos');

    // ── Phase 20: Budget ─────────────────────────────────────
    restoredCount += await restoreTable('projectBudgets', 'projectBudget', 'ProjectBudgets');
    restoredCount += await restoreTable('projectBudgetItems', 'projectBudgetItem', 'ProjectBudgetItems');

    // ── Phase 21: Dashboard ──────────────────────────────────
    restoredCount += await restoreTable('userDashboardLayouts', 'userDashboardLayout', 'UserDashboardLayouts');

    // ── Phase 22: Zeitmodelle ────────────────────────────────
    restoredCount += await restoreTable('zeitmodelle', 'zeitmodell', 'Zeitmodelle');
    restoredCount += await restoreTable('zeitmodellEintraege', 'zeitmodellEintrag', 'ZeitmodellEintraege');
    restoredCount += await restoreTable('mitarbeiterZeitmodelle', 'mitarbeiterZeitmodell', 'MitarbeiterZeitmodelle');
    restoredCount += await restoreTable('zeitmodellAenderungen', 'zeitmodellAenderung', 'ZeitmodellAenderungen');

    // ── Phase 23: Payroll ────────────────────────────────────
    restoredCount += await restoreTable('payrollEntries', 'payrollEntry', 'PayrollEntries');
    restoredCount += await restoreTable('salaryConfigurations', 'salaryConfiguration', 'SalaryConfigurations');

    // ── Phase 24: Devices ────────────────────────────────────
    restoredCount += await restoreTable('devices', 'device', 'Devices');
    restoredCount += await restoreTable('deviceAssignments', 'deviceAssignment', 'DeviceAssignments');

    // ── Phase 25: Travel ─────────────────────────────────────
    restoredCount += await restoreTable('travelExpenses', 'travelExpense', 'TravelExpenses');

    // ── Phase 26: Messages (self-ref via replyToId) ──────────
    if (backupData.data.messages?.length) {
      const msgDeferred: { id: string; replyToId: string }[] = [];
      for (const msg of backupData.data.messages) {
        const record = { ...msg };
        if (record.replyToId) {
          msgDeferred.push({ id: record.id, replyToId: record.replyToId });
          record.replyToId = null;
        }
        await prisma.message.create({ data: record });
      }
      if (msgDeferred.length > 0) {
        for (const { id, replyToId } of msgDeferred) {
          await prisma.message.update({ where: { id }, data: { replyToId } });
        }
      }
      restoredCount += backupData.data.messages.length;
      console.log(`  ✓ Messages: ${backupData.data.messages.length}`);
    }

    // ── Phase 27: E-Learning ─────────────────────────────────
    restoredCount += await restoreHierarchical('courseCategories', 'courseCategory', 'parentId', 'CourseCategories');
    restoredCount += await restoreTable('courses', 'course', 'Courses');
    restoredCount += await restoreTable('lessons', 'lesson', 'Lessons');
    restoredCount += await restoreTable('quizzes', 'quiz', 'Quizzes');
    restoredCount += await restoreTable('questions', 'question', 'Questions');
    restoredCount += await restoreTable('answers', 'answer', 'Answers');
    restoredCount += await restoreTable('courseAssignments', 'courseAssignment', 'CourseAssignments');
    restoredCount += await restoreTable('enrollments', 'enrollment', 'Enrollments');
    restoredCount += await restoreTable('lessonProgress', 'lessonProgress', 'LessonProgress');
    restoredCount += await restoreTable('quizAttempts', 'quizAttempt', 'QuizAttempts');
    restoredCount += await restoreTable('questionResponses', 'questionResponse', 'QuestionResponses');

    // ── Phase 28: Onboarding ─────────────────────────────────
    restoredCount += await restoreTable('applicants', 'applicant', 'Applicants');
    restoredCount += await restoreTable('applicantDocuments', 'applicantDocument', 'ApplicantDocuments');
    restoredCount += await restoreTable('applicantInterviews', 'applicantInterview', 'ApplicantInterviews');
    restoredCount += await restoreTable('applicantNotes', 'applicantNote', 'ApplicantNotes');
    restoredCount += await restoreTable('employeeDocuments', 'employeeDocument', 'EmployeeDocuments');
    restoredCount += await restoreTable('onboardingTasks', 'onboardingTask', 'OnboardingTasks');

    // ── Phase 29: Training ───────────────────────────────────
    restoredCount += await restoreTable('trainingSessions', 'trainingSession', 'TrainingSessions');
    restoredCount += await restoreTable('trainingCompletions', 'trainingCompletion', 'TrainingCompletions');

    // ── Phase 30: Equipment ──────────────────────────────────
    restoredCount += await restoreTable('equipmentAssignments', 'equipmentAssignment', 'EquipmentAssignments');

    // ── Phase 31: Checklists ─────────────────────────────────
    restoredCount += await restoreTable('checklistTemplates', 'checklistTemplate', 'ChecklistTemplates');
    restoredCount += await restoreTable('checklistItems', 'checklistItem', 'ChecklistItems');
    restoredCount += await restoreTable('checklistInstances', 'checklistInstance', 'ChecklistInstances');
    restoredCount += await restoreTable('checklistItemCompletions', 'checklistItemCompletion', 'ChecklistItemCompletions');

    // ── Phase 32: News ───────────────────────────────────────
    restoredCount += await restoreTable('newsSources', 'newsSource', 'NewsSources');
    restoredCount += await restoreTable('newsItems', 'newsItem', 'NewsItems');

    console.log(`✅ Restore completed! Total records restored: ${restoredCount}`);

    res.json({
      message: 'Backup restored successfully',
      restoredRecords: restoredCount,
      backupVersion: backupData.version,
      backupTimestamp: backupData.timestamp
    });
  } catch (error: any) {
    console.error('❌ Restore backup error:', error);
    res.status(500).json({ error: 'Failed to restore backup', details: error.message });
  }
};

// ============================================================
// UPLOAD BACKUP
// ============================================================
export const uploadBackup = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = req.file.originalname.endsWith('.json') ? 'json' : 'sql';
    const filename = `uploaded_backup_${timestamp}.${extension}`;
    const filepath = path.join(BACKUP_DIR, filename);

    fs.renameSync(req.file.path, filepath);

    res.json({
      message: 'Backup uploaded successfully',
      filename,
      timestamp: new Date().toISOString(),
      size: fs.statSync(filepath).size
    });
  } catch (error: any) {
    console.error('Upload backup error:', error);
    res.status(500).json({ error: 'Failed to upload backup', details: error.message });
  }
};

// ============================================================
// EXPORT DATA (lightweight, public-safe export without passwords)
// ============================================================
export const exportData = async (req: Request, res: Response) => {
  try {
    const [
      users,
      userGroups,
      employees,
      projects,
      customers,
      suppliers,
      articles,
      timeEntries,
      absenceRequests,
      invoices,
      incidents,
      orders,
      documentNodes,
      documentVersions,
      courses,
      applicants,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.userGroup.findMany(),
      prisma.employee.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          department: true,
          startDate: true,
          isActive: true,
        }
      }),
      prisma.project.findMany(),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
      prisma.article.findMany(),
      prisma.timeEntry.findMany(),
      prisma.absenceRequest.findMany(),
      prisma.invoice.findMany(),
      prisma.incident.findMany(),
      prisma.order.findMany(),
      prisma.documentNode.findMany(),
      prisma.documentVersion.findMany(),
      prisma.course.findMany(),
      prisma.applicant.findMany(),
    ]);

    const data = {
      exportDate: new Date().toISOString(),
      version: '3.0',
      users,
      userGroups,
      employees,
      projects,
      customers,
      suppliers,
      articles,
      timeEntries,
      absenceRequests,
      invoices,
      incidents,
      orders,
      documentNodes,
      documentVersions,
      courses,
      applicants,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="data_export_${new Date().toISOString()}.json"`);
    res.json(data);
  } catch (error: any) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data', details: error.message });
  }
};
