import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...');
    
    // Find all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (admins.length === 0) {
      console.log('❌ No admin users found!');
      console.log('Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@timetracking.local',
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN',
          vacationDays: 30,
          isActive: true,
          requiresPasswordChange: true,
        },
      });
      
      console.log('✅ New admin user created!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', admin.email);
      console.log('🔑 Password: admin123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    console.log(`Found ${admins.length} admin user(s):`);
    admins.forEach((admin, idx) => {
      console.log(`${idx + 1}. ${admin.email} (${admin.firstName} ${admin.lastName})`);
    });

    // Reset password for all admin users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    for (const admin of admins) {
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          requiresPasswordChange: false,
          isActive: true,
        },
      });
      console.log(`✅ Password reset for: ${admin.email}`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 All admin passwords have been reset to: admin123');
    console.log('📧 Admin emails:');
    admins.forEach(admin => {
      console.log(`   - ${admin.email}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🌐 Open http://localhost:3002 and login with one of the emails above.');
    console.log('');

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
