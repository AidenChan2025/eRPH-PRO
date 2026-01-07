import { 
    db, collection, getDocs, query, where, limit 
} from './firebase';
import { DSKPStandard } from '../types';

const COLLECTION = 'dskp_standards';

export const dskpService = {
    // List standards with filters
    list: async (filters: { subject?: string, grade?: string, schoolType?: string, search?: string }) => {
        let constraints = [];

        // Flexible filtering
        // Firestore doesn't support "ILike" (case insensitive) natively efficiently.
        // We assume data is stored consistently or we handle normalization at save time.
        // For now, exact match specific fields.

        if (filters.subject) constraints.push(where('subject', '==', filters.subject));
        // Use custom index if needed for multi-field
        if (filters.grade) constraints.push(where('grade', '==', filters.grade));
        
        // Search is hard in NoSQL without Algolia/Typesense.
        // We will rely on client-side filtering for small result sets or exact matches?
        // OR: the user selects from dropdowns, so 'subject' and 'grade' are the main drivers.
        
        // Limit to prevent explosion if no filters
        if (!filters.subject && !filters.grade) {
             constraints.push(limit(50));
        } else {
             constraints.push(limit(2000)); // Cap at a reasonable max
        }

        const q = query(collection(db, COLLECTION), ...constraints);
        const snap = await getDocs(q);
        const data = snap.docs.map(d => d.data() as DSKPStandard);

        // Client-side search for keywords if provided and not handled by DB
        if (filters.search) {
             const lower = filters.search.toLowerCase();
             return { 
                 success: true, 
                 data: data.filter(d => 
                     d.contentStandard?.toLowerCase().includes(lower) || 
                     d.learningStandard?.toLowerCase().includes(lower) ||
                     d.topic?.toLowerCase().includes(lower)
                 ) 
             };
        }

        return { success: true, data };
    },

    // Get Options (Subjects) - Optimized to read from a metadata doc instead of scanning all records?
    // For now, let's try to query distinct subjects if possible? No, Firestore distinct is hard.
    // BETTER STRATEGY: Maintain a 'metadata' collection with a document 'dskp_options'
    // containing { subjects: [...] }.
    getOptions: async () => {
        // Fallback: This is expensive if we scan everything.
        // Ideally, we start with the static list in frontend constants, 
        // OR we fetch a known 'metadata' doc.
        // Let's assume we have a metadata doc.
        
        /* 
           To make this work immediately without seeding metadata:
           We will return the DEFAULT_SUBJECTS from the frontend constants if DB is empty,
           or implemented a 'get all' and strict distinct client side (SLOW).
           
           Let's temporarily return a hardcoded list of common subjects + empty list 
           and let the frontend merge it.
        */
       return { success: true, subjects: [] }; // The frontend uses local constants as fallback!
    }
};
