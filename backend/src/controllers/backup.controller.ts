import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const createBackup = async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Export all data using Prisma - Alle Tabellen
    const [
      users,
      userGroups,
      userGroupMemberships,
      modules,
      moduleAccess,
      customers,
      suppliers,
      articleGroups,
      articles,
      projects,
      locations,
      projectAssignments,
      timeEntries,
      absenceRequests,
      holidays,
      overtimeBalances,
      complianceViolations,
      complianceSettings,
      invoiceTemplates,
      invoices,
      invoiceItems,
      reminders,
      reminderSettings,
      incidents,
      incidentComments,
      workflows,
      workflowSteps,
      invoiceTemplateWorkflows,
      workflowInstances,
      workflowInstanceSteps,
      systemSettings,
      documentNodes,
      documentVersions,
      documentNodeGroupPermissions
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.userGroup.findMany(),
      prisma.userGroupMembership.findMany(),
      prisma.module.findMany(),
      prisma.moduleAccess.findMany(),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
      prisma.articleGroup.findMany(),
      prisma.article.findMany(),
      prisma.project.findMany(),
      prisma.location.findMany(),
      prisma.projectAssignment.findMany(),
      prisma.timeEntry.findMany(),
      prisma.absenceRequest.findMany(),
      prisma.holiday.findMany(),
      prisma.overtimeBalance.findMany(),
      prisma.complianceViolation.findMany(),
      prisma.complianceSettings.findMany(),
      prisma.invoiceTemplate.findMany(),
      prisma.invoice.findMany(),
      prisma.invoiceItem.findMany(),
      prisma.reminder.findMany(),
      prisma.reminderSettings.findMany(),
      prisma.incident.findMany(),
      prisma.incidentComment.findMany(),
      prisma.workflow.findMany(),
      prisma.workflowStep.findMany(),
      prisma.invoiceTemplateWorkflow.findMany(),
      prisma.workflowInstance.findMany(),
      prisma.workflowInstanceStep.findMany(),
      prisma.systemSettings.findMany(),
      prisma.documentNode.findMany(),
      prisma.documentVersion.findMany(),
      prisma.documentNodeGroupPermission.findMany()
    ]);

    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      schemaInfo: {
        tablesCount: 34,
        description: 'Complete database backup including all modules and intranet'
      },
      data: {
        users,
        userGroups,
        userGroupMemberships,
        modules,
        moduleAccess,
        customers,
        suppliers,
        articleGroups,
        articles,
        projects,
        locations,
        projectAssignments,
        timeEntries,
        absenceRequests,
        holidays,
        overtimeBalances,
        complianceViolations,
        complianceSettings,
        invoiceTemplates,
        invoices,
        invoiceItems,
        reminders,
        reminderSettings,
        incidents,
        incidentComments,
        workflows,
        workflowSteps,
        invoiceTemplateWorkflows,
        workflowInstances,
        workflowInstanceSteps,
        systemSettings,
        documentNodes,
        documentVersions,
        documentNodeGroupPermissions
      },
      statistics: {
        usersCount: users.length,
        userGroupsCount: userGroups.length,
        customersCount: customers.length,
        suppliersCount: suppliers.length,
        articlesCount: articles.length,
        projectsCount: projects.length,
        locationsCount: locations.length,
        timeEntriesCount: timeEntries.length,
        absenceRequestsCount: absenceRequests.length,
        invoicesCount: invoices.length,
        incidentsCount: incidents.length,
        workflowsCount: workflows.length,
        documentNodesCount: documentNodes.length,
        documentVersionsCount: documentVersions.length,
        documentPermissionsCount: documentNodeGroupPermissions.length
      }
    };

    // Write backup to file
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

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

