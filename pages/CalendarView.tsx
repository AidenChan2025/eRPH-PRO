
import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { CalendarEvent, Task, LeaveRecord, UserRole } from '../types';
import { collection, query, where, getDocs, db, setDoc, doc, deleteDoc } from '../services/firebase';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
    BookOpen, CheckSquare, Clock, X, MapPin, Flag
} from 'lucide-react';
import { ACADEMIC_CALENDAR_2026, SCHOOL_HOLIDAYS_2026, SchoolGroup } from '../utils/academicCalendar';
import { useTranslation } from 'react-i18next';

type EventType = 'task' | 'leave' | 'event' | 'holiday' | 'term';

interface UnifiedEvent {
    id: string;
    title: string;
    date: string;
    endDate?: string;
    type: EventType;
    details?: string;
    meta?: any;
}

const CalendarView = () => {
    const { t } = useLanguage();
    const { currentUser, schools } = useGlobal();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [unifiedEvents, setUnifiedEvents] = useState<UnifiedEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
        title: '',
        start: new Date().toISOString().split('T')[0],
        type: 'personal'
    });

    const currentSchool = schools.find(s => s.id === currentUser?.schoolId);
    const schoolGroup = currentSchool?.settings?.schoolGroup || 'B';



    const fetchData = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const eventsList: UnifiedEvent[] = [];

        try {
            const schoolId = currentUser.schoolId;

            // 1. Load Academic Calendar (Terms)
            const academicYear = ACADEMIC_CALENDAR_2026[schoolGroup as SchoolGroup] || ACADEMIC_CALENDAR_2026['B'];
            if (academicYear && academicYear.terms) {
                academicYear.terms.forEach((term, idx) => {
                    eventsList.push({
                        id: `term-${idx}`,
                        title: term.name,
                        date: term.start,
                        endDate: term.end,
                        type: 'term',
                        details: `Academic Term: ${term.name}`,
                        meta: term
                    });
                });
            }

            // 2. Load School Holidays (Festivals/Breaks)
            SCHOOL_HOLIDAYS_2026.forEach((hol, idx) => {
                if (hol.group === schoolGroup || !hol.group || hol.group === 'ALL') {
                    eventsList.push({
                        id: `hol-${idx}`,
                        title: hol.name,
                        date: hol.date,
                        endDate: hol.date,
                        type: 'holiday',
                        details: 'School Holiday',
                        meta: hol
                    });
                }
            });

            const globalQ = query(collection(db, 'calendarEvents'), where('schoolId', '==', 'global'));
            const globalSnap = await getDocs(globalQ);
            globalSnap.docs.forEach((d: any) => {
                const data = d.data() as CalendarEvent;
                if (data.group && data.group !== 'ALL' && data.group !== schoolGroup) return;
                eventsList.push({
                    id: d.id, title: data.title, date: data.start, endDate: data.end, type: data.type === 'term' ? 'term' : 'holiday', details: 'Public / MOE Event', meta: data
                });
            });

            const schoolQ = query(collection(db, 'calendarEvents'), where('schoolId', '==', schoolId));
            const schoolSnap = await getDocs(schoolQ);
            schoolSnap.docs.forEach((d: any) => {
                const data = d.data() as CalendarEvent;
                if (data.type === 'personal' && data.createdBy !== currentUser.id) return;
                eventsList.push({
                    id: d.id, title: data.title, date: data.start, endDate: data.end, type: data.type === 'holiday' ? 'holiday' : 'event', details: data.type === 'personal' ? 'Personal Event' : 'School Event', meta: data
                });
            });



            const taskQ = query(collection(db, 'tasks'), where('assigneeId', '==', currentUser.id));
            const taskSnap = await getDocs(taskQ);
            taskSnap.docs.forEach((d: any) => {
                const data = d.data() as Task;
                if (data.status !== 'Completed') {
                    eventsList.push({ id: d.id, title: data.title, date: data.dueDate, type: 'task', details: `Priority: ${data.priority}`, meta: data });
                }
            });

            let leaveQ;
            if (currentUser.role === UserRole.TEACHER) {
                leaveQ = query(collection(db, 'leaveRecords'), where('teacherId', '==', currentUser.id));
            } else {
                leaveQ = query(collection(db, 'leaveRecords'), where('schoolId', '==', schoolId));
            }
            const leaveSnap = await getDocs(leaveQ);
            leaveSnap.docs.forEach((d: any) => {
                const data = d.data() as LeaveRecord;
                eventsList.push({ id: d.id, title: `${data.type}`, date: data.startDate, endDate: data.endDate, type: 'leave', details: `${data.teacherName} - ${data.status}`, meta: data });
            });

            setUnifiedEvents(eventsList);
        } catch (e) {
            console.error("Error fetching calendar data:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser, schools]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        for (let i = 0; i < firstDay; i++) { days.push(null); }
        for (let i = 1; i <= daysInMonth; i++) { days.push(new Date(year, month, i)); }
        return days;
    }, [currentDate]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return unifiedEvents.filter(e => {
            if (e.endDate) { return dateStr >= e.date && dateStr <= e.endDate; }
            return e.date === dateStr;
        });
    };

    const handleAddEvent = async () => {
        if (!newEvent.title || !newEvent.start) return;
        try {
            const eventData = { ...newEvent, id: `ev-${Date.now()}`, schoolId: currentUser?.schoolId || '', createdBy: currentUser?.id } as CalendarEvent;
            await setDoc(doc(db, 'calendarEvents', eventData.id), eventData);
            setShowAddModal(false);
            setNewEvent({ title: '', start: new Date().toISOString().split('T')[0], type: 'personal' });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm("Delete this event?")) return;
        try {
            await deleteDoc(doc(db, 'calendarEvents', id));
            setSelectedDate(null);
            fetchData();
        } catch (e) { console.error(e); }
    };

    const getTypeColor = (type: EventType) => {
        switch (type) {

            case 'task': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'leave': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'holiday': return 'bg-red-100 text-red-700 border-red-200';
            case 'term': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6 p-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-bold text-slate-600 hover:text-blue-600">{t('today')}</button>
                        <button onClick={() => navigateMonth('next')} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        {currentSchool && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                {t('school_group')} {schoolGroup}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" /> {t('add_event')}
                    </Button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 border-b bg-slate-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {calendarGrid.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} className="bg-slate-50/30 border-b border-r min-h-[100px]"></div>;
                        const dateStr = date.toISOString().split('T')[0];
                        const dayEvents = getEventsForDate(date);
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isSelected = selectedDate === dateStr;
                        const hasHoliday = dayEvents.some(e => e.type === 'holiday');

                        return (
                            <div
                                key={dateStr}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`
                                    min-h-[100px] p-2 border-b border-r cursor-pointer transition-colors relative group
                                    ${isToday ? 'bg-blue-50/50' : hasHoliday ? 'bg-red-50/30' : 'hover:bg-slate-50'}
                                    ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                                        {date.getDate()}
                                    </span>
                                    {dayEvents.length > 0 && <span className="text-[10px] text-slate-400 font-medium md:hidden">{dayEvents.length}</span>}
                                </div>

                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map((e, idx) => (
                                        <div
                                            key={`${e.id}-${idx}`}
                                            className={`text-[10px] px-1.5 py-0.5 rounded truncate border flex items-center gap-1 ${getTypeColor(e.type)}`}
                                            title={e.title}
                                        >
                                            <span className="truncate font-medium">{e.title}</span>
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[10px] text-slate-500 pl-1 font-medium">
                                            +{dayEvents.length - 3} {t('more')}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedDate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setSelectedDate(null)}>
                    <Card className="w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">
                                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                <p className="text-xs text-slate-500">{t('events_and_tasks')}</p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-3">
                            {getEventsForDate(new Date(selectedDate)).length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p>{t('no_events_day')}</p>
                                    <Button size="sm" variant="secondary" className="mt-4" onClick={() => { setNewEvent({ ...newEvent, start: selectedDate }); setShowAddModal(true); }}>{t('add_event')}</Button>
                                </div>
                            ) : (
                                getEventsForDate(new Date(selectedDate)).map((e, idx) => (
                                    <div key={`${e.id}-${idx}`} className="flex gap-3 p-3 bg-white border rounded-lg shadow-sm">
                                        <div className={`w-1 self-stretch rounded-full ${getTypeColor(e.type).split(' ')[0].replace('bg-', 'bg-').replace('100', '500')}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-sm text-slate-800">{e.title}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getTypeColor(e.type)}`}>{e.type}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{e.details}</p>

                                            {(e.type === 'event' || e.type === 'holiday') && e.meta?.createdBy === currentUser.id && (
                                                <div className="mt-2 pt-2 border-t border-dashed flex justify-end">
                                                    <button onClick={() => handleDeleteEvent(e.id)} className="text-xs text-red-500 hover:underline">{t('delete')}</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-sm shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-lg text-slate-800">{t('add_event')}</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('event_title')}</label>
                                <input
                                    className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="e.g. Staff Meeting"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('start_date')}</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded-lg text-sm"
                                        value={newEvent.start}
                                        onChange={e => setNewEvent({ ...newEvent, start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('end_date')} {t('optional')}</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded-lg text-sm"
                                        value={newEvent.end || ''}
                                        onChange={e => setNewEvent({ ...newEvent, end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('event_type')}</label>
                                <select
                                    className="w-full border p-2 rounded-lg text-sm"
                                    value={newEvent.type}
                                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                >
                                    <option value="personal">{t('personal_event')}</option>
                                    <option value="school">{t('school_event')}</option>
                                    <option value="holiday">{t('public_holiday')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowAddModal(false)}>{t('cancel')}</Button>
                            <Button onClick={handleAddEvent}>{t('save')}</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
