export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
    type: 'national' | 'state';
    states?: string[]; // If state, list of states. If empty, all states.
}

export const MALAYSIA_HOLIDAYS_2026: Holiday[] = [
    { date: '2026-01-01', name: "New Year's Day", type: 'national', states: ['All except Johor, Kedah, Kelantan, Perlis, Terengganu'] },
    { date: '2026-01-14', name: "Thaipusam", type: 'state', states: ['Johor', 'Kuala Lumpur', 'Negeri Sembilan', 'Penang', 'Perak', 'Putrajaya', 'Selangor'] }, // Tentative
    { date: '2026-02-01', name: "Federal Territory Day", type: 'state', states: ['Kuala Lumpur', 'Labuan', 'Putrajaya'] },
    { date: '2026-02-17', name: "Chinese New Year", type: 'national' },
    { date: '2026-02-18', name: "Chinese New Year (Day 2)", type: 'national' },
    { date: '2026-03-20', name: "Hari Raya Aidilfitri", type: 'national' }, // Tentative
    { date: '2026-03-21', name: "Hari Raya Aidilfitri (Day 2)", type: 'national' }, // Tentative
    { date: '2026-05-01', name: "Labour Day", type: 'national' },
    { date: '2026-05-27', name: "Hari Raya Haji", type: 'national' }, // Tentative
    { date: '2026-05-31', name: "Wesak Day", type: 'national' },
    { date: '2026-06-01', name: "Agong's Birthday", type: 'national' },
    { date: '2026-06-17', name: "Awal Muharram", type: 'national' },
    { date: '2026-07-07', name: "Georgetown World Heritage City Day", type: 'state', states: ['Penang'] },
    { date: '2026-08-25', name: "Prophet Muhammad's Birthday", type: 'national' },
    { date: '2026-08-31', name: "Merdeka Day", type: 'national' },
    { date: '2026-09-16', name: "Malaysia Day", type: 'national' },
    { date: '2026-11-08', name: "Deepavali", type: 'national', states: ['All except Sarawak'] }, // Tentative
    { date: '2026-12-11', name: "Sultan of Selangor's Birthday", type: 'state', states: ['Selangor'] },
    { date: '2026-12-25', name: "Christmas Day", type: 'national' }
];

export const isHoliday = (dateStr: string): Holiday | undefined => {
    return MALAYSIA_HOLIDAYS_2026.find(h => h.date === dateStr);
};
