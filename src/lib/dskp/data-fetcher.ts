import { collection, getDocs } from '../../services/firebase';
import { db } from '../../services/firebase';
import { DSKPStandard, SchoolType } from './parser';

const REGISTRY_COLLECTION = 'dskp_final';
const ROOT_COLLECTION = REGISTRY_COLLECTION;

// Helper: Sanitize IDs
const sanitizeId = (id: string) => id.replace(/\//g, '_').trim();

export const dskpFetcher = {
    // Level 1: Get School Types
    getSchoolTypes: async () => {
        try {
            const snap = await getDocs(collection(db, ROOT_COLLECTION));
            return { success: true, data: snap.docs.map((d: any) => d.id) };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // Level 2: Get Years
    getYears: async (type: string) => {
        try {
            const snap = await getDocs(collection(db, `${ROOT_COLLECTION}/${type}/years`));
            return { success: true, data: snap.docs.map((d: any) => d.id).sort() };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // Level 3: Get Subjects
    getSubjects: async (type: string, year: string) => {
        try {
            const safeYear = sanitizeId(year);
            const snap = await getDocs(collection(db, `${ROOT_COLLECTION}/${type}/years/${safeYear}/subjects`));
            return { success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // Level 4: Get Standards
    getStandards: async (type: string, year: string, subject: string) => {
        try {
            const safeYear = sanitizeId(year);
            const safeSubject = sanitizeId(subject);
            const docRef = collection(db, `${ROOT_COLLECTION}/${type}/years/${safeYear}/subjects/${safeSubject}`);
            // Actually, in the service logic, we wrote standards as an ARRAY inside the document?
            // Let's check dskpService.ts line 176: batch.set(subjectRef, { standards: standards, ... }).
            // So standards are INSIDE the subject document, not a subcollection.
            // Wait, previous code: 
            /*
             const subjectRef = doc(db, ...);
             batch.set(subjectRef, { standards: standards ... })
            */
            // So we need to fetch the DOCUMENT, not collection.

            // Correction: The `getSubjects` fetched the doc data which implies it *has* the standards? 
            // In Admin.tsx, `toggleSubject` called `dskpService.getStandards`. 
            // Let's check what `dskpService.getStandards` did (I didn't view it in previous turn, assumed).
            // But logic 123 in `dskpService.ts` was `batch.set`.
            // So `getSubjects` actually returns objects that *contain* the standards array if `getDocs` reads the whole doc.
            // But usually we want to separate listing subjects from downloading all standard data if large.
            // However, Firestore `getDocs` downloads the whole document.
            // So `getSubjects` ALREADY downloads the standards arrays for ALL subjects in that year.
            // That might be heavy.
            // But based on my implementation, `standards` field is in the subject doc.

            // Re-implementing getStandards to simply return the standards field from the subject doc.
            // Or better, `getSubjects` could project? No, client SDK downloads all.
            // So `getStandards` in Admin.tsx was redundant? 
            // Let's look at Admin.tsx line 573: `const res = await dskpService.getStandards(...)`.
            // I need to implement `getStandards`. 

            /*
             // From my memory of dskpService.ts (which I modified):
             // I only modified the sync part. The fetch part was mostly hidden in "Lazy Fetch Methods remain the same".
             // I should probably fetch the single Doc here.
            */

            import { doc, getDoc } from '../../services/firebase';
            const docRef = doc(db, `${ROOT_COLLECTION}/${type}/years/${safeYear}/subjects/${safeSubject}`);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                return { success: true, data: data.standards as DSKPStandard[] };
            }
            return { success: false, error: "Subject not found" };

        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }
};
