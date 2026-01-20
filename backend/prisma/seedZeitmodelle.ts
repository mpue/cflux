import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedZeitmodelleModule() {
  console.log('🕒 Seeding Zeitmodelle Module...');

  try {
    // Check if module already exists
    const existingModule = await prisma.module.findFirst({
      where: { key: 'zeitmodelle' }
    });

    if (existingModule) {
      console.log('✓ Zeitmodelle module already exists');
      return;
    }

    // Create Zeitmodelle module
    const module = await prisma.module.create({
      data: {
        key: 'zeitmodelle',
        name: 'Zeitmodelle',
        description: 'Verwaltung von Zeitmodellen mit differenzierten Stundensätzen basierend auf Wochentag, Uhrzeit und Feiertagen',
        icon: 'schedule',
        route: '/zeitmodelle',
        isActive: true
      }
    });

    console.log(`✓ Created module: ${module.name}`);

    // Get Admin group or create it
    let adminGroup = await prisma.userGroup.findFirst({
      where: { 
        OR: [
          { name: 'Administrators' },
          { name: 'Admin' }
        ]
      }
    });

    if (!adminGroup) {
      // Create Admin group
      adminGroup = await prisma.userGroup.create({
        data: {
          name: 'Administrators',
          description: 'System administrators with full access'
        }
      });
      console.log('✓ Created Administrators group');
    }

    // Grant full permissions to admin group
    await prisma.moduleAccess.create({
      data: {
        moduleId: module.id,
        userGroupId: adminGroup.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      }
    });

    console.log(`✓ Granted full permissions to Administrators group`);

    // Optional: Create example Zeitmodell
    const exampleZeitmodell = await prisma.zeitmodell.create({
      data: {
        name: 'Standard Arbeitszeit',
        beschreibung: 'Reguläres Zeitmodell für normale Arbeitstage (Mo-Fr, 08:00-17:00)',
        gueltigVon: new Date('2024-01-01'),
        version: 1,
        eintraege: {
          create: [
            {
              stundensatz: 95.00,
              startzeit: '08:00',
              endzeit: '17:00',
              wochentage: [0, 1, 2, 3, 4], // Mo-Fr
              nurFeiertage: false,
              keineFeiertage: true,
              prioritaet: 50
            },
            {
              stundensatz: 120.00,
              startzeit: '17:00',
              endzeit: '22:00',
              wochentage: [0, 1, 2, 3, 4], // Mo-Fr
              nurFeiertage: false,
              keineFeiertage: false,
              prioritaet: 60
            },
            {
              stundensatz: 150.00,
              startzeit: '22:00',
              endzeit: '08:00',
              wochentage: [],
              nurFeiertage: false,
              keineFeiertage: false,
              prioritaet: 70
            },
            {
              stundensatz: 130.00,
              startzeit: '00:00',
              endzeit: '23:59',
              wochentage: [5, 6], // Sa-So
              nurFeiertage: false,
              keineFeiertage: true,
              prioritaet: 65
            },
            {
              stundensatz: 180.00,
              startzeit: '00:00',
              endzeit: '23:59',
              wochentage: [],
              nurFeiertage: true,
              keineFeiertage: false,
              prioritaet: 80
            }
          ]
        }
      },
      include: {
        eintraege: true
      }
    });

    console.log(`✓ Created example Zeitmodell: ${exampleZeitmodell.name} with ${exampleZeitmodell.eintraege.length} entries`);

    // Log audit entry
    await prisma.zeitmodellAenderung.create({
      data: {
        zeitmodellId: exampleZeitmodell.id,
        aenderungstyp: 'CREATE',
        altJson: JSON.stringify({}),
        neuJson: JSON.stringify(exampleZeitmodell),
        kommentar: 'Initial creation via seed script'
      }
    });

    console.log('✓ Created audit log entry');
    console.log('🎉 Zeitmodelle module seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding Zeitmodelle module:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedZeitmodelleModule()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedZeitmodelleModule;
