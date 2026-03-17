#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '..', 'backend', 'version.json');
const version = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
version.build += 1;
fs.writeFileSync(versionFile, JSON.stringify(version, null, 2) + '\n', 'utf8');
console.log(`Build number incremented to ${version.major}.${version.minor}.${version.patch} Build ${version.build}`);
