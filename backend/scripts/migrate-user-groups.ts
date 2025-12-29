import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserGroupData() {
  console.log('Starting migration of user group data...');

  try {
    // Find all users with a userGroupId set
    const usersWithGroups = await prisma.user.findMany({
      where: {
        userGroupId: {
          not: null,
        },
      },
      select: {
        id: true,
        userGroupId: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`Found ${usersWithGroups.length} users with existing group assignments`);

    // Create memberships for these users
    for (const user of usersWithGroups) {
      if (user.userGroupId) {
        try {
          // Check if membership already exists
          const existing = await prisma.userGroupMembership.findUnique({
            where: {
              userId_userGroupId: {
                userId: user.id,
                userGroupId: user.userGroupId,
              },
            },
          });

          if (!existing) {
            await prisma.userGroupMembership.create({
              data: {
                userId: user.id,
                userGroupId: user.userGroupId,
              },
            });
            console.log(`✓ Migrated: ${user.firstName} ${user.lastName}`);
          } else {
            console.log(`- Skipped (already exists): ${user.firstName} ${user.lastName}`);
          }
        } catch (error: any) {
          console.error(`✗ Failed for ${user.firstName} ${user.lastName}:`, error.message);
        }
      }
    }

    console.log('\nMigration completed successfully!');
    console.log('Note: The old userGroupId field has been kept for backwards compatibility.');
    console.log('You can manually set it to null for all users if desired.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateUserGroupData();
