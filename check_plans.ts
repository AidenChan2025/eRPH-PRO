// @ts-nocheck
import { db, collection, query, where, getDocs } from './services/firebase';
import { UserRole } from './types';

async function check() {
    const q = query(collection(db, 'lessonPlans'), where('teacherId', '==', 'u-cch'));
    const snap = await getDocs(q);
    console.log("Plans for u-cch:", snap.size);
    snap.forEach(d => console.log(d.id, d.data().date));
}
check();
