import { prisma } from '../lib/prisma';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';


const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Same TABLE_MAP as in backup.controller.ts — kept in sync.
 * Maps backup JSON key names → Prisma client accessor names.
 */
export const TABLE_MAP: Record<string, string> = {
  systemSettings: 'systemSettings',
  departments: 'department',
  users: 'user',
  apiKeys: 'apiKey',
  userGroups: 'userGroup',
  userGroupMemberships: 'userGroupMembership',
  modules: 'module',
  moduleAccess: 'moduleAccess',
  employees: 'employee',
  applicants: 'applicant',
  applicantDocuments: 'applicantDocument',
  applicantInterviews: 'applicantInterview',
  applicantNotes: 'applicantNote',
  employeeDocuments: 'employeeDocument',
  onboardingTasks: 'onboardingTask',
  onboardingJobs: 'onboardingJob',
  probationReviews: 'probationReview',
  jobFunctions: 'jobFunction',
  jobFunctionDocuments: 'jobFunctionDocument',
  customers: 'customer',
  suppliers: 'supplier',
  articleGroups: 'articleGroup',
  articles: 'article',
  costCenters: 'costCenter',
  inventoryItems: 'inventoryItem',
  inventoryMovements: 'inventoryMovement',
  projects: 'project',
  stories: 'story',
  projectTasks: 'projectTask',
  taskDependencies: 'taskDependency',
  locations: 'location',
  projectAssignments: 'projectAssignment',
  timeEntries: 'timeEntry',
  projectTimeAllocations: 'projectTimeAllocation',
  absenceRequests: 'absenceRequest',
  holidays: 'holiday',
  overtimeBalances: 'overtimeBalance',
  complianceViolations: 'complianceViolation',
  complianceSettings: 'complianceSettings',
  invoiceTemplates: 'invoiceTemplate',
  invoices: 'invoice',
  invoiceItems: 'invoiceItem',
  reminders: 'reminder',
  reminderSettings: 'reminderSettings',
  incidents: 'incident',
  incidentComments: 'incidentComment',
  incidentAttachments: 'incidentAttachment',
  systemActions: 'systemAction',
  workflowTriggers: 'workflowTrigger',
  actionLogs: 'actionLog',
  workflows: 'workflow',
  workflowSteps: 'workflowStep',
  invoiceTemplateWorkflows: 'invoiceTemplateWorkflow',
  workflowInstances: 'workflowInstance',
  workflowInstanceSteps: 'workflowInstanceStep',
  payrollPeriods: 'payrollPeriod',
  payrollEntries: 'payrollEntry',
  salaryConfigurations: 'salaryConfiguration',
  devices: 'device',
  deviceAssignments: 'deviceAssignment',
  deviceSoftware: 'deviceSoftware',
  deviceUpdates: 'deviceUpdate',
  deviceVulnerabilities: 'deviceVulnerability',
  travelExpenses: 'travelExpense',
  messages: 'message',
  documentNodeTypeRegistries: 'documentNodeTypeRegistry',
  documentNodes: 'documentNode',
  documentNodeGroupPermissions: 'documentNodeGroupPermission',
  documentVersions: 'documentVersion',
  documentNodeAttachments: 'documentNodeAttachment',
  documentNodeAttachmentVersions: 'documentNodeAttachmentVersion',
  media: 'media',
  orders: 'order',
  orderItems: 'orderItem',
  orderDeliveries: 'orderDelivery',
  orderDeliveryItems: 'orderDeliveryItem',
  ehsMonthlyData: 'eHSMonthlyData',
  ehsTodos: 'eHSTodo',
  projectBudgets: 'projectBudget',
  projectBudgetItems: 'projectBudgetItem',
  userDashboardLayouts: 'userDashboardLayout',
  zeitmodelle: 'zeitmodell',
  zeitmodellEintraege: 'zeitmodellEintrag',
  mitarbeiterZeitmodelle: 'mitarbeiterZeitmodell',
  zeitmodellAenderungen: 'zeitmodellAenderung',
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
  trainingCatalogs: 'trainingCatalog',
  trainingSessions: 'trainingSession',
  trainingCompletions: 'trainingCompletion',
  equipments: 'equipment',
  equipmentAssignments: 'equipmentAssignment',
  checklistTemplates: 'checklistTemplate',
  checklistItems: 'checklistItem',
  checklistInstances: 'checklistInstance',
  checklistItemCompletions: 'checklistItemCompletion',
  checklistItemAttachments: 'checklistItemAttachment',
  newsSources: 'newsSource',
  newsItems: 'newsItem',
  contactGroups: 'contactGroup',
  contacts: 'contact',
  tools: 'tool',
  toolAssignments: 'toolAssignment',
  handoverProtocols: 'handoverProtocol',
  handoverProtocolItems: 'handoverProtocolItem',
  calendarEvents: 'calendarEvent',
  calendarEventAttendees: 'calendarEventAttendee',
  reports: 'report',
  reportAreas: 'reportArea',
  reportPhotos: 'reportPhoto',
  reportFindings: 'reportFinding',
};

