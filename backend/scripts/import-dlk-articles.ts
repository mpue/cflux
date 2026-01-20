import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importDlkArticles() {
  try {
    const csvPath = path.join(__dirname, '..', '..', 'docs', 'dlk.csv');
    console.log(`Reading CSV file from: ${csvPath}`);
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Skip header line
    let imported = 0;
    let skipped = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }
      
      // Split by semicolon
      const columns = line.split(';');
      
      if (columns.length < 3) {
        console.log(`Skipping line ${i + 1}: Not enough columns`);
        skipped++;
        continue;
      }
      
      const articleNumber = columns[0]?.trim();
      const name = columns[1]?.trim();
      const description = columns[2]?.trim();
      
      // Skip if articleNumber is empty or not a valid number
      if (!articleNumber || articleNumber === '' || isNaN(Number(articleNumber))) {
        console.log(`Skipping line ${i + 1}: Invalid article number "${articleNumber}"`);
        skipped++;
        continue;
      }
      
      // Skip if name is empty
      if (!name || name === '') {
        console.log(`Skipping line ${i + 1}: Empty name`);
        skipped++;
        continue;
      }
      
      try {
        // Check if article already exists
        const existing = await prisma.article.findUnique({
          where: { articleNumber }
        });
        
        if (existing) {
          console.log(`Article ${articleNumber} already exists, updating...`);
          await prisma.article.update({
            where: { articleNumber },
            data: {
              name,
              description: description || null,
              unit: 'Dienstleistung',
              price: 0,
              vatRate: 7.7,
              isActive: true
            }
          });
        } else {
          console.log(`Creating article ${articleNumber}: ${name}`);
          await prisma.article.create({
            data: {
              articleNumber,
              name,
              description: description || null,
              unit: 'Dienstleistung',
              price: 0,
              vatRate: 7.7,
              isActive: true
            }
          });
        }
        
        imported++;
      } catch (error) {
        console.error(`Error importing article ${articleNumber}:`, error);
        skipped++;
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Total lines processed: ${lines.length - 1}`);
    console.log(`Successfully imported/updated: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('Error importing articles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importDlkArticles()
  .then(() => {
    console.log('Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
