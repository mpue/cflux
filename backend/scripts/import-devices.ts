import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const csvData = `Name;Comment;User;OS;Vulnerabilities;Missing Updates;Actions
CHVAQ0035;Matthias Diewald;CHVAQ0035\\Matthias Diewald;Windows 11 (24H2);33 non-critical;1 critical,9 non-critical;
CHVAQTB05;Matthias Diewald ;DESKTOP-L717A42\\Matthias Diewald;Windows 11 (23H2);No vulnerable software;2 non-critical;OS nicht Aktiv
CHVAQTB04;Marco Rondic ;DESKTOP-8RS2I8H\\Admin;Windows 11 (25H2);1 non-critical;4 non-critical;OS nicht Aktiv
CHVAQTB03;Yilmaz;DESKTOP-VCMK3BV\\Yilmaz;Windows 11 (23H2);No vulnerable software;2 non-critical;OS nicht Aktiv
CHVAQ0033;Basel 2;CHVAQ0033\\Basel 2;Windows 11 (24H2);34 non-critical;2 critical,23 non-critical;
CHVAQTB02;Vanja Lobas;DESKTOP-S1FMMKD\\Vanja Lobas;Windows 11 (23H2);1 non-critical;1 critical,9 non-critical;OS nicht Aktiv
CHVAQ0034;Boris Vulic;CHVAQ0034\\Boris Vulic;Windows 11 (24H2);5 non-critical;9 non-critical;
CHVAQ0032;Binder Udo;CHVAQ0032\\Binder Udo;Windows 11 (25H2);2 non-critical;12 non-critical;
CHVAQ0031;Moritz Haymayer;CHVAQ0031\\Moritz Haimayer;Windows 11 (24H2);3 non-critical;8 non-critical;
CHVAQ0030;Holger Schleuter;CHVAQ0030\\Holger Schleuter;Windows 11 (24H2);No vulnerable software;8 non-critical;
CHVAQ0028;Stationer Laptop Basel;DESKTOP-GLSS45M\\Basel;Windows 11 (24H2);1 critical,52 non-critical;2 critical,22 non-critical;
chvaq00027;Neu;chvaq0027\\Radovan Radojevic;Windows 11 (24H2);17 non-critical;12 non-critical;
CHVAQ0023;Rado Radojevic alt ;DESKTOP-22N80R6\\User;Windows 11 (24H2);40 non-critical;1 critical,10 non-critical;
CHVAQ0009;Steffen Hofmann-Gauding;DESKTOP-IH0B0NE\\HgS;Windows 10 (22H2);4 non-critical;2 critical,8 non-critical;
CHVAQTB01;Test Tablet;DESKTOP-RU9BB65\\Michael Stein;Windows 11 (24H2);3 critical,179 non-critical;3 critical,9 non-critical;
CHVAQ0012;Lazar Novakovic;DESKTOP-81Q4K08\\User;Windows 11 (22H2);17 critical,67 non-critical;7 non-critical;
CHVAQ0013;Alexander Maric;DESKTOP-IH0B0NE\\Lenovo;Windows 10 (22H2);8 non-critical;1 critical,5 non-critical;
CHVAQ0015;Marco Sandic;DESKTOP-VUHDOGA\\Lenovo;Windows 10 (22H2);6 non-critical;3 critical,11 non-critical;Noch Ersetzen
CHVAQ0014;Janusz;DESKTOP-O8QR5BE\\User;Windows 10 (22H2);No vulnerable software;1 critical,9 non-critical;Noch Ersetzen
CHVAQ0022;Joana Szklarczyk;Aquist\\User;Windows 11 (22H2);21 non-critical;5 non-critical;
CHVAQ0016;Andreas Busse;FURBIFY-JF44J9H\\User;Windows 11 (23H2);7 non-critical;1 critical,11 non-critical;
CHVAQ0011;Adrian Gabinet;DESKTOP-773PU9G\\AdG;Windows 10 (22H2);4 critical,211 non-critical;2 critical,24 non-critical;Noch Ersetzen
CHVAQ0017;Vanja Lobas;Aquist\\User;Windows 11 (24H2);52 non-critical;2 critical,4 non-critical;
CHVAQ0020;Marco Rondic;Aquist\\User;Windows 11 (24H2);33 non-critical;1 critical,4 non-critical;
CHVAQ0019;Ralf Weimann-Zupan;Aquist\\User;Windows 11 (22H2);5 non-critical;8 non-critical;
CHVAQ0008;Mihaela Neu;CHVAQ0008\\BnM;Windows 11 (24H2);40 non-critical;1 critical,10 non-critical;
CHVAQ0005;Yilmaz Laptop;Aquist\\User;Windows 11 (22H2);68 non-critical;15 non-critical;
CHVAQ0006;Phillip Amacker neu;CHVAQ0006\\AmP;Windows 11 (24H2);33 non-critical;1 critical,11 non-critical;
CHVAQ0004;Predrag Petrovic;CHVAQ0004\\Admin;Windows 11 (22H2);9 critical,39 non-critical;7 non-critical;
CHVAQ0003;Ioana Suicu;Aquist\\SuI;Windows 11 (22H2);70 non-critical;1 critical,11 non-critical;
CHVAQ0002;Phillip Amacker;CHVAQCH0002\\User;Windows 11 (24H2);3 critical,128 non-critical;2 critical,12 non-critical;
CHVAQ0001;Michael Stein;CHVAQ0001\\Michael Stein;Windows 11 (24H2);9 non-critical;1 critical,15 non-critical;`;

