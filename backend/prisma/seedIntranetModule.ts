import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Registering INTRANET module...');

  // Create or update INTRANET module
  const intranetModule = await prisma.module.upsert({
    where: { key: 'INTRANET' },
    update: {
      name: 'Intranet',
      description: 'Firmen-Intranet mit Dokumentenverwaltung',
      icon: '📚',
      route: '/intranet',
      isActive: true,
      sortOrder: 100,
    },
    create: {
      key: 'INTRANET',
      name: 'Intranet',
      description: 'Firmen-Intranet mit Dokumentenverwaltung',
      icon: '📚',
      route: '/intranet',
      isActive: true,
      sortOrder: 100,
    },
  });

  console.log('✅ INTRANET module registered:', intranetModule);

  // Grant access to all user groups by default (READ permission)
  const userGroups = await prisma.userGroup.findMany({
    where: { isActive: true },
  });

  for (const group of userGroups) {
    await prisma.moduleAccess.upsert({
      where: {
        moduleId_userGroupId: {
          moduleId: intranetModule.id,
          userGroupId: group.id,
        },
      },
      update: {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      },
      create: {
        moduleId: intranetModule.id,
        userGroupId: group.id,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      },
    });
  }

  console.log(`✅ Granted READ access to ${userGroups.length} user groups`);
  console.log('');
  console.log('✨ INTRANET module is now ready!');
  console.log('   - All users can read intranet documents');
  console.log('   - Admins have full access');
  console.log('   - Grant WRITE permissions in Module Permissions page');
}

main()
  .catch((e) => {
    console.error('❌ Error registering INTRANET module:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
