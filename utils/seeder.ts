import { db, doc, setDoc, writeBatch, collection, getDocs, query, where } from '../services/firebase';
import { User, School, SchoolType, UserRole, LessonPlan, LessonStatus, LeaveRecord, LeaveType, LeaveStatus } from '../types';

export const seed2026Data = async () => {
    console.log("Starting 2026 Data Seed...");
    const batchSize = 400; // Firestore batch limit is 500
    let batch = writeBatch(db);
    let operationCounter = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = writeBatch(db);
        operationCounter = 0;
        console.log("Batch committed.");
    };

    // 1. Seed Users
    const users: User[] = [
        {
            id: 'u-cch', name: 'Chan Cheng Hoong', email: 'cchoong2020@gmail.com', role: UserRole.SUPER_ADMIN,
            phone: '012-3456789', grade: 'JUSA C', schoolId: 's-1', serviceHistory: [],
            securityConfig: { twoFactorEnabled: true, sessionTimeoutMinutes: 30, lastPasswordChange: '2025-01-01', loginAlerts: true }
        },
        {
            id: 'u-principal', name: 'Tan Mei Ling', email: 'principal@school.com', role: UserRole.PRINCIPAL,
            phone: '012-3334444', grade: 'DG52', schoolId: 's-1', serviceHistory: [],
            securityConfig: { twoFactorEnabled: true, sessionTimeoutMinutes: 15, lastPasswordChange: '2025-01-01', loginAlerts: true }
        },
        {
            id: 'u-teacher', name: 'Wong Siew Min', email: 'teacher@school.com', role: UserRole.TEACHER,
            phone: '012-5556666', grade: 'DG44', schoolId: 's-1', serviceHistory: [],
            securityConfig: { twoFactorEnabled: false, sessionTimeoutMinutes: 60, lastPasswordChange: '2025-01-01', loginAlerts: false }
        }
    ];

    for (const u of users) {
        batch.set(doc(db, 'users', u.id), u);
        operationCounter++;
    }

    // 2. Seed School
    const school: School = {
        id: 's-1', name: 'SJK(C) Mentakab 1', code: 'CBC7071', district: 'Temerloh', type: SchoolType.SJKC,
        settings: { termStartDate: '2026-03-09', customTimeSlots: ["07:45 - 08:45"], customClasses: ["4 诚实"], customSubjects: ["华文"] }
    };
    batch.set(doc(db, 'schools', school.id), school);
    operationCounter++;

    // 3. Generate Lesson Plans (Jan - April 2026)
    // Academic Year 2026 usually starts March 2026, but user asked for "Year 2026". 
    // We will generate Jan-April 2026.
    const plans: LessonPlan[] = [];
    const subjects = ['Bahasa Melayu', 'English', 'Matematik', 'Sains', 'Sejarah', 'Reka Bentuk dan Teknologi'];
    const classes = ['4 Cerdas', '5 Pintar', '6 Gemilang'];
    const timeSlots = ['07:45 - 08:45', '09:15 - 10:15', '11:45 - 12:45'];

    // Config: Seed for multiple demo users
    const teachers = [
        { id: 'u-teacher', name: 'Wong Siew Min' },
        { id: 'u-principal', name: 'Tan Mei Ling' },
        { id: 'u-admin', name: 'Lee Wei Kang' }
    ];

    let startDate = new Date('2026-01-01');
    let endDate = new Date('2026-04-30');

    for (const teacher of teachers) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

            // Generate 2-3 plans per day
            const dailyCount = Math.floor(Math.random() * 2) + 2;

            for (let i = 0; i < dailyCount; i++) {
                const subject = subjects[(d.getDate() + i) % subjects.length];
                const cls = classes[i % classes.length];
                const id = `lp-2026-${teacher.id}-${d.getMonth()}-${d.getDate()}-${i}`;

                // Random Status logic
                let status = LessonStatus.APPROVED;
                if (d.getMonth() === 3) status = LessonStatus.SUBMITTED; // April
                if (d > new Date('2026-04-20')) status = LessonStatus.DRAFT; // Late April

                const plan: LessonPlan = {
                    id,
                    schoolId: 's-1',
                    teacherId: teacher.id,
                    teacherName: teacher.name,
                    subject,
                    grade: cls.includes('4') ? 'Tahun 4' : (cls.includes('5') ? 'Tahun 5' : 'Tahun 6'),
                    className: cls,
                    time: timeSlots[i],
                    topic: `Unit ${d.getDate()}: ${subject} - Topik Pembelajaran`,
                    date: d.toISOString().split('T')[0],
                    contentStandard: `${i + 1}.0 Standard Kandungan`,
                    learningStandard: `${i + 1}.${d.getDate()}.1 Standard Pembelajaran`,
                    objectives: [`Murid dapat menguasai ${subject} dengan baik.`],
                    successCriteria: ['Murid berjaya menjawab 3 soalan.'],
                    activities: ['Set Induksi', 'Aktiviti Utama', 'Penutup'],
                    teachingAids: ['Buku Teks', 'Papan Putih'],
                    pak21: ['Think-Pair-Share'],
                    assessment: ['Pemerhatian'],
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

    // 4. Generate Leave Records (Mock Data)
    const leaveTypes = Object.values(LeaveType);
    const leaveRecords: LeaveRecord[] = [];

    // Generate 3-5 leave records per teacher
    for (const teacher of teachers) {
        const leaveCount = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < leaveCount; i++) {
            // Random date in Jan-April 2026
            const month = Math.floor(Math.random() * 4);
            const day = Math.floor(Math.random() * 20) + 1;
            const startDate = new Date(2026, month, day);
            const endDate = new Date(2026, month, day + Math.floor(Math.random() * 2));

            const record: LeaveRecord = {
                id: `lr-${teacher.id}-${i}`,
                schoolId: 's-1',
                teacherId: teacher.id,
                teacherName: teacher.name,
                type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                reason: 'Personal affairs / Medical appointment',
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
