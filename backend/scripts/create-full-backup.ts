import { prisma } from '../src/lib/prisma';
import { createBackupFile } from '../src/services/backupScheduler.service';
import fs from 'fs';
import path from 'path';

/**
 * Manual full backup (CLI).
 *
 * Reuses the exact same backup logic as the automatic scheduler and the admin
 * API, so a `npm run backup` produces a complete v3.0 ZIP (all tables + uploads)
 * — there is a single source of truth (TABLE_MAP in backupScheduler.service.ts).
 */
async function main() {
  try {
    console.log('🔄 Erstelle vollständiges Backup...');

    const zipFilename = await createBackupFile('backup');

    const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
    const filepath = path.join(backupDir, zipFilename);
    const stats = fs.statSync(filepath);

    console.log('✅ Backup erfolgreich erstellt!');
    console.log('📄 Datei:', zipFilename);
    console.log('📊 Größe:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('   (Datenbank: alle Tabellen + hochgeladene Dateien)');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Fehler beim Backup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
