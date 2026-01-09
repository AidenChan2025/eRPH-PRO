import { db, doc, setDoc, writeBatch, collection, getDocs, query, where } from '../services/firebase';
import { User, School, SchoolType, UserRole, LeaveRecord, LeaveType, LeaveStatus } from '../types';

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
        // Clean up legacy lesson plans
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


    // 3. Generate Leave Records for Demo Users
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
