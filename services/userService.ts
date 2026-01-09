import {
    db, doc, getDoc, setDoc
} from './firebase';

const COLLECTION = 'users';

export const userService = {
    getProfile: async (uid: string) => {
        const snap = await getDoc(doc(db, COLLECTION, uid));
        if (snap.exists()) {
            return { success: true, data: { ...(snap.data() as any), id: uid } };
        }
        return { success: false, message: 'User not found' };
    },

    updateProfile: async (uid: string, data: any) => {
        await setDoc(doc(db, COLLECTION, uid), data, { merge: true });
        return { success: true };
    },

    // Create initial profile if doesn't exist (e.g. after Google Login)
    ensureProfile: async (uid: string, email: string, name: string) => {
        const ref = doc(db, COLLECTION, uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, {
                id: uid,
                email,
                name,
                role: 'teacher', // Default role
                createdAt: new Date().toISOString(),
                schoolId: '' // Needs to be set later
            });
        }
    }
};
