const { PrismaClient } = require('@prisma/client');
const moduleService = require('./dist/services/module.service').default;

const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'markus.richter@example.com' }
    });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log(`Getting modules for user: ${user.email}\n`);
    
    const modules = await moduleService.getModulesForUser(user.id);
    
    console.log(`Found ${modules.length} modules:\n`);
    
    for (const module of modules) {
      console.log(`- ${module.name} (${module.key})`);
      if (module.permissions) {
        console.log(`  Permissions: View=${module.permissions.canView}, Create=${module.permissions.canCreate}, Edit=${module.permissions.canEdit}, Delete=${module.permissions.canDelete}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
