import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ==================== UTILITY FUNCTIONS ====================

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

function randomSubset<T>(arr: T[], minCount: number = 1, maxCount?: number): T[] {
  const count = randomInt(minCount, maxCount || arr.length);
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ==================== DATA ====================

const firstNames = [
  'Anna', 'Beat', 'Carmen', 'Daniel', 'Emma', 'Felix', 'Greta', 'Hans',
  'Isabelle', 'Jakob', 'Karin', 'Lukas', 'Maria', 'Nils', 'Olivia', 'Peter',
  'Queenie', 'Roger', 'Sandra', 'Thomas', 'Ursula', 'Viktor', 'Wendy', 'Xaver',
  'Yvonne', 'Zoe', 'Adrian', 'Barbara', 'Christian', 'Diana', 'Ernst', 'Franziska',
  'Georg', 'Helena', 'Ingrid', 'Jonas', 'Katharina', 'Ludwig', 'Margot', 'Nikolaus',
  'Otto', 'Paula', 'Quentin', 'Rita', 'Stefan', 'Tanja', 'Ulrich', 'Verena',
  'Wolfgang', 'Xenia', 'Yannick', 'Zara'
];

const lastNames = [
  'Müller', 'Meier', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner',
  'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein',
  'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann'
];

const projectNames = [
  'Website Relaunch', 'CRM Migration', 'Mobile App', 'Digitalisierung',
  'Cloud Migration', 'Security Audit', 'Compliance Update', 'ERP Integration',
  'Marketing Kampagne', 'Produktentwicklung', 'Marktanalyse', 'Prozessoptimierung'
];

const companyPrefixes = ['Swiss', 'Alpen', 'Helvetia', 'Eidgenössische', 'Zentral'];
const companySuffixes = ['Solutions', 'Services', 'Consulting', 'Technologies', 'Systems', 'AG', 'GmbH'];

// ==================== MAIN ====================

async function generateTestData() {
  console.log('🚀 Starting test data generation...\n');

  // ==================== 1. USER GROUPS ====================
  console.log('👥 Creating User Groups...');
  const userGroupsData = [
    { name: 'Management', description: 'Führungskräfte und Geschäftsleitung' },
    { name: 'Entwicklung', description: 'Software-Entwickler und Techniker' },
    { name: 'Marketing & Vertrieb', description: 'Marketing und Sales Team' },
    { name: 'HR & Administration', description: 'Personal und Verwaltung' },
    { name: 'Finanzen & Controlling', description: 'Finanzabteilung' },
    { name: 'Einkauf & Logistik', description: 'Beschaffung und Logistik' },
  ];

  const userGroups = [];
  for (const groupData of userGroupsData) {
    const group = await prisma.userGroup.upsert({
      where: { name: groupData.name },
      update: {},
      create: groupData,
    });
    userGroups.push(group);
  }
  console.log(`✅ Created ${userGroups.length} user groups\n`);

  // ==================== 2. USERS ====================
  console.log('👤 Creating Users (150 users)...');
  const users = [];
  const password = await bcrypt.hash('Test123!', 10);

  for (let i = 0; i < 150; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    
    const user = await prisma.user.create({
      data: {
        email,
        password,
        firstName,
        lastName,
        role: i < 5 ? 'ADMIN' : 'USER',
        vacationDays: randomInt(20, 30),
        workingHoursPerWeek: randomChoice([40, 42, 35, 30]),
        entryDate: randomDate(new Date('2018-01-01'), new Date('2025-06-01')),
        isActive: i < 145,
        hasChangedPassword: randomBoolean(0.8),
      },
    });
    users.push(user);

    // Assign to 1-2 random groups
    const groupsToAssign = randomSubset(userGroups, 1, 2);
    for (const group of groupsToAssign) {
      await prisma.userGroupMembership.create({
        data: {
          userId: user.id,
          userGroupId: group.id,
        },
      });
    }
  }
  console.log(`✅ Created ${users.length} users\n`);

  // ==================== 3. COST CENTERS ====================
  console.log('💰 Creating Cost Centers...');
  const costCenters = [];
  const codes = ['1000', '2000', '3000', '4000', '5000'];
  for (const code of codes) {
    const cc = await prisma.costCenter.create({
      data: {
        code,
        name: `Kostenstelle ${code}`,
        isActive: true,
        managerId: randomChoice(users.filter(u => u.role === 'ADMIN')).id,
      },
    });
    costCenters.push(cc);
  }
  console.log(`✅ Created ${costCenters.length} cost centers\n`);

  // ==================== 4. PROJECTS ====================
  console.log('📁 Creating Projects (80 projects)...');
  const projects = [];
  
  for (let i = 0; i < 80; i++) {
    const startDate = randomDate(new Date('2023-01-01'), new Date('2025-06-01'));
    const status = randomChoice(['ACTIVE', 'COMPLETED', 'PLANNING', 'ON_HOLD'] as const);
    
    const project = await prisma.project.create({
      data: {
        name: `${randomChoice(projectNames)} ${i + 1}`,
        description: `Projektbeschreibung für Projekt ${i + 1}`,
        status,
        startDate,
        managerId: randomChoice(users).id,
        isActive: true,
        hourlyRate: randomInt(80, 200),
      },
    });
    projects.push(project);
  }
  console.log(`✅ Created ${projects.length} projects\n`);

  // ==================== 5. TIME ENTRIES ====================
  console.log('⏱️ Creating Time Entries (5000+ entries)...');
  let timeEntryCount = 0;
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-01-19');

  for (const user of users.filter(u => u.isActive)) {
    const numEntries = randomInt(30, 100);
    
    for (let i = 0; i < numEntries; i++) {
      const clockIn = randomDate(startDate, endDate);
      clockIn.setHours(randomInt(6, 10), randomInt(0, 59), 0, 0);
      
      const clockOut = new Date(clockIn);
      clockOut.setHours(clockIn.getHours() + randomInt(7, 10), randomInt(0, 59), 0, 0);
      
      await prisma.timeEntry.create({
        data: {
          userId: user.id,
          clockIn,
          clockOut: randomBoolean(0.95) ? clockOut : null,
          projectId: randomBoolean(0.7) ? randomChoice(projects).id : null,
          isManualEntry: randomBoolean(0.1),
        },
      });
      timeEntryCount++;
    }
  }
  console.log(`✅ Created ${timeEntryCount} time entries\n`);

  // ==================== 6. CUSTOMERS ====================
  console.log('🏢 Creating Customers (100 customers)...');
  const customers = [];
  
  for (let i = 0; i < 100; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: `${randomChoice(companyPrefixes)} ${randomChoice(companySuffixes)} ${i + 1}`,
        email: `kontakt${i}@kunde.ch`,
        phone: `+41 ${randomInt(21, 99)} ${randomInt(100, 999)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
        address: `Hauptstrasse ${randomInt(1, 150)}`,
        city: randomChoice(['Zürich', 'Bern', 'Basel', 'Luzern', 'Genf']),
        zip: String(randomInt(1000, 9999)),
        country: 'Schweiz',
        isActive: randomBoolean(0.9),
      },
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers\n`);

  // ==================== 7. INVOICES ====================
  console.log('🧾 Creating Invoices (300 invoices)...');
  
  for (let i = 0; i < 300; i++) {
    const invoiceDate = randomDate(new Date('2023-01-01'), new Date('2026-01-15'));
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + randomInt(14, 60));
    
    const status = randomChoice(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const);
    const paidDate = status === 'PAID' ? randomDate(invoiceDate, dueDate) : null;
    
    const totalAmount = randomInt(1000, 50000);
    const taxRate = 0.077;
    const taxAmount = totalAmount * taxRate;
    const subtotal = totalAmount - taxAmount;
    
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(i + 1).padStart(5, '0')}`,
        customerId: randomChoice(customers).id,
        invoiceDate,
        dueDate,
        status,
        totalAmount,
        taxRate,
        taxAmount,
        subtotal,
        paidDate,
        createdBy: randomChoice(users).id,
      },
    });
  }
  console.log(`✅ Created 300 invoices\n`);

  // ==================== 8. ORDERS ====================
  console.log('📦 Creating Orders (200 orders)...');
  
  for (let i = 0; i < 200; i++) {
    const status = randomChoice(['DRAFT', 'REQUESTED', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] as const);
    const requestDate = randomDate(new Date('2023-06-01'), new Date('2026-01-15'));
    const expectedDelivery = new Date(requestDate);
    expectedDelivery.setDate(expectedDelivery.getDate() + randomInt(7, 45));
    
    const totalAmount = randomInt(500, 25000);
    
    await prisma.order.create({
      data: {
        orderNumber: `BO-${String(100000 + i).toString()}`,
        requestedBy: randomChoice(users).id,
        approvedBy: randomBoolean(0.7) ? randomChoice(users.filter(u => u.role === 'ADMIN')).id : null,
        status,
        category: randomChoice(['IT-Ausstattung', 'Büromaterial', 'Möbel', 'Dienstleistungen']),
        description: `Bestellung von Equipment`,
        totalAmount,
        requestDate,
        expectedDeliveryDate: expectedDelivery,
        costCenterId: randomBoolean(0.8) ? randomChoice(costCenters).id : null,
      },
    });
  }
  console.log(`✅ Created 200 orders\n`);

  // ==================== 9. INCIDENTS ====================
  console.log('⚠️ Creating Incidents (150 incidents)...');
  
  for (let i = 0; i < 150; i++) {
    const incidentDate = randomDate(new Date('2023-01-01'), new Date('2026-01-15'));
    const status = randomChoice(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const);
    
    await prisma.incident.create({
      data: {
        incidentNumber: `INC-${String(i + 1).padStart(5, '0')}`,
        title: `Vorfall ${i + 1} - ${randomChoice(['Werkstatt', 'Büro', 'Lager'])}`,
        description: `Detaillierte Beschreibung des Vorfalls ${i + 1}`,
        incidentType: randomChoice(['Unfall', 'Beinahe-Unfall', 'Gefährdung']),
        severity: randomChoice(['NIEDRIG', 'MITTEL', 'HOCH', 'KRITISCH']),
        status,
        incidentDate,
        reportedById: randomChoice(users).id,
        location: randomChoice(['Werkstatt A', 'Büro 2.OG', 'Lager']),
        injurySustained: randomBoolean(0.3),
        firstAidGiven: randomBoolean(0.4),
        medicalTreatmentRequired: randomBoolean(0.2),
      },
    });
  }
  console.log(`✅ Created 150 incidents\n`);

  // ==================== 10. DEVICES ====================
  console.log('💻 Creating Devices (300 devices)...');
  const deviceManufacturers = ['HP', 'Dell', 'Lenovo', 'Apple', 'Samsung'];
  const deviceStatuses = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'];
  
  for (let i = 0; i < 300; i++) {
    const purchaseDate = randomDate(new Date('2018-01-01'), new Date('2025-12-01'));
    const status = randomChoice(deviceStatuses);
    
    await prisma.device.create({
      data: {
        name: `Device ${randomChoice(deviceManufacturers)} ${i + 1}`,
        manufacturer: randomChoice(deviceManufacturers),
        model: `Model-${randomInt(1000, 9999)}`,
        serialNumber: `SN-${String(i + 1).padStart(8, '0')}`,
        purchaseDate,
        purchasePrice: randomInt(500, 5000),
        status,
        assignedToId: status === 'IN_USE' ? randomChoice(users.filter(u => u.isActive)).id : null,
        location: randomChoice(['Büro Zürich', 'Büro Bern', 'Lager']),
        warrantyExpiry: new Date(purchaseDate.getTime() + 365 * 24 * 60 * 60 * 1000 * randomInt(1, 5)),
      },
    });
  }
  console.log(`✅ Created 300 devices\n`);

  // ==================== 11. MESSAGES ====================
  console.log('💬 Creating Messages (500 messages)...');
  for (let i = 0; i < 500; i++) {
    const sender = randomChoice(users);
    const recipient = randomChoice(users.filter(u => u.id !== sender.id));
    const sentAt = randomDate(new Date('2024-06-01'), new Date('2026-01-19'));
    
    await prisma.message.create({
      data: {
        senderId: sender.id,
        subject: randomChoice([
          'Meeting Anfrage',
          'Projekt Update',
          'Frage zu Dokument',
          'Urlaubsantrag',
          'Information',
        ]),
        content: `Hallo ${recipient.firstName},\n\nDies ist eine wichtige Nachricht.\n\nViele Grüße,\n${sender.firstName}`,
        isRead: randomBoolean(0.7),
        readAt: randomBoolean(0.7) ? randomDate(sentAt, new Date()) : null,
        sentAt,
      },
    });
  }
  console.log(`✅ Created 500 messages\n`);

  // ==================== SUMMARY ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✨ TEST DATA GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`👥 ${users.length} Users`);
  console.log(`👨‍👩‍👧‍👦 ${userGroups.length} User Groups`);
  console.log(`📁 ${projects.length} Projects`);
  console.log(`⏱️  ${timeEntryCount}+ Time Entries`);
  console.log(`🏢 ${customers.length} Customers`);
  console.log(`🧾 300 Invoices`);
  console.log(`📦 200 Orders`);
  console.log(`⚠️  150 Incidents`);
  console.log(`💻 300 Devices`);
  console.log(`💬 500 Messages`);
  console.log(`💰 ${costCenters.length} Cost Centers`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('   Email: [any user]@example.com');
  console.log('   Password: Test123!');
  console.log('');
  console.log('   Admin Examples:');
  for (let i = 0; i < Math.min(5, users.length); i++) {
    if (users[i].role === 'ADMIN') {
      console.log(`   - ${users[i].email} (${users[i].role})`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════');
}

// ==================== EXECUTION ====================

generateTestData()
  .catch((e) => {
    console.error('❌ Error during test data generation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
