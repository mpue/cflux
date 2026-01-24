const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOnboarding() {
  try {
    const module = await prisma.module.findFirst({
      where: { key: 'onboarding' }
    });
    
    if (module) {
      console.log('✅ Onboarding-Modul gefunden:');
      console.log(JSON.stringify(module, null, 2));
    } else {
      console.log('❌ Onboarding-Modul nicht gefunden');
    }
    
    // Prüfe auch die Tabellen
    const applicants = await prisma.applicant.count();
    const employees = await prisma.employee.count();
    
    console.log(`\n📊 Datenbank-Status:`);
    console.log(`   Bewerber: ${applicants}`);
    console.log(`   Mitarbeiter: ${employees}`);
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOnboarding();
