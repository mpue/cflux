/**
 * Migration Script: Copy User data to Employee profiles
 * 
 * This script ensures all existing users have an Employee profile
 * with their personal data properly migrated.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserToEmployee() {
  console.log('🔄 Starting User to Employee migration...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeProfile: {
          select: {
            id: true
          }
        }
      }
    });

    console.log(`📊 Found ${users.length} users`);

    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const user of users) {
      try {
        if (user.employeeProfile) {
          existing++;
          console.log(`✓ User ${user.email} already has an employee profile`);
          
          // Update to ensure firstName, lastName, email are synced
          await prisma.employee.update({
            where: { id: user.employeeProfile.id },
            data: {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            }
          });
        } else {
          // Create new employee profile with default values
          await prisma.employee.create({
            data: {
              userId: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              weeklyHours: 45, // Default Swiss work week
              vacationDays: 30, // Default vacation days
              canton: 'ZH', // Default canton
              country: 'Schweiz',
              exemptFromTracking: false
            }
          });
          created++;
          console.log(`✓ Created employee profile for ${user.email}`);
        }
      } catch (error) {
        errors++;
        console.error(`✗ Error processing user ${user.email}:`, error);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✓ Created: ${created}`);
    console.log(`   ✓ Existing: ${existing}`);
    console.log(`   ✗ Errors: ${errors}`);
    console.log('\n✅ Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateUserToEmployee()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