const TABLE_COUNT = Object.keys(TABLE_MAP).length;
const prismaModel = (accessor: string) => (prisma as any)[accessor];

/**
 * Creates a full backup (database JSON + uploads ZIP).
 * Used by the scheduler and the manual CLI script — no Request/Response dependency.
 * `prefix` controls the filename ("auto_backup" for the scheduler, "backup" for manual runs).
 * Returns the ZIP filename on success.
 */
export async function createBackupFile(prefix: string = 'auto_backup'): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonFilename = `${prefix}_${timestamp}.json`;
  const jsonFilepath = path.join(BACKUP_DIR, jsonFilename);

  console.log(`📦 [Backup] Creating backup of ${TABLE_COUNT} tables...`);

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
    type: 'automatic',
    schemaInfo: {
      tablesCount: TABLE_COUNT,
      description: 'Automatic scheduled backup — all modules',
    },
    data,
    statistics: {
      usersCount: data.users?.length ?? 0,
      userGroupsCount: data.userGroups?.length ?? 0,
      employeesCount: data.employees?.length ?? 0,
      customersCount: data.customers?.length ?? 0,
      projectsCount: data.projects?.length ?? 0,
      timeEntriesCount: data.timeEntries?.length ?? 0,
      invoicesCount: data.invoices?.length ?? 0,
      ordersCount: data.orders?.length ?? 0,
    },
  };

  const jsonContent = JSON.stringify(backup, null, 2);
  fs.writeFileSync(jsonFilepath, jsonContent, 'utf-8');

  // Create ZIP with JSON + uploads
  const zipFilename = `${prefix}_${timestamp}.zip`;
  const zipFilepath = path.join(BACKUP_DIR, zipFilename);
  const zip = new AdmZip();
  zip.addFile('backup.json', Buffer.from(jsonContent, 'utf-8'));

  if (fs.existsSync(UPLOADS_DIR)) {
    const addDirToZip = (dirPath: string, zipPath: string) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const entryZipPath = path.join(zipPath, entry.name);
        if (entry.isDirectory()) {
          addDirToZip(fullPath, entryZipPath);
        } else if (entry.isFile()) {
          zip.addLocalFile(fullPath, path.dirname(entryZipPath));
        }
      }
    };
    addDirToZip(UPLOADS_DIR, 'uploads');
  }

  zip.writeZip(zipFilepath);
  fs.unlinkSync(jsonFilepath); // remove standalone JSON

  console.log(`✅ [Backup] Created: ${zipFilename}`);
  return zipFilename;
}

/**
 * Deletes auto-backup files older than the retention period.
 */
