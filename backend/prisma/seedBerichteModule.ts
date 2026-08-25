import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULE_KEY = 'berichte';
/** "Berichte" ist als Anzeigename schon vom Auswertungs-Modul belegt. */
const MODULE_NAME = 'Rundgangsberichte';

/**
 * Legt das Modul "Berichte" an und gibt es den bestehenden Benutzergruppen
 * frei. Der eigentliche Datenzugriff bleibt zusaetzlich an die
 * Projektzuordnung des Benutzers gebunden.
 */
export async function seedBerichteModule() {
  console.log('📋 Seeding Berichte module...');

  const existing = await prisma.module.findUnique({
    where: { key: MODULE_KEY },
  });

  if (existing) {
    console.log('✅ Berichte module already exists');
    return;
  }

  // Module.name ist unique — der Name "Berichte" gehoert bereits dem
  // Auswertungs-Modul (key: 'reports'), daher "Rundgangsberichte".
  const nameTaken = await prisma.module.findUnique({
    where: { name: MODULE_NAME },
  });

  if (nameTaken) {
    throw new Error(
      `Der Modulname "${MODULE_NAME}" ist bereits vom Modul "${nameTaken.key}" belegt. ` +
        'Bitte MODULE_NAME in prisma/seedBerichteModule.ts anpassen.'
    );
  }

  const berichteModule = await prisma.module.create({
    data: {
      name: MODULE_NAME,
      key: MODULE_KEY,
      description: 'Toolbox-Rundgang / Tagesprotokolle je Projekt',
      icon: 'assignment',
      route: '/berichte',
      isActive: true,
      sortOrder: 41,
    },
  });

  console.log('✅ Berichte module created');

  const userGroups = await prisma.userGroup.findMany();

  for (const group of userGroups) {
    const isPrivileged = group.name === 'Admin' || group.name === 'Managers';

    await prisma.moduleAccess.create({
      data: {
        moduleId: berichteModule.id,
        userGroupId: group.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: isPrivileged,
      },
    });

    console.log(`  ✅ Access granted to group: ${group.name}`);
  }

  console.log('✅ Berichte module seeded successfully');
}

if (require.main === module) {
  seedBerichteModule()
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
