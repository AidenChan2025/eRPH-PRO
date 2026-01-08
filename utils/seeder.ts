import { db, doc, setDoc, writeBatch, collection, getDocs, query, where } from '../services/firebase';
import { User, School, SchoolType, UserRole, LessonPlan, LessonStatus, LeaveRecord, LeaveType, LeaveStatus } from '../types';

export const seed2026Data = async () => {
    console.log("Starting 2026 Data Seed...");
    const batchSize = 400; // Firestore batch limit is 500
    let batch = writeBatch(db);
    let operationCounter = 0;

    const commitBatch = async () => {
        if (operationCounter > 0) {
            await batch.commit();
            batch = writeBatch(db);
            operationCounter = 0;
            console.log("Batch committed.");
        }
    };

    // 1. Seed School
    const school: School = {
        id: 's-1', name: 'SJK(C) Mentakab 1', code: 'CBC7071', district: 'Temerloh', type: SchoolType.SJKC,
        settings: { termStartDate: '2026-03-09', customTimeSlots: ["07:45 - 08:45"], customClasses: ["4 诚实"], customSubjects: ["华文"] }
    };
    batch.set(doc(db, 'schools', school.id), school);
    operationCounter++;

    // 2. Cleanup existing demo data to ensure a fresh start
    console.log("Cleaning up old demo data...");
    const demoUIDs = ['u-teacher', 'u-principal', 'u-admin'];
    for (const uid of demoUIDs) {
        const q = query(collection(db, 'lessonPlans'), where('teacherId', '==', uid));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
            batch.delete(doc(db, 'lessonPlans', d.id));
            operationCounter++;
        });
        await commitBatch();

        const qLeave = query(collection(db, 'leaveRecords'), where('teacherId', '==', uid));
        const snapLeave = await getDocs(qLeave);
        snapLeave.docs.forEach(d => {
            batch.delete(doc(db, 'leaveRecords', d.id));
            operationCounter++;
        });
        await commitBatch();
    }

    // 3. Generate Lesson Plans (Jan - April 2026)
    const demoTeachers = [
        {
            id: 'u-teacher',
            name: 'Wong Siew Min',
            subjects: ['Bahasa Melayu', 'Matematik', 'Sejarah'],
            classes: ['4 Cerdas', '5 Pintar']
        },
        {
            id: 'u-principal',
            name: 'Tan Mei Ling',
            subjects: ['English', 'Sains'],
            classes: ['6 Gemilang']
        },
        {
            id: 'u-admin',
            name: 'Lee Wei Kang',
            subjects: ['Reka Bentuk dan Teknologi', 'Pendidikan Moral'],
            classes: ['4 Amanah', '5 Bestari']
        }
    ];

    const timeSlots = ['07:45 - 08:45', '09:15 - 10:15', '11:45 - 12:45'];
    let startDate = new Date('2026-01-01');
    let endDate = new Date('2026-04-30');

    for (const teacher of demoTeachers) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

            // Each teacher has 1-2 plans per day
            const dailyCount = Math.floor(Math.random() * 1) + 1;

            for (let i = 0; i < dailyCount; i++) {
                const subject = teacher.subjects[i % teacher.subjects.length];
                const cls = teacher.classes[i % teacher.classes.length];
                const id = `lp-2026-${teacher.id}-${d.getMonth()}-${d.getDate()}-${i}`;

                // Random Status logic
                let status = LessonStatus.APPROVED;
                if (d.getMonth() === 3) status = LessonStatus.SUBMITTED; // April
                if (d > new Date('2026-04-20')) status = LessonStatus.DRAFT;

                const plan: LessonPlan = {
                    id,
                    schoolId: 's-1',
                    teacherId: teacher.id,
                    teacherName: teacher.name,
                    subject,
                    grade: cls.includes('4') ? 'Tahun 4' : (cls.includes('5') ? 'Tahun 5' : 'Tahun 6'),
                    className: cls,
                    time: timeSlots[i],
                    topic: `Demo Unit ${d.getDate()}: ${subject}`,
                    date: d.toISOString().split('T')[0],
                    contentStandard: `${i + 1}.0 Standard Kandungan`,
                    learningStandard: `${i + 1}.${d.getDate()}.1 Standard Pembelajaran`,
                    objectives: [`Demo objective for ${subject}.`],
                    successCriteria: ['Successfully complete demo tasks.'],
                    activities: ['Introduction', 'Class Activity', 'Closing'],
                    teachingAids: ['Textbook', 'Interactive Board'],
                    pak21: ['Think-Pair-Share'],
                    assessment: ['Observation'],
                    status,
                    version: 1,
                    updatedAt: new Date().toISOString()
                };

                batch.set(doc(db, 'lessonPlans', plan.id), plan);
                operationCounter++;

                if (operationCounter >= batchSize) await commitBatch();
            }
        }
        // Reset date for next teacher
        startDate = new Date('2026-01-01');
    }

    // 3. Generate Leave Records for Demo Users
    const leaveTypes = Object.values(LeaveType);

    for (const teacher of demoTeachers) {
        const leaveCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < leaveCount; i++) {
            const month = Math.floor(Math.random() * 4);
            const day = Math.floor(Math.random() * 20) + 1;
            const sDate = new Date(2026, month, day);
            const eDate = new Date(2026, month, day + Math.floor(Math.random() * 1));

            const record: LeaveRecord = {
                id: `lr-${teacher.id}-${i}`,
                schoolId: 's-1',
                teacherId: teacher.id,
                teacherName: teacher.name,
                type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
                startDate: sDate.toISOString().split('T')[0],
                endDate: eDate.toISOString().split('T')[0],
                reason: 'Demo leave record',
                status: LeaveStatus.APPROVED,
                createdAt: new Date().toISOString()
            };

            batch.set(doc(db, 'leaveRecords', record.id), record);
            operationCounter++;
        }
    }

    if (operationCounter > 0) await commitBatch();
    console.log("Seeding Complete.");
    return true;
};
