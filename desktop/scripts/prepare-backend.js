#!/usr/bin/env node
/**
 * Prepare Backend for Demo Build
 * 
 * This script:
 * 1. Converts Prisma schema to SQLite
 * 2. Generates Prisma Client for SQLite
 * 3. Builds the backend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_DIR = path.join(__dirname, '..', '..', 'backend');
const SCHEMA_FILE = path.join(BACKEND_DIR, 'prisma', 'schema.prisma');
const SCHEMA_BACKUP = path.join(BACKEND_DIR, 'prisma', 'schema.prisma.postgres.backup');

console.log('═══════════════════════════════════════');
console.log('  Preparing Backend for Demo Build     ');
console.log('═══════════════════════════════════════\n');

try {
  // Step 1: Backup original schema
  console.log('📦 Step 1: Backing up original PostgreSQL schema...');
  if (!fs.existsSync(SCHEMA_BACKUP)) {
    fs.copyFileSync(SCHEMA_FILE, SCHEMA_BACKUP);
    console.log('✅ Backup created\n');
  } else {
    console.log('ℹ️  Backup already exists\n');
  }

  // Step 2: Convert schema to SQLite
  console.log('🔄 Step 2: Converting schema to SQLite...');
  let schema = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  
  // Replace provider
  schema = schema.replace(
    /provider\s*=\s*"postgresql"/g,
    'provider = "sqlite"'
  );
  
  // Remove @db.Text annotations (not needed in SQLite)
  schema = schema.replace(/@db\.Text/g, '');
  
  // Replace uuid() with cuid() (SQLite compatible)
  schema = schema.replace(/@default\(uuid\(\)\)/g, '@default(cuid())');
  
  fs.writeFileSync(SCHEMA_FILE, schema);
  console.log('✅ Schema converted to SQLite\n');

  // Step 3: Generate Prisma Client
  console.log('🔧 Step 3: Generating Prisma Client for SQLite...');
  execSync('npx prisma generate', {
    cwd: BACKEND_DIR,
    stdio: 'inherit'
  });
  console.log('✅ Prisma Client generated\n');

  // Step 4: Build backend
  console.log('🏗️  Step 4: Building backend...');
  execSync('npm run build', {
    cwd: BACKEND_DIR,
    stdio: 'inherit'
  });
  console.log('✅ Backend built\n');

  console.log('═══════════════════════════════════════');
  console.log('  ✅ Backend prepared successfully!    ');
  console.log('═══════════════════════════════════════\n');
  console.log('Note: Original schema backed up at:');
  console.log(SCHEMA_BACKUP);
  console.log('\nTo restore PostgreSQL schema, run:');
  console.log('cp ' + SCHEMA_BACKUP + ' ' + SCHEMA_FILE);
  console.log('');

} catch (error) {
  console.error('\n❌ Error preparing backend:', error.message);
  
  // Try to restore original schema
  if (fs.existsSync(SCHEMA_BACKUP)) {
    console.log('\n🔄 Attempting to restore original schema...');
    fs.copyFileSync(SCHEMA_BACKUP, SCHEMA_FILE);
    console.log('✅ Original schema restored');
  }
  
  process.exit(1);
}
