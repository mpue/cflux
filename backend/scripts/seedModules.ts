import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script to initialize default modules in the system
 */
async function seedModules() {
  console.log('Seeding modules...');

  const modules = [
    {
      name: 'Dashboard',
      key: 'dashboard',
      description: 'Übersichtsseite mit wichtigen Informationen',
      icon: 'dashboard',
      route: '/',
      sortOrder: 0,
    },
    {
      name: 'Zeiterfassung',
      key: 'time_tracking',
      description: 'Zeit- und Anwesenheitsverwaltung',
      icon: 'schedule',
      route: '/time',
      sortOrder: 1,
    },
    {
      name: 'Projekte',
      key: 'projects',
      description: 'Projektverwaltung',
      icon: 'folder',
      route: '/projects',
      sortOrder: 2,
    },
    {
      name: 'Kunden',
      key: 'customers',
      description: 'Kundenverwaltung',
      icon: 'people',
      route: '/customers',
      sortOrder: 3,
    },
    {
      name: 'Lieferanten',
      key: 'suppliers',
      description: 'Lieferantenverwaltung',
      icon: 'local_shipping',
      route: '/suppliers',
      sortOrder: 4,
    },
    {
      name: 'Abteilungen',
      key: 'departments',
      description: 'Abteilungsverwaltung',
      icon: 'business',
      route: '/departments',
      sortOrder: 5,
    },
    {
      name: 'Artikel',
      key: 'articles',
      description: 'Artikel- und Produktverwaltung',
      icon: 'inventory',
      route: '/articles',
      sortOrder: 6,
    },
    {
      name: 'Rechnungen',
      key: 'invoices',
      description: 'Rechnungsverwaltung',
      icon: 'receipt',
      route: '/invoices',
      sortOrder: 6,
    },
    {
      name: 'Mahnungen',
      key: 'reminders',
      description: 'Mahnwesen',
      icon: 'warning',
      route: '/reminders',
      sortOrder: 7,
    },
    {
      name: 'Abwesenheiten',
      key: 'absences',
      description: 'Urlaubsverwaltung und Abwesenheiten',
      icon: 'event_busy',
      route: '/absences',
      sortOrder: 8,
    },
    {
      name: 'Berichte',
      key: 'reports',
      description: 'Auswertungen und Berichte',
      icon: 'assessment',
      route: '/reports',
      sortOrder: 9,
    },
    {
      name: 'Compliance',
      key: 'compliance',
      description: 'Arbeitszeit-Compliance (Schweiz)',
      icon: 'policy',
      route: '/compliance',
      sortOrder: 10,
    },
    {
      name: 'Vorfälle',
      key: 'incidents',
      description: 'Incident Management',
      icon: 'bug_report',
      route: '/incidents',
      sortOrder: 11,
    },
    {
      name: 'Benutzer',
      key: 'users',
      description: 'Benutzerverwaltung',
      icon: 'person',
      route: '/users',
      sortOrder: 12,
    },
    {
      name: 'Benutzergruppen',
      key: 'user_groups',
      description: 'Benutzergruppenverwaltung',
      icon: 'groups',
      route: '/user-groups',
      sortOrder: 13,
    },
    {
      name: 'Module',
      key: 'modules',
      description: 'Modulverwaltung und Berechtigungen',
      icon: 'apps',
      route: '/modules',
      sortOrder: 14,
    },
    {
      name: 'Einstellungen',
      key: 'settings',
      description: 'Systemeinstellungen',
      icon: 'settings',
      route: '/settings',
      sortOrder: 15,
    },
    {
      name: 'Dokumente',
      key: 'intranet',
      description: 'Dokumentenverwaltung und Wissensdatenbank',
      icon: 'folder_shared',
      route: '/admin?tab=dokumente',
      sortOrder: 16,
    },
    {
      name: 'Kostenstellen',
      key: 'cost_centers',
      description: 'Kostenstellenverwaltung',
      icon: 'account_balance',
      route: '/cost-centers',
      sortOrder: 17,
    },
    {
      name: 'Lagerbestand',
      key: 'inventory',
      description: 'Lagerverwaltung und Bestandsübersicht',
      icon: 'warehouse',
      route: '/inventory',
      sortOrder: 18,
    },
    {
      name: 'Projekt-Budget',
      key: 'project_budget',
      description: 'Projektbudget-Planung und -Überwachung',
      icon: 'account_balance_wallet',
      route: '/project-budget',
      sortOrder: 19,
    },
    {
      name: 'Projekt-Reports',
      key: 'project_reports',
      description: 'Umfassende Projekt-Berichte und Analysen',
      icon: 'assessment',
      route: '/project-reports',
      sortOrder: 20,
    },
    {
      name: 'Projektplanung',
      key: 'project_planning',
      description: 'Grafischer Gantt-Chart Editor für Projektplanung',
      icon: 'timeline',
      route: '/project-planning',
      sortOrder: 21,
    },
    {
      name: 'E-Learning',
      key: 'elearning',
      description: 'Schulungsmanagement und Online-Kurse',
      icon: 'school',
      route: '/elearning',
      sortOrder: 22,
    },
    {
      name: 'Onboarding',
      key: 'onboarding',
      description: 'Bewerberverwaltung und Mitarbeiter-Onboarding',
      icon: 'person_add',
      route: '/onboarding',
      sortOrder: 23,
    },
    {
      name: 'Funktionen',
      key: 'job_functions',
      description: 'Jobbeschreibungen und Funktionsdefinitionen',
      icon: 'work',
      route: '/admin/job-functions',
      sortOrder: 24,
    },
    {
      name: 'Checklisten',
      key: 'checklists',
      description: 'Vorlagen und Instanzen für Onboarding, Offboarding, Audits und mehr',
      icon: 'checklist',
      route: '/checklists',
      sortOrder: 25,
    },
    {
      name: 'System Logs',
      key: 'system_logs',
      description: 'System-Aktivitätsprotokolle und Workflow-Actions',
      icon: 'receipt_long',
      route: '/admin?tab=systemLogs',
      sortOrder: 26,
    },
    {
      name: 'Standorte',
      key: 'locations',
      description: 'Standort- und Betriebsstättenverwaltung',
      icon: 'location_on',
      route: '/admin?tab=locations',
      sortOrder: 27,
    },
    {
      name: 'Geräte',
      key: 'devices',
      description: 'Geräte- und Inventarverwaltung',
      icon: 'devices',
      route: '/admin?tab=devices',
      sortOrder: 28,
    },
    {
      name: 'Workflows',
      key: 'workflows',
      description: 'Workflow-Engine und Genehmigungsprozesse',
      icon: 'account_tree',
      route: '/admin?tab=workflows',
      sortOrder: 29,
    },
    {
      name: 'Bestellungen',
      key: 'orders',
      description: 'Bestellwesen und Beschaffung',
      icon: 'shopping_cart',
      route: '/admin?tab=orders',
      sortOrder: 30,
    },
    {
      name: 'Reisespesen',
      key: 'travel_expenses',
      description: 'Reisekostenabrechnung und Spesenverwaltung',
      icon: 'flight',
      route: '/admin?tab=travelExpenses',
      sortOrder: 31,
    },
    {
      name: 'Lohnabrechnung',
      key: 'payroll',
      description: 'Lohn- und Gehaltsabrechnung',
      icon: 'payments',
      route: '/admin?tab=payroll',
      sortOrder: 32,
    },
    {
      name: 'Zeitmodelle',
      key: 'zeitmodelle',
      description: 'Arbeitszeitmodelle und Schichtpläne',
      icon: 'schedule',
      route: '/admin?tab=zeitmodelle',
      sortOrder: 33,
    },
    {
      name: 'News',
      key: 'news',
      description: 'News-Verwaltung und Unternehmensnachrichten',
      icon: 'article',
      route: '/admin?tab=news',
      sortOrder: 34,
    },
    {
      name: 'Feiertage',
      key: 'holidays',
      description: 'Feiertagsverwaltung nach Kantonen',
      icon: 'event',
      route: '/admin?tab=holidays',
      sortOrder: 35,
    },
    {
      name: 'Chat',
      key: 'chat',
      description: 'Echtzeit-Chat mit Kollegen',
      icon: 'chat',
      route: '/chat',
      sortOrder: 36,
    },
    {
      name: 'Nachrichten',
      key: 'messages',
      description: 'Internes Nachrichtensystem',
      icon: 'mail',
      route: '/messages',
      sortOrder: 37,
    },
    {
      name: 'Genehmigungen',
      key: 'workflow',
      description: 'Genehmigungen und Workflow-Aufgaben',
      icon: 'approval',
      route: '/my-approvals',
      sortOrder: 38,
    },
    {
      name: 'Geplante Aufgaben',
      key: 'scheduled_tasks',
      description: 'Automatisierte Aufgaben und Cron-Jobs verwalten',
      icon: 'schedule_send',
      route: '/admin?tab=scheduledTasks',
      sortOrder: 39,
    },
  ];

  for (const module of modules) {
    const existing = await prisma.module.findUnique({
      where: { key: module.key },
    });

    if (!existing) {
      await prisma.module.create({
        data: module,
      });
      console.log(`Created module: ${module.name}`);
    } else {
      console.log(`Module already exists: ${module.name}`);
    }
  }

  console.log('Module seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedModules()
    .catch((error) => {
      console.error('Error seeding modules:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedModules };
