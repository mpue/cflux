import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

/**
 * Installation script that runs on first startup
 * Checks if database is initialized and runs setup if needed
 */
async function install() {
  try {
    console.log('🚀 Starting installation check...');

    // Check if database is already initialized by checking for users
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      console.log('✅ Database already initialized. Skipping installation.');
      await prisma.$disconnect();
      return;
    }

    console.log('📦 First run detected - Starting installation...');
    console.log('');

    // Step 1: Seed modules
    console.log('1️⃣  Installing modules...');
    try {
      execSync('node dist/prisma/seedModules.js', { 
        stdio: 'inherit',
        cwd: '/app'
      });
      console.log('✅ Modules installed successfully');
    } catch (error) {
      console.error('❌ Error installing modules:', error);
      throw error;
    }

    console.log('');

    // Step 2: Create admin user
    console.log('2️⃣  Creating admin user...');
    try {
      execSync('npx ts-node scripts/setup-admin.ts', { 
        stdio: 'inherit',
        cwd: '/app'
      });
      console.log('✅ Admin user created successfully');
    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      throw error;
    }

    console.log('');
    console.log('🎉 Installation completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Check /tmp/admin-credentials.txt for admin login');
    console.log('   2. Login with provided credentials');
    console.log('   3. Change password immediately');
    console.log('   4. Delete /tmp/admin-credentials.txt');
    console.log('');

  } catch (error) {
    console.error('❌ Installation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

install();
