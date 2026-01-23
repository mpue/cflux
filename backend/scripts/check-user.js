const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Checking user markus.richter@example.com...\n');
    
    const user = await prisma.user.findFirst({
      where: { email: 'markus.richter@example.com' },
      include: {
        userGroupMemberships: {
          include: {
            userGroup: {
              include: {
                moduleAccess: {
                  include: { module: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log(`User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Role: ${user.role}`);
    console.log(`\nGroups:`);
    
    for (const membership of user.userGroupMemberships) {
      const group = membership.userGroup;
      console.log(`\n  - ${group.name} (Active: ${group.isActive})`);
      console.log(`    Modules:`);
      
      for (const access of group.moduleAccess) {
        console.log(`      * ${access.module.name} (${access.module.key})`);
        console.log(`        View: ${access.canView}, Create: ${access.canCreate}, Edit: ${access.canEdit}, Delete: ${access.canDelete}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
