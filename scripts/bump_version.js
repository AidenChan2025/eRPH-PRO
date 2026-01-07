
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../package.json');
const versionFilePath = path.resolve(__dirname, '../src/config/version.ts');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;

// Increment version (patch level)
const versionParts = currentVersion.split('.').map(Number);
versionParts[2] += 1;
const newVersion = versionParts.join('.');

console.log(`Bumping version from ${currentVersion} to ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Update src/config/version.ts
const versionFileContent = `export const APP_VERSION = '${newVersion}';\n`;
fs.writeFileSync(versionFilePath, versionFileContent);

console.log('Version updated successfully.');
