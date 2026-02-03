import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface SupplierRow {
  name: string;
  contactPerson?: string;
  phone?: string;
  fax?: string;
  homepage?: string;
  customerNumber?: string;
  category?: string;
  notes?: string;
}

function cleanField(field: string | undefined): string | undefined {
  if (!field) return undefined;
  
  // Entferne Anführungszeichen und Zeilenumbrüche
  let cleaned = field
    .replace(/^["']|["']$/g, '')
    .replace(/\r?\n/g, ' ')
    .trim();
  
  return cleaned.length > 0 ? cleaned : undefined;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

async function importSuppliers() {
  const csvFilePath = path.join(__dirname, '../docs/lieferanten.csv');

  console.log('Lese CSV-Datei:', csvFilePath);

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent.split('\n');
  const results: SupplierRow[] = [];

  // Erste Zeile überspringen (Header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseCSVLine(line);
    
    // CSV-Struktur: Name ist in Spalte 0, aber oft mehrzeilige Einträge in Anführungszeichen
    // Spalten: 0=Name, 1=Ansprechpartner, 2=Tel, 3=Fax, 4=Homepage, 5=Kd-Nr, 6=Kategorie, 7=was wird bestellt, 8=Ansprechpartner2, 9=Art, 10=Bemerkungen
    const name = cleanField(row[0]);

    // Nur importieren wenn Name vorhanden und nicht leer
    if (name && name.length > 1 && !name.toLowerCase().includes('ansprech')) {
      const contactPerson = cleanField(row[1]);
      const phone = cleanField(row[2]);
      const fax = cleanField(row[3]);
      const homepage = cleanField(row[4]);
      const customerNumber = cleanField(row[5]);
      const category = cleanField(row[6]);

      // Notizen aus mehreren Spalten zusammensetzen (was wird bestellt, Ansprechpartner, Art, Bemerkungen)
      const notes = [row[7], row[8], row[9], row[10]]
        .map(s => cleanField(s))
        .filter(s => s && s.length > 0)
        .join(' | ') || undefined;

      results.push({
        name: name.substring(0, 255),
        contactPerson: contactPerson,
        phone: phone,
        fax: fax,
        homepage: homepage,
        customerNumber: customerNumber,
        category: category,
        notes: notes,
      });
    }
  }

  console.log(`\nGefundene Lieferanten: ${results.length}`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const supplier of results) {
    try {
      // Prüfen ob Lieferant bereits existiert (nach Name)
      const existing = await prisma.supplier.findFirst({
        where: {
          name: {
            equals: supplier.name,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        console.log(`⏭️  Übersprungen (existiert bereits): ${supplier.name}`);
        skipped++;
      } else {
        // E-Mail aus customerNumber extrahieren (falls vorhanden)
        let email: string | undefined = undefined;
        if (supplier.customerNumber && supplier.customerNumber.includes('@')) {
          const emailMatch = supplier.customerNumber.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
          if (emailMatch) {
            email = emailMatch[1];
          }
        }

        await prisma.supplier.create({
          data: {
            name: supplier.name.substring(0, 255), // Name auf max 255 Zeichen begrenzen
            customerNumber: supplier.customerNumber,
            category: supplier.category,
            contactPerson: supplier.contactPerson,
            email: email,
            phone: supplier.phone,
            notes: supplier.notes,
            isActive: true,
          },
        });

        console.log(`✅ Importiert: ${supplier.name}${supplier.category ? ` [${supplier.category}]` : ''}`);
        imported++;
      }
    } catch (error: any) {
      console.error(`❌ Fehler bei: ${supplier.name}`, error.message);
      errors++;
    }
  }

  console.log('\n===========================================');
  console.log(`✅ Erfolgreich importiert: ${imported}`);
  console.log(`⏭️  Übersprungen (existiert): ${skipped}`);
  console.log(`❌ Fehler: ${errors}`);
  console.log(`📊 Gesamt verarbeitet: ${results.length}`);
  console.log('===========================================\n');

  await prisma.$disconnect();
}

// Script ausführen
importSuppliers()
  .then(() => {
    console.log('Import abgeschlossen!');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('Import fehlgeschlagen:', error);
    process.exit(1);
  });
