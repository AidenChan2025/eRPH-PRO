
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword as _signInWithEmailAndPassword,
    createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
    signInWithPopup as _signInWithPopup,
    signOut as _signOut,
    onAuthStateChanged as _onAuthStateChanged,
    sendEmailVerification as _sendEmailVerification,
    GoogleAuthProvider
} from 'firebase/auth';
import {
    getFirestore,
    collection as _collection,
    doc as _doc,
    getDocs as _getDocs,
    getDoc as _getDoc,
    setDoc as _setDoc,
    updateDoc as _updateDoc,
    deleteDoc as _deleteDoc,
    query as _query,
    where as _where,
    limit as _limit,
    orderBy as _orderBy,
    startAfter as _startAfter,
    writeBatch as _writeBatch,
    getCountFromServer as _getCountFromServer
} from 'firebase/firestore';

// Configuration from environment variables (mapped via vite.config.ts define)
declare const process: any;

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

let realApp: any = null;
let realAuth: any = null;
let realDb: any = null;

// Determine if we have valid keys to initialize Firebase
const hasRequiredKeys = !!firebaseConfig.apiKey && !!firebaseConfig.projectId && firebaseConfig.apiKey !== '';

if (hasRequiredKeys) {
    try {
        realApp = initializeApp(firebaseConfig);
        realAuth = getAuth(realApp);
        realDb = getFirestore(realApp);
        console.log("Firebase Initialized with:", {
            apiKeyPresent: !!firebaseConfig.apiKey,
            projectId: firebaseConfig.projectId,
            authDomain: firebaseConfig.authDomain
        });
    } catch (e) {
        console.error("Firebase Initialization Failed:", e);
    }
} else {
    console.warn("Firebase Authorization Keys Missing. Running in MOCK mode.");
    console.log("Config State:", {
        apiKeyLength: firebaseConfig.apiKey?.length,
        projectId: firebaseConfig.projectId
    });
}

const DB_MODE_KEY = 'erph_db_mode';

// Simplifed Mode: Only 'firebase' or 'mock'
export const getDbMode = (): 'mock' | 'firebase' => {
    const stored = localStorage.getItem(DB_MODE_KEY) as any;
    if (stored === 'mock' || stored === 'firebase') return stored;
    // Default to firebase if keys exist, otherwise mock
    return hasRequiredKeys ? 'firebase' : 'mock';
};

export const setDbMode = (mode: 'mock' | 'firebase') => {
    if (getDbMode() === mode) return;
    localStorage.setItem(DB_MODE_KEY, mode);
    // Force clean state on mode switch
    window.location.reload();
};

// --- AUTHENTICATION OBSERVER (MOCK) ---
const authListeners = new Set<(user: any) => void>();

const notifyAuthChange = (user: any) => {
    authListeners.forEach(listener => listener(user));
};

export const auth = {
    get currentUser() {
        if (getDbMode() === 'firebase') return realAuth?.currentUser || null;
        const stored = localStorage.getItem('erph_current_user');
        return stored ? JSON.parse(stored) : null;
    }
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    // Add synthetic delay for better perceived UX and to allow loading states to show
    await new Promise(r => setTimeout(r, 600));

    if (getDbMode() === 'firebase' && realAuth) {
        return _signInWithEmailAndPassword(realAuth, email, pass);
    }

    let uid = '';
    let displayName = '';

    if (email === 'cchoong2020@gmail.com') {
        if (pass === '123456' || pass === 'demo123') {
            uid = 'u-cch';
            displayName = 'Chan Cheng Hoong';
        } else {
            throw new Error("Invalid password for Super Admin.");
        }
    } else if (email.includes('admin@')) {
        uid = 'u-admin';
        displayName = 'Lee Wei Kang';
    } else if (email.includes('principal@')) {
        uid = 'u-principal';
        displayName = 'Tan Mei Ling';
    } else if (email.includes('teacher@')) {
        uid = 'u-teacher';
        displayName = 'Wong Siew Min';
    } else {
        uid = `u-gen-${Date.now()}`;
        displayName = email.split('@')[0];
    }

    const mockUser = { uid, email, displayName };
    localStorage.setItem('erph_current_user', JSON.stringify(mockUser));
    notifyAuthChange(mockUser);
    return { user: mockUser };
};

