import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function createFullBackup() {
  try {
    console.log('🔄 Erstelle vollständiges Backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.json`;
    
    // Alle Daten laden
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
      systemSettings
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
      prisma.systemSettings.findMany()
    ]);

    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      schemaInfo: {
        tablesCount: 31,
        description: 'Complete database backup including all modules'
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
        systemSettings
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
        workflowsCount: workflows.length
      }
    };

    // Backup-Verzeichnis sicherstellen
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Backup schreiben
    const filepath = path.join(backupDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');
    
    const stats = fs.statSync(filepath);
    
    console.log('✅ Backup erfolgreich erstellt!');
    console.log('📄 Datei:', filename);
    console.log('📊 Größe:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('');
    console.log('Statistiken:');
    console.log('  - Benutzer:', users.length);
    console.log('  - Benutzergruppen:', userGroups.length);
    console.log('  - Module:', modules.length);
    console.log('  - Kunden:', customers.length);
    console.log('  - Lieferanten:', suppliers.length);
    console.log('  - Artikel:', articles.length);
    console.log('  - Projekte:', projects.length);
    console.log('  - Standorte:', locations.length);
    console.log('  - Zeiteinträge:', timeEntries.length);
    console.log('  - Abwesenheitsanträge:', absenceRequests.length);
    console.log('  - Rechnungen:', invoices.length);
    console.log('  - Vorfälle:', incidents.length);
    console.log('  - Workflows:', workflows.length);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Fehler beim Backup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createFullBackup();
