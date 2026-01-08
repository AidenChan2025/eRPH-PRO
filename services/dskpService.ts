import {
    db, collection, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
    query, where, limit, orderBy, doc, writeBatch
} from './firebase';
import { DSKPStandard, DSKPStructure, SchoolType } from '../types';

const COLLECTION = 'dskp_standards';
const METADATA_COLLECTION = 'metadata';
const STRUCTURE_DOC = 'dskp_structure';

const STAGING_COLLECTION = 'dskp_raw';
const REGISTRY_COLLECTION = 'dskp_final'; // New Root
const ROOT_COLLECTION = REGISTRY_COLLECTION;

// Helper to classify School Type based on Subject Name (Strict Priority)
export const classifySchoolType = (subject: string): SchoolType => {
    const s = subject.toUpperCase();
    if (s.includes('PEMULIHAN')) return SchoolType.PEMULIHAN;
    if (s.includes('PRASEKOLAH') || s.includes('PRA SEKOLAH')) return SchoolType.PRASEKOLAH;
    if (s.includes('SJKT') || s.includes('TAMIL')) return SchoolType.SJKT;
    if (s.includes('SJKC')) return SchoolType.SJKC;
    if (s.includes('BERCANTUM')) return SchoolType.KELAS_BERCANTUM;
    // if (s.includes('PENDIDIKAN KHAS') || s.includes('KHAS')) return 'KHAS'; 
    return SchoolType.SK; // Default
};

