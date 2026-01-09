
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
    User, LeaveStatus, DSKPStandard, LoginRecord,
    School, UserRole, Task, TaskStatus, TaskPriority, LeaveRecord,
    SchoolType, TimetableTemplate, TimetableSlot, ReferenceSource, ReferenceItem
} from '../types';
import {
    db, auth,
    collection, doc, setDoc, getDocs, writeBatch,
    onAuthStateChanged, signOut, query, where, limit, getDoc, getCountFromServer, updateDoc
} from '../services/firebase';
import { sendEmail } from '../services/emailService';
import { seed2026Data } from '../utils/seeder';

export const MOCK_USERS: User[] = [
    {
        id: 'u-cch',
        name: 'Chan Cheng Hoong',
        email: 'cchoong2020@gmail.com',
        role: UserRole.SUPER_ADMIN,
        phone: '012-3456789',
        grade: 'JUSA C',
        serviceHistory: [],
        securityConfig: { twoFactorEnabled: true, sessionTimeoutMinutes: 30, lastPasswordChange: '2024-01-01', loginAlerts: true }
    },
    {
        id: 'u-admin',
        schoolId: 's-1',
        name: 'Lee Wei Kang',
        email: 'admin@school.com',
        role: UserRole.SCHOOL_ADMIN,
        phone: '012-1112222',
        grade: 'DG 12',
        serviceHistory: [],
        securityConfig: { twoFactorEnabled: false, sessionTimeoutMinutes: 30, lastPasswordChange: '2024-01-01', loginAlerts: true }
    },
    {
        id: 'u-principal',
        schoolId: 's-1',
        name: 'Tan Mei Ling',
        email: 'principal@school.com',
        role: UserRole.PRINCIPAL,
        phone: '012-3334444',
        grade: 'DG52',
        serviceHistory: [],
        securityConfig: { twoFactorEnabled: true, sessionTimeoutMinutes: 15, lastPasswordChange: '2024-01-01', loginAlerts: true }
    },
    {
        id: 'u-teacher',
        schoolId: 's-1',
        name: 'Wong Siew Min',
        email: 'teacher@school.com',
        role: UserRole.TEACHER,
        phone: '012-5556666',
        grade: 'DG 10',
        serviceHistory: [],
        securityConfig: { twoFactorEnabled: false, sessionTimeoutMinutes: 60, lastPasswordChange: '2024-01-01', loginAlerts: false }
    }
];

const ACTUAL_DSKP_DATA: DSKPStandard[] = [
    {
        id: "dskp-pm-y1-1", schoolType: SchoolType.SJKC, subject: "道德教育", grade: "一年级",
        contentStandard: "1.我的宗教信仰", learningStandard: "1.1 说出自身的宗教信仰"
    },
    {
        id: "dskp-pm-y1-2", schoolType: SchoolType.SJKC, subject: "道德教育", grade: "一年级",
        contentStandard: "1.我的宗教信仰", learningStandard: "1.2 解释宗教信仰的重要性"
    },
    {
        id: "dskp-bm-y4-1", schoolType: SchoolType.SJKC, subject: "国文 (Bahasa Melayu)", grade: "四年级",
        contentStandard: "1.1 Mendengar dan memberikan respons", learningStandard: "1.1.1 Mendengar, mengecam sebutan, dan menyebut sesuatu yang diujarkan semula dalam situasi tidak formal."
    },
    {
        id: "dskp-math-y4-1", schoolType: SchoolType.SJKC, subject: "数学", grade: "四年级",
        contentStandard: "1.0 整数与运算", learningStandard: "1.1.1 说出100 000以内的数目"
    }
];

const generateMockTimetable = (teacherId: string, name: string): TimetableTemplate => {
    const slots: TimetableSlot[] = [
        { id: `s-${teacherId}-1`, day: 'Mon', startTime: '08:00', endTime: '09:00', subject: 'Bahasa Melayu', class: '4 Amanah', color: '#bfdbfe' },
        { id: `s-${teacherId}-2`, day: 'Mon', startTime: '10:15', endTime: '11:15', subject: 'Matematik', class: '4 Amanah', color: '#bbf7d0' },
        { id: `s-${teacherId}-3`, day: 'Tue', startTime: '07:45', endTime: '08:45', subject: 'Sains', class: '5 Bestari', color: '#fef08a' },
        { id: `s-${teacherId}-4`, day: 'Wed', startTime: '09:00', endTime: '10:00', subject: 'English', class: '6 Cemerlang', color: '#fed7aa' },
        { id: `s-${teacherId}-5`, day: 'Thu', startTime: '11:30', endTime: '12:30', subject: 'Sejarah', class: '4 Amanah', color: '#fbcfe8' },
        { id: `s-${teacherId}-6`, day: 'Fri', startTime: '08:30', endTime: '09:30', subject: 'P. Jasmani', class: '5 Bestari', color: '#ddd6fe' },
    ];
    return { id: `tt-${teacherId}-main`, teacherId, schoolId: 's-1', name, effectiveDate: '2025-01-01', isActive: true, slots };
};



