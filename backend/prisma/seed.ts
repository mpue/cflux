import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

// Hilfsfunktion für zufällige Auswahl
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Hilfsfunktion für zufällige Zahl in Range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Hilfsfunktion für zufälliges Datum in Range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Seeding database with dummy data...');

  // 1. Admin User (falls noch nicht vorhanden)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      role: 'ADMIN',
      vacationDays: 30,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 2. Mitarbeiter erstellen
  const userNames = [
    { firstName: 'Anna', lastName: 'Schmidt' },
    { firstName: 'Thomas', lastName: 'Müller' },
    { firstName: 'Julia', lastName: 'Weber' },
    { firstName: 'Michael', lastName: 'Wagner' },
    { firstName: 'Sarah', lastName: 'Becker' },
    { firstName: 'Daniel', lastName: 'Schulz' },
    { firstName: 'Lisa', lastName: 'Hoffmann' },
    { firstName: 'Sebastian', lastName: 'Koch' },
    { firstName: 'Laura', lastName: 'Bauer' },
    { firstName: 'Markus', lastName: 'Richter' },
  ];

  const users = [];
  const password = await bcrypt.hash('password123', 10);
  
  for (const name of userNames) {
    const user = await prisma.user.upsert({
      where: { email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@example.com` },
      update: {},
      create: {
        email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@example.com`,
        password: password,
        firstName: name.firstName,
        lastName: name.lastName,
        role: 'USER',
        vacationDays: randomInt(15, 30),
        isActive: true,
      },
    });
    users.push(user);
  }
  console.log(`✅ ${users.length} users created`);

  // 3. Projekte erstellen
  const projectNames = [
    { name: 'Website Relaunch', description: 'Neugestaltung der Firmenwebsite' },
    { name: 'Mobile App Development', description: 'Entwicklung einer nativen Mobile App' },
    { name: 'CRM System', description: 'Implementierung eines Customer Relationship Management Systems' },
    { name: 'Marketing Kampagne', description: 'Q1 Marketing Initiative' },
    { name: 'Interne Tools', description: 'Entwicklung interner Verwaltungstools' },
    { name: 'API Integration', description: 'Integration externer APIs' },
    { name: 'Datenbank Migration', description: 'Migration auf neue Datenbank-Infrastruktur' },
    { name: 'Security Audit', description: 'Sicherheitsüberprüfung der Systeme' },
  ];

  const projects = [];
  for (const proj of projectNames) {
    const existingProject = await prisma.project.findFirst({
      where: { name: proj.name },
    });

    let project;
    if (existingProject) {
      project = existingProject;
    } else {
      project = await prisma.project.create({
        data: {
          name: proj.name,
          description: proj.description,
          isActive: true,
        },
      });
    }
    projects.push(project);
  }
  console.log(`✅ ${projects.length} projects created`);

  // 3.5 Kunden erstellen
  const customerData = [
    { 
      name: 'Müller & Co. GmbH', 
      contactPerson: 'Hans Müller', 
      email: 'mueller@firma.ch', 
      phone: '+41 44 123 45 67',
      address: 'Bahnhofstrasse 123',
      zipCode: '8001',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-123.456.789',
      notes: 'Wichtiger Stammkunde seit 2015'
    },
    { 
      name: 'Tech Solutions AG', 
      contactPerson: 'Sarah Weber', 
      email: 'info@techsolutions.ch', 
      phone: '+41 31 555 66 77',
      address: 'Bundesplatz 5',
      zipCode: '3011',
      city: 'Bern',
      country: 'Schweiz',
      taxId: 'CHE-234.567.890',
      notes: 'Spezialisiert auf IT-Projekte'
    },
    { 
      name: 'Bau & Handwerk Meyer', 
      contactPerson: 'Klaus Meyer', 
      email: 'meyer@bauhandwerk.ch', 
      phone: '+41 61 777 88 99',
      address: 'Steinenvorstadt 42',
      zipCode: '4051',
      city: 'Basel',
      country: 'Schweiz',
      taxId: 'CHE-345.678.901'
    },
    { 
      name: 'Gastro Service Schweiz', 
      contactPerson: 'Maria Rossi', 
      email: 'rossi@gastroservice.ch', 
      phone: '+41 91 222 33 44',
      address: 'Via Nassa 28',
      zipCode: '6900',
      city: 'Lugano',
      country: 'Schweiz',
      taxId: 'CHE-456.789.012',
      notes: 'Mehrere Restaurants in der Südschweiz'
    },
    { 
      name: 'Schneider Fashion GmbH', 
      contactPerson: 'Anna Schneider', 
      email: 'schneider@fashion.ch', 
      phone: '+41 71 333 44 55',
      address: 'Marktgasse 15',
      zipCode: '9000',
      city: 'St. Gallen',
      country: 'Schweiz',
      taxId: 'CHE-567.890.123'
    },
    { 
      name: 'Consulting Partners Luzern', 
      contactPerson: 'Peter Keller', 
      email: 'keller@consulting-luzern.ch', 
      phone: '+41 41 444 55 66',
      address: 'Haldenstrasse 8',
      zipCode: '6006',
      city: 'Luzern',
      country: 'Schweiz',
      taxId: 'CHE-678.901.234',
      notes: 'Unternehmensberatung, regelmäßige Projekte'
    },
    { 
      name: 'Grüner Daumen Gartenbau', 
      contactPerson: 'Thomas Grün', 
      email: 'info@gruener-daumen.ch', 
      phone: '+41 52 666 77 88',
      address: 'Rosenweg 33',
      zipCode: '8400',
      city: 'Winterthur',
      country: 'Schweiz',
      taxId: 'CHE-789.012.345'
    },
    { 
      name: 'Pharma Logistics International', 
      contactPerson: 'Dr. Julia Fischer', 
      email: 'fischer@pharmalog.ch', 
      phone: '+41 61 888 99 00',
      address: 'St. Alban-Anlage 66',
      zipCode: '4052',
      city: 'Basel',
      country: 'Schweiz',
      taxId: 'CHE-890.123.456',
      notes: 'Pharmazeutische Logistik'
    },
    { 
      name: 'Immobilien Schmidt & Partner', 
      contactPerson: 'Robert Schmidt', 
      email: 'schmidt@immobilien-partner.ch', 
      phone: '+41 44 111 22 33',
      address: 'Seestrasse 200',
      zipCode: '8002',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-901.234.567'
    },
    { 
      name: 'Elektro Wagner AG', 
      contactPerson: 'Martin Wagner', 
      email: 'wagner@elektro-ag.ch', 
      phone: '+41 62 222 33 44',
      address: 'Industriestrasse 55',
      zipCode: '5001',
      city: 'Aarau',
      country: 'Schweiz',
      taxId: 'CHE-012.345.678'
    },
    { 
      name: 'Finanz Beratung Zürich', 
      contactPerson: 'Andrea Lehmann', 
      email: 'lehmann@finanzberatung.ch', 
      phone: '+41 44 333 44 55',
      address: 'Paradeplatz 8',
      zipCode: '8001',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-123.456.790',
      notes: 'Finanzdienstleistungen für KMU'
    },
    { 
      name: 'Weber Transport & Spedition', 
      contactPerson: 'Franz Weber', 
      email: 'weber@transport-spedition.ch', 
      phone: '+41 33 444 55 66',
      address: 'Industriepark 12',
      zipCode: '3600',
      city: 'Thun',
      country: 'Schweiz',
      taxId: 'CHE-234.567.891'
    },
    { 
      name: 'Hotel Alpenblick AG', 
      contactPerson: 'Stefan Berger', 
      email: 'berger@hotel-alpenblick.ch', 
      phone: '+41 33 555 66 77',
      address: 'Höheweg 37',
      zipCode: '3800',
      city: 'Interlaken',
      country: 'Schweiz',
      taxId: 'CHE-345.678.902',
      notes: '4-Sterne Hotel, Wellness-Bereich'
    },
    { 
      name: 'Bäckerei Tradition Meier', 
      contactPerson: 'Josef Meier', 
      email: 'meier@baeckerei-tradition.ch', 
      phone: '+41 71 666 77 88',
      address: 'Hauptgasse 44',
      zipCode: '9400',
      city: 'Rorschach',
      country: 'Schweiz',
      taxId: 'CHE-456.789.013'
    },
    { 
      name: 'Software Innovations Lab', 
      contactPerson: 'Dr. Michael Braun', 
      email: 'braun@software-lab.ch', 
      phone: '+41 44 777 88 99',
      address: 'Technoparkstrasse 1',
      zipCode: '8005',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-567.890.124',
      notes: 'Startup für KI-Lösungen'
    },
    { 
      name: 'Klinik Seeblick', 
      contactPerson: 'Dr. Claudia Vogel', 
      email: 'vogel@klinik-seeblick.ch', 
      phone: '+41 44 888 99 00',
      address: 'Seestrasse 150',
      zipCode: '8700',
      city: 'Küsnacht',
      country: 'Schweiz',
      taxId: 'CHE-678.901.235',
      notes: 'Privatklinik, hochwertige Ausstattung'
    },
    { 
      name: 'Auto Garage Zürich Nord', 
      contactPerson: 'Daniel Huber', 
      email: 'huber@autogarage-nord.ch', 
      phone: '+41 44 111 00 99',
      address: 'Schaffhauserstrasse 222',
      zipCode: '8057',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-789.012.346'
    },
    { 
      name: 'Möbel Design Studio', 
      contactPerson: 'Lisa Baumgartner', 
      email: 'baumgartner@moebel-design.ch', 
      phone: '+41 31 222 11 00',
      address: 'Kramgasse 78',
      zipCode: '3011',
      city: 'Bern',
      country: 'Schweiz',
      taxId: 'CHE-890.123.457'
    },
    { 
      name: 'Versicherungen Global Schweiz', 
      contactPerson: 'Christian Frei', 
      email: 'frei@versicherungen-global.ch', 
      phone: '+41 58 333 22 11',
      address: 'Mythenquai 50',
      zipCode: '8002',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-901.234.568',
      notes: 'Versicherungsdienstleistungen'
    },
    { 
      name: 'Bio Lebensmittel Handel', 
      contactPerson: 'Sabine Kunz', 
      email: 'kunz@bio-handel.ch', 
      phone: '+41 61 444 33 22',
      address: 'Aeschenvorstadt 24',
      zipCode: '4051',
      city: 'Basel',
      country: 'Schweiz',
      taxId: 'CHE-012.345.679'
    },
    { 
      name: 'Rechtsanwälte Burger & Partner', 
      contactPerson: 'RA Dr. Thomas Burger', 
      email: 'burger@rechtsanwaelte.ch', 
      phone: '+41 44 555 44 33',
      address: 'Rämistrasse 5',
      zipCode: '8001',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-123.456.791',
      notes: 'Wirtschaftsrecht und Steuerrecht'
    },
    { 
      name: 'Druckerei Modern Print', 
      contactPerson: 'Markus Stauffer', 
      email: 'stauffer@modern-print.ch', 
      phone: '+41 31 666 55 44',
      address: 'Gewerbestrasse 88',
      zipCode: '3012',
      city: 'Bern',
      country: 'Schweiz',
      taxId: 'CHE-234.567.892'
    },
    { 
      name: 'Event Solutions Pro', 
      contactPerson: 'Petra Zimmermann', 
      email: 'zimmermann@eventsolutions.ch', 
      phone: '+41 44 777 66 55',
      address: 'Konradstrasse 19',
      zipCode: '8005',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-345.678.903',
      notes: 'Event-Management und Catering'
    },
    { 
      name: 'Sportartikel Champion', 
      contactPerson: 'Ralf Steiner', 
      email: 'steiner@sportchampion.ch', 
      phone: '+41 71 888 77 66',
      address: 'St. Leonhard-Strasse 35',
      zipCode: '9000',
      city: 'St. Gallen',
      country: 'Schweiz',
      taxId: 'CHE-456.789.014'
    },
    { 
      name: 'Architektur Studio Basel', 
      contactPerson: 'Nina Zürcher', 
      email: 'zuercher@architektur-basel.ch', 
      phone: '+41 61 999 88 77',
      address: 'Clarastrasse 12',
      zipCode: '4058',
      city: 'Basel',
      country: 'Schweiz',
      taxId: 'CHE-567.890.125',
      notes: 'Moderne Architektur und Innendesign'
    },
    { 
      name: 'Reinigung Service Plus', 
      contactPerson: 'Monika Lang', 
      email: 'lang@reinigung-plus.ch', 
      phone: '+41 44 000 99 88',
      address: 'Badenerstrasse 120',
      zipCode: '8004',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-678.901.236'
    },
    { 
      name: 'Schmuck & Uhren Boutique', 
      contactPerson: 'Verena Gold', 
      email: 'gold@schmuck-uhren.ch', 
      phone: '+41 22 111 22 33',
      address: 'Rue du Rhône 88',
      zipCode: '1204',
      city: 'Genf',
      country: 'Schweiz',
      taxId: 'CHE-789.012.347',
      notes: 'Luxusschmuck und Schweizer Uhren'
    },
    { 
      name: 'Sanitär Blitz GmbH', 
      contactPerson: 'Urs Blitz', 
      email: 'blitz@sanitaer.ch', 
      phone: '+41 41 222 33 44',
      address: 'Industriestrasse 45',
      zipCode: '6010',
      city: 'Kriens',
      country: 'Schweiz',
      taxId: 'CHE-890.123.458'
    },
    { 
      name: 'Fitness Center Vitality', 
      contactPerson: 'Sandra Kraft', 
      email: 'kraft@vitality-fitness.ch', 
      phone: '+41 44 333 22 11',
      address: 'Universitätstrasse 90',
      zipCode: '8006',
      city: 'Zürich',
      country: 'Schweiz',
      taxId: 'CHE-901.234.569'
    },
    { 
      name: 'Gartencenter Blumenparadies', 
      contactPerson: 'Helmut Blum', 
      email: 'blum@blumenparadies.ch', 
      phone: '+41 52 444 55 66',
      address: 'Landstrasse 200',
      zipCode: '8406',
      city: 'Winterthur',
      country: 'Schweiz',
      taxId: 'CHE-012.345.680'
    }
  ];

  const customers = [];
  for (const custData of customerData) {
    const customer = await prisma.customer.upsert({
      where: { 
        id: `seed-${custData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      },
      update: {},
      create: {
        ...custData,
        isActive: Math.random() > 0.1 // 90% aktiv
      },
    });
    customers.push(customer);
  }
  console.log(`✅ ${customers.length} customers created`);

  // Einige Projekte mit Kunden verknüpfen
  for (let i = 0; i < Math.min(projects.length, customers.length); i++) {
    if (Math.random() > 0.3) { // 70% der Projekte bekommen einen Kunden
      await prisma.project.update({
        where: { id: projects[i].id },
        data: { customerId: customers[i % customers.length].id }
      });
    }
  }
  console.log('✅ Projects linked to customers');

  // 4. Projektzuweisungen (jeder User zu 2-4 Projekten)
  let assignmentCount = 0;
  for (const user of users) {
    const numProjects = randomInt(2, 4);
    const selectedProjects = [...projects].sort(() => 0.5 - Math.random()).slice(0, numProjects);
    
    for (const project of selectedProjects) {
      await prisma.projectAssignment.upsert({
        where: {
          userId_projectId: {
            userId: user.id,
            projectId: project.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          projectId: project.id,
        },
      });
      assignmentCount++;
    }
  }
  console.log(`✅ ${assignmentCount} project assignments created`);

  // 5. Zeiteinträge generieren (letzte 6 Monate)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const today = new Date();

  let timeEntryCount = 0;
  for (const user of users) {
    // Hole die zugewiesenen Projekte für diesen User
    const userAssignments = await prisma.projectAssignment.findMany({
      where: { userId: user.id },
      include: { project: true },
    });
    const userProjects = userAssignments.map(a => a.project);

    // Generiere 40-80 Zeiteinträge pro User
    const numEntries = randomInt(40, 80);
    
    for (let i = 0; i < numEntries; i++) {
      const workDate = randomDate(sixMonthsAgo, today);
      
      // Arbeitszeit zwischen 7-9 Uhr Start
      const startHour = randomInt(7, 9);
      const startMinute = randomInt(0, 59);
      workDate.setHours(startHour, startMinute, 0, 0);
      
      // Arbeitszeit zwischen 6-10 Stunden
      const workHours = randomInt(6, 10);
      const workMinutes = randomInt(0, 59);
      const endDate = new Date(workDate);
      endDate.setHours(startHour + workHours, startMinute + workMinutes, 0, 0);
      
      // 70% der Einträge haben ein Projekt
      const hasProject = Math.random() < 0.7;
      const project = hasProject && userProjects.length > 0 ? randomChoice(userProjects) : null;

      await prisma.timeEntry.create({
        data: {
          userId: user.id,
          projectId: project?.id,
          clockIn: workDate,
          clockOut: endDate,
          status: 'CLOCKED_OUT',
          description: hasProject ? `Arbeit an ${project?.name}` : 'Allgemeine Aufgaben',
        },
      });
      timeEntryCount++;
    }
  }
  console.log(`✅ ${timeEntryCount} time entries created`);

  // 6. Abwesenheitsanträge generieren
  const absenceTypes: ('VACATION' | 'SICK_LEAVE' | 'PERSONAL_LEAVE' | 'UNPAID_LEAVE' | 'OTHER')[] = 
    ['VACATION', 'SICK_LEAVE', 'PERSONAL_LEAVE', 'OTHER'];
  let absenceCount = 0;

  for (const user of users) {
    // 3-8 Abwesenheitsanträge pro User
    const numAbsences = randomInt(3, 8);
    
    for (let i = 0; i < numAbsences; i++) {
      const startDate = randomDate(sixMonthsAgo, today);
      const days = randomInt(1, 10);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      
      const type = randomChoice(absenceTypes);
      // 80% der Anträge sind genehmigt
      const status: 'APPROVED' | 'REJECTED' | 'PENDING' = 
        Math.random() < 0.8 ? 'APPROVED' : (Math.random() < 0.5 ? 'PENDING' : 'REJECTED');

      await prisma.absenceRequest.create({
        data: {
          userId: user.id,
          type,
          startDate,
          endDate,
          days,
          reason: type === 'SICK_LEAVE' ? 'Krankheit' : type === 'VACATION' ? 'Urlaub' : 'Persönliche Gründe',
          status,
          reviewedBy: status !== 'PENDING' ? admin.id : undefined,
          reviewedAt: status !== 'PENDING' ? new Date() : undefined,
        },
      });
      absenceCount++;
    }
  }
  console.log(`✅ ${absenceCount} absence requests created`);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@example.com / admin123');
  console.log('Users: [firstname].[lastname]@example.com / password123');
  console.log('Example: anna.schmidt@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
