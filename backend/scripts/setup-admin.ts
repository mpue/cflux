import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Default admin credentials - MUST be changed on first login
const DEFAULT_ADMIN_EMAIL = 'admin@timetracking.local';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

/**
 * Setup script to create an initial admin user with a default password
 * that MUST be changed on first login via the browser
 */
async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user...');
    
    // Check if any admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists. Skipping admin setup.');
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        email: DEFAULT_ADMIN_EMAIL,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        vacationDays: 30,
        isActive: true,
        requiresPasswordChange: true, // User must change password on first login
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin Email:', DEFAULT_ADMIN_EMAIL);
    console.log('🔑 Default Password:', DEFAULT_ADMIN_PASSWORD);
    console.log('⚠️  IMPORTANT: Change this password immediately on first login!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🌐 Open http://localhost:3002 and login with the credentials above.');
    console.log('   You will be forced to change your password immediately.');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
