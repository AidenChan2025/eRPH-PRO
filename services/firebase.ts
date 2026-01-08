
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
        console.log("Firebase Initialized:", {
            projectId: firebaseConfig.projectId
        });
    } catch (e) {
        console.error("Firebase Initialization Failed:", e);
    }
} else {
    console.error("CRITICAL: Firebase Configuration Missing. Application will not function correctly.");
}

export const isInitialized = () => !!realDb;

// --- AUTHENTICATION EXPORTS ---
export const auth = realAuth;

export const signInWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    if (!realAuth) throw new Error("Firebase Auth not initialized");
    return _signInWithEmailAndPassword(realAuth, email, pass);
};

export const signInWithGoogle = async (authObj: any) => {
    if (!realAuth) throw new Error("Firebase Auth not initialized");
    const provider = new GoogleAuthProvider();
    return _signInWithPopup(realAuth, provider);
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    if (!realAuth) throw new Error("Firebase Auth not initialized");
    return _createUserWithEmailAndPassword(realAuth, email, pass);
};

export const sendEmailVerification = async (user: any) => {
    if (!realAuth) throw new Error("Firebase Auth not initialized");
    return _sendEmailVerification(user);
};

export const signOut = async (authObj: any) => {
    if (!realAuth) throw new Error("Firebase Auth not initialized");
    return _signOut(realAuth);
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
    if (!realAuth) return () => { };
    return _onAuthStateChanged(realAuth, callback);
};

// --- FIRESTORE EXPORTS ---
export const db = realDb;

export const collection = (dbInstance: any, path: string) => {
    if (!realDb) throw new Error("Firestore not initialized");
    return _collection(dbInstance, path);
};

export const doc = (dbInstance: any, path: string, id?: string) => {
    if (!realDb) throw new Error("Firestore not initialized");
    return id ? _doc(dbInstance, path, id) : _doc(dbInstance, path);
};

export const getDocs = async (queryOrRef: any) => {
    if (!realDb) throw new Error("Firestore not initialized");
    const snapshot = await _getDocs(queryOrRef);
    return {
        empty: snapshot.empty,
        docs: snapshot.docs.map((d: any) => ({
            id: d.id,
            data: () => d.data(),
            ref: d.ref
        }))
    };
};

export const getDoc = async (ref: any) => {
    if (!realDb) throw new Error("Firestore not initialized");
    const docSnap = await _getDoc(ref);
    return { exists: () => docSnap.exists(), data: () => docSnap.data(), id: docSnap.id };
};

export const setDoc = async (ref: any, data: any, options?: any) => {
    if (!realDb) throw new Error("Firestore not initialized");
    return _setDoc(ref, data, options);
};

export const updateDoc = async (ref: any, data: any) => {
    if (!realDb) throw new Error("Firestore not initialized");
    return _updateDoc(ref, data);
};

export const deleteDoc = async (ref: any) => {
    if (!realDb) throw new Error("Firestore not initialized");
    return _deleteDoc(ref);
};

// --- QUERY BUILDERS ---
// Pass-through functions for query constraints
export { where, limit, orderBy, startAfter } from 'firebase/firestore';

export const query = (ref: any, ...constraints: any[]) => {
    if (!realDb) throw new Error("Firestore not initialized");
    return _query(ref, ...constraints);
};

export const getCountFromServer = async (queryOrRef: any) => {
    if (!realDb) throw new Error("Firestore not initialized");
    return _getCountFromServer(queryOrRef);
};

export const writeBatch = (dbInstance: any) => {
    if (!realDb) throw new Error("Firestore not initialized");
    return _writeBatch(dbInstance);
};
