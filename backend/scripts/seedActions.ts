import { PrismaClient } from '@prisma/client';
import { actionService } from '../src/services/action.service';

const prisma = new PrismaClient();

async function seedActions() {
  console.log('🌱 Seeding System Actions...');

  try {
    // Seed all standard system actions
    await actionService.seedSystemActions();

    console.log('✅ System Actions seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding system actions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedActions();
