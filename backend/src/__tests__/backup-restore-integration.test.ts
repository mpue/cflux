import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('Backup & Restore Integration Test', () => {
  let backupFilePath: string;
  let testData: any = {};

  beforeAll(async () => {
    // Clean database before test
    await cleanDatabase();
    
    // Create comprehensive test data
    await createTestData();
    
    // Store original data counts for verification
    testData.counts = await getDataCounts();
  });

  afterAll(async () => {
    // Cleanup
    if (backupFilePath && fs.existsSync(backupFilePath)) {
      fs.unlinkSync(backupFilePath);
    }
    await prisma.$disconnect();
  });

  describe('Backup Creation', () => {
    it('should create a complete backup with all tables', async () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupFilePath = path.join(__dirname, `../../backups/test_backup_${timestamp}.json`);

      // Export all data
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
        // Message recipients included in messages
      ]);

      const backup = {
        version: '2.0',
        timestamp: new Date().toISOString(),
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
        }
      };

      // Save backup to file
      fs.writeFileSync(backupFilePath, JSON.stringify(backup, null, 2));

      expect(fs.existsSync(backupFilePath)).toBe(true);
      expect(backup.data.users.length).toBeGreaterThan(0);
      expect(backup.data.documentNodes.length).toBeGreaterThan(0);
      
      console.log('✅ Backup created with:');
      console.log(`   Users: ${users.length}`);
      console.log(`   DocumentNodes: ${documentNodes.length}`);
      console.log(`   DocumentVersions: ${documentVersions.length}`);
      console.log(`   DocumentPermissions: ${documentNodeGroupPermissions.length}`);
    });
  });

  describe('Data Modification', () => {
    it('should modify database to verify restore', async () => {
      // Delete some data to verify restore
      await prisma.documentNodeGroupPermission.deleteMany();
      await prisma.documentVersion.deleteMany();
      await prisma.documentNode.deleteMany();
      await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
      
      const counts = await getDataCounts();
      expect(counts.documentNodes).toBe(0);
      expect(counts.documentVersions).toBe(0);
      expect(counts.documentNodeGroupPermissions).toBe(0);
      
      console.log('✅ Data modified - Intranet tables cleared');
    });
  });

  describe('Backup Restore', () => {
    it('should restore all data from backup correctly', async () => {
      expect(fs.existsSync(backupFilePath)).toBe(true);
      
      const backupContent = fs.readFileSync(backupFilePath, 'utf-8');
      const backupData = JSON.parse(backupContent);

      // Clean database
      await cleanDatabase();

      // Verify database is empty
      const beforeCounts = await getDataCounts();
      expect(beforeCounts.documentNodes).toBe(0);

      // Restore all data in correct order
      console.log('🔄 Starting restore...');
      
      // System settings first
      if (backupData.data.systemSettings) {
        for (const setting of backupData.data.systemSettings) {
          await prisma.systemSettings.create({ data: setting });
        }
        console.log(`   ✓ SystemSettings: ${backupData.data.systemSettings.length}`);
      }

      // Users and groups
      if (backupData.data.users) {
        for (const user of backupData.data.users) {
          await prisma.user.create({ data: user });
        }
        console.log(`   ✓ Users: ${backupData.data.users.length}`);
      }

      if (backupData.data.userGroups) {
        for (const group of backupData.data.userGroups) {
          await prisma.userGroup.create({ data: group });
        }
        console.log(`   ✓ UserGroups: ${backupData.data.userGroups.length}`);
      }

      if (backupData.data.userGroupMemberships) {
        for (const membership of backupData.data.userGroupMemberships) {
          await prisma.userGroupMembership.create({ data: membership });
        }
        console.log(`   ✓ UserGroupMemberships: ${backupData.data.userGroupMemberships.length}`);
      }

      // Modules
      if (backupData.data.modules) {
        for (const module of backupData.data.modules) {
          await prisma.module.create({ data: module });
        }
        console.log(`   ✓ Modules: ${backupData.data.modules.length}`);
      }

      if (backupData.data.moduleAccess) {
        for (const access of backupData.data.moduleAccess) {
          await prisma.moduleAccess.create({ data: access });
        }
        console.log(`   ✓ ModuleAccess: ${backupData.data.moduleAccess.length}`);
      }

      // Business entities
      if (backupData.data.customers) {
        for (const customer of backupData.data.customers) {
          await prisma.customer.create({ data: customer });
        }
        console.log(`   ✓ Customers: ${backupData.data.customers.length}`);
      }

      if (backupData.data.suppliers) {
        for (const supplier of backupData.data.suppliers) {
          await prisma.supplier.create({ data: supplier });
        }
        console.log(`   ✓ Suppliers: ${backupData.data.suppliers.length}`);
      }

      // Articles
      if (backupData.data.articleGroups) {
        for (const group of backupData.data.articleGroups) {
          await prisma.articleGroup.create({ data: group });
        }
        console.log(`   ✓ ArticleGroups: ${backupData.data.articleGroups.length}`);
      }

      if (backupData.data.articles) {
        for (const article of backupData.data.articles) {
          await prisma.article.create({ data: article });
        }
        console.log(`   ✓ Articles: ${backupData.data.articles.length}`);
      }

      // Projects
      if (backupData.data.projects) {
        for (const project of backupData.data.projects) {
          await prisma.project.create({ data: project });
        }
        console.log(`   ✓ Projects: ${backupData.data.projects.length}`);
      }

      if (backupData.data.locations) {
        for (const location of backupData.data.locations) {
          await prisma.location.create({ data: location });
        }
        console.log(`   ✓ Locations: ${backupData.data.locations.length}`);
      }

      if (backupData.data.projectAssignments) {
        for (const assignment of backupData.data.projectAssignments) {
          await prisma.projectAssignment.create({ data: assignment });
        }
        console.log(`   ✓ ProjectAssignments: ${backupData.data.projectAssignments.length}`);
      }

      // Time tracking
      if (backupData.data.timeEntries) {
        for (const entry of backupData.data.timeEntries) {
          await prisma.timeEntry.create({ data: entry });
        }
        console.log(`   ✓ TimeEntries: ${backupData.data.timeEntries.length}`);
      }

      if (backupData.data.absenceRequests) {
        for (const absence of backupData.data.absenceRequests) {
          await prisma.absenceRequest.create({ data: absence });
        }
        console.log(`   ✓ AbsenceRequests: ${backupData.data.absenceRequests.length}`);
      }

      if (backupData.data.holidays) {
        for (const holiday of backupData.data.holidays) {
          await prisma.holiday.create({ data: holiday });
        }
        console.log(`   ✓ Holidays: ${backupData.data.holidays.length}`);
      }

      if (backupData.data.overtimeBalances) {
        for (const balance of backupData.data.overtimeBalances) {
          await prisma.overtimeBalance.create({ data: balance });
        }
        console.log(`   ✓ OvertimeBalances: ${backupData.data.overtimeBalances.length}`);
      }

      // Compliance
      if (backupData.data.complianceSettings) {
        for (const setting of backupData.data.complianceSettings) {
          await prisma.complianceSettings.create({ data: setting });
        }
        console.log(`   ✓ ComplianceSettings: ${backupData.data.complianceSettings.length}`);
      }

      if (backupData.data.complianceViolations) {
        for (const violation of backupData.data.complianceViolations) {
          await prisma.complianceViolation.create({ data: violation });
        }
        console.log(`   ✓ ComplianceViolations: ${backupData.data.complianceViolations.length}`);
      }

      // Invoices
      if (backupData.data.invoiceTemplates) {
        for (const template of backupData.data.invoiceTemplates) {
          await prisma.invoiceTemplate.create({ data: template });
        }
        console.log(`   ✓ InvoiceTemplates: ${backupData.data.invoiceTemplates.length}`);
      }

      if (backupData.data.invoices) {
        for (const invoice of backupData.data.invoices) {
          await prisma.invoice.create({ data: invoice });
        }
        console.log(`   ✓ Invoices: ${backupData.data.invoices.length}`);
      }

      if (backupData.data.invoiceItems) {
        for (const item of backupData.data.invoiceItems) {
          await prisma.invoiceItem.create({ data: item });
        }
        console.log(`   ✓ InvoiceItems: ${backupData.data.invoiceItems.length}`);
      }

      // Reminders
      if (backupData.data.reminders) {
        for (const reminder of backupData.data.reminders) {
          await prisma.reminder.create({ data: reminder });
        }
        console.log(`   ✓ Reminders: ${backupData.data.reminders.length}`);
      }

      if (backupData.data.reminderSettings) {
        for (const setting of backupData.data.reminderSettings) {
          await prisma.reminderSettings.create({ data: setting });
        }
        console.log(`   ✓ ReminderSettings: ${backupData.data.reminderSettings.length}`);
      }

      // Incidents
      if (backupData.data.incidents) {
        for (const incident of backupData.data.incidents) {
          await prisma.incident.create({ data: incident });
        }
        console.log(`   ✓ Incidents: ${backupData.data.incidents.length}`);
      }

      if (backupData.data.incidentComments) {
        for (const comment of backupData.data.incidentComments) {
          await prisma.incidentComment.create({ data: comment });
        }
        console.log(`   ✓ IncidentComments: ${backupData.data.incidentComments.length}`);
      }

      // Workflows
      if (backupData.data.workflows) {
        for (const workflow of backupData.data.workflows) {
          await prisma.workflow.create({ data: workflow });
        }
        console.log(`   ✓ Workflows: ${backupData.data.workflows.length}`);
      }

      if (backupData.data.workflowSteps) {
        for (const step of backupData.data.workflowSteps) {
          await prisma.workflowStep.create({ data: step });
        }
        console.log(`   ✓ WorkflowSteps: ${backupData.data.workflowSteps.length}`);
      }

      if (backupData.data.invoiceTemplateWorkflows) {
        for (const itw of backupData.data.invoiceTemplateWorkflows) {
          await prisma.invoiceTemplateWorkflow.create({ data: itw });
        }
        console.log(`   ✓ InvoiceTemplateWorkflows: ${backupData.data.invoiceTemplateWorkflows.length}`);
      }

      if (backupData.data.workflowInstances) {
        for (const instance of backupData.data.workflowInstances) {
          await prisma.workflowInstance.create({ data: instance });
        }
        console.log(`   ✓ WorkflowInstances: ${backupData.data.workflowInstances.length}`);
      }

      if (backupData.data.workflowInstanceSteps) {
        for (const step of backupData.data.workflowInstanceSteps) {
          await prisma.workflowInstanceStep.create({ data: step });
        }
        console.log(`   ✓ WorkflowInstanceSteps: ${backupData.data.workflowInstanceSteps.length}`);
      }

      // Messages (commented out for now)
      // if (backupData.data.messages) {
      //   for (const message of backupData.data.messages) {
      //     await prisma.message.create({ data: message });
      //   }
      //   console.log(`   ✓ Messages: ${backupData.data.messages.length}`);
      // }

      // MessageRecipients removed from schema

      // CRITICAL: Intranet data with hierarchical restore
      if (backupData.data.documentNodes) {
        const nodes = [...backupData.data.documentNodes];
        const sortedNodes: any[] = [];
        
        // Recursive function to add nodes in correct order
        const addNodeWithChildren = (node: any) => {
          if (!sortedNodes.find(n => n.id === node.id)) {
            sortedNodes.push(node);
            nodes.filter(n => n.parentId === node.id).forEach(child => {
              addNodeWithChildren(child);
            });
          }
        };
        
        // Start with root nodes
        nodes.filter(n => n.parentId === null).forEach(root => {
          addNodeWithChildren(root);
        });
        
        // Add any remaining nodes
        nodes.forEach(node => {
          if (!sortedNodes.find(n => n.id === node.id)) {
            sortedNodes.push(node);
          }
        });
        
        // Create nodes in correct hierarchical order
        for (const node of sortedNodes) {
          await prisma.documentNode.create({ data: node });
        }
        console.log(`   ✓ DocumentNodes: ${backupData.data.documentNodes.length} (hierarchical)`);
      }

      if (backupData.data.documentVersions) {
        for (const version of backupData.data.documentVersions) {
          await prisma.documentVersion.create({ data: version });
        }
        console.log(`   ✓ DocumentVersions: ${backupData.data.documentVersions.length}`);
      }

      if (backupData.data.documentNodeGroupPermissions) {
        for (const permission of backupData.data.documentNodeGroupPermissions) {
          await prisma.documentNodeGroupPermission.create({ data: permission });
        }
        console.log(`   ✓ DocumentNodeGroupPermissions: ${backupData.data.documentNodeGroupPermissions.length}`);
      }

      console.log('✅ Restore completed');

      // Verify restored data
      const afterCounts = await getDataCounts();
      
      expect(afterCounts.users).toBe(testData.counts.users);
      expect(afterCounts.userGroups).toBe(testData.counts.userGroups);
      expect(afterCounts.documentNodes).toBe(testData.counts.documentNodes);
      expect(afterCounts.documentVersions).toBe(testData.counts.documentVersions);
      expect(afterCounts.documentNodeGroupPermissions).toBe(testData.counts.documentNodeGroupPermissions);
      
      console.log('✅ Data counts verified - All matches!');
    });

    it('should restore hierarchical DocumentNode structure correctly', async () => {
      // Verify parent-child relationships
      const rootNodes = await prisma.documentNode.findMany({
        where: { parentId: null }
      });
      
      expect(rootNodes.length).toBeGreaterThan(0);
      
      for (const root of rootNodes) {
        const children = await prisma.documentNode.findMany({
          where: { parentId: root.id }
        });
        
        console.log(`   Root node "${root.title}" has ${children.length} children`);
        
        // Verify each child can access its parent
        for (const child of children) {
          const parent = await prisma.documentNode.findUnique({
            where: { id: child.parentId! }
          });
          expect(parent).toBeDefined();
          expect(parent?.id).toBe(root.id);
        }
      }
      
      console.log('✅ DocumentNode hierarchy validated');
    });

    it('should restore DocumentVersions with correct node references', async () => {
      const versions = await prisma.documentVersion.findMany();
      
      for (const version of versions) {
        const node = await prisma.documentNode.findUnique({
          where: { id: version.documentNodeId }
        });
        
        expect(node).toBeDefined();
        console.log(`   Version for node "${node?.title}" verified`);
      }
      
      console.log('✅ DocumentVersion references validated');
    });

    it('should restore DocumentNodeGroupPermissions with correct references', async () => {
      const permissions = await prisma.documentNodeGroupPermission.findMany();
      
      for (const permission of permissions) {
        const node = await prisma.documentNode.findUnique({
          where: { id: permission.documentNodeId }
        });
        const group = await prisma.userGroup.findUnique({
          where: { id: permission.userGroupId }
        });
        
        expect(node).toBeDefined();
        expect(group).toBeDefined();
        console.log(`   Permission: Group "${group?.name}" → Node "${node?.title}" (${permission.permissionLevel})`);
      }
      
      console.log('✅ DocumentNodeGroupPermission references validated');
    });
  });
});

