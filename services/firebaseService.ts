import { db, doc, getDoc, setDoc, collection, getDocs, query, where, writeBatch } from './firebase';
import { LessonRecord, DSKPRecord, TimetableConfig } from '../types';

export const firebaseService = {
    // 1. Get Teacher's Timetable
    getTimetable: async (uid: string): Promise<TimetableConfig | null> => {
        try {
            // Check for a default timetable or specific config
            // Assuming we store it in users/{uid}/timetable_config/default
            const ref = doc(db, 'users', uid, 'timetable_config', 'default');
            const snap = await getDoc(ref);
            if (snap.exists()) {
                return { id: snap.id, ...snap.data() } as TimetableConfig;
            }
            return null;
        } catch (error) {
            console.error("Error fetching timetable:", error);
            return null;
        }
    },

    // 2. Get DSKP Standards
    getDSKP: async (subject: string, grade: string): Promise<DSKPRecord | null> => {
        try {
            // ID Format: Subject_Grade (e.g. "English_Year1")
            // Ensure proper naming convention or normalization
            const docId = `${subject.trim()}_${grade.trim()}`;
            const ref = doc(db, 'curriculum_dskp', docId);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                return { id: snap.id, ...snap.data() } as DSKPRecord;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching DSKP for ${subject} ${grade}:`, error);
            return null;
        }
    },

    // 3. Save Daily Lesson (Atomic)
    saveDailyLesson: async (lessonData: LessonRecord): Promise<{ success: boolean; message?: string }> => {
        try {
            const ref = doc(db, 'lesson_records', lessonData.id);
            // Use setDoc with merge to allow partial updates if needed, 
            // but for "atomic write" of a record, set is appropriate.
            await setDoc(ref, {
                ...lessonData,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            return { success: true };
        } catch (error: any) {
            console.error("Error saving lesson:", error);
            return { success: false, message: error.message };
        }
    }
};
