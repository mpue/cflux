import { PrismaClient, ProjectStatus, InvoiceStatus, OrderStatus, DocumentType } from '@prisma/client';
import { addDays, addMonths, subMonths, startOfMonth, format } from 'date-fns';

const prisma = new PrismaClient();

// Hilfsfunktion für zufällige Zahlen
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Hilfsfunktion für zufällige Auswahl aus Array
function randomChoice<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

// Hilfsfunktion für zufällige Dezimalzahl
function randomDecimal(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

async function seedBusinessReportData() {
  console.log('🎯 Starte Generierung von Geschäftsbericht-Demodaten...\n');

  try {
    // 1. Hole bestehende Daten
    const users = await prisma.user.findMany({
      where: { isActive: true }
    });

    if (users.length === 0) {
      console.log('❌ Keine aktiven Benutzer gefunden. Bitte zuerst Benutzer anlegen.');
      return;
    }

    console.log(`✅ ${users.length} aktive Benutzer gefunden\n`);

    // 2. Aktualisiere Employees mit Departments
    console.log('👥 Aktualisiere Employees mit Departments...');
    const departments = [
      'Engineering',
      'Sales',
      'Marketing',
      'HR',
      'Finance',
      'Operations',
      'Customer Support',
      'Product Management'
    ];

    const employees = await prisma.employee.findMany({ where: { isActive: true } });
    for (let i = 0; i < employees.length; i++) {
      await prisma.employee.update({
        where: { id: employees[i].id },
        data: {
          department: departments[i % departments.length],
          position: randomChoice(['Senior', 'Junior', 'Lead', 'Manager'])
        }
      });
    }
    console.log(`✅ ${employees.length} Employees aktualisiert\n`);

    // 3. Erstelle Kunden
    console.log('🏢 Erstelle Kunden...');
    const customerNames = [
      'Schweizer Innovationsbank AG',
      'Alpine Tech Solutions GmbH',
      'Helvetia Consulting Group',
      'Swiss Digital Services AG',
      'Zurich Medical Systems',
      'Geneva Finance Corporation',
      'Bern Manufacturing AG',
      'Basel Pharma Research',
      'Lausanne Business Solutions',
      'Luzern Tech Partners'
    ];

    const customers = [];
    for (const name of customerNames) {
      const existing = await prisma.customer.findFirst({
        where: { name }
      });
      
      if (!existing) {
        const customer = await prisma.customer.create({
          data: {
            name: name,
            contactPerson: 'Max Mustermann',
            email: `kontakt@${name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').substring(0, 50)}.ch`,
            phone: `+41 ${randomInt(21, 99)} ${randomInt(100, 999)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
            address: `Musterstrasse ${randomInt(1, 99)}`,
            city: randomChoice(['Zürich', 'Bern', 'Basel', 'Genf', 'Lausanne', 'Luzern']),
            zipCode: `${randomInt(1000, 9999)}`,
            country: 'Schweiz',
            isActive: true
          }
        });
        customers.push(customer);
      } else {
        customers.push(existing);
      }
    }
    console.log(`✅ ${customers.length} Kunden erstellt\n`);

    // 4. Erstelle Projekte über die letzten 12 Monate
    console.log('📁 Erstelle Projekte...');
    const projectStatuses: ProjectStatus[] = ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'PLANNING'];
    const projectNames = [
      'Digital Transformation',
      'Cloud Migration',
      'Mobile App Development',
      'Website Redesign',
      'CRM Implementation',
      'Data Analytics Platform',
      'Security Audit',
      'API Integration',
      'E-Commerce Platform',
      'Business Intelligence Dashboard',
      'DevOps Automation',
      'Quality Management System',
      'Supply Chain Optimization',
      'Customer Portal',
      'Internal Tools Development'
    ];

    const projects = [];
    for (let i = 0; i < projectNames.length; i++) {
      const startDate = subMonths(new Date(), randomInt(0, 11));
      const status: ProjectStatus = i < 8 ? 'ACTIVE' : randomChoice(projectStatuses);
      
      const project = await prisma.project.create({
        data: {
          name: `${projectNames[i]} - ${customers[i % customers.length].name}`,
          description: `Umfassendes ${projectNames[i]} Projekt`,
          status: status,
          startDate: startDate,
          endDate: status === 'COMPLETED' ? addMonths(startDate, randomInt(2, 6)) : null,
          defaultHourlyRate: randomDecimal(120, 250, 2),
          customerId: customers[i % customers.length].id,
          isActive: true
        }
      });
      projects.push(project);
    }
    console.log(`✅ ${projects.length} Projekte erstellt\n`);

    // 5. Erstelle Rechnungen über die letzten 12 Monate
    console.log('💰 Erstelle Rechnungen...');
    const invoices = [];
    const statusDistribution = {
      PAID: 0.6,      // 60% bezahlt
      SENT: 0.2,      // 20% versendet
      DRAFT: 0.1,     // 10% Entwurf
      OVERDUE: 0.1    // 10% überfällig
    };

    for (let month = 11; month >= 0; month--) {
      const monthDate = subMonths(new Date(), month);
      const invoicesThisMonth = randomInt(5, 12);

      for (let i = 0; i < invoicesThisMonth; i++) {
        const customer = randomChoice(customers);
        
        // Bestimme Status basierend auf Verteilung
        const rand = Math.random();
        let status: InvoiceStatus;
        if (rand < statusDistribution.PAID) {
          status = 'PAID';
        } else if (rand < statusDistribution.PAID + statusDistribution.SENT) {
          status = 'SENT';
        } else if (rand < statusDistribution.PAID + statusDistribution.SENT + statusDistribution.DRAFT) {
          status = 'DRAFT';
        } else {
          status = 'OVERDUE';
        }

        const subtotal = randomDecimal(5000, 50000, 2);
        const vatRate = 8.1; // Swiss VAT
        const vatAmount = parseFloat((subtotal * vatRate / 100).toFixed(2));
        const totalAmount = parseFloat((subtotal + vatAmount).toFixed(2));

        const invoiceDate = addDays(startOfMonth(monthDate), randomInt(1, 28));
        const dueDate = addDays(invoiceDate, 30);

        const invoice = await prisma.invoice.create({
          data: {
            documentType: 'INVOICE' as DocumentType,
            invoiceNumber: `RE-${format(monthDate, 'yyyyMM')}-${String(i + 1).padStart(4, '0')}`,
            customerId: customer.id,
            invoiceDate: invoiceDate,
            dueDate: dueDate,
            status: status,
            subtotal: subtotal,
            vatAmount: vatAmount,
            totalAmount: totalAmount,
            notes: `Dienstleistungen ${format(monthDate, 'MMMM yyyy')}`,
            isActive: true
          }
        });
        
        // Erstelle ein Invoice Item
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: `Projektarbeit ${format(monthDate, 'MMMM')}`,
            quantity: randomInt(40, 160),
            unitPrice: randomDecimal(100, 200, 2),
            vatRate: vatRate,
            totalPrice: subtotal
          }
        });
        
        invoices.push(invoice);
      }
    }
    console.log(`✅ ${invoices.length} Rechnungen erstellt\n`);

    // 6. Erstelle Zeiterfassungen über die letzten 3 Monate
    console.log('⏱️  Erstelle Zeiterfassungen...');
    const timeEntries = [];
    
    if (employees.length === 0) {
      console.log('⚠️  Keine Employees gefunden, überspringe Zeiterfassungen\n');
    } else {
      for (let month = 2; month >= 0; month--) {
        const monthDate = subMonths(new Date(), month);

        for (const employee of employees) {
          // Arbeite 20-22 Tage pro Monat
          const workDays = randomInt(20, 22);
          
          for (let day = 0; day < workDays; day++) {
            const date = addDays(startOfMonth(monthDate), randomInt(1, 28));
            
            // Überspringe Wochenenden
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            const project = randomChoice(projects);
            
            // Normale Arbeitszeit: 8-9 Stunden
            const regularHours = randomDecimal(7.5, 9, 0.25);
            // Overtime in 5% der Fälle
            const rand = Math.random();
            let hours = regularHours;
            
            if (rand > 0.95) {
              // Overtime
              hours = regularHours + randomDecimal(1, 3, 0.25);
            }

            const clockIn = new Date(date);
            clockIn.setHours(8 + randomInt(0, 2), randomInt(0, 59), 0);
            
            const clockOut = new Date(clockIn);
            clockOut.setHours(clockIn.getHours() + Math.floor(hours), Math.floor((hours % 1) * 60), 0);

            const timeEntry = await prisma.timeEntry.create({
              data: {
                employeeId: employee.id,
                projectId: project.id,
                clockIn: clockIn,
                clockOut: clockOut,
                pauseMinutes: 60, // 1 hour break
                status: 'CLOCKED_OUT',
                description: `Arbeit an ${project.name}`
              }
            });
            timeEntries.push(timeEntry);
          }
        }
      }
      console.log(`✅ ${timeEntries.length} Zeiterfassungen erstellt\n`);
    }

    // 7. Erstelle Bestellungen (Orders)
    console.log('📦 Erstelle Bestellungen...');
    const orderStatuses: OrderStatus[] = ['DRAFT', 'REQUESTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'];
    const orderItems = [
      { name: 'Dell Laptop XPS 15', price: 2500 },
      { name: 'iPhone 15 Pro', price: 1200 },
      { name: 'Office Chair Premium', price: 850 },
      { name: 'Monitor 27" 4K', price: 650 },
      { name: 'Docking Station', price: 350 },
      { name: 'Wireless Keyboard & Mouse', price: 180 },
      { name: 'Webcam HD Pro', price: 220 },
      { name: 'Noise Cancelling Headphones', price: 380 },
      { name: 'External SSD 2TB', price: 250 },
      { name: 'Office Desk Adjustable', price: 1200 }
    ];

    const orders = [];
    for (let month = 5; month >= 0; month--) {
      const monthDate = subMonths(new Date(), month);
      const ordersThisMonth = randomInt(3, 8);

      for (let i = 0; i < ordersThisMonth; i++) {
        const orderDate = addDays(startOfMonth(monthDate), randomInt(1, 28));
        const requestedBy = randomChoice(users);
        
        // Status basierend auf Alter
        let status: OrderStatus;
        if (month > 3) {
          status = randomChoice(['RECEIVED', 'CANCELLED'] as OrderStatus[]);
        } else if (month > 1) {
          status = randomChoice(['APPROVED', 'ORDERED', 'RECEIVED'] as OrderStatus[]);
        } else {
          status = randomChoice(orderStatuses);
        }

        const numItems = randomInt(1, 4);
        const selectedItems = [];
        const usedItems = new Set<number>();
        
        while (selectedItems.length < numItems) {
          const idx = randomInt(0, orderItems.length - 1);
          if (!usedItems.has(idx)) {
            usedItems.add(idx);
            selectedItems.push(orderItems[idx]);
          }
        }

        const totalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);
        const vatRate = 8.1;
        const vatAmount = parseFloat((totalAmount * vatRate / 100).toFixed(2));
        const grandTotal = parseFloat((totalAmount + vatAmount).toFixed(2));

        const order = await prisma.order.create({
          data: {
            orderNumber: `BO-${format(monthDate, 'yyyyMM')}${String(i + 1).padStart(3, '0')}`,
            title: selectedItems[0].name + (selectedItems.length > 1 ? ` +${selectedItems.length - 1} weitere` : ''),
            requestedById: requestedBy.id,
            orderDate: orderDate,
            status: status,
            totalAmount: totalAmount,
            vatAmount: vatAmount,
            grandTotal: grandTotal,
            description: selectedItems.map(item => item.name).join(', '),
            isActive: true
          }
        });
        orders.push(order);
      }
    }
    console.log(`✅ ${orders.length} Bestellungen erstellt\n`);

    // 8. Statistiken ausgeben
    console.log('📈 Zusammenfassung der generierten Daten:\n');
    console.log(`   👥 Benutzer: ${users.length}`);
    console.log(`   🏢 Kunden: ${customers.length}`);
    console.log(`   📁 Projekte: ${projects.length}`);
    console.log(`   💰 Rechnungen: ${invoices.length}`);
    console.log(`   ⏱️  Zeiterfassungen: ${timeEntries.length}`);
    console.log(`   📦 Bestellungen: ${orders.length}\n`);

    // Rechnungsstatistik
    const invoiceStats = {
      paid: invoices.filter(i => i.status === 'PAID').length,
      sent: invoices.filter(i => i.status === 'SENT').length,
      draft: invoices.filter(i => i.status === 'DRAFT').length,
      overdue: invoices.filter(i => i.status === 'OVERDUE').length,
      totalRevenue: invoices
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + i.totalAmount, 0)
    };

    console.log('💰 Rechnungsstatistik:');
    console.log(`   ✅ Bezahlt: ${invoiceStats.paid}`);
    console.log(`   📤 Versendet: ${invoiceStats.sent}`);
    console.log(`   📝 Entwurf: ${invoiceStats.draft}`);
    console.log(`   ⚠️  Überfällig: ${invoiceStats.overdue}`);
    console.log(`   💵 Gesamtumsatz (bezahlt): CHF ${invoiceStats.totalRevenue.toFixed(2)}\n`);

    // Projektstatistik
    const projectStats = {
      active: projects.filter(p => p.status === 'ACTIVE').length,
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      onHold: projects.filter(p => p.status === 'ON_HOLD').length,
      planning: projects.filter(p => p.status === 'PLANNING').length
    };

    console.log('📁 Projektstatistik:');
    console.log(`   🟢 Aktiv: ${projectStats.active}`);
    console.log(`   ✅ Abgeschlossen: ${projectStats.completed}`);
    console.log(`   ⏸️  Pausiert: ${projectStats.onHold}`);
    console.log(`   📋 Planung: ${projectStats.planning}\n`);

    // Zeiterfassungsstatistik
    const totalHours = timeEntries.reduce((sum, te) => {
      if (te.clockIn && te.clockOut) {
        const hours = (te.clockOut.getTime() - te.clockIn.getTime()) / (1000 * 60 * 60);
        const netHours = hours - (te.pauseMinutes || 0) / 60;
        return sum + netHours;
      }
      return sum;
    }, 0);

    console.log('⏱️  Zeiterfassungsstatistik:');
    console.log(`   📊 Gesamtstunden: ${totalHours.toFixed(2)} h\n`);

    console.log('✅ Geschäftsbericht-Demodaten erfolgreich generiert!\n');
    console.log('🎯 Der Geschäftsbericht kann nun mit umfangreichen Daten getestet werden.');
    console.log('📊 Zeitraum: Letzte 12 Monate für Rechnungen, 3 Monate für Zeiterfassung');

  } catch (error) {
    console.error('❌ Fehler beim Generieren der Demodaten:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script ausführen
seedBusinessReportData()
  .then(() => {
    console.log('\n✅ Script erfolgreich beendet');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script mit Fehler beendet:', error);
    process.exit(1);
  });
