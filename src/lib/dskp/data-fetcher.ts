import { collection, getDocs, doc, getDoc, db } from '../../../services/firebase';
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
