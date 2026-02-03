import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      take: 10,
      select: {
        name: true,
        customerNumber: true,
        category: true,
        contactPerson: true
      }
    });
    
    console.log('\n=== Erste 10 Lieferanten ===\n');
    suppliers.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   Kundennummer: ${s.customerNumber || '(leer)'}`);
      console.log(`   Kategorie: ${s.category || '(leer)'}`);
      console.log(`   Kontakt: ${s.contactPerson || '(leer)'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuppliers();