export const signInWithGoogle = async (authObj: any) => {
    if (getDbMode() === 'firebase' && realAuth) {
        const provider = new GoogleAuthProvider();
        return _signInWithPopup(realAuth, provider);
    }
    throw new Error("Google Login only available in Firebase mode.");
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    if (getDbMode() === 'firebase' && realAuth) {
        return _createUserWithEmailAndPassword(realAuth, email, pass);
    }
    // Mock Signup
    const uid = `u-gen-${Date.now()}`;
    const displayName = email.split('@')[0];
    const mockUser = { uid, email, displayName, emailVerified: false };
    localStorage.setItem('erph_current_user', JSON.stringify(mockUser));
    notifyAuthChange(mockUser);
    return { user: mockUser };
};

export const sendEmailVerification = async (user: any) => {
    if (getDbMode() === 'firebase' && realAuth) {
        return _sendEmailVerification(user);
    }
    // Mock Verification
    console.log("Mock Email Verification Sent to:", user.email);
    return Promise.resolve();
};

export const signOut = async (authObj: any) => {
    if (getDbMode() === 'firebase' && realAuth) {
        return _signOut(realAuth);
    }
    localStorage.removeItem('erph_current_user');
    notifyAuthChange(null);
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
    if (getDbMode() === 'firebase' && realAuth) {
        return _onAuthStateChanged(realAuth, callback);
    }

    authListeners.add(callback);

    // Initial check
    const stored = localStorage.getItem('erph_current_user');
    const user = stored ? JSON.parse(stored) : null;
    setTimeout(() => callback(user), 10); // Reduced delay for faster initial hydration

    // Unsubscribe function
    return () => {
        authListeners.delete(callback);
    };
};

// --- DATABASE (FIRESTORE WRAPPERS) ---

export const db = (getDbMode() === 'firebase' && realDb) ? realDb : { type: 'custom_db' };

export const collection = (dbInstance: any, path: string) => {
    if (getDbMode() === 'firebase' && dbInstance && !dbInstance.type) {
        return _collection(dbInstance, path);
    }
    return { path, type: 'custom_collection' };
};

export const doc = (dbInstance: any, path: string, id?: string) => {
    if (getDbMode() === 'firebase' && dbInstance && !dbInstance.type) {
        return id ? _doc(dbInstance, path, id) : _doc(dbInstance, path);
    }
    if (id) return { path, id, type: 'custom_doc' };
    const parts = (path || '').split('/');
    if (parts.length > 1) return { path: parts[0], id: parts[1], type: 'custom_doc' };
    return { path, id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, type: 'custom_doc' };
};

// --- CRUD OPERATIONS ---
const getStore = () => JSON.parse(localStorage.getItem('ERPH_PRO_DATA_V1_STABLE') || '{}');
const setStore = (data: any) => localStorage.setItem('ERPH_PRO_DATA_V1_STABLE', JSON.stringify(data));

export const getDocs = async (queryOrRef: any) => {
    if (getDbMode() === 'firebase' && queryOrRef && !queryOrRef.type) {
        const snapshot = await _getDocs(queryOrRef);
        return {
            empty: snapshot.empty,
            docs: snapshot.docs.map((d: any) => ({
                id: d.id,
                data: () => d.data()
            }))
        };
    }

    const store = getStore();
    const collectionPath = queryOrRef.path;
    let items = Object.values(store[collectionPath] || {});

    if (queryOrRef.constraints) {
        queryOrRef.constraints.forEach((c: any) => {
            if (c.kind === 'where') {
                items = items.filter((item: any) => {
                    if (c.op === '==') return item[c.field] === c.value;
                    if (c.op === '>=') return item[c.field] >= c.value;
                    if (c.op === '<=') return item[c.field] <= c.value;
                    return true;
                });
            }
            if (c.kind === 'orderBy') {
                items.sort((a: any, b: any) => {
                    const valA = a[c.field];
                    const valB = b[c.field];
                    if (valA < valB) return c.dir === 'asc' ? -1 : 1;
                    if (valA > valB) return c.dir === 'asc' ? 1 : -1;
                    return 0;
                });
            }
        });
        const limitConstraint = queryOrRef.constraints.find((c: any) => c.kind === 'limit');
        if (limitConstraint) items = items.slice(0, limitConstraint.value);
    }

    return {
        empty: items.length === 0,
        docs: items.map((d: any) => ({ id: d.id, data: () => d }))
    };
};

