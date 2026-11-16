import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OTA_DIR = path.join(ROOT_DIR, 'ota');
const MANIFEST_PATH = path.join(OTA_DIR, 'manifest.json');
const ZIP_PATH = path.join(OTA_DIR, 'bundle.zip');

if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(OTA_DIR)) {
  fs.mkdirSync(OTA_DIR, { recursive: true });
}

console.log('📦 Bundling OTA update from dist/...');

// Read manifest
let manifest = {
  version: '1.0.1',
  bundleUrl: 'https://raw.githubusercontent.com/Vinay-kumar-code/SafarNama/main/ota/bundle.zip',
  releaseNotes: 'Routine travel updates & performance improvements',
  releasedAt: new Date().toISOString(),
  mandatory: false,
};

if (fs.existsSync(MANIFEST_PATH)) {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    manifest = { ...manifest, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Could not read existing manifest, creating fresh one.');
  }
}

// Bump patch version (e.g. 1.0.0 -> 1.0.1)
const versionParts = manifest.version.split('.').map(Number);
if (versionParts.length === 3 && !versionParts.some(isNaN)) {
  versionParts[2] += 1;
  manifest.version = versionParts.join('.');
}
manifest.releasedAt = new Date().toISOString();

// Create zip archive
try {
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Compress-Archive -Path '${DIST_DIR}\\*' -DestinationPath '${ZIP_PATH}' -Force"`, { stdio: 'inherit' });
  } else {
    execSync(`cd '${DIST_DIR}' && zip -r '${ZIP_PATH}' .`, { stdio: 'inherit' });
  }
  console.log(`✓ Generated OTA bundle zip: ${ZIP_PATH}`);
} catch (err) {
  console.warn('Note: automatic zip creation via shell command finished with notice:', err.message);
}

// Write updated manifest
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`✓ Updated ota/manifest.json to version ${manifest.version}`);
console.log('🎉 OTA Bundle complete! Commit and push to main for devices to auto-update on launch.');
