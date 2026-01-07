import { DSKPStandard, SchoolType } from '../types';
import { api } from './api';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1mW401zSgjPLjtahPCaeiLFpv3Zpk3AL-2Dgc6s5sDAA/export?format=csv';

export const syncDskpFromSheet = async (onProgress?: (msg: string) => void) => {
    try {
        if (onProgress) onProgress("Fetching data from Google Sheets...");
        console.log("Starting DSKP Sync...");

        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error("Failed to fetch Google Sheet");

        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== '');

        // Skip header
        const dataRows = rows.slice(1);

        if (onProgress) onProgress(`Parsing ${dataRows.length} standards...`);

        let currentSchoolType: any = SchoolType.PRIMARY; // Default
        const standards: DSKPStandard[] = [];

        dataRows.forEach((row, index) => {
            const cols = parseCSVRow(row);

            // Check for metadata row (School Type / Program definition)
            if (cols[0] && cols[0].toUpperCase().includes('PROGRAM SEKOLAH')) {
                const programType = cols[1]?.trim().toUpperCase();
                if (programType) {
                    if (programType.includes('MENENGAH')) {
                        currentSchoolType = SchoolType.SECONDARY;
                    } else if (programType.includes('SK') || programType.includes('SJK') || programType.includes('KHAS') || programType.includes('RENDAH')) {
                        // Group all primary school types (SK, SJKC, SJKT, Khas) into 'SR'
                        currentSchoolType = SchoolType.PRIMARY;
                    } else {
                        // Default fallback if unclear, or maybe 'ALL'
                        currentSchoolType = SchoolType.ALL;
                    }
                }
                return; // Skip this row
            }

            // Skip empty rows or header repetitions
            if (!cols[0] || cols[0] === 'SUBJEK' || cols[0].startsWith('---')) return;

            standards.push({
                id: `dskp-sync-${index}`,
                subject: cols[0] || 'Unknown',
                grade: cols[1] || '-',
                contentStandard: cols[2] || '-',
                learningStandard: cols[3] || '-',
                temaBidang: cols[4] || '',
                tema: cols[5] || '',
                tajukKemahiran: cols[6] || '',
                tajuk: cols[7] || '',
                schoolType: currentSchoolType
            });
        });

        if (onProgress) onProgress(`Uploading ${standards.length} records to MySQL Database...`);

        // Send everything in one go to the MySQL Sync API
        const res = await api.dskp.sync(standards);

        if (!res.success) throw new Error(res.message || "MySQL Sync failed");

        if (onProgress) onProgress("Sync completed successfully!");
        return { success: true, count: standards.length };
    } catch (error) {
        console.error("DSKP Sync failed:", error);
        if (onProgress) onProgress(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { success: false, error };
    }
};

// Simple CSV parser that handles quotes
function parseCSVRow(row: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