export const listBackups = async (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.json') || file.endsWith('.sql'))
      .map(file => {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
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
    
    // Validate filename to prevent directory traversal
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
    
    // Validate filename to prevent directory traversal
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

export const restoreBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Read and parse backup file
    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    console.log('🔄 Starting database restore...');
    console.log(`📦 Backup version: ${backupData.version}`);
    console.log(`📅 Backup date: ${backupData.timestamp}`);

    // Step 1: Delete all existing data (in reverse order of dependencies)
    console.log('🗑️  Deleting existing data...');
    
    // Delete detail records with foreign keys first
    await prisma.workflowInstanceStep.deleteMany();
    await prisma.workflowInstance.deleteMany();
    await prisma.invoiceTemplateWorkflow.deleteMany();
    await prisma.workflowStep.deleteMany();
    await prisma.workflow.deleteMany();
    
    await prisma.incidentComment.deleteMany();
    await prisma.incident.deleteMany();
    
    await prisma.reminderSettings.deleteMany();
    await prisma.reminder.deleteMany();
    
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.invoiceTemplate.deleteMany();
    
    await prisma.complianceViolation.deleteMany();
    await prisma.complianceSettings.deleteMany();
    
    await prisma.overtimeBalance.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.absenceRequest.deleteMany();
    await prisma.timeEntry.deleteMany();
    
    await prisma.projectAssignment.deleteMany();
    await prisma.location.deleteMany();
    await prisma.project.deleteMany();
    
    await prisma.article.deleteMany();
    await prisma.articleGroup.deleteMany();
    
    await prisma.supplier.deleteMany();
    await prisma.customer.deleteMany();
    
    // Delete intranet data
    await prisma.documentNodeGroupPermission.deleteMany();
    await prisma.documentVersion.deleteMany();
    await prisma.documentNode.deleteMany();
    
    await prisma.moduleAccess.deleteMany();
    await prisma.module.deleteMany();
    
    await prisma.userGroupMembership.deleteMany();
    await prisma.userGroup.deleteMany();
    
    await prisma.systemSettings.deleteMany();
    
    // Delete users last
    await prisma.user.deleteMany();

    console.log('✅ All existing data deleted');

    // Step 2: Restore data from backup (in correct order)
    console.log('📥 Restoring data from backup...');
    
    let restoredCount = 0;

    // Restore independent tables first
    if (backupData.data.systemSettings) {
      for (const item of backupData.data.systemSettings) {
        await prisma.systemSettings.create({ data: item });
      }
      restoredCount += backupData.data.systemSettings.length;
      console.log(`  ✓ SystemSettings: ${backupData.data.systemSettings.length}`);
    }

    if (backupData.data.users) {
      for (const user of backupData.data.users) {
        await prisma.user.create({ data: user });
      }
      restoredCount += backupData.data.users.length;
      console.log(`  ✓ Users: ${backupData.data.users.length}`);
    }

    if (backupData.data.userGroups) {
      for (const group of backupData.data.userGroups) {
        await prisma.userGroup.create({ data: group });
      }
      restoredCount += backupData.data.userGroups.length;
      console.log(`  ✓ UserGroups: ${backupData.data.userGroups.length}`);
    }

    if (backupData.data.userGroupMemberships) {
      for (const membership of backupData.data.userGroupMemberships) {
        await prisma.userGroupMembership.create({ data: membership });
      }
      restoredCount += backupData.data.userGroupMemberships.length;
      console.log(`  ✓ UserGroupMemberships: ${backupData.data.userGroupMemberships.length}`);
    }

    if (backupData.data.modules) {
      for (const module of backupData.data.modules) {
        await prisma.module.create({ data: module });
      }
      restoredCount += backupData.data.modules.length;
      console.log(`  ✓ Modules: ${backupData.data.modules.length}`);
    }

    if (backupData.data.moduleAccess) {
      for (const access of backupData.data.moduleAccess) {
        await prisma.moduleAccess.create({ data: access });
      }
      restoredCount += backupData.data.moduleAccess.length;
      console.log(`  ✓ ModuleAccess: ${backupData.data.moduleAccess.length}`);
    }

    // Restore customers and suppliers
    if (backupData.data.customers) {
      for (const customer of backupData.data.customers) {
        await prisma.customer.create({ data: customer });
      }
      restoredCount += backupData.data.customers.length;
      console.log(`  ✓ Customers: ${backupData.data.customers.length}`);
    }

    if (backupData.data.suppliers) {
      for (const supplier of backupData.data.suppliers) {
        await prisma.supplier.create({ data: supplier });
      }
      restoredCount += backupData.data.suppliers.length;
      console.log(`  ✓ Suppliers: ${backupData.data.suppliers.length}`);
    }

    // Restore articles
    if (backupData.data.articleGroups) {
      for (const group of backupData.data.articleGroups) {
        await prisma.articleGroup.create({ data: group });
      }
      restoredCount += backupData.data.articleGroups.length;
      console.log(`  ✓ ArticleGroups: ${backupData.data.articleGroups.length}`);
    }

    if (backupData.data.articles) {
      for (const article of backupData.data.articles) {
        await prisma.article.create({ data: article });
      }
      restoredCount += backupData.data.articles.length;
      console.log(`  ✓ Articles: ${backupData.data.articles.length}`);
    }

    // Restore projects and locations
    if (backupData.data.projects) {
      for (const project of backupData.data.projects) {
        await prisma.project.create({ data: project });
      }
      restoredCount += backupData.data.projects.length;
      console.log(`  ✓ Projects: ${backupData.data.projects.length}`);
    }

    if (backupData.data.locations) {
      for (const location of backupData.data.locations) {
        await prisma.location.create({ data: location });
      }
      restoredCount += backupData.data.locations.length;
      console.log(`  ✓ Locations: ${backupData.data.locations.length}`);
    }

    if (backupData.data.projectAssignments) {
      for (const assignment of backupData.data.projectAssignments) {
        await prisma.projectAssignment.create({ data: assignment });
      }
      restoredCount += backupData.data.projectAssignments.length;
      console.log(`  ✓ ProjectAssignments: ${backupData.data.projectAssignments.length}`);
    }

    // Restore time entries and absences
    if (backupData.data.timeEntries) {
      for (const entry of backupData.data.timeEntries) {
        await prisma.timeEntry.create({ data: entry });
      }
      restoredCount += backupData.data.timeEntries.length;
      console.log(`  ✓ TimeEntries: ${backupData.data.timeEntries.length}`);
    }

    if (backupData.data.absenceRequests) {
      for (const absence of backupData.data.absenceRequests) {
        await prisma.absenceRequest.create({ data: absence });
      }
      restoredCount += backupData.data.absenceRequests.length;
      console.log(`  ✓ AbsenceRequests: ${backupData.data.absenceRequests.length}`);
    }

    if (backupData.data.holidays) {
      for (const holiday of backupData.data.holidays) {
        await prisma.holiday.create({ data: holiday });
      }
      restoredCount += backupData.data.holidays.length;
      console.log(`  ✓ Holidays: ${backupData.data.holidays.length}`);
    }

    if (backupData.data.overtimeBalances) {
      for (const balance of backupData.data.overtimeBalances) {
        await prisma.overtimeBalance.create({ data: balance });
      }
      restoredCount += backupData.data.overtimeBalances.length;
      console.log(`  ✓ OvertimeBalances: ${backupData.data.overtimeBalances.length}`);
    }

    // Restore compliance data
    if (backupData.data.complianceSettings) {
      for (const setting of backupData.data.complianceSettings) {
        await prisma.complianceSettings.create({ data: setting });
      }
      restoredCount += backupData.data.complianceSettings.length;
      console.log(`  ✓ ComplianceSettings: ${backupData.data.complianceSettings.length}`);
    }

    if (backupData.data.complianceViolations) {
      for (const violation of backupData.data.complianceViolations) {
        await prisma.complianceViolation.create({ data: violation });
      }
      restoredCount += backupData.data.complianceViolations.length;
      console.log(`  ✓ ComplianceViolations: ${backupData.data.complianceViolations.length}`);
    }

    // Restore invoices
    if (backupData.data.invoiceTemplates) {
      for (const template of backupData.data.invoiceTemplates) {
        await prisma.invoiceTemplate.create({ data: template });
      }
      restoredCount += backupData.data.invoiceTemplates.length;
      console.log(`  ✓ InvoiceTemplates: ${backupData.data.invoiceTemplates.length}`);
    }

    if (backupData.data.invoices) {
      for (const invoice of backupData.data.invoices) {
        await prisma.invoice.create({ data: invoice });
      }
      restoredCount += backupData.data.invoices.length;
      console.log(`  ✓ Invoices: ${backupData.data.invoices.length}`);
    }

    if (backupData.data.invoiceItems) {
      for (const item of backupData.data.invoiceItems) {
        await prisma.invoiceItem.create({ data: item });
      }
      restoredCount += backupData.data.invoiceItems.length;
      console.log(`  ✓ InvoiceItems: ${backupData.data.invoiceItems.length}`);
    }

    // Restore reminders
    if (backupData.data.reminders) {
      for (const reminder of backupData.data.reminders) {
        await prisma.reminder.create({ data: reminder });
      }
      restoredCount += backupData.data.reminders.length;
      console.log(`  ✓ Reminders: ${backupData.data.reminders.length}`);
    }

    if (backupData.data.reminderSettings) {
      for (const setting of backupData.data.reminderSettings) {
        await prisma.reminderSettings.create({ data: setting });
      }
      restoredCount += backupData.data.reminderSettings.length;
      console.log(`  ✓ ReminderSettings: ${backupData.data.reminderSettings.length}`);
    }

    // Restore incidents
    if (backupData.data.incidents) {
      for (const incident of backupData.data.incidents) {
        await prisma.incident.create({ data: incident });
      }
      restoredCount += backupData.data.incidents.length;
      console.log(`  ✓ Incidents: ${backupData.data.incidents.length}`);
    }

    if (backupData.data.incidentComments) {
      for (const comment of backupData.data.incidentComments) {
        await prisma.incidentComment.create({ data: comment });
      }
      restoredCount += backupData.data.incidentComments.length;
      console.log(`  ✓ IncidentComments: ${backupData.data.incidentComments.length}`);
    }

    // Restore workflows
    if (backupData.data.workflows) {
      for (const workflow of backupData.data.workflows) {
        await prisma.workflow.create({ data: workflow });
      }
      restoredCount += backupData.data.workflows.length;
      console.log(`  ✓ Workflows: ${backupData.data.workflows.length}`);
    }

    if (backupData.data.workflowSteps) {
      for (const step of backupData.data.workflowSteps) {
        await prisma.workflowStep.create({ data: step });
      }
      restoredCount += backupData.data.workflowSteps.length;
      console.log(`  ✓ WorkflowSteps: ${backupData.data.workflowSteps.length}`);
    }

    if (backupData.data.invoiceTemplateWorkflows) {
      for (const link of backupData.data.invoiceTemplateWorkflows) {
        await prisma.invoiceTemplateWorkflow.create({ data: link });
      }
      restoredCount += backupData.data.invoiceTemplateWorkflows.length;
      console.log(`  ✓ InvoiceTemplateWorkflows: ${backupData.data.invoiceTemplateWorkflows.length}`);
    }

    if (backupData.data.workflowInstances) {
      for (const instance of backupData.data.workflowInstances) {
        await prisma.workflowInstance.create({ data: instance });
      }
      restoredCount += backupData.data.workflowInstances.length;
      console.log(`  ✓ WorkflowInstances: ${backupData.data.workflowInstances.length}`);
    }

    if (backupData.data.workflowInstanceSteps) {
      for (const step of backupData.data.workflowInstanceSteps) {
        await prisma.workflowInstanceStep.create({ data: step });
      }
      restoredCount += backupData.data.workflowInstanceSteps.length;
      console.log(`  ✓ WorkflowInstanceSteps: ${backupData.data.workflowInstanceSteps.length}`);
    }

    // Restore intranet data (must be done in hierarchical order due to parentId constraint)
    if (backupData.data.documentNodes) {
      // Sort nodes by parentId (null first, then by parent hierarchy)
      const nodes = [...backupData.data.documentNodes];
      const sortedNodes: any[] = [];
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      
      // Recursive function to add nodes in correct order
      const addNodeWithChildren = (node: any) => {
        if (!sortedNodes.find(n => n.id === node.id)) {
          sortedNodes.push(node);
          // Find and add children
          nodes.filter(n => n.parentId === node.id).forEach(child => {
            addNodeWithChildren(child);
          });
        }
      };
      
      // Start with root nodes (parentId = null)
      nodes.filter(n => n.parentId === null).forEach(root => {
        addNodeWithChildren(root);
      });
      
      // Add any remaining nodes (in case of orphaned nodes)
      nodes.forEach(node => {
        if (!sortedNodes.find(n => n.id === node.id)) {
          sortedNodes.push(node);
        }
      });
      
      // Create nodes in correct order
      for (const node of sortedNodes) {
        await prisma.documentNode.create({ data: node });
      }
      restoredCount += backupData.data.documentNodes.length;
      console.log(`  ✓ DocumentNodes: ${backupData.data.documentNodes.length}`);
    }

    if (backupData.data.documentVersions) {
      for (const version of backupData.data.documentVersions) {
        await prisma.documentVersion.create({ data: version });
      }
      restoredCount += backupData.data.documentVersions.length;
      console.log(`  ✓ DocumentVersions: ${backupData.data.documentVersions.length}`);
    }

    if (backupData.data.documentNodeGroupPermissions) {
      for (const permission of backupData.data.documentNodeGroupPermissions) {
        await prisma.documentNodeGroupPermission.create({ data: permission });
      }
      restoredCount += backupData.data.documentNodeGroupPermissions.length;
      console.log(`  ✓ DocumentNodeGroupPermissions: ${backupData.data.documentNodeGroupPermissions.length}`);
    }

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

export const uploadBackup = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = req.file.originalname.endsWith('.json') ? 'json' : 'sql';
    const filename = `uploaded_backup_${timestamp}.${extension}`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Move uploaded file to backup directory
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

export const exportData = async (req: Request, res: Response) => {
  try {
    // Export all important data as JSON (without sensitive password data)
    const [
      users,
      userGroups,
      projects,
      customers,
      suppliers,
      articles,
      timeEntries,
      absenceRequests,
      invoices,
      incidents,
      documentNodes,
      documentVersions
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
          employeeProfile: {
            select: {
              vacationDays: true
            }
          }
        }
      }),
      prisma.userGroup.findMany(),
      prisma.project.findMany(),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
      prisma.article.findMany(),
      prisma.timeEntry.findMany(),
      prisma.absenceRequest.findMany(),
      prisma.invoice.findMany(),
      prisma.incident.findMany(),
      prisma.documentNode.findMany(),
      prisma.documentVersion.findMany()
    ]);

    const data = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      users,
      userGroups,
      projects,
      customers,
      suppliers,
      articles,
      timeEntries,
      absenceRequests,
      invoices,
      incidents,
      documentNodes,
      documentVersions
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="data_export_${new Date().toISOString()}.json"`);
    res.json(data);
  } catch (error: any) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data', details: error.message });
  }
};
