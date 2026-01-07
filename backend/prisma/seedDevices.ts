import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'aquist';

interface CSVDevice {
  serialNumber: string;
  details: string;
  quantity: number;
  category: string;
  assignedTo: string;
  assignmentDate: string;
}

function parseCSV(filePath: string): CSVDevice[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  const devices: CSVDevice[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(';');
    if (parts.length < 6) continue;
    
    const serialNumber = parts[0]?.trim() || '';
    const details = parts[1]?.trim() || '';
    const quantity = parseInt(parts[2]?.trim() || '1', 10);
    const category = parts[3]?.trim() || '';
    const assignedTo = parts[4]?.trim() || '';
    const assignmentDate = parts[5]?.trim() || '';
    
    // Skip if no category
    if (!category) continue;
    
    devices.push({
      serialNumber,
      details,
      quantity,
      category,
      assignedTo,
      assignmentDate
    });
  }
  
  return devices;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'N/A') return null;
  
  // Format: DD.MM.YYYY
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  return new Date(year, month, day);
}

async function findOrCreateUserByName(name: string): Promise<string | null> {
  if (!name || name === 'Lager' || name === 'N/A' || name === 'Baustelle Lonza') return null;
  
  // Try to split name into first and last name
  const nameParts = name.trim().split(' ');
  if (nameParts.length < 2) return null;
  
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  
  // Search for user
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          AND: [
            { firstName: { contains: firstName, mode: 'insensitive' } },
            { lastName: { contains: lastName, mode: 'insensitive' } }
          ]
        },
        {
          email: { contains: name.toLowerCase().replace(/\s+/g, '.'), mode: 'insensitive' }
        }
      ]
    }
  });
  
  // If user not found, create new user
  if (!user) {
    try {
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '.')}@aquist.ch`;
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'USER',
          isActive: true,
          vacationDays: 25,
          weeklyHours: 40
        }
      });
      
      console.log(`✓ Created new user: ${firstName} ${lastName} (${email})`);
    } catch (error) {
      console.error(`Error creating user ${firstName} ${lastName}:`, error);
      return null;
    }
  }
  
  return user?.id || null;
}

function getCategoryName(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'Laptop': 'Laptop',
    'Handy': 'Smartphone',
    'SIM Karte': 'SIM-Karte',
    'Tastatur Maus': 'Eingabegeräte',
    'Tasche': 'Zubehör',
    'Tablet': 'Tablet',
    'Monitor': 'Monitor',
    'Drucker': 'Drucker',
    'P-Touch': 'Etikettendrucker',
    'Handy Hülle': 'Zubehör',
    'Docking Station': 'Docking Station'
  };
  
  return categoryMap[category] || category;
}

function getManufacturer(details: string, category: string): string | null {
  const detailsLower = details.toLowerCase();
  
  if (detailsLower.includes('lenovo')) return 'Lenovo';
  if (detailsLower.includes('google pixel')) return 'Google';
  if (detailsLower.includes('iphone') || detailsLower.includes('apple')) return 'Apple';
  if (detailsLower.includes('samsung')) return 'Samsung';
  if (detailsLower.includes('xiaomi')) return 'Xiaomi';
  if (detailsLower.includes('nubia')) return 'Nubia';
  if (detailsLower.includes('brother')) return 'Brother';
  if (detailsLower.includes('hp') || category === 'Drucker') return 'HP';
  if (detailsLower.includes('logitec')) return 'Logitech';
  if (detailsLower.includes('sunrise')) return 'Sunrise';
  
  return null;
}

function getModel(details: string, serialNumber: string): string | null {
  if (details && details !== 'N/A' && details !== 'Neu' && details !== 'Alt') {
    return details;
  }
  return null;
}

async function seedDevices() {
  console.log('Starting device import from CSV...');
  
  // In Docker, the path is different - check both locations
  let csvPath = path.join(__dirname, '..', '..', 'docs', 'Bestandsaufnahme.csv');
  if (!fs.existsSync(csvPath)) {
    csvPath = '/app/docs/Bestandsaufnahme.csv';
  }
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    return;
  }
  
  const csvDevices = parseCSV(csvPath);
  console.log(`Parsed ${csvDevices.length} entries from CSV`);
  
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const csvDevice of csvDevices) {
    try {
      // Handle multiple quantity - create separate devices
      for (let i = 0; i < csvDevice.quantity; i++) {
        const serialNumber = csvDevice.serialNumber && 
                           csvDevice.serialNumber !== 'N/A' && 
                           csvDevice.serialNumber !== 'Noch abklären'
          ? `${csvDevice.serialNumber}${csvDevice.quantity > 1 ? `-${i + 1}` : ''}`
          : null;
        
        // Skip if device with this serial number already exists
        if (serialNumber) {
          const existing = await prisma.device.findUnique({
            where: { serialNumber }
          });
          if (existing) {
            console.log(`Skipping existing device: ${serialNumber}`);
            skippedCount++;
            continue;
          }
        }
        
        const userId = await findOrCreateUserByName(csvDevice.assignedTo);
        const purchaseDate = parseDate(csvDevice.assignmentDate);
        const category = getCategoryName(csvDevice.category);
        const manufacturer = getManufacturer(csvDevice.details, csvDevice.category);
        const model = getModel(csvDevice.details, csvDevice.serialNumber);
        
        const deviceName = model || `${category}${serialNumber ? ` ${serialNumber}` : ''}`;
        
        const notes = csvDevice.assignedTo === 'Lager' 
          ? 'Im Lager' 
          : csvDevice.assignedTo && csvDevice.assignedTo !== 'N/A'
          ? `Zugewiesen an: ${csvDevice.assignedTo}`
          : null;
        
        const device = await prisma.device.create({
          data: {
            name: deviceName,
            serialNumber,
            manufacturer,
            model,
            category,
            purchaseDate,
            notes,
            isActive: true,
            userId
          }
        });
        
        // Create assignment if user found
        if (userId && purchaseDate) {
          await prisma.deviceAssignment.create({
            data: {
              deviceId: device.id,
              userId,
              assignedAt: purchaseDate,
              notes: `Importiert aus Bestandsaufnahme`
            }
          });
        }
        
        createdCount++;
        console.log(`Created device: ${deviceName} (${category})`);
      }
    } catch (error) {
      console.error(`Error creating device:`, error);
      skippedCount++;
    }
  }
  
  console.log(`\nImport completed:`);
  console.log(`- Created: ${createdCount} devices`);
  console.log(`- Skipped: ${skippedCount} devices`);
}

seedDevices()
  .catch((error) => {
    console.error('Error during device seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
