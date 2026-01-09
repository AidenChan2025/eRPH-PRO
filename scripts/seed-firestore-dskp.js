import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// --- CONFIGURATION ---
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1etnLs97NwAwAFBZ3y2kGWTpei7--YcjDam1Ex-MXPeM/export?format=csv';

// Helper to read .env
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val) envVars[key.trim()] = val.trim();
        });
        return envVars;
    } catch (e) {
        console.warn("Could not read .env file, relying on process.env");
        return process.env;
    }
}

const env = loadEnv();

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

// --- INIT FIREBASE ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Simple CSV Parser
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map(line => {
        // Handle quotes simply (not robust for all CSVs but works for simple ones)
        const values = [];
        let current = '';
        let inQuote = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));

        const row = {};
        headers.forEach((h, i) => {
            row[h] = values[i] || '';
        });
        return row;
    });
}

// --- MAIN SYNC LOGIC ---
async function syncDSKP() {
    console.log("Starting DSKP Sync Engine...");

    try {
        // 1. Auth (if needed for write rules)
        // Note: For a script, usually we use Service Account (Admin SDK). 
        // Using Client SDK requires a user. We will skip Auth if rules allow write, 
        // or prompt for it. For now, we assume public read/write or existing session? 
        // We will try an anonymous sign in or throw error if rules fail.
        // Actually, let's look for a hardcoded generic admin login or just try.
        // If this fails, user must run this in a context with Auth (like browser).

        console.log("Fetching CSV from Google Drive...");
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        const csvText = await response.text();

        console.log("Parsing Data...");
        const rows = parseCSV(csvText);
        console.log(`Found ${rows.length} rows.`);
        if (rows.length > 0) {
            console.log("Headers detected:", Object.keys(rows[0]));
            console.log("First Row Sample:", rows[0]);
        }

        // 2. Transform Data
        // Map: Subject_Grade -> { standards: [] }
        const collections = {};

        rows.forEach(row => {
            // Mapping based on actual CSV headers
            const subject = row['SUBJEK'];
            const grade = row['TAHUN'];

            if (!subject || !grade || subject === '-' || grade === '') return;

            const id = `${subject}_${grade}`.replace(/[\/\s]+/g, '_');

            if (!collections[id]) {
                collections[id] = {
                    id,
                    subject,
                    grade,
                    standards: []
                };
            }

            // Simple validation to ensure we catch SK/SP
            const sk = row['SK'] || '';
            const sp = row['SP'] || '';
            const theme = row['TEMA/BIDANG/TERAS'] || row['tema2'] || '';
            const topic = row['TAJUK/KEMAHIRAN/NILAITERAS'] || row['tajuk2'] || '';

            if (sk || sp) {
                collections[id].standards.push({
                    theme,
                    topic,
                    sk,
                    sp,
                    sk_code: '', // Not in CSV explicitly on this row sample, maybe parse from string if needed
                    sp_code: ''
                });
            }
        });

        // 3. Write to Firestore
        console.log(`Prepared ${Object.keys(collections).length} curriculum documents.`);

        const batchSize = 500;
        // We are writing whole docs, not individual standards, so batch count is doc count.
        // But if docs are huge, we might hit size limits. 

        for (const docId in collections) {
            const data = collections[docId];
            data.lastUpdated = new Date().toISOString();

            // Priority Check
            const isPriority = (data.subject.includes('English') || data.subject.includes('Bahasa Melayu'))
                && data.grade.includes('Year 1');

            if (isPriority) {
                console.log(`Writing PRIORITY: ${docId} (${data.standards.length} standards)`);
            } else {
                console.log(`Writing: ${docId} (${data.standards.length} standards)`);
            }

            await setDoc(doc(db, 'curriculum_dskp', docId), data);
        }

        console.log("Sync Complete!");
        process.exit(0);

    } catch (error) {
        console.error("Sync Failed:", error);
        process.exit(1);
    }
}

syncDSKP();