// Helper: Sanitize IDs for Firestore Paths (remove slashes)
const sanitizeId = (id: string) => id.replace(/\//g, '_').trim();

export const dskpService = {
    // --- STAGE 1: SYNC RAW DATA TO STAGING ---
    // --- STAGE 1: SYNC RAW DATA TO STAGING ---
    syncRawToStaging: async (rawRows: any[]) => {
        try {
            console.log("Stage 1: Syncing Raw Data to Staging...", rawRows.length);

            // 1. Clear Staging (Delete all documents in dskp_raw)
            console.log("Clearing existing raw data in", STAGING_COLLECTION);
            const rawCol = collection(db, STAGING_COLLECTION);
            const rawSnap = await getDocs(rawCol); // Be careful with large reads, but for now this is the way
            let deleteBatch = writeBatch(db);
            let deleteCount = 0;

            for (const doc of rawSnap.docs) {
                deleteBatch.delete(doc.ref);
                deleteCount++;
                if (deleteCount >= 200) {
                    await deleteBatch.commit();
                    deleteBatch = writeBatch(db);
                    deleteCount = 0;
                }
            }
            if (deleteCount > 0) await deleteBatch.commit();
            console.log("Cleared existing raw data.");

            // 2. Upload Raw Rows
            let batch = writeBatch(db);
            let operationCount = 0;
            let totalProcessed = 0;

            for (let i = 0; i < rawRows.length; i++) {
                const row = rawRows[i];
                // Create a simple object, strictly preserving order via index
                const ref = doc(db, STAGING_COLLECTION, `row_${i.toString().padStart(5, '0')}`);

                batch.set(ref, {
                    rowIndex: i,
                    data: row, // Save the array or object as is
                    timestamp: Date.now()
                });
                operationCount++;
                totalProcessed++;

                // Reduced batch size to 100 to prevent 'resource-exhausted'
                if (operationCount >= 100) {
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                    console.log(`Uploaded ${totalProcessed} rows to staging...`);
                    // Increased delay to 2s to allow Firestore SDK buffer to drain
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            if (operationCount > 0) await batch.commit();
            console.log("Stage 1 Complete.");
            return { success: true, count: totalProcessed };

        } catch (err: any) {
            console.error("Stage 1 Failed", err);
            return { success: false, message: err.message };
        }
    },

    // --- STAGE 2: PROCESS & MAP REGISTRY ---
    processStagingToRegistry: async (mapping: any) => {
        try {
            console.log("Stage 2: Processing Staging to Registry...");

            // 1. Fetch all staging data ordered by index
            const q = query(collection(db, STAGING_COLLECTION), orderBy('rowIndex'));
            const snap = await getDocs(q);
            const stagingDocs = snap.docs.map(d => d.data());

            let batch = writeBatch(db);
            let operationCount = 0;
            let processedCount = 0;

            // Context for Fill-Down
            let lastSubject = '';
            let lastGrade = '';
            let lastSK = '';
            let lastTema = '';
            let lastTajuk = '';
            let lastSchoolType = SchoolType.SK;

            // Structure to hold hierarchy for batch writing: { [type]: { [year]: { [subject]: [standards...] } } }
            // We can process sequentially and build this in memory first to minimize overlapping writes
            const hierarchy: Record<string, Record<string, Record<string, DSKPStandard[]>>> = {};

            for (const docData of stagingDocs) {
                const row = docData.data;

                // --- POWER PROMPT LOGIC ---
                // We map the indexed columns (from UI) to the variable names required.

                const subject = String(row[mapping.subject] || "").trim();
                const year = String(row[mapping.grade] || "").trim();
                const sk = String(row[mapping.contentStandard] || "").trim();
                const sp = String(row[mapping.learningStandard] || "").trim();

                // 1. SKIP EMPTY DATA (Strict Check)
                if (!subject || !sk || !sp) continue;

                // 2. STRICT CATEGORY CLASSIFICATION
                let category = SchoolType.SK;
                const upperSub = subject.toUpperCase();

                if (upperSub.includes("PEMULIHAN")) {
                    category = SchoolType.PEMULIHAN;
                } else if (upperSub.includes("PRASEKOLAH") || upperSub.includes("PRA SEKOLAH")) {
                    category = SchoolType.PRASEKOLAH;
                } else if (upperSub.includes("SJKT") || upperSub.includes("TAMIL")) {
                    category = SchoolType.SJKT;
                } else if (upperSub.includes("SJKC")) {
                    category = SchoolType.SJKC;
                } else if (upperSub.includes("BERCANTUM") || year.includes("&")) {
                    category = SchoolType.KELAS_BERCANTUM;
                }

                // 3. BUILD HIERARCHY
                if (!hierarchy[category]) hierarchy[category] = {};
                if (!hierarchy[category][year]) hierarchy[category][year] = {};
                if (!hierarchy[category][year][subject]) hierarchy[category][year][subject] = [];

                // 4. PUSH DATA
                const standard: DSKPStandard = {
                    id: `dskp-${Date.now()}-${docData.rowIndex}`,
                    schoolType: category,
                    grade: year,
                    subject: subject,
                    contentStandard: sk,
                    learningStandard: sp,
                    temaBidang: String(row[mapping.temaBidang] || ""),
                    tema: String(row[mapping.temaBidang] || ""),
                    tajukKemahiran: String(row[mapping.tajukKemahiran] || ""),
                    tajuk: String(row[mapping.tajukKemahiran] || "")
                };

                hierarchy[category][year][subject].push(standard);
                processedCount++;
            }

            // 2. Write Hierarchy to Registry
            for (const type of Object.keys(hierarchy)) {
                // Type Doc
                const typeRef = doc(db, `${REGISTRY_COLLECTION}/${type}`);
                batch.set(typeRef, { lastUpdated: new Date().toISOString() }, { merge: true });
                operationCount++;

                for (const year of Object.keys(hierarchy[type])) {
                    // Year Doc
                    const safeYear = sanitizeId(year);
                    const yearRef = doc(db, `${REGISTRY_COLLECTION}/${type}/years/${safeYear}`);
                    batch.set(yearRef, { lastUpdated: new Date().toISOString() }, { merge: true });
                    operationCount++;

                    for (const subject of Object.keys(hierarchy[type][year])) {
                        // Subject Doc
                        const safeSubject = sanitizeId(subject);
                        const subjectRef = doc(db, `${REGISTRY_COLLECTION}/${type}/years/${safeYear}/subjects/${safeSubject}`);
                        const standards = hierarchy[type][year][subject];

                        batch.set(subjectRef, {
                            title: subject,
                            standards: standards,
                            count: standards.length,
                            lastUpdated: new Date().toISOString()
                        });
                        operationCount++;

                        if (operationCount >= 100) {
                            await batch.commit();
                            batch = writeBatch(db);
                            operationCount = 0;
                            // Aggressive delay: 2s
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                }
            }

            if (operationCount > 0) await batch.commit();
            console.log("Stage 2 Complete. Processed:", processedCount);
            return { success: true, count: processedCount };

        } catch (err: any) {
            console.error("Stage 2 Failed", err);
            return { success: false, message: err.message };
        }
    },


    // ... (Lazy Fetch Methods remain the same) ...

    // Level 1: Get School Types
    getSchoolTypes: async () => {
        try {
            const snap = await getDocs(collection(db, ROOT_COLLECTION));
            return { success: true, data: snap.docs.map(d => d.id) };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // Level 2: Get Years for a Type
    getYears: async (type: string) => {
        try {
            const snap = await getDocs(collection(db, `${ROOT_COLLECTION}/${type}/years`));
            return { success: true, data: snap.docs.map(d => d.id).sort() }; // Sort alphanumerically
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // Level 3: Get Subjects for a Year
    getSubjects: async (type: string, year: string) => {
        try {
            const safeYear = sanitizeId(year);
            const snap = await getDocs(collection(db, `${ROOT_COLLECTION}/${type}/years/${safeYear}/subjects`));
            return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // Level 4: Get Standards (Already in Subject Doc, but helper for clarity)
    getStandards: async (type: string, year: string, subject: string) => {
        try {
            const safeYear = sanitizeId(year);
            const safeSubject = sanitizeId(subject);
            const docRef = doc(db, `${ROOT_COLLECTION}/${type}/years/${safeYear}/subjects/${safeSubject}`);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as { standards: DSKPStandard[] };
                return { success: true, data: data.standards || [] };
            }
            return { success: false, message: "Subject not found" };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // --- LEGACY/COMPATIBILITY METHODS ---

    // List standards with filters (Legacy)
    list: async (filters: { subject?: string, grade?: string, schoolType?: string, search?: string }) => {
        // If searching, we still fallback to the flat collection for now until full migration
        // Or we implement a client-side search if needed, but that's heavy.
        let constraints = [];

        if (filters.schoolType) constraints.push(where('schoolType', '==', filters.schoolType));
        if (filters.subject) constraints.push(where('subject', '==', filters.subject));
        if (filters.grade) constraints.push(where('grade', '==', filters.grade));

        if (!filters.subject && !filters.grade && !filters.search) {
            constraints.push(limit(100));
        } else {
            constraints.push(limit(2000));
        }

        const q = query(collection(db, COLLECTION), ...constraints);
        const snap = await getDocs(q);
        const data = snap.docs.map(d => d.data() as DSKPStandard);

        if (filters.search) {
            const lower = filters.search.toLowerCase();
            return {
                success: true,
                data: data.filter(d =>
                    d.contentStandard?.toLowerCase().includes(lower) ||
                    d.learningStandard?.toLowerCase().includes(lower) ||
                    d.tajuk?.toLowerCase().includes(lower) ||
                    d.subject?.toLowerCase().includes(lower)
                )
            };
        }

        return { success: true, data };
    },

    // Get Hierarchy Structure (Legacy)
    listStructure: async () => {
        try {
            const structureRef = doc(db, METADATA_COLLECTION, STRUCTURE_DOC);
            const docSnap = await getDoc(structureRef);

            if (docSnap.exists()) {
                return { success: true, data: docSnap.data() as DSKPStructure };
            }
            return { success: true, data: {} as DSKPStructure };
        } catch (err: any) {
            console.error("Failed to fetch DSKP structure", err);
            return { success: false, message: err.message };
        }
    },

    // Get Options (Used by LessonPlanEditor)
    getOptions: async () => {
        try {
            // For now, fallback to the old structure doc for options to keep it fast
            // Ideally, we'd scan the new hierarchy, but that requires many reads.
            const structureRef = doc(db, METADATA_COLLECTION, STRUCTURE_DOC);
            const docSnap = await getDoc(structureRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as DSKPStructure;
                let subjects = new Set<string>();
                Object.values(data).forEach(list => {
                    // Check if list is array to satisfy TS
                    if (Array.isArray(list)) list.forEach(s => subjects.add(s));
                });
                return { success: true, subjects: Array.from(subjects).sort() };
            }
            return { success: true, subjects: [] };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    },



    getSyncHistory: async () => {
        try {
            const q = query(
                collection(db, 'dskp_sync_logs'),
                orderBy('timestamp', 'desc'),
                limit(5)
            );
            const snap = await getDocs(q);
            return {
                success: true,
                data: snap.docs.map(d => ({ id: d.id, ...d.data() }))
            };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    },

    updateNode: async (id: string | number, data: Partial<DSKPStandard>) => {
        try {
            await updateDoc(doc(db, COLLECTION, String(id)), data);
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    },

    delete: async (id: string | number) => {
        try {
            await deleteDoc(doc(db, COLLECTION, String(id)));
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    },

    // Legacy Rebuild Index (Might still be useful for the options dropdown?)
    rebuildIndex: async () => {
        try {
            console.log("Rebuilding DSKP Index (Legacy)...");
            const q = query(collection(db, COLLECTION));
            const snap = await getDocs(q);

            const newStructure: DSKPStructure = {};
            let count = 0;

            snap.docs.forEach(d => {
                const data = d.data() as DSKPStandard;
                const { grade, subject } = data;
                if (grade && subject) {
                    if (!newStructure[grade]) newStructure[grade] = [];
                    if (!newStructure[grade].includes(subject)) {
                        newStructure[grade].push(subject);
                    }
                }
                count++;
            });

            await setDoc(doc(db, METADATA_COLLECTION, STRUCTURE_DOC), newStructure);
            return { success: true, count };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    }
};
