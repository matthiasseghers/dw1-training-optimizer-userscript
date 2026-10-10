#!/usr/bin/env node

/**
 * Validates that all GM_ API calls in the source code are declared in meta.json grants
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Read meta.json
const metaPath = path.join(rootDir, 'meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const grants = new Set(meta.grant || []);

// Find all GM_ API calls in source files
const srcDir = path.join(rootDir, 'src');
const gmApiCalls = new Set();

function scanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Strip comments so we only detect actual GM_ API usage
  content = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // Match GM_ and GM. function calls
  const matches = content.matchAll(/\bGM[_.]\w+/g);
  for (const match of matches) {
    // Normalize GM.foo to GM_foo for grants lookup
    gmApiCalls.add(match[0].replace('GM.', 'GM_'));
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      scanFile(filePath);
    }
  }
}

scanDirectory(srcDir);

// Check for missing grants
const missing = [];
for (const api of gmApiCalls) {
  if (!grants.has(api)) {
    missing.push(api);
  }
}

// Check for unused grants
const unused = [];
for (const grant of grants) {
  if (grant !== 'none' && grant.startsWith('GM_') && !gmApiCalls.has(grant)) {
    unused.push(grant);
  }
}

// Report results
let hasIssues = false;

if (missing.length > 0) {
  console.error('Missing GM API grants in meta.json:');
  missing.forEach((api) => console.error(`   - ${api}`));
  console.error('\nAdd these to the "grant" array in meta.json\n');
  hasIssues = true;
}

if (unused.length > 0) {
  console.warn('Unused GM API grants in meta.json:');
  unused.forEach((api) => console.warn(`   - ${api}`));
  console.warn('\nConsider removing these from meta.json for better security\n');
}

if (!hasIssues && unused.length === 0) {
  console.log('All GM API calls are properly granted.');
}

process.exit(hasIssues ? 1 : 0);
