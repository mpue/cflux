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
