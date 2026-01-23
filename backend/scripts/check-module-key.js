const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModuleKey() {
  try {
    const modules = await prisma.module.findMany({
      where: {
        key: {
          in: ['intranet', 'INTRANET']
        }
      },
      select: {
        id: true,
        key: true,
        name: true,
        isActive: true
      }
    });

    console.log('Found modules:', JSON.stringify(modules, null, 2));

    // Also check user's module access
    const user = await prisma.user.findUnique({
      where: { email: 'markus.richter@example.com' },
      include: {
        userGroupMemberships: {
          include: {
            userGroup: {
              include: {
                moduleAccess: {
                  where: {
                    module: {
                      key: {
                        in: ['intranet', 'INTRANET']
                      }
                    }
                  },
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('\n\nUser module access:');
    user.userGroupMemberships.forEach(membership => {
      console.log(`\nGroup: ${membership.userGroup.name} (active: ${membership.userGroup.isActive})`);
      membership.userGroup.moduleAccess.forEach(access => {
        console.log(`  Module Key: "${access.module.key}" (active: ${access.module.isActive})`);
        console.log(`  Permissions: canView=${access.canView}, canCreate=${access.canCreate}, canEdit=${access.canEdit}`);
      });
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkModuleKey();