export const getDoc = async (ref: any) => {
    if (getDbMode() === 'firebase' && ref && !ref.type) {
        const docSnap = await _getDoc(ref);
        return { exists: () => docSnap.exists(), data: () => docSnap.data(), id: docSnap.id };
    }
    const store = getStore();
    const data = store[ref.path]?.[ref.id];
    return { exists: () => !!data, data: () => data, id: ref.id };
};

export const setDoc = async (ref: any, data: any, options?: any) => {
    if (getDbMode() === 'firebase' && ref && !ref.type) return _setDoc(ref, data, options);
    const store = getStore();
    if (!store[ref.path]) store[ref.path] = {};
    store[ref.path][ref.id] = { ...data, id: ref.id };
    setStore(store);
};

export const updateDoc = async (ref: any, data: any) => {
    if (getDbMode() === 'firebase' && ref && !ref.type) return _updateDoc(ref, data);
    const store = getStore();
    if (store[ref.path]?.[ref.id]) {
        store[ref.path][ref.id] = { ...store[ref.path][ref.id], ...data };
        setStore(store);
    }
};

export const deleteDoc = async (ref: any) => {
    if (getDbMode() === 'firebase' && ref && !ref.type) return _deleteDoc(ref);
    const store = getStore();
    if (store[ref.path]) {
        delete store[ref.path][ref.id];
        setStore(store);
    }
};

// --- QUERY BUILDERS ---
export const where = (field: string, op: any, value: any) => ({ type: 'constraint', kind: 'where', field, op, value });
export const limit = (val: number) => ({ type: 'constraint', kind: 'limit', value: val });
export const orderBy = (field: string, dir: 'asc' | 'desc' = 'asc') => ({ type: 'constraint', kind: 'orderBy', field, dir });
export const startAfter = (snapshot: any) => ({ type: 'constraint', kind: 'startAfter', snapshot });

export const query = (ref: any, ...constraints: any[]) => {
    if (getDbMode() === 'firebase' && !ref.type) {
        const realConstraints = constraints.map(c => {
            if (c.kind === 'where') return _where(c.field, c.op, c.value);
            if (c.kind === 'limit') return _limit(c.value);
            if (c.kind === 'orderBy') return _orderBy(c.field, c.dir);
            if (c.kind === 'startAfter') return _startAfter(c.snapshot);
            return null;
        }).filter(Boolean);
        return _query(ref, ...realConstraints);
    }
    return { path: ref.path, constraints, type: 'custom_query' };
};

export const getCountFromServer = async (queryOrRef: any) => {
    if (getDbMode() === 'firebase' && queryOrRef && !queryOrRef.type) return _getCountFromServer(queryOrRef);
    const snap = await getDocs(queryOrRef);
    return { data: () => ({ count: snap.docs.length }) };
};

export const writeBatch = (dbInstance: any) => {
    if (getDbMode() === 'firebase' && dbInstance && !dbInstance.type) return _writeBatch(dbInstance);

    const localChanges: { path: string, id: string, data: any, op: 'set' | 'update' | 'delete' }[] = [];

    return {
        set: (ref: any, data: any) => {
            localChanges.push({ path: ref.path, id: ref.id, data, op: 'set' });
        },
        update: (ref: any, data: any) => {
            localChanges.push({ path: ref.path, id: ref.id, data, op: 'update' });
        },
        delete: (ref: any) => {
            localChanges.push({ path: ref.path, id: ref.id, data: null, op: 'delete' });
        },
        commit: async () => {
            if (localChanges.length === 0) return;
            const store = getStore();
            localChanges.forEach(change => {
                if (!store[change.path]) store[change.path] = {};
                if (change.op === 'set') {
                    store[change.path][change.id] = { ...change.data, id: change.id };
                } else if (change.op === 'update') {
                    store[change.path][change.id] = { ...store[change.path][change.id], ...change.data };
                } else if (change.op === 'delete') {
                    delete store[change.path][change.id];
                }
            });
            setStore(store);
        }
    };
};

export const clearMockDb = async () => {
    localStorage.removeItem('ERPH_PRO_DATA_V1_STABLE');
    window.location.reload();
};