function cleanupOldBackups(retentionDays: number): void {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('auto_backup_') && f.endsWith('.zip'));

  for (const file of files) {
    const fp = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(fp);
    if (stats.birthtimeMs < cutoff) {
      fs.unlinkSync(fp);
      console.log(`🗑️ [Auto-Backup] Deleted old backup: ${file}`);
    }
  }
}

/**
 * Calculates milliseconds until the next scheduled backup time.
 */
function msUntilNext(backupTime: string, interval: string): number {
  const [hours, minutes] = backupTime.split(':').map(Number);
  const now = new Date();

  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  // If today's time already passed, move to next occurrence
  if (next.getTime() <= now.getTime()) {
    switch (interval) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      default: // daily
        next.setDate(next.getDate() + 1);
    }
  }

  return next.getTime() - now.getTime();
}

function intervalToMs(interval: string): number {
  switch (interval) {
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000; // approximate
    default: // daily
      return 24 * 60 * 60 * 1000;
  }
}

class BackupScheduler {
  private initialTimer: ReturnType<typeof setTimeout> | null = null;
  private recurringTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  /**
   * Starts the scheduler. Reads settings from DB, schedules next backup,
   * then repeats at the configured interval. Automatically re-reads
   * settings on each run so admin changes take effect.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    await this.scheduleNext();
    console.log('⏰ [Auto-Backup] Scheduler started');
  }

  stop(): void {
    if (this.initialTimer) clearTimeout(this.initialTimer);
    if (this.recurringTimer) clearInterval(this.recurringTimer);
    this.initialTimer = null;
    this.recurringTimer = null;
    this.running = false;
    console.log('⏹️ [Auto-Backup] Scheduler stopped');
  }

  private async scheduleNext(): Promise<void> {
    // Clear any existing timers
    if (this.initialTimer) clearTimeout(this.initialTimer);
    if (this.recurringTimer) clearInterval(this.recurringTimer);

    const settings = await prisma.systemSettings.findFirst();
    if (!settings?.autoBackupEnabled) {
      console.log('ℹ️ [Auto-Backup] Auto-backup is disabled in system settings');
      return;
    }

    const { backupTime, backupInterval, backupRetention } = settings;
    const delay = msUntilNext(backupTime, backupInterval);
    const nextRun = new Date(Date.now() + delay);

    console.log(`⏰ [Auto-Backup] Next backup scheduled at ${nextRun.toLocaleString()} (${backupInterval})`);

    // First run: wait until the scheduled time
    this.initialTimer = setTimeout(async () => {
      await this.runBackup(backupRetention);

      // Subsequent runs: repeat at the interval
      this.recurringTimer = setInterval(async () => {
        // Re-read settings in case admin changed them
        const currentSettings = await prisma.systemSettings.findFirst();
        if (!currentSettings?.autoBackupEnabled) {
          console.log('ℹ️ [Auto-Backup] Auto-backup was disabled, stopping scheduler');
          this.stop();
          return;
        }
        await this.runBackup(currentSettings.backupRetention);
      }, intervalToMs(backupInterval));
    }, delay);
  }

  private async runBackup(retentionDays: number): Promise<void> {
    try {
      const filename = await createBackupFile();

      // Update lastBackupAt in system settings
      const settings = await prisma.systemSettings.findFirst();
      if (settings) {
        await prisma.systemSettings.update({
          where: { id: settings.id },
          data: { lastBackupAt: new Date() },
        });
      }

      // Cleanup old backups based on retention setting
      cleanupOldBackups(retentionDays);

      console.log(`✅ [Auto-Backup] Completed successfully: ${filename}`);
    } catch (error) {
      console.error('❌ [Auto-Backup] Failed:', error);
    }
  }

  /** Re-read settings and reschedule (call after admin changes settings). */
  async reschedule(): Promise<void> {
    this.stop();
    this.running = true;
    await this.scheduleNext();
  }
}

export const backupScheduler = new BackupScheduler();