interface GlobalContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    schools: School[];
    setSchools: React.Dispatch<React.SetStateAction<School[]>>;
    sendNotification: (recipientId: string, message: string) => Promise<void>;
    sendEmailNotification: (recipientId: string, subject: string, body: string) => Promise<boolean>;
    getAcademicWeek: (date: Date) => number;
    isLoading: boolean;
    isSeeding: boolean;
    seedDatabase: (force?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    refreshGlobalData: () => Promise<void>;
    viewMode: 'admin' | 'teacher';
    setViewMode: React.Dispatch<React.SetStateAction<'admin' | 'teacher'>>;
    isEmailModalOpen: boolean;
    setIsEmailModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) throw new Error("useGlobal must be used within a GlobalProvider");
    return context;
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [schools, setSchools] = useState<School[]>([]);
    const [viewMode, setViewMode] = useState<'admin' | 'teacher'>('teacher');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const hasAttemptedSeed = useRef(false);



    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (authUser: any) => {
            if (!authUser) {
                setCurrentUser(null);
            } else {
                try {
                    const hardcodedAdmin = MOCK_USERS.find(u => u.id === authUser.uid);
                    if (hardcodedAdmin && hardcodedAdmin.id === 'u-cch') {
                        setCurrentUser(hardcodedAdmin);
                    } else {
                        const userRef = doc(db, 'users', authUser.uid);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            setCurrentUser({ id: userSnap.id, ...(userSnap.data() as any) } as User);
                        } else {
                            const demoByEmail = MOCK_USERS.find(u => u.email === authUser.email);
                            if (demoByEmail) setCurrentUser(demoByEmail);
                        }
                    }
                } catch (e) { console.error("Session restoration failed:", e); }
            }
            if (!hasAttemptedSeed.current) { seedDatabase(); }
            setIsLoading(false);
        });
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (currentUser) {
            setViewMode([UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.GPK, UserRole.SUPER_ADMIN].includes(currentUser.role) ? 'admin' : 'teacher');
        }
    }, [currentUser]);

    const refreshGlobalData = async () => {
        try {
            const schoolSnap = await getDocs(collection(db, 'schools'));
            setSchools(schoolSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        } catch (e) { }
    };

    useEffect(() => { refreshGlobalData(); }, [currentUser]);

    const seedDatabase = async (force: boolean = false) => {
        if (isSeeding || (hasAttemptedSeed.current && !force)) return;
        setIsSeeding(true);
        hasAttemptedSeed.current = true;
        try {
            // Check if we already have data to avoid re-seeding massive data on every reload
            const schoolRef = doc(db, 'schools', 's-1');
            const schoolSnap = await getDoc(schoolRef);

            if (!schoolSnap.exists() || force || (schoolSnap.data() as any).settings?.termStartDate !== '2026-03-09') {
                await seed2026Data();
                // Refresh local state after seeding
                await refreshGlobalData();
                // Force reload to reflect new data in lists if needed, or just let state update
                window.location.reload();
            }
        } catch (e) {
            console.error("Seed failed:", e);
        } finally {
            setIsSeeding(false);
        }
    };

    const sendNotification = async (recipientId: string, message: string) => {
        const notif = { id: `n-${Date.now()}`, recipientId, message, type: 'info', timestamp: new Date().toISOString(), isRead: false };
        await setDoc(doc(db, 'notifications', notif.id), notif);
    };

    const sendEmailNotification = async (recipientId: string, subject: string, body: string) => {
        try {
            const userSnap = await getDoc(doc(db, 'users', recipientId));
            const email = userSnap.exists() ? (userSnap.data() as any).email : MOCK_USERS.find(u => u.id === recipientId)?.email;
            if (!email) return false;
            return await sendEmail({ to: email, subject: `[Secure Portal] ${subject}`, text: body });
        } catch (e) { return false; }
    };

    const logout = async () => { await signOut(auth); setCurrentUser(null); };
    const getAcademicWeek = (date: Date) => 20;

    return (
        <GlobalContext.Provider value={{
            currentUser, setCurrentUser, schools, setSchools,
            sendNotification, sendEmailNotification, getAcademicWeek, refreshGlobalData,
            isLoading, isSeeding, seedDatabase, logout, viewMode, setViewMode,
            isEmailModalOpen, setIsEmailModalOpen
        }}>
            {children}
        </GlobalContext.Provider>
    );
};
