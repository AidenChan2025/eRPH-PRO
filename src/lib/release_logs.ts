export interface LogEntry {
    version: string;
    date: string;
    added: string[];
    changed: string[];
    fixed: string[];
    isLatest?: boolean;
}

export const RELEASE_LOGS: LogEntry[] = [
    {
        version: "1.1.0",
        date: "2026-01-08",
        isLatest: true,
        added: [
            "New 2-stage DSKP Sync: \"Sync Raw\" and \"Process Mapping\" buttons.",
            "Strict Priority Keyword Parser for School Categories (SK/SJKC/SJKT/Pemulihan)."
        ],
        changed: [
            "Refactored project structure into /src/app, /src/components, and /src/lib.",
            "Replaced static DSKP pages with a single Dynamic Route template."
        ],
        fixed: [
            "Resolved issue where SJKT subjects were incorrectly grouped under SJKC.",
            "Fixed \"Empty Table\" error by implementing row validation during mapping."
        ]
    }
    // Add older logs here if needed
];
