import { PrismaClient, ActionCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface SystemActionData {
  actionKey: string;
  displayName: string;
  description?: string;
  category?: ActionCategory;
  contextSchema?: any;
  isSystem?: boolean;
}

async function seedActions() {
  console.log('🌱 Seeding System Actions...');

  try {
    const actions: SystemActionData[] = [
      // Authentication
      {
        actionKey: 'user.login',
        displayName: 'Benutzer meldet sich an',
        description: 'Wird ausgelöst wenn sich ein Benutzer erfolgreich anmeldet',
        category: 'AUTHENTICATION',
        isSystem: true,
        contextSchema: {
          userId: 'string',
          email: 'string',
          timestamp: 'string',
        },
      },
      {
        actionKey: 'user.logout',
        displayName: 'Benutzer meldet sich ab',
        description: 'Wird ausgelöst wenn sich ein Benutzer abmeldet',
        category: 'AUTHENTICATION',
        isSystem: true,
      },

      // Time Tracking
      {
        actionKey: 'timeentry.clockin',
        displayName: 'Benutzer stempelt sich ein',
        description: 'Wird ausgelöst wenn sich ein Benutzer einstempelt',
        category: 'TIME_TRACKING',
        isSystem: true,
        contextSchema: {
          userId: 'string',
          timeEntryId: 'string',
          clockIn: 'string',
        },
      },
      {
        actionKey: 'timeentry.clockout',
        displayName: 'Benutzer stempelt sich aus',
        description: 'Wird ausgelöst wenn sich ein Benutzer ausstempelt',
        category: 'TIME_TRACKING',
        isSystem: true,
        contextSchema: {
          userId: 'string',
          timeEntryId: 'string',
          clockOut: 'string',
          totalHours: 'number',
        },
      },

      // Orders
      {
        actionKey: 'order.created',
        displayName: 'Bestellung anlegen',
        description: 'Wird ausgelöst wenn eine neue Bestellung erstellt wird',
        category: 'ORDERS',
        isSystem: true,
        contextSchema: {
          orderId: 'string',
          orderNumber: 'string',
          requestedBy: 'string',
          totalAmount: 'number',
        },
      },
      {
        actionKey: 'order.approved',
        displayName: 'Bestellung genehmigt',
        description: 'Wird ausgelöst wenn eine Bestellung genehmigt wird',
        category: 'ORDERS',
        isSystem: true,
      },
      {
        actionKey: 'order.rejected',
        displayName: 'Bestellung abgelehnt',
        description: 'Wird ausgelöst wenn eine Bestellung abgelehnt wird',
        category: 'ORDERS',
        isSystem: true,
      },
      {
        actionKey: 'order.ordered',
        displayName: 'Bestellung bestellt',
        description: 'Wird ausgelöst wenn eine Bestellung tatsächlich bestellt wird',
        category: 'ORDERS',
        isSystem: true,
      },

      // Invoices
      {
        actionKey: 'invoice.created',
        displayName: 'Rechnung erstellt',
        description: 'Wird ausgelöst wenn eine neue Rechnung erstellt wird',
        category: 'INVOICES',
        isSystem: true,
        contextSchema: {
          invoiceId: 'string',
          invoiceNumber: 'string',
          customerId: 'string',
          totalAmount: 'number',
        },
      },
      {
        actionKey: 'invoice.sent',
        displayName: 'Rechnung auf versendet setzen',
        description: 'Wird ausgelöst wenn eine Rechnung auf Status SENT gesetzt wird',
        category: 'INVOICES',
        isSystem: true,
      },
      {
        actionKey: 'invoice.paid',
        displayName: 'Rechnung bezahlt',
        description: 'Wird ausgelöst wenn eine Rechnung als bezahlt markiert wird',
        category: 'INVOICES',
        isSystem: true,
      },
      {
        actionKey: 'invoice.cancelled',
        displayName: 'Rechnung storniert',
        description: 'Wird ausgelöst wenn eine Rechnung storniert wird',
        category: 'INVOICES',
        isSystem: true,
      },

      // Users
      {
        actionKey: 'user.created',
        displayName: 'Benutzer angelegt',
        description: 'Wird ausgelöst wenn ein neuer Benutzer angelegt wird',
        category: 'USERS',
        isSystem: true,
      },
      {
        actionKey: 'user.updated',
        displayName: 'Benutzer bearbeitet',
        description: 'Wird ausgelöst wenn ein Benutzer bearbeitet wird',
        category: 'USERS',
        isSystem: true,
      },
      {
        actionKey: 'user.deleted',
        displayName: 'Benutzer gelöscht',
        description: 'Wird ausgelöst wenn ein Benutzer gelöscht wird',
        category: 'USERS',
        isSystem: true,
      },

      // Documents
      {
        actionKey: 'document.created',
        displayName: 'Dokument erstellt',
        description: 'Wird ausgelöst wenn ein neues Dokument erstellt wird',
        category: 'DOCUMENTS',
        isSystem: true,
      },
      {
        actionKey: 'document.updated',
        displayName: 'Dokument bearbeitet',
        description: 'Wird ausgelöst wenn ein Dokument bearbeitet wird',
        category: 'DOCUMENTS',
        isSystem: true,
      },

      // Incidents
      {
        actionKey: 'incident.created',
        displayName: 'Vorfall gemeldet',
        description: 'Wird ausgelöst wenn ein neuer Vorfall gemeldet wird',
        category: 'INCIDENTS',
        isSystem: true,
      },
      {
        actionKey: 'incident.approved',
        displayName: 'Vorfall genehmigt',
        description: 'Wird ausgelöst wenn ein Vorfall genehmigt wird',
        category: 'INCIDENTS',
        isSystem: true,
      },

      // Compliance
      {
        actionKey: 'compliance.violation',
        displayName: 'Compliance-Verstoß erkannt',
        description: 'Wird ausgelöst wenn ein Compliance-Verstoß erkannt wird',
        category: 'COMPLIANCE',
        isSystem: true,
      },
    ];

    const created = [];
    
    for (const action of actions) {
      const existing = await prisma.systemAction.findUnique({
        where: { actionKey: action.actionKey },
      });

      if (!existing) {
        const newAction = await prisma.systemAction.create({
          data: {
            actionKey: action.actionKey,
            displayName: action.displayName,
            description: action.description,
            category: action.category || 'CUSTOM',
            contextSchema: action.contextSchema ? JSON.stringify(action.contextSchema) : null,
            isSystem: action.isSystem || false,
          },
        });
        created.push(newAction);
        console.log(`✓ Created system action: ${action.actionKey}`);
      }
    }

    console.log(`✅ System Actions seeded successfully (${created.length} new actions)`);
  } catch (error) {
    console.error('❌ Error seeding system actions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedActions();
