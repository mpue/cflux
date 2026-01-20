import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomBoolean(prob: number = 0.5): boolean {
  return Math.random() < prob;
}

const firstNames = [
  'Adrian', 'Barbara', 'Christian', 'Diana', 'Ernst', 'Franziska',
  'Georg', 'Helena', 'Ingrid', 'Jonas', 'Katharina', 'Ludwig', 'Margot',
  'Nikolaus', 'Otto', 'Paula', 'Quentin', 'Rita', 'Stefan', 'Tanja',
  'Ulrich', 'Verena', 'Wolfgang', 'Xenia', 'Yannick', 'Zara'
];

const lastNames = [
  'König', 'Walter', 'Mayer', 'Huber', 'Kaiser', 'Fuchs',
  'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung',
  'Hahn', 'Schubert', 'Vogel', 'Friedrich', 'Keller', 'Günther'
];

async function main() {
  console.log('🚀 Creating MASSIVE additional test data...\n');

  // Get existing data for relationships
  const allUsers = await prisma.user.findMany();
  const allProjects = await prisma.project.findMany();
  const allCustomers = await prisma.customer.findMany();

  if (allUsers.length === 0) {
    console.error('❌ No users found. Run seed:dev first!');
    return;
  }

  console.log(`📊 Found ${allUsers.length} existing users, ${allProjects.length} projects, ${allCustomers.length} customers\n`);

  // ==================== 1. ADD MORE USERS ====================
  console.log('👤 Creating 100 additional users...');
  const password = await bcrypt.hash('Test123!', 10);
  const newUsers = [];

  for (let i = 0; i < 100; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomInt(100, 999)}@example.com`;

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password,
          firstName,
          lastName,
          role: i < 3 ? 'ADMIN' : 'USER',
          vacationDays: randomInt(20, 30),
          isActive: true,
          hasChangedPassword: randomBoolean(0.7),
        },
      });
      newUsers.push(user);
    } catch (e) {
      // Skip if email already exists
      continue;
    }
  }
  console.log(`✅ Created ${newUsers.length} new users\n`);

  const combinedUsers = [...allUsers, ...newUsers];

  // ==================== 2. MASSIVE TIME ENTRIES ====================
  console.log('⏱️ Creating 3000 time entries...');
  let timeEntryCount = 0;
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-01-19');

  for (let i = 0; i < 3000; i++) {
    const user = randomChoice(combinedUsers.filter(u => u.isActive));
    const project = allProjects.length > 0 && randomBoolean(0.7) ? randomChoice(allProjects) : null;

    const clockIn = randomDate(startDate, endDate);
    clockIn.setHours(randomInt(6, 10), randomInt(0, 59), 0, 0);

    const clockOut = new Date(clockIn);
    clockOut.setHours(clockIn.getHours() + randomInt(6, 10), randomInt(0, 59), 0, 0);

    try {
      await prisma.timeEntry.create({
        data: {
          userId: user.id,
          clockIn,
          clockOut: randomBoolean(0.95) ? clockOut : null,
          projectId: project?.id || null,
        },
      });
      timeEntryCount++;
    } catch (e) {
      // Continue on error
      continue;
    }
  }
  console.log(`✅ Created ${timeEntryCount} time entries\n`);

  // ==================== 3. MORE INVOICES ====================
  console.log('🧾 Creating 200 invoices...');
  let invoiceCount = 0;

  if (allCustomers.length > 0) {
    const startInvoiceNum = 100000 + randomInt(1, 50000);

    for (let i = 0; i < 200; i++) {
      const invoiceDate = randomDate(new Date('2023-01-01'), new Date('2026-01-15'));
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + randomInt(14, 60));

      const status = randomChoice(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const);
      const paidDate = status === 'PAID' ? randomDate(invoiceDate, dueDate) : null;

      const subtotal = randomInt(1000, 50000);
      const taxRate = 0.077;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      try {
        await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${String(startInvoiceNum + i).padStart(6, '0')}`,
            customerId: randomChoice(allCustomers).id,
            invoiceDate,
            dueDate,
            status,
            totalAmount,
            taxRate,
            taxAmount,
            subtotal,
            paidDate,
            createdBy: randomChoice(combinedUsers).id,
          },
        });
        invoiceCount++;
      } catch (e) {
        continue;
      }
    }
  }
  console.log(`✅ Created ${invoiceCount} invoices\n`);

  // ==================== 4. ORDERS ====================
  console.log('📦 Creating 150 orders...');
  let orderCount = 0;
  const startOrderNum = 200000 + randomInt(1, 50000);

  for (let i = 0; i < 150; i++) {
    const requestDate = randomDate(new Date('2024-01-01'), new Date('2026-01-15'));
    const expectedDelivery = new Date(requestDate);
    expectedDelivery.setDate(expectedDelivery.getDate() + randomInt(7, 45));

    const status = randomChoice(['DRAFT', 'REQUESTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'] as const);

    try {
      await prisma.order.create({
        data: {
          orderNumber: `BO-${String(startOrderNum + i)}`,
          requestedBy: randomChoice(combinedUsers).id,
          approvedBy: randomBoolean(0.6) ? randomChoice(combinedUsers.filter(u => u.role === 'ADMIN')).id : null,
          status,
          category: randomChoice(['IT-Ausstattung', 'Büromaterial', 'Möbel', 'Dienstleistungen']),
          description: `Bestellung ${i + 1} - ${randomChoice(['Laptops', 'Monitore', 'Drucker', 'Papier', 'Möbel'])}`,
          totalAmount: randomInt(500, 25000),
          requestDate,
          expectedDeliveryDate: expectedDelivery,
        },
      });
      orderCount++;
    } catch (e) {
      continue;
    }
  }
  console.log(`✅ Created ${orderCount} orders\n`);

  // ==================== 5. INCIDENTS ====================
  console.log('⚠️ Creating 100 incidents...');
  let incidentCount = 0;
  const startIncidentNum = 10000 + randomInt(1, 50000);

  for (let i = 0; i < 100; i++) {
    const incidentDate = randomDate(new Date('2024-01-01'), new Date('2026-01-15'));
    const status = randomChoice(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const);

    try {
      await prisma.incident.create({
        data: {
          incidentNumber: `INC-${String(startIncidentNum + i).padStart(6, '0')}`,
          title: `Vorfall ${i + 1} - ${randomChoice(['Werkstatt', 'Büro', 'Lager', 'Produktion'])}`,
          description: `Detaillierte Beschreibung des Vorfalls ${i + 1}. ${randomChoice([
            'Stolpergefahr erkannt und behoben',
            'Kleinere Verletzung behandelt',
            'Defektes Equipment ausgetauscht',
            'Unsicheres Verhalten gemeldet'
          ])}`,
          incidentType: randomChoice(['Unfall', 'Beinahe-Unfall', 'Gefährdung', 'Umweltvorfall']),
          severity: randomChoice(['NIEDRIG', 'MITTEL', 'HOCH', 'KRITISCH']),
          status,
          incidentDate,
          reportedById: randomChoice(combinedUsers).id,
          location: randomChoice(['Werkstatt A', 'Büro 1.OG', 'Büro 2.OG', 'Lager', 'Produktionshalle']),
          injurySustained: randomBoolean(0.3),
          firstAidGiven: randomBoolean(0.4),
          medicalTreatmentRequired: randomBoolean(0.2),
        },
      });
      incidentCount++;
    } catch (e) {
      continue;
    }
  }
  console.log(`✅ Created ${incidentCount} incidents\n`);

  // ==================== 6. DEVICES ====================
  console.log('💻 Creating 200 devices...');
  let deviceCount = 0;
  const manufacturers = ['HP', 'Dell', 'Lenovo', 'Apple', 'Samsung', 'Canon', 'Brother'];
  const startAssetNum = 50000 + randomInt(1, 50000);

  for (let i = 0; i < 200; i++) {
    const purchaseDate = randomDate(new Date('2020-01-01'), new Date('2025-12-01'));
    const status = randomChoice(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']);

    try {
      await prisma.device.create({
        data: {
          name: `${randomChoice(manufacturers)} Device ${i + 1}`,
          manufacturer: randomChoice(manufacturers),
          model: `Model-${randomInt(1000, 9999)}`,
          serialNumber: `SN-${String(startAssetNum + i).padStart(10, '0')}`,
          purchaseDate,
          status,
          assignedToId: status === 'IN_USE' ? randomChoice(combinedUsers.filter(u => u.isActive)).id : null,
          location: randomChoice(['Büro Zürich', 'Büro Bern', 'Büro Basel', 'Lager', 'Home Office']),
          warrantyExpiry: new Date(purchaseDate.getTime() + 365 * 24 * 60 * 60 * 1000 * randomInt(1, 5)),
        },
      });
      deviceCount++;
    } catch (e) {
      continue;
    }
  }
  console.log(`✅ Created ${deviceCount} devices\n`);

  // ==================== 7. MESSAGES ====================
  console.log('💬 Creating 300 messages...');
  let messageCount = 0;

  for (let i = 0; i < 300; i++) {
    const sender = randomChoice(combinedUsers);
    const recipient = randomChoice(combinedUsers.filter(u => u.id !== sender.id));
    const sentAt = randomDate(new Date('2024-06-01'), new Date('2026-01-19'));

    try {
      await prisma.message.create({
        data: {
          senderId: sender.id,
          subject: randomChoice([
            'Meeting Anfrage',
            'Projekt Update',
            'Frage zu Dokument',
            'Urlaubsantrag',
            'Technisches Problem',
            'Feedback',
            'Information',
            'Status Update',
          ]),
          content: `Hallo ${recipient.firstName},\n\nDies ist eine Nachricht bezüglich ${randomChoice([
            'des laufenden Projekts',
            'der Zeiterfassung',
            'des nächsten Meetings',
            'einer dringenden Angelegenheit',
            'einer Frage'
          ])}.\n\nBitte um Rückmeldung.\n\nGrüße,\n${sender.firstName}`,
          isRead: randomBoolean(0.6),
          readAt: randomBoolean(0.6) ? randomDate(sentAt, new Date()) : null,
          sentAt,
        },
      });
      messageCount++;
    } catch (e) {
      continue;
    }
  }
  console.log(`✅ Created ${messageCount} messages\n`);

  // ==================== SUMMARY ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✨ MASSIVE TEST DATA GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`👥 +${newUsers.length} New Users (Total: ${combinedUsers.length})`);
  console.log(`⏱️  +${timeEntryCount} Time Entries`);
  console.log(`🧾 +${invoiceCount} Invoices`);
  console.log(`📦 +${orderCount} Orders`);
  console.log(`⚠️  +${incidentCount} Incidents`);
  console.log(`💻 +${deviceCount} Devices`);
  console.log(`💬 +${messageCount} Messages`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔐 All new users have password: Test123!');
  console.log('');
  console.log('Example logins:');
  for (let i = 0; i < Math.min(3, newUsers.length); i++) {
    console.log(`  - ${newUsers[i].email}`);
  }
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
