
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

// Update src/config/changelog.ts
const changelogPath = path.resolve(__dirname, '../src/config/changelog.ts');
let changelogContent = fs.readFileSync(changelogPath, 'utf-8');

const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
});

const newEntry = `    {
        version: "v${newVersion}",
        date: "${today}",
        title: "Platform Enhancement",
        items: [
            "🚀 General performance optimizations and bug fixes.",
            "🛡️ Security and stability improvements.",
            "🔧 Minor UI refinements and infrastructure updates."
        ]
    },`;

// Insert after 'export const CHANGELOG: ChangeLogEntry[] = ['
const insertIndex = changelogContent.indexOf('export const CHANGELOG: ChangeLogEntry[] = [') + 'export const CHANGELOG: ChangeLogEntry[] = ['.length;
changelogContent = changelogContent.slice(0, insertIndex) + '\n' + newEntry + changelogContent.slice(insertIndex);

fs.writeFileSync(changelogPath, changelogContent);

console.log('Version and Changelog updated successfully.');
