import { collection, getDocs, writeBatch, doc, query, orderBy, getDoc } from '../../services/firebase';
import { db } from '../../services/firebase';
import { SchoolType, classifySchoolType, DSKPStandard } from './parser';

const STAGING_COLLECTION = 'dskp_raw';
const REGISTRY_COLLECTION = 'dskp_final';

// Helper: Sanitize IDs
const sanitizeId = (id: string) => id.replace(/\//g, '_').trim();

export const syncEngine = {
    // Stage 1: Sync Raw
    syncRawToStaging: async (rawRows: any[]) => {
        try {
            console.log("Stage 1: Syncing Raw Data to Staging...", rawRows.length);

            // 1. Clear Staging
            console.log("Clearing existing raw data in", STAGING_COLLECTION);
            const rawCol = collection(db, STAGING_COLLECTION);
            const rawSnap = await getDocs(rawCol);
            let deleteBatch = writeBatch(db);
            let deleteCount = 0;

            for (const doc of rawSnap.docs) {
                // @ts-ignore - ref exists in our custom wrapper
                deleteBatch.delete(doc.ref);
                deleteCount++;
                if (deleteCount >= 200) {
                    await deleteBatch.commit();
                    deleteBatch = writeBatch(db);
                    deleteCount = 0;
                }
            }
            if (deleteCount > 0) await deleteBatch.commit();

            // 2. Upload Raw
            let batch = writeBatch(db);
            let operationCount = 0;
            let totalProcessed = 0;

            for (let i = 0; i < rawRows.length; i++) {
                const row = rawRows[i];
                const ref = doc(db, STAGING_COLLECTION, `row_${i.toString().padStart(5, '0')}`);

                batch.set(ref, {
                    rowIndex: i,
                    data: row,
                    timestamp: Date.now()
                });
                operationCount++;
                totalProcessed++;

                if (operationCount >= 100) {
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            if (operationCount > 0) await batch.commit();
            return { success: true, count: totalProcessed };

        } catch (err: any) {
            console.error("Stage 1 Failed", err);
            return { success: false, message: err.message };
        }
    },

    // Stage 2: Process & Map
    processStagingToRegistry: async (mapping: any) => {
        try {
            console.log("Stage 2: Processing Staging to Registry...");
            const stagingRef = collection(db, STAGING_COLLECTION);
            const q = query(stagingRef, orderBy('rowIndex'));
            const snapshot = await getDocs(q);
            const stagingDocs = snapshot.docs.map((d: any) => d.data());

            let batch = writeBatch(db);
            let operationCount = 0;
            let processedCount = 0;

            const hierarchy: Record<string, Record<string, Record<string, DSKPStandard[]>>> = {};

            for (const docData of stagingDocs) {
                const row = docData.data;
                const subject = String(row[mapping.subject] || "").trim();
                const year = String(row[mapping.grade] || "").trim();
                const sk = String(row[mapping.contentStandard] || "").trim();
                const sp = String(row[mapping.learningStandard] || "").trim();

                if (!subject || !sk || !sp) continue;

                let category = classifySchoolType(subject); // Use shared logic

                // Build Hierarchy
                if (!hierarchy[category]) hierarchy[category] = {};
                if (!hierarchy[category][year]) hierarchy[category][year] = {};
                if (!hierarchy[category][year][subject]) hierarchy[category][year][subject] = [];

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

            // Write Hierarchy
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
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                }
            }

            if (operationCount > 0) await batch.commit();
            return { success: true, count: processedCount };

        } catch (err: any) {
            console.error("Stage 2 Failed", err);
            return { success: false, message: err.message };
        }
    }
};
