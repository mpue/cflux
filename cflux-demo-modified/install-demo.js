#!/usr/bin/env node
/**
 * CFlux Demo Installation Script
 * 
 * This script helps you set up the demo version of CFlux
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('═══════════════════════════════════════════════════════');
console.log('  CFlux Demo Version - Installation Script            ');
console.log('═══════════════════════════════════════════════════════\n');

const REPO_ROOT = path.join(__dirname, '..');
const BACKEND_DIR = path.join(REPO_ROOT, 'backend');
const FRONTEND_DIR = path.join(REPO_ROOT, 'frontend');
const DESKTOP_DIR = path.join(REPO_ROOT, 'desktop');

function runCommand(command, cwd, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    console.log(`✅ ${description} - Done!`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Failed!`);
    return false;
  }
}

function checkDirectory(dir, name) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ ${name} directory not found: ${dir}`);
    return false;
  }
  console.log(`✅ ${name} directory found`);
  return true;
}

async function main() {
  console.log('🔍 Step 1: Checking directories...\n');
  
  const checks = [
    checkDirectory(BACKEND_DIR, 'Backend'),
    checkDirectory(FRONTEND_DIR, 'Frontend'),
    checkDirectory(DESKTOP_DIR, 'Desktop')
  ];
  
  if (!checks.every(Boolean)) {
    console.error('\n❌ Not all required directories found!');
    process.exit(1);
  }
  
  console.log('\n✅ All directories found!\n');
  console.log('═══════════════════════════════════════════════════════');
  
  // Install dependencies
  console.log('\n📦 Step 2: Installing dependencies...\n');
  
  const installSteps = [
    { dir: BACKEND_DIR, cmd: 'npm install', desc: 'Installing backend dependencies' },
    { dir: FRONTEND_DIR, cmd: 'npm install', desc: 'Installing frontend dependencies' },
    { dir: DESKTOP_DIR, cmd: 'npm install', desc: 'Installing desktop dependencies' }
  ];
  
  for (const step of installSteps) {
    if (!runCommand(step.cmd, step.dir, step.desc)) {
      console.error('\n❌ Installation failed!');
      process.exit(1);
    }
  }
  
  console.log('\n✅ All dependencies installed!\n');
  console.log('═══════════════════════════════════════════════════════');
  
  // Build frontend
  console.log('\n🏗️  Step 3: Building frontend...\n');
  if (!runCommand('npm run build', FRONTEND_DIR, 'Building frontend')) {
    console.error('\n❌ Frontend build failed!');
    process.exit(1);
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n✅ Installation complete!\n');
  console.log('Next steps:\n');
  console.log('  1. Test in development mode:');
  console.log('     cd desktop && npm run dev\n');
  console.log('  2. Build for production:');
  console.log('     cd desktop && npm run build:win\n');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('\n❌ Installation failed:', error.message);
  process.exit(1);
});
