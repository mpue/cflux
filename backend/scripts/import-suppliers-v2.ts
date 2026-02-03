import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Parse CSV with proper handling of multi-line quoted fields
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.split('\n');
  
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }
    
    if (!inQuotes && char === ';') {
      // Field separator
      currentRow.push(currentField.trim());
      currentField = '';
      i++;
      continue;
    }
    
    if (!inQuotes && (char === '\n' || char === '\r')) {
      // End of row
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
      i++;
      continue;
    }
    
    // Regular character
    currentField += char;
    i++;
  }
  
  // Add last row if any
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }
  
  return rows;
}

// Clean field - remove extra spaces and normalize
function cleanField(field: string | undefined): string {
  if (!field) return '';
  return field
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .trim();
}

async function importSuppliers() {
  try {
    const csvPath = path.join('/app/docs/lieferanten.csv');
    console.log('Lese CSV-Datei:', csvPath);
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(fileContent);
    
    console.log('\nGefundene Zeilen:', rows.length);
    
    let imported = 0;
    let skipped = 0;
    
    // Skip header row (index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // CSV columns: Name, Ansprechpartner, Tel, Fax, Homepage, Kd-Nr, Kategorie, was wird bestellt, Ansprechpartner2, Art, Bemerkungen
      const name = cleanField(row[0]);
      const contactPerson = cleanField(row[1]);
      const phone = cleanField(row[2]);
      const faxField = cleanField(row[3]);
      const homepageField = cleanField(row[4]);
      const customerNumber = cleanField(row[5]);
      const category = cleanField(row[6]);
      
      // Combine other fields into notes including fax and homepage
      const notesFields = [
        faxField ? `Fax: ${faxField}` : '',
        homepageField ? `Homepage: ${homepageField}` : '',
        row[7] ? `Was wird bestellt: ${cleanField(row[7])}` : '',
        row[8] ? `Ansprechpartner: ${cleanField(row[8])}` : '',
        row[9] ? `Art: ${cleanField(row[9])}` : '',
        row[10] ? `Bemerkungen: ${cleanField(row[10])}` : ''
      ].filter(s => s.length > 0);
      
      const notes = notesFields.length > 0 ? notesFields.join(' | ') : undefined;
      
      if (!name || name.length === 0) {
        skipped++;
        continue;
      }
      
      // Check if supplier already exists
      const existing = await prisma.supplier.findFirst({
        where: { name }
      });
      
      if (existing) {
        console.log(`⚠️  Übersprungen (existiert bereits): ${name}`);
        skipped++;
        continue;
      }
      
      // Create supplier
      await prisma.supplier.create({
        data: {
          name,
          contactPerson: contactPerson || undefined,
          phone: phone || undefined,
          customerNumber: customerNumber || undefined,
          category: category || undefined,
          notes: notes
        }
      });
      
      imported++;
      const displayInfo = [
        category ? `Kategorie: ${category}` : '',
        contactPerson ? `Kontakt: ${contactPerson}` : ''
      ].filter(s => s).join(', ');
      
      console.log(`✅ ${name}${displayInfo ? ` (${displayInfo})` : ''}`);
    }
    
    console.log('\n=== Import abgeschlossen ===');
    console.log(`✅ ${imported} Lieferanten importiert`);
    console.log(`⚠️  ${skipped} übersprungen`);
    
  } catch (error) {
    console.error('Fehler beim Import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importSuppliers();
