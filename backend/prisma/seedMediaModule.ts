import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMediaModule() {
  console.log('🎬 Seeding Media module...');

  try {
    // Check if Media module already exists
    const existingModule = await prisma.module.findUnique({
      where: { key: 'media' },
    });

    if (existingModule) {
      console.log('✅ Media module already exists');
      return;
    }

    // Create Media module
    const mediaModule = await prisma.module.create({
      data: {
        name: 'Medien',
        key: 'media',
        description: 'Verwaltung von Mediendateien (Bilder, PDFs, Dokumente)',
        icon: 'PermMedia',
        route: '/media',
        isActive: true,
        sortOrder: 90,
      },
    });

    console.log('✅ Media module created:', mediaModule.name);

    // Get all user groups
    const userGroups = await prisma.userGroup.findMany();

    // Grant view access to all groups by default
    for (const group of userGroups) {
      await prisma.moduleAccess.create({
        data: {
          moduleId: mediaModule.id,
          userGroupId: group.id,
          canView: true,
          canCreate: group.name === 'Admin' || group.name === 'Managers',
          canEdit: group.name === 'Admin' || group.name === 'Managers',
          canDelete: group.name === 'Admin',
        },
      });
      console.log(`  ✅ Access granted to group: ${group.name}`);
    }

    console.log('✅ Media module seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding Media module:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedMediaModule()
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
