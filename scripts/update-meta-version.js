import { readFileSync, writeFileSync } from 'fs';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/update-meta-version.js <version>');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid version format: "${version}" (expected x.y.z)`);
  process.exit(1);
}

const metaPath = new URL('../meta.json', import.meta.url);
const raw = readFileSync(metaPath, 'utf-8');
const meta = JSON.parse(raw);

meta.version = version;

writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
console.log(`Updated meta.json version to ${version}`);
