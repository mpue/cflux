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
      name: 'Artikel',
      key: 'articles',
      description: 'Artikel- und Produktverwaltung',
      icon: 'inventory',
      route: '/articles',
      sortOrder: 5,
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
      name: 'Intranet',
      key: 'intranet',
      description: 'Intranet und Wissensdatenbank',
      icon: 'folder_shared',
      route: '/intranet',
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