// Helper functions
async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  // Delete in reverse dependency order
  // Messages commented out for now
  // await prisma.message.deleteMany();
  // MessageRecipients removed from schema
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
  await prisma.moduleAccess.deleteMany();
  await prisma.module.deleteMany();
  await prisma.userGroupMembership.deleteMany();
  await prisma.userGroup.deleteMany();
  await prisma.documentNodeGroupPermission.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.documentNode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();
  
  console.log('✅ Database cleaned');
}

async function createTestData() {
  console.log('🔨 Creating test data...');
  
  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'test.admin@example.com',
      firstName: 'Test',
      lastName: 'Admin',
      password: 'hashed_password',
      role: 'ADMIN',
      weeklyHours: 40,
      vacationDays: 25
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'test.user@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashed_password',
      role: 'USER',
      weeklyHours: 40,
      vacationDays: 25
    }
  });

  // Create user groups
  const group1 = await prisma.userGroup.create({
    data: {
      name: 'Test Entwicklung',
      description: 'Test group for development',
      color: '#2196F3'
    }
  });

  const group2 = await prisma.userGroup.create({
    data: {
      name: 'Test Management',
      description: 'Test group for management',
      color: '#FF9800'
    }
  });

  // Add users to groups
  await prisma.userGroupMembership.create({
    data: { userId: user1.id, userGroupId: group1.id }
  });

  await prisma.userGroupMembership.create({
    data: { userId: user2.id, userGroupId: group2.id }
  });

  // Create document nodes with hierarchy
  const rootNode = await prisma.documentNode.create({
    data: {
      title: 'Test Root',
      type: 'FOLDER',
      createdById: user1.id,
      updatedById: user1.id
    }
  });

  const childNode1 = await prisma.documentNode.create({
    data: {
      title: 'Test Child 1',
      type: 'DOCUMENT',
      parentId: rootNode.id,
      createdById: user1.id,
      updatedById: user1.id
    }
  });

  const childNode2 = await prisma.documentNode.create({
    data: {
      title: 'Test Child 2',
      type: 'FOLDER',
      parentId: rootNode.id,
      createdById: user1.id,
      updatedById: user1.id
    }
  });

  const grandchildNode = await prisma.documentNode.create({
    data: {
      title: 'Test Grandchild',
      type: 'DOCUMENT',
      parentId: childNode2.id,
      createdById: user1.id,
      updatedById: user1.id
    }
  });

  // Create document versions
  await prisma.documentVersion.create({
    data: {
      documentNodeId: childNode1.id,
      version: 1,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content 1' }] }] }),
      createdById: user1.id
    }
  });

  await prisma.documentVersion.create({
    data: {
      documentNodeId: grandchildNode.id,
      version: 1,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content 2' }] }] }),
      createdById: user1.id
    }
  });

  // Create document permissions
  await prisma.documentNodeGroupPermission.create({
    data: {
      documentNodeId: rootNode.id,
      userGroupId: group1.id,
      permissionLevel: 'WRITE'
    }
  });

  await prisma.documentNodeGroupPermission.create({
    data: {
      documentNodeId: childNode1.id,
      userGroupId: group2.id,
      permissionLevel: 'READ'
    }
  });

  console.log('✅ Test data created:');
  console.log(`   Users: 2`);
  console.log(`   Groups: 2`);
  console.log(`   DocumentNodes: 4 (1 root, 2 children, 1 grandchild)`);
  console.log(`   DocumentVersions: 2`);
  console.log(`   Permissions: 2`);
}

async function getDataCounts() {
  const [
    users,
    userGroups,
    userGroupMemberships,
    documentNodes,
    documentVersions,
    documentNodeGroupPermissions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userGroup.count(),
    prisma.userGroupMembership.count(),
    prisma.documentNode.count(),
    prisma.documentVersion.count(),
    prisma.documentNodeGroupPermission.count()
  ]);

  return {
    users,
    userGroups,
    userGroupMemberships,
    documentNodes,
    documentVersions,
    documentNodeGroupPermissions
  };
}
