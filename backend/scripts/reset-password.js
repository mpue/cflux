const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    await prisma.user.update({
      where: { email: 'markus.richter@example.com' },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    });
    console.log('Password reset to: Test123!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
