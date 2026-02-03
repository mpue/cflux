import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupSuppliers() {
  console.log('Lösche alle Lieferanten...');
  
  const result = await prisma.supplier.deleteMany({});
  
  console.log(`✅ ${result.count} Lieferanten gelöscht`);
  
  await prisma.$disconnect();
}

cleanupSuppliers()
  .then(() => {
    console.log('Bereinigung abgeschlossen!');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('Fehler:', error);
    process.exit(1);
  });
