
import { Holiday } from './holidays';

export type SchoolGroup = 'A' | 'B';

// Group A: Johor, Kedah, Kelantan, Terengganu
// Group B: Others

export interface AcademicTerm {
    name: string;
    start: string; // YYYY-MM-DD
    end: string;
}

export type AcademicYear = {
    group: SchoolGroup;
    terms: AcademicTerm[];
    holidays: Holiday[];
};

export const ACADEMIC_CALENDAR_2026: Record<SchoolGroup, AcademicYear> = {
    A: {
        group: 'A',
        terms: [
            { name: "Penggal 1", start: "2026-01-11", end: "2026-03-19" },
            { name: "Cuti Penggal 1", start: "2026-03-20", end: "2026-03-28" },
            { name: "Penggal 1 (Samb.)", start: "2026-03-29", end: "2026-05-21" },
            { name: "Cuti Pertengahan Tahun", start: "2026-05-22", end: "2026-06-06" },
            { name: "Penggal 2", start: "2026-06-07", end: "2026-08-27" },
            { name: "Cuti Penggal 2", start: "2026-08-28", end: "2026-09-05" },
            { name: "Penggal 2 (Samb.)", start: "2026-09-06", end: "2026-12-03" },
            { name: "Cuti Akhir Persekolahan", start: "2026-12-04", end: "2026-12-31" }
        ],
        holidays: [] // Will merge with national holidays dynamically
    },
    B: {
        group: 'B',
        terms: [
            { name: "Penggal 1", start: "2026-01-12", end: "2026-03-20" },
            { name: "Cuti Penggal 1", start: "2026-03-21", end: "2026-03-29" },
            { name: "Penggal 1 (Samb.)", start: "2026-03-30", end: "2026-05-22" },
            { name: "Cuti Pertengahan Tahun", start: "2026-05-23", end: "2026-06-07" },
            { name: "Penggal 2", start: "2026-06-08", end: "2026-08-28" },
            { name: "Cuti Penggal 2", start: "2026-08-29", end: "2026-09-06" },
            { name: "Penggal 2 (Samb.)", start: "2026-09-07", end: "2026-12-04" },
            { name: "Cuti Akhir Persekolahan", start: "2026-12-05", end: "2026-12-31" }
        ],
        holidays: []
    }
};

export const SCHOOL_HOLIDAYS_2026 = [
    // Add specific school holidays that are not public (e.g., Cuti Perayaan KPM)
    // Chinese New Year 2026 (Added by KPM)
    { date: '2026-02-15', name: "Cuti Tambahan KPM (CNY)", type: 'school', group: 'A' },
    { date: '2026-02-16', name: "Cuti Tambahan KPM (CNY)", type: 'school', group: 'B' }, // Conflicting logic in screenshot? 
    // Wait, Screenshot says: Group A: 15.02 (Sun), Group B: 16.02 (Mon)
    // CNY is 17 & 18 Feb.
    { date: '2026-02-19', name: "Cuti Tambahan KPM (CNY)", type: 'school', group: 'A' }, // Group A gets 19th?
    // Screenshot: 
    // Group A: 15.02, 19.02
    // Group B: 16.02, 19.02, 20.02

    { date: '2026-02-15', name: "Cuti Perayaan KPM (TBC)", type: 'school', group: 'A' },
    { date: '2026-02-16', name: "Cuti Perayaan KPM (TBC)", type: 'school', group: 'B' },
    { date: '2026-02-19', name: "Cuti Perayaan KPM (TBC)", type: 'school', group: 'A' },
    { date: '2026-02-19', name: "Cuti Perayaan KPM (TBC)", type: 'school', group: 'B' },
    { date: '2026-02-20', name: "Cuti Perayaan KPM (TBC)", type: 'school', group: 'B' },

    // Hari Raya Aidilfitri
    // Group A: 19.03
    // Group B: 19.03, 20.03
    { date: '2026-03-19', name: "Cuti Perayaan KPM (Aidilfitri)", type: 'school', group: 'A' },
    { date: '2026-03-19', name: "Cuti Perayaan KPM (Aidilfitri)", type: 'school', group: 'B' },
    { date: '2026-03-20', name: "Cuti Perayaan KPM (Aidilfitri)", type: 'school', group: 'B' },

    // Deepavali
    // Group A: 09.11
    // Group B: 10.11
    { date: '2026-11-09', name: "Cuti Perayaan KPM (Deepavali)", type: 'school', group: 'A' },
    { date: '2026-11-10', name: "Cuti Perayaan KPM (Deepavali)", type: 'school', group: 'B' },
];

export const getAcademicEvents = (group: SchoolGroup) => {
    return {
        terms: ACADEMIC_CALENDAR_2026[group].terms,
        holidays: SCHOOL_HOLIDAYS_2026.filter(h => h.group === group || !h.group)
    };
};
