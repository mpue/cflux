const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function grantProjectReportsAccess() {
  console.log('Granting project_reports access to Administratoren...');

  const adminGroup = await prisma.userGroup.findFirst({
    where: { name: 'Administratoren' },
  });

  if (!adminGroup) {
    console.error('Administratoren group not found!');
    return;
  }

  // Find the module
  const module = await prisma.module.findUnique({
    where: { key: 'project_reports' },
  });

  if (!module) {
    console.error('project_reports module not found!');
    return;
  }

  const existingAccess = await prisma.moduleAccess.findFirst({
    where: {
      userGroupId: adminGroup.id,
      moduleId: module.id,
    },
  });

  if (existingAccess) {
    console.log('Access already granted.');
    return;
  }

  await prisma.moduleAccess.create({
    data: {
      userGroupId: adminGroup.id,
      moduleId: module.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
  });

  console.log('✅ Access granted successfully!');
}

grantProjectReportsAccess()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
