import { db, doc, getDoc, setDoc, collection, getDocs, query, where, writeBatch } from './firebase';
import { LessonRecord, DSKPRecord, TimetableConfig, WeeklySubmission } from '../types';

// In-memory cache for DSKP records to prevent 429 errors
const dskpCache: Record<string, DSKPRecord> = {};

export const firebaseService = {
    // 1. Get Teacher's Timetable
    getTimetable: async (uid: string): Promise<TimetableConfig | null> => {
        try {
            // Check for a default timetable or specific config
            // Assuming we store it in users/{uid}/timetable_config/default
            const ref = doc(db, `users/${uid}/timetable_config/default`);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data() as any;
                return { id: snap.id, ...data } as TimetableConfig;
            }
            return null;
        } catch (error) {
            console.error("Error fetching timetable:", error);
            return null;
        }
    },

    // 2. Get DSKP Standards (with Caching)
    getDSKP: async (subject: string, grade: string): Promise<DSKPRecord | null> => {
        try {
            // ID Format: Subject_Grade (e.g. "English_Year1")
            const docId = `${subject.trim()}_${grade.trim()}`;

            // Check Cache First
            if (dskpCache[docId]) {
                console.log(`[Cache Hit] DSKP: ${docId}`);
                return dskpCache[docId];
            }

            const ref = doc(db, 'curriculum_dskp', docId);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const data = snap.data() as any;
                const record = { id: snap.id, ...data } as DSKPRecord;

                // Store in Cache
                dskpCache[docId] = record;
                return record;
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
    },

    // 4. Save Timetable Config
    saveTimetableConfig: async (uid: string, config: TimetableConfig): Promise<{ success: boolean; message?: string }> => {
        try {
            const ref = doc(db, `users/${uid}/timetable_config/${config.id || 'default'}`);
            await setDoc(ref, config, { merge: true });
            return { success: true };
        } catch (error: any) {
            console.error("Error saving timetable:", error);
            return { success: false, message: error.message };
        }
    },

    // 5. Get Unique Subjects from DSKP
    getAvailableSubjects: async (): Promise<string[]> => {
        try {
            // This might be expensive if many docs. For now is fine.
            // Ideally we maintain a separate 'metadata' doc with list of subjects.
            // But we can scan the collection for IDs.
            const snap = await getDocs(collection(db, 'curriculum_dskp'));
            const subjects = new Set<string>();
            snap.docs.forEach((d: any) => {
                const data = d.data();
                if (data.subject) subjects.add(data.subject);
            });
            return Array.from(subjects).sort();
        } catch (error) {
            console.error("Error fetching subjects:", error);
            return [];
        }
    },

    // 6. Get Lessons for a specific week
    getWeeklyLessons: async (teacherId: string, year: number, week: number): Promise<LessonRecord[]> => {
        try {
            const q = query(
                collection(db, 'lesson_records'),
                where('teacherId', '==', teacherId),
                where('year', '==', year),
                where('week', '==', week)
            );
            const snap = await getDocs(q);
            return snap.docs.map((d: any) => d.data() as LessonRecord);
        } catch (error) {
            console.error("Error fetching weekly lessons:", error);
            return [];
        }
    },

    // 7. Get Recent Previous Lesson (for Copy feature)
    getPreviousLesson: async (teacherId: string, subjectId: string, classId: string): Promise<LessonRecord | null> => {
        try {
            // Get the most recent lesson for this subject/class
            const q = query(
                collection(db, 'lesson_records'),
                where('teacherId', '==', teacherId),
                where('subjectId', '==', subjectId),
                where('classId', '==', classId),
                // orderBy('createdAt', 'desc'), // Requires index. For now do client side filter or just grab recently updated
                // simplified: just keys
            );
            const snap = await getDocs(q);
            if (snap.empty) return null;

            // Sort in memory to avoid index requirement for now
            const docs = snap.docs.map((d: any) => d.data() as LessonRecord);
            docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return docs[0];
        } catch (error) {
            console.error("Error fetching previous lesson:", error);
            return null;
        }
    },

    // 8. Weekly Submission Management
    getWeeklySubmission: async (teacherId: string, year: number, week: number): Promise<WeeklySubmission | null> => {
        try {
            const id = `${teacherId}_${year}_${week}`;
            const ref = doc(db, 'weekly_submissions', id);
            const snap = await getDoc(ref);
            if (snap.exists()) return snap.data() as WeeklySubmission;
            return null;
        } catch (error) {
            return null;
        }
    },

    submitWeek: async (submission: WeeklySubmission): Promise<void> => {
        const ref = doc(db, 'weekly_submissions', submission.id);
        await setDoc(ref, submission, { merge: true });
    },

    // 9. Batch Create/Update Lessons (Auto-Population)
    batchUpdateLessons: async (lessons: LessonRecord[]): Promise<void> => {
        try {
            const batch = writeBatch(db);
            lessons.forEach(l => {
                const ref = doc(db, 'lesson_records', l.id);
                // merge: true allows us to be safe 
                batch.set(ref, { ...l, updatedAt: new Date().toISOString() }, { merge: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Batch update failed", error);
            throw error;
        }
    },

    // 10. Admin: Get All Teachers
    getAllTeachers: async (schoolId?: string): Promise<any[]> => {
        try {
            let q = query(collection(db, 'users'), where('role', '==', 'TEACHER'));
            if (schoolId) q = query(q, where('schoolId', '==', schoolId));

            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    // 11. Admin: Get Submissions for School/Month (Simplified for now: Get All Submissions)
    getAllSubmissions: async (schoolId: string, year: number): Promise<WeeklySubmission[]> => {
        try {
            const q = query(
                collection(db, 'weekly_submissions'),
                where('schoolId', '==', schoolId),
                where('year', '==', year)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data() as WeeklySubmission);
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    // 12. Admin: Review Submission
    reviewSubmission: async (id: string, status: 'Approved' | 'Rejected', feedback?: string, reviewerId?: string): Promise<void> => {
        const ref = doc(db, 'weekly_submissions', id);
        await setDoc(ref, {
            status,
            comments: feedback || null,
            reviewedAt: new Date().toISOString(),
            reviewerId
        }, { merge: true });

        // If rejected, also set lessons back to Draft? Or maybe keep them as Submitted but user sees 'Rejected' on week?
        // User request says: "Return Button: ... sets status to Draft".
        // This likely means the WEEK status is Rejected (conceptually returned) but if lessons need editing, 
        // they might need to be 'Draft'. But let's stick to Week Status for flow.
        // Actually, if Week is Rejected, User enters 'Draft' mode again effectively.
    },

    // 13. Integrity: Sign and Submit
    signSubmission: async (submission: WeeklySubmission, signatureDataUrl: string): Promise<void> => {
        try {
            // Fetch IP with Promise.race (3s strict timeout)
            let ip = 'Unknown';
            try {
                const fetchIp = async () => {
                    const res = await fetch('https://api.ipify.org?format=json');
                    const data = await res.json();
                    return data.ip;
                };

                const timeout = new Promise<string>((_, reject) =>
                    setTimeout(() => reject(new Error("IP Fetch Timeout")), 3000)
                );

                ip = await Promise.race([fetchIp(), timeout]);
                console.log("IP Fetched:", ip);
            } catch (e) {
                console.warn("Could not fetch IP (timeout or error), defaulting to Unknown");
            }

            const ref = doc(db, 'weekly_submissions', submission.id);
            await setDoc(ref, {
                ...submission,
                status: 'Pending',
                submittedAt: new Date().toISOString(),
                signatureUrl: signatureDataUrl,
                signedAt: new Date().toISOString(),
                ipAddress: ip,
                userAgent: navigator.userAgent
            }, { merge: true });
        } catch (error) {
            console.error("Error signing submission:", error);
            throw error;
        }
    }
};
