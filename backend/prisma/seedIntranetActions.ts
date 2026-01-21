import { PrismaClient, ActionCategory } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed System Actions for Intranet Document Approval Workflow
 */
async function seedIntranetActions() {
  console.log('Seeding Intranet System Actions...');

  const actions = [
    {
      actionKey: 'intranet.document.created',
      displayName: 'Intranet-Dokument erstellt',
      description: 'Wird ausgelöst, wenn ein neues Intranet-Dokument erstellt wird',
      category: ActionCategory.DOCUMENTS,
      contextSchema: JSON.stringify({
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          type: { type: 'string', enum: ['FOLDER', 'DOCUMENT', 'LINK'] },
          createdById: { type: 'string' },
          parentId: { type: 'string', nullable: true }
        }
      }),
      isActive: true,
      isSystem: true
    },
    {
      actionKey: 'intranet.document.submitted',
      displayName: 'Intranet-Dokument zur Freigabe eingereicht',
      description: 'Wird ausgelöst, wenn ein Dokument zur Freigabe eingereicht wird',
      category: ActionCategory.DOCUMENTS,
      contextSchema: JSON.stringify({
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          submittedById: { type: 'string' },
          workflowInstanceId: { type: 'string', nullable: true }
        }
      }),
      isActive: true,
      isSystem: true
    },
    {
      actionKey: 'intranet.document.approved',
      displayName: 'Intranet-Dokument freigegeben',
      description: 'Wird ausgelöst, wenn ein Dokument freigegeben wird',
      category: ActionCategory.DOCUMENTS,
      contextSchema: JSON.stringify({
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          approvedById: { type: 'string' },
          approvedAt: { type: 'string', format: 'date-time' }
        }
      }),
      isActive: true,
      isSystem: true
    },
    {
      actionKey: 'intranet.document.rejected',
      displayName: 'Intranet-Dokument abgelehnt',
      description: 'Wird ausgelöst, wenn ein Dokument abgelehnt wird',
      category: ActionCategory.DOCUMENTS,
      contextSchema: JSON.stringify({
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          rejectedById: { type: 'string' },
          rejectedAt: { type: 'string', format: 'date-time' },
          rejectionReason: { type: 'string', nullable: true }
        }
      }),
      isActive: true,
      isSystem: true
    },
    {
      actionKey: 'intranet.document.published',
      displayName: 'Intranet-Dokument veröffentlicht',
      description: 'Wird ausgelöst, wenn ein Dokument veröffentlicht wird',
      category: ActionCategory.DOCUMENTS,
      contextSchema: JSON.stringify({
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          publishedAt: { type: 'string', format: 'date-time' }
        }
      }),
      isActive: true,
      isSystem: true
    },
    {
      actionKey: 'intranet.document.updated',
      displayName: 'Intranet-Dokument aktualisiert',
      description: 'Wird ausgelöst, wenn ein Dokument aktualisiert wird',
      category: ActionCategory.DOCUMENTS,
      contextSchema: JSON.stringify({
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          updatedById: { type: 'string' },
          previousVersion: { type: 'integer' },
          currentVersion: { type: 'integer' }
        }
      }),
      isActive: true,
      isSystem: true
    },
    {
      actionKey: 'intranet.document.deleted',
      displayName: 'Intranet-Dokument gelöscht',
      description: 'Wird ausgelöst, wenn ein Dokument gelöscht wird',
      category: ActionCategory.DOCUMENTS,
      contextSchema: JSON.stringify({
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          deletedById: { type: 'string' }
        }
      }),
      isActive: true,
      isSystem: true
    }
  ];

  for (const action of actions) {
    const existing = await prisma.systemAction.findUnique({
      where: { actionKey: action.actionKey }
    });

    if (!existing) {
      await prisma.systemAction.create({ data: action });
      console.log(`✓ Created action: ${action.displayName}`);
    } else {
      await prisma.systemAction.update({
        where: { actionKey: action.actionKey },
        data: action
      });
      console.log(`✓ Updated action: ${action.displayName}`);
    }
  }

  console.log('Intranet System Actions seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedIntranetActions()
    .catch((error) => {
      console.error('Error seeding intranet actions:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedIntranetActions };
