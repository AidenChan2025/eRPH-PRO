import { 
    db, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, orderBy, limit 
} from './firebase';
import { LessonPlan } from '../types';

const COLLECTION = 'lessonPlans';

export const lessonService = {
    // Save or Update a Lesson Plan
    save: async (plan: LessonPlan) => {
        const planId = plan.id || `lp-${Date.now()}`;
        const planRef = doc(db, COLLECTION, planId);
        
        // Ensure critical fields
        const dataToSave = {
            ...plan,
            id: planId,
            updatedAt: new Date().toISOString(),
            // Ensure search fields are indexed if needed, or just store plainly
            teacherId: plan.teacherId || 'unknown',
            schoolId: plan.schoolId || 'unknown'
        };

        await setDoc(planRef, dataToSave, { merge: true });
        return { success: true, data: dataToSave };
    },

    // Get a single lesson plan
    get: async (id: string) => {
        const planRef = doc(db, COLLECTION, id);
        const snap = await getDoc(planRef);
        if (snap.exists()) {
            return { success: true, data: snap.data() as LessonPlan };
        }
        return { success: false, message: 'Plan not found' };
    },

    // List lesson plans with filters
    list: async (filters: { teacherId?: string, schoolId?: string, startDate?: string, endDate?: string }) => {
        const constraints = [];
        
        // Note: Firestore requires composite indexes for multiple 'where' clauses.
        // We will start simple.
        if (filters.teacherId) constraints.push(where('teacherId', '==', filters.teacherId));
        if (filters.schoolId) constraints.push(where('schoolId', '==', filters.schoolId));
        
        // Date filtering in Firestore can be tricky with string comparisons, but ISO strings usually sort ok.
        // Ideally store as Timestamp, but keeping string for compatibility with existing type.
        if (filters.startDate) constraints.push(where('date', '>=', filters.startDate));
        if (filters.endDate) constraints.push(where('date', '<=', filters.endDate));

        const q = query(collection(db, COLLECTION), ...constraints, orderBy('updatedAt', 'desc'), limit(100));
        const snap = await getDocs(q);
        
        const plans = snap.docs.map(d => d.data() as LessonPlan);
        return { success: true, data: plans };
    },

    // Delete a plan
    delete: async (id: string) => {
        await deleteDoc(doc(db, COLLECTION, id));
        return { success: true };
    }
};