interface DeviceRow {
  name: string;
  comment: string;
  user: string;
  os: string;
  vulnerabilities: string;
  missingUpdates: string;
  actions: string;
}

function parseCSV(csv: string): DeviceRow[] {
  const lines = csv.trim().split('\n');
  const rows: DeviceRow[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    if (parts.length >= 6) {
      rows.push({
        name: parts[0].trim(),
        comment: parts[1].trim(),
        user: parts[2].trim(),
        os: parts[3].trim(),
        vulnerabilities: parts[4].trim(),
        missingUpdates: parts[5].trim(),
        actions: parts[6] ? parts[6].trim() : ''
      });
    }
  }
  
  return rows;
}

function determineCategory(name: string): string {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('tb')) {
    return 'Tablet';
  }
  
  return 'Laptop';
}

async function importDevices() {
  console.log('🚀 Starting device import...');
  
  const rows = parseCSV(csvData);
  console.log(`📊 Found ${rows.length} devices to import`);
  
  let imported = 0;
  let skipped = 0;
  let updated = 0;
  
  for (const row of rows) {
    try {
      // Check if device already exists
      const existing = await prisma.device.findFirst({
        where: { serialNumber: row.name }
      });
      
      if (existing) {
        console.log(`🔄 Updating ${row.name}`);
        
        const category = determineCategory(row.name);
        
        await prisma.device.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            serialNumber: row.name,
            manufacturer: row.os.includes('Windows') ? 'Microsoft' : undefined,
            model: row.os || undefined,
            category: category,
            notes: row.os || undefined,
            isActive: !row.actions.toLowerCase().includes('nicht aktiv')
          }
        });
        
        updated++;
        continue;
      }
      
      const category = determineCategory(row.name);
      
      // Create device
      await prisma.device.create({
        data: {
          name: row.name,
          serialNumber: row.name,
          manufacturer: row.os.includes('Windows') ? 'Microsoft' : undefined,
          model: row.os || undefined,
          category: category,
          notes: row.os || undefined,
          isActive: !row.actions.toLowerCase().includes('nicht aktiv')
        }
      });
      
      console.log(`✅ Imported: ${row.name}`);
      imported++;
      
    } catch (error) {
      console.error(`❌ Error importing ${row.name}:`, error);
    }
  }
  
  console.log('\n📈 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   📊 Total: ${rows.length}`);
}

// Run import
importDevices()
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
