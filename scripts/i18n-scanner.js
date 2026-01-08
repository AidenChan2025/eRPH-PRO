import { Project, SyntaxKind, QuoteKind } from "ts-morph";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALE_DIR = path.join(__dirname, '../src/locales');
const TARGET_FILES = ["src/**/*.tsx", "pages/**/*.tsx", "components/**/*.tsx", "App.tsx"];
const SKIP_Attributes = ['className', 'id', 'key', 'style', 'ref', 'src', 'href', 'to'];
const TRANSLATE_ATTRIBUTES = ['title', 'placeholder', 'label', 'alt', 'aria-label'];

// Load Locales
const enPath = path.join(LOCALE_DIR, 'en.json');
const msPath = path.join(LOCALE_DIR, 'ms.json');
const zhPath = path.join(LOCALE_DIR, 'zh.json');

let enData = {};
try { enData = JSON.parse(fs.readFileSync(enPath, 'utf8')); } catch (e) { }

// Helper: CamelCase Key Generator
function generateKey(text) {
    // 1. Remove special chars, keep spaces
    let clean = text.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    if (!clean) return "text_" + Math.random().toString(36).substr(2, 5);

    // 2. camelCase
    let words = clean.split(/\s+/);
    words = words.slice(0, 5);

    let key = words.map((w, i) => {
        if (i === 0) return w.toLowerCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join('');

    // 3. Collision check/Value match
    if (enData[key] && enData[key] !== text) {
        let i = 1;
        while (enData[`${key}_${i}`] && enData[`${key}_${i}`] !== text) {
            i++;
        }
        return `${key}_${i}`;
    }
    return key;
}

// Initialize Project
console.log("🚀 Starting i18n Scanner (ESM)...");
const project = new Project({
    manipulationSettings: {
        quoteKind: QuoteKind.Single,
    },
    tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths(TARGET_FILES);

let modifications = 0;

project.getSourceFiles().forEach(sourceFile => {
    // console.log(`Scanning: ${sourceFile.getFilePath()}`);
    let needsHook = false;
    let importAdded = false;

    // 1. Scan JSX Text
    sourceFile.getDescendantsOfKind(SyntaxKind.JsxText).forEach(node => {
        const text = node.getText().trim();
        if (!text || text.match(/^[{}.:,\-0-9\s]+$/) || text.length < 2) return;

        const key = generateKey(text);
        enData[key] = text;

        node.replaceWithText(`{t('${key}')}`);
        needsHook = true;
        modifications++;
    });

    // 2. Scan Attributes
    sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach(attr => {
        if (!attr.getName) {
            // Should not happen for JsxAttribute, but safety first
            return;
        }
        const name = attr.getName();
        if (!TRANSLATE_ATTRIBUTES.includes(name)) return;

        const init = attr.getInitializer();
        if (!init || init.getKind() !== SyntaxKind.StringLiteral) return;

        const text = init.getLiteralValue();
        if (!text || text.match(/^{.*}$/)) return;

        const key = generateKey(text);
        enData[key] = text;

        attr.setInitializer(`{t('${key}')}`);
        needsHook = true;
        modifications++;
    });

    if (needsHook) {
        // Add Import
        const importDecl = sourceFile.getImportDeclaration(d => d.getModuleSpecifierValue() === 'react-i18next');
        if (!importDecl) {
            sourceFile.addImportDeclaration({
                moduleSpecifier: 'react-i18next',
                namedImports: ['useTranslation']
            });
            importAdded = true;
        } else {
            const namedImports = importDecl.getNamedImports();
            if (!namedImports.some(ni => ni.getName() === 'useTranslation')) {
                importDecl.addNamedImport('useTranslation');
            }
        }

        // Add Hook logic (simplified)
        const functions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
        const arrowFuncs = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
        const allFuncs = [...functions, ...arrowFuncs];

        let injected = false;
        allFuncs.forEach(func => {
            let isComponent = false;

            if (func.getKind() === SyntaxKind.FunctionDeclaration) {
                const name = func.getName();
                if (name && name[0] === name[0].toUpperCase()) isComponent = true;
            }

            if (!isComponent && func.getParent().getKind() === SyntaxKind.VariableDeclaration) {
                const name = func.getParent().getName();
                if (name && name[0] === name[0].toUpperCase()) isComponent = true;
            }

            if (isComponent) {
                const body = func.getBody();
                if (!body) return;

                if (body.getKind() !== SyntaxKind.Block) {
                    return;
                }

                const statements = body.getStatements();
                const hasHook = statements.some(s => s.getText().includes('useTranslation'));

                if (!hasHook) {
                    body.insertStatements(0, "const { t } = useTranslation();");
                    injected = true;
                }
            }
        });
    }
});

if (modifications > 0) {
    console.log(`Saving ${modifications} changes to source files...`);
    project.saveSync();

    fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

    const msData = JSON.parse(fs.readFileSync(msPath, 'utf8'));
    const zhData = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

    Object.keys(enData).forEach(key => {
        if (!msData[key]) msData[key] = "";
        if (!zhData[key]) zhData[key] = "";
    });

    fs.writeFileSync(msPath, JSON.stringify(msData, null, 2));
    fs.writeFileSync(zhPath, JSON.stringify(zhData, null, 2));
    console.log("✅ JSON files updated.");
} else {
    console.log("No text found to extract.");
}
