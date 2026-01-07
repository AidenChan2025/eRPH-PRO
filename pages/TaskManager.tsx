
import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Task, TaskStatus, TaskPriority, RecurrenceFrequency, TaskRecurrence, UserRole, User } from '../types';
import { 
    Plus, X, Repeat, AlarmClock, CalendarDays, User as UserIcon, 
    Trash2, Check, Lock, Search, Filter, RefreshCw, 
    CheckSquare, ChevronRight, BarChart3, Clock, AlertTriangle, UserPlus, Send, Loader2
} from 'lucide-react';
import { collection, query, where, getDocs, db, setDoc, doc, deleteDoc } from '../services/firebase';

const TaskManager = () => {
    const { t } = useLanguage();
    const { currentUser, sendEmailNotification, viewMode } = useGlobal();
    
    const [tasks, setTasks] = useState<Task[]>([]);
    const [scopedUsers, setScopedUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'my_tasks' | 'assigned_tasks'>(viewMode === 'admin' ? 'assigned_tasks' : 'my_tasks');
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | TaskStatus>('ALL');

    const [newTask, setNewTask] = useState<Partial<Task> & { isRecurring: boolean }>({
        title: '', description: '', priority: TaskPriority.MEDIUM, dueDate: new Date().toISOString().split('T')[0], assigneeId: '',
        dependencies: [], isRecurring: false, recurrence: { frequency: RecurrenceFrequency.WEEKLY, interval: 1 }
    });

    const isLeader = currentUser && [UserRole.SUPER_ADMIN, UserRole.PRINCIPAL, UserRole.GPK, UserRole.SCHOOL_ADMIN].includes(currentUser.role);

    const refreshTasks = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const userQuery = currentUser.role === UserRole.SUPER_ADMIN ? query(collection(db, 'users')) : query(collection(db, 'users'), where('schoolId', '==', currentUser.schoolId || ''));
            const userSnap = await getDocs(userQuery);
            setScopedUsers(userSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));

            const taskQuery = currentUser.role === UserRole.SUPER_ADMIN ? query(collection(db, 'tasks')) : query(collection(db, 'tasks'), where('schoolId', '==', currentUser.schoolId || ''));
            const taskSnap = await getDocs(taskQuery);
            setTasks(taskSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { refreshTasks(); }, [currentUser]);

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.assigneeId) return;
        const task: Task = {
            id: `t-${Date.now()}`, schoolId: currentUser?.schoolId || '', title: newTask.title, description: newTask.description || '',
            assigneeId: newTask.assigneeId, assigneeName: scopedUsers.find(u=>u.id===newTask.assigneeId)?.name || 'Unknown',
            assignerId: currentUser?.id || '', assignerName: currentUser?.name || '', dueDate: newTask.dueDate || '',
            status: TaskStatus.PENDING, priority: newTask.priority || TaskPriority.MEDIUM, createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'tasks', task.id), task);
        refreshTasks(); setShowModal(false);
    };

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        await setDoc(doc(db, 'tasks', taskId), { ...task, status: newStatus });
        refreshTasks();
    };

    const processedTasks = useMemo(() => {
        return tasks.filter(t => activeTab === 'my_tasks' ? t.assigneeId === currentUser?.id : (t.assignerId === currentUser?.id))
            .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(t => filterStatus === 'ALL' || t.status === filterStatus);
    }, [tasks, activeTab, searchQuery, filterStatus, currentUser]);

    const stats = useMemo(() => {
        const assigned = tasks.filter(t => t.assignerId === currentUser?.id);
        const completed = assigned.filter(t => t.status === TaskStatus.COMPLETED).length;
        return { total: assigned.length, completed, pending: assigned.length - completed, rate: assigned.length ? Math.round((completed / assigned.length) * 100) : 0 };
    }, [tasks, currentUser]);

    if (!currentUser) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h2 className="text-2xl font-bold text-slate-800">{activeTab === 'assigned_tasks' ? t('assignment_oversight') : t('my_tasks')}</h2><p className="text-slate-500 text-sm">{t('manage_weekly_submissions')}</p></div>
                <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2"/> {t('new_task')}</Button>
            </div>

            {isLeader && activeTab === 'assigned_tasks' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-blue-100 rounded-2xl"><Send className="w-6 h-6 text-blue-600"/></div><div><p className="text-[10px] font-black text-slate-400 uppercase">{t('issued_directives')}</p><h4 className="text-2xl font-bold">{stats.total}</h4></div></div></Card>
                    <Card className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-100 rounded-2xl"><CheckSquare className="w-6 h-6 text-emerald-600"/></div><div><p className="text-[10px] font-black text-slate-400 uppercase">{t('completion_rate')}</p><h4 className="text-2xl font-bold">{stats.rate}%</h4></div></div></Card>
                    <Card className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-amber-100 rounded-2xl"><Clock className="w-6 h-6 text-amber-600"/></div><div><p className="text-[10px] font-black text-slate-400 uppercase">{t('awaiting_action')}</p><h4 className="text-2xl font-bold">{stats.pending}</h4></div></div></Card>
                </div>
            )}

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={()=>setActiveTab('my_tasks')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab==='my_tasks'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>{t('my_workspace')}</button>
                {isLeader && <button onClick={()=>setActiveTab('assigned_tasks')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab==='assigned_tasks'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>{t('assignment_oversight')}</button>}
            </div>

            <div className="grid gap-4">
                {processedTasks.length === 0 ? <Card className="p-12 text-center text-slate-400">{t('no_data')}</Card> : processedTasks.map(task => (
                    <Card key={task.id} className="p-5 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${task.status===TaskStatus.COMPLETED?'bg-emerald-50 text-emerald-600':'bg-slate-50 text-slate-400'}`}><CheckSquare className="w-6 h-6"/></div>
                            <div><h4 className={`font-bold ${task.status===TaskStatus.COMPLETED?'line-through opacity-50':''}`}>{task.title}</h4><p className="text-xs text-slate-500">{task.assigneeName} • {task.dueDate}</p></div>
                        </div>
                        <div className="flex gap-2">
                            {task.status !== TaskStatus.COMPLETED && <button onClick={()=>handleStatusChange(task.id, TaskStatus.COMPLETED)} className="p-2 bg-blue-600 text-white rounded-lg"><Check className="w-4 h-4"/></button>}
                        </div>
                    </Card>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg shadow-2xl overflow-hidden border-0 rounded-3xl">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50"><h3 className="font-bold text-lg">{t('directive_issue')}</h3><button onClick={()=>setShowModal(false)}><X className="w-5 h-5"/></button></div>
                        <div className="p-8 space-y-4">
                            <div><label className="block text-[10px] font-black uppercase mb-1">{t('task_directive_title')}</label><input className="w-full border p-3 rounded-xl" value={newTask.title} onChange={e=>setNewTask({...newTask, title:e.target.value})} /></div>
                            <div><label className="block text-[10px] font-black uppercase mb-1">{t('assigned_to')}</label><select className="w-full border p-3 rounded-xl" value={newTask.assigneeId} onChange={e=>setNewTask({...newTask, assigneeId:e.target.value})}>{scopedUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                            <div><label className="block text-[10px] font-black uppercase mb-1">{t('due_date')}</label><input type="date" className="w-full border p-3 rounded-xl" value={newTask.dueDate} onChange={e=>setNewTask({...newTask, dueDate:e.target.value})} /></div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3"><Button variant="secondary" onClick={()=>setShowModal(false)}>{t('cancel')}</Button><Button onClick={handleCreateTask}>{t('send_directive')}</Button></div>
                    </Card>
                </div>
            )}
        </div>
    );
};
export default TaskManager;
