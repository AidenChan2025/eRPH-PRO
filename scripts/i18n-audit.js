import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '../src/locales');
const files = ['en.json', 'ms.json', 'zh.json'];

function runAudit() {
    console.log("🔍 Starting Internationalization Audit...");

    // 1. Load Files
    const data = {};
    files.forEach(file => {
        data[file] = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
    });

    const masterKeys = Object.keys(data['en.json']);
    let errors = [];

    // 2. Check for Missing Keys & Empty Values
    masterKeys.forEach(key => {
        files.forEach(file => {
            if (!data[file][key]) {
                errors.push(`[MISSING KEY/VALUE]: Key "${key}" is missing or empty in ${file}`);
            }
        });
    });

    // 3. Check for Mixed Language (Regex validation)
    const chineseRegex = /[\u4e00-\u9fa5]/;
    Object.entries(data['ms.json']).forEach(([key, value]) => {
        if (chineseRegex.test(value)) {
            errors.push(`[MIXED LANGUAGE]: Found Chinese characters in Malay file (ms.json) for key: "${key}"`);
        }
    });

    // 4. Final Verdict
    if (errors.length > 0) {
        console.error("❌ Audit Failed! Please fix the following errors before deploying:");
        errors.forEach(err => console.error(err));
        process.exit(1); // Stop the build/deploy process
    } else {
        console.log("✅ Audit Passed! All translations are synchronized and verified.");
        process.exit(0);
    }
}

runAudit();
