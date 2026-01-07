
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { TimetableTemplate, TimetableSlot, DayOfWeek, UserRole, User } from '../types';
import { collection, query, where, getDocs, db, setDoc, doc, deleteDoc, writeBatch } from '../services/firebase';
import { Plus, Trash2, Save, Calendar as CalendarIcon, Clock, Move, X, Palette, AlertCircle, Copy, CheckCircle, Edit2, User as UserIcon, ChevronDown } from 'lucide-react';

// --- CONFIG ---
const START_HOUR = 7; // 7:00 AM
const END_HOUR = 19;  // 7:00 PM
const PIXELS_PER_HOUR = 80;
const SNAP_MINUTES = 5; // Snap to nearest 5 mins
const DAYS: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- HELPERS ---
const timeToMinutes = (time: string) => {
    const [h, m] = (time || '00:00').split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const COLORS = [
    '#bfdbfe', // blue-200
    '#bbf7d0', // green-200
    '#fef08a', // yellow-200
    '#fed7aa', // orange-200
    '#fbcfe8', // pink-200
    '#ddd6fe', // violet-200
    '#e2e8f0', // slate-200
    '#fecaca', // red-200
];

const TimetableManager = () => {
    const { t } = useLanguage();
    const { currentUser, viewMode } = useGlobal();
    
    // Data State
    const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Admin View State
    const [teachers, setTeachers] = useState<User[]>([]);
    const [targetTeacherId, setTargetTeacherId] = useState<string>('');

    // Editor State
    const [currentSlots, setCurrentSlots] = useState<TimetableSlot[]>([]);
    const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    
    // Refs for Drag Calculation
    const gridRef = useRef<HTMLDivElement>(null);

    // Permissions
    const canViewOthers = currentUser && [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.GPK, UserRole.SUPER_ADMIN].includes(currentUser.role) && viewMode === 'admin';
    const canEdit = !canViewOthers || (currentUser?.id === targetTeacherId);

    // Derived: Overlap Detection
    const overlappingSlotIds = useMemo(() => {
        const ids = new Set<string>();
        currentSlots.forEach((s1, i) => {
            currentSlots.forEach((s2, j) => {
                if (i >= j) return; // Avoid double check
                if (s1.day !== s2.day) return;

                const start1 = timeToMinutes(s1.startTime);
                const end1 = timeToMinutes(s1.endTime);
                const start2 = timeToMinutes(s2.startTime);
                const end2 = timeToMinutes(s2.endTime);

                if (start1 < end2 && start2 < end1) {
                    ids.add(s1.id);
                    ids.add(s2.id);
                }
            });
        });
        return ids;
    }, [currentSlots]);

    // Initial Setup
    useEffect(() => {
        if (!currentUser) return;
        setTargetTeacherId(currentUser.id);

        if (canViewOthers) {
            const fetchTeachers = async () => {
                const q = query(collection(db, 'users'), where('schoolId', '==', currentUser.schoolId));
                const snap = await getDocs(q);
                setTeachers(snap.docs.map((d:any) => ({id:d.id, ...d.data()} as User)));
            };
            fetchTeachers();
        }
    }, [currentUser, canViewOthers]);

    // Fetch Templates when target teacher changes
    useEffect(() => {
        if (!targetTeacherId) return;
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(db, 'timetableTemplates'), where('teacherId', '==', targetTeacherId));
                const snap = await getDocs(q);
                const data = snap.docs.map((d:any) => ({id: d.id, ...d.data()} as TimetableTemplate));
                setTemplates(data);
                if (data.length > 0) {
                    const active = data.find(t => t.isActive);
                    setSelectedTemplateId(active ? active.id : data[0].id);
                } else {
                    setSelectedTemplateId(null);
                    setCurrentSlots([]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, [targetTeacherId]);

    // Update slots when template changes
    useEffect(() => {
        if (selectedTemplateId) {
            const tmpl = templates.find(t => t.id === selectedTemplateId);
            if (tmpl) {
                setCurrentSlots(tmpl.slots || []);
                setHasUnsavedChanges(false);
                setRenameValue(tmpl.name);
            }
        } else {
            setCurrentSlots([]);
            setHasUnsavedChanges(false);
            setRenameValue('');
        }
    }, [selectedTemplateId, templates]); 

    const updateSlots = (newSlots: TimetableSlot[]) => {
        setCurrentSlots(newSlots);
        setHasUnsavedChanges(true);
    };

    const handleTemplateSwitch = (newId: string) => {
        if (hasUnsavedChanges) {
            if (!confirm("You have unsaved changes. Discard them?")) return;
        }
        setSelectedTemplateId(newId);
    };

    const handleSaveCurrent = async () => {
        if (!selectedTemplateId || !currentUser || !canEdit) return;
        setIsSaving(true);
        try {
            const tmpl = templates.find(t => t.id === selectedTemplateId);
            if (!tmpl) return;
            
            const updatedTmpl = { ...tmpl, slots: currentSlots, name: renameValue };
            await setDoc(doc(db, 'timetableTemplates', tmpl.id), updatedTmpl);
            
            setTemplates(prev => prev.map(t => t.id === tmpl.id ? updatedTmpl : t));
            setHasUnsavedChanges(false);
            setIsRenaming(false);
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!currentUser || !canEdit) return;
        if (hasUnsavedChanges && !confirm("Discard unsaved changes?")) return;

        const name = prompt("Enter Template Name (e.g. Standard Routine):", "New Timetable");
        if (!name) return;

        const newTmpl: TimetableTemplate = {
            id: `tt-${Date.now()}`,
            teacherId: targetTeacherId,
            schoolId: currentUser.schoolId || '',
            name,
            effectiveDate: new Date().toISOString(),
            slots: [],
            isActive: templates.length === 0
        };

        try {
            await setDoc(doc(db, 'timetableTemplates', newTmpl.id), newTmpl);
            setTemplates(prev => [...prev, newTmpl]);
            setSelectedTemplateId(newTmpl.id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCloneTemplate = async () => {
        if (!selectedTemplateId || !currentUser || !canEdit) return;
        const currentTmpl = templates.find(t => t.id === selectedTemplateId);
        if(!currentTmpl) return;
        const newName = prompt("New Template Name:", `${currentTmpl.name} (Copy)`);
        if(!newName) return;
        const newTmpl: TimetableTemplate = {
            ...currentTmpl,
            id: `tt-${Date.now()}`,
            name: newName,
            slots: currentSlots,
            isActive: false
        };
        try {
            await setDoc(doc(db, 'timetableTemplates', newTmpl.id), newTmpl);
            setTemplates(prev => [...prev, newTmpl]);
            setSelectedTemplateId(newTmpl.id);
            setHasUnsavedChanges(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!canEdit) return;
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, 'timetableTemplates', id));
            const remaining = templates.filter(t => t.id !== id);
            setTemplates(remaining);
            if (remaining.length > 0) setSelectedTemplateId(remaining[0].id);
            else setSelectedTemplateId(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSetActive = async () => {
        if(!selectedTemplateId || !currentUser || !canEdit) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            templates.forEach(t => {
                const ref = doc(db, 'timetableTemplates', t.id);
                if (t.id === selectedTemplateId) batch.update(ref, { isActive: true });
                else if (t.isActive) batch.update(ref, { isActive: false });
            });
            await batch.commit();
            setTemplates(prev => prev.map(t => ({...t, isActive: t.id === selectedTemplateId})));
        } catch (e) {
            console.error(e);
            alert("Failed to update active status.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- DRAG AND DROP ---
    const handleDragStart = (e: React.DragEvent, slotId: string) => {
        if (!canEdit) return;
        e.dataTransfer.setData('text/plain', slotId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedSlotId(slotId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!canEdit) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, day: DayOfWeek) => {
        if (!canEdit) return;
        e.preventDefault();
        const slotId = e.dataTransfer.getData('text/plain');
        if (!slotId) return;

        const currentTarget = e.currentTarget as HTMLDivElement;
        const rect = currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minutesFromStart = (offsetY / PIXELS_PER_HOUR) * 60;
        const totalMinutes = (START_HOUR * 60) + minutesFromStart;
        const snappedMinutes = Math.round(totalMinutes / SNAP_MINUTES) * SNAP_MINUTES;
        
        const slotIndex = currentSlots.findIndex(s => s.id === slotId);
        if (slotIndex === -1) return;
        const slot = currentSlots[slotIndex];
        const duration = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
        const newStartMins = Math.max(START_HOUR * 60, Math.min((END_HOUR * 60) - duration, snappedMinutes));
        const newEndMins = newStartMins + duration;

        const updatedSlot = { ...slot, day, startTime: minutesToTime(newStartMins), endTime: minutesToTime(newEndMins) };
        const newSlots = [...currentSlots];
        newSlots[slotIndex] = updatedSlot;
        updateSlots(newSlots);
        setDraggedSlotId(null);
    };

    const addSlot = (day: DayOfWeek, startHour: number) => {
        if (!canEdit) return;
        const newSlot: TimetableSlot = {
            id: generateId(), day, startTime: minutesToTime(startHour * 60), endTime: minutesToTime((startHour + 1) * 60),
            subject: 'New Subject', class: 'Class', color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
        updateSlots([...currentSlots, newSlot]);
        setEditingSlot(newSlot);
    };

    const saveSlotChanges = () => {
        if (!editingSlot || !canEdit) return;
        updateSlots(currentSlots.map(s => s.id === editingSlot.id ? editingSlot : s));
        setEditingSlot(null);
    };

    const deleteSlot = () => {
        if (!editingSlot || !canEdit) return;
        updateSlots(currentSlots.filter(s => s.id !== editingSlot.id));
        setEditingSlot(null);
    };

    const getSlotStyle = (slot: TimetableSlot) => {
        const startMins = timeToMinutes(slot.startTime);
        const endMins = timeToMinutes(slot.endTime);
        const durationMins = endMins - startMins;
        const topOffsetMins = startMins - (START_HOUR * 60);
        const topPixels = (topOffsetMins / 60) * PIXELS_PER_HOUR;
        const heightPixels = (durationMins / 60) * PIXELS_PER_HOUR;
        return { top: `${topPixels}px`, height: `${heightPixels}px`, backgroundColor: slot.color || '#e2e8f0' };
    };

    if (!currentUser) return null;

    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    const isActive = currentTemplate?.isActive;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 overflow-hidden bg-slate-50">
            {/* Toolbar - Aligned with screenshot */}
            <div className="bg-white border-b px-8 py-5 flex flex-col md:flex-row items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
                    <h2 className="text-2xl font-bold text-slate-800">{t('timetable')}</h2>
                    
                    <div className="flex items-center gap-3">
                        {/* Admin Teacher Selector */}
                        {canViewOthers && (
                            <div className="relative group">
                                <div className="absolute left-3 top-2.5 z-10 text-slate-400 group-hover:text-blue-500 transition-colors">
                                    <UserIcon className="w-4.5 h-4.5"/>
                                </div>
                                <select 
                                    className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-10 pr-10 py-2.5 min-w-[220px] shadow-sm appearance-none hover:border-slate-300 transition-all cursor-pointer"
                                    value={targetTeacherId}
                                    onChange={(e) => setTargetTeacherId(e.target.value)}
                                >
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none"/>
                            </div>
                        )}

                        {/* Template Selector */}
                        <div className="relative group">
                            <select 
                                className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block px-4 py-2.5 min-w-[180px] shadow-sm appearance-none hover:border-slate-300 transition-all cursor-pointer pr-10"
                                value={selectedTemplateId || ''}
                                onChange={(e) => handleTemplateSwitch(e.target.value)}
                            >
                                {templates.length === 0 && <option value="">No Templates</option>}
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name} {t.isActive ? '(Active)' : ''}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none"/>
                        </div>
                    </div>

                    {selectedTemplateId && canEdit && (
                        isActive ? (
                             <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 shadow-sm animate-in fade-in zoom-in-95">
                                <CheckCircle className="w-3 h-3 mr-1.5"/> Active Schedule
                             </span>
                        ) : (
                            <button onClick={handleSetActive} className="text-xs text-slate-400 hover:text-emerald-600 hover:underline transition-colors">
                                Set as Active
                            </button>
                        )
                    )}
                </div>

                {canEdit && (
                    <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                        <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
                            <button onClick={handleCreateTemplate} className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-blue-600 transition-all hover:shadow-sm" title="New Template"><Plus className="w-5 h-5"/></button>
                            {selectedTemplateId && (
                                <>
                                    <button onClick={handleCloneTemplate} className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-indigo-600 transition-all hover:shadow-sm" title="Clone Template"><Copy className="w-4.5 h-4.5"/></button>
                                    <button onClick={() => handleDeleteTemplate(selectedTemplateId)} className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-red-600 transition-all hover:shadow-sm" title="Delete Template"><Trash2 className="w-4.5 h-4.5"/></button>
                                </>
                            )}
                        </div>
                        <Button onClick={handleSaveCurrent} disabled={!selectedTemplateId || isSaving || !hasUnsavedChanges} className={`rounded-xl px-6 ${hasUnsavedChanges ? 'ring-4 ring-amber-400/20 bg-amber-500 hover:bg-amber-600' : ''}`}>
                            <Save className="w-4 h-4 mr-2"/> {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-auto bg-white relative custom-scrollbar" ref={gridRef}>
                    <div className="absolute top-0 left-0 w-20 bg-white border-r border-slate-100 z-10 h-full min-h-max">
                        <div className="h-14 border-b bg-slate-50/50 sticky top-0 z-20"></div>
                        {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map(hour => (
                            <div key={hour} className="border-b border-slate-50 text-[10px] text-slate-400 font-bold text-right pr-4 relative" style={{ height: `${PIXELS_PER_HOUR}px` }}>
                                <span className="relative top-4">{hour}:00</span>
                            </div>
                        ))}
                    </div>

                    <div className="ml-20 min-w-[900px]">
                        {/* Header Row */}
                        <div className="flex sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
                            {DAYS.map(day => (
                                <div key={day} className="flex-1 min-w-[120px] py-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest border-r border-slate-50 last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid Body */}
                        <div className="flex relative" style={{ height: `${(END_HOUR - START_HOUR + 1) * PIXELS_PER_HOUR}px` }}>
                            <div className="absolute inset-0 z-0 pointer-events-none">
                                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                                    <div key={i} className="border-b border-slate-50 w-full" style={{ height: `${PIXELS_PER_HOUR}px` }}></div>
                                ))}
                            </div>

                            {DAYS.map(day => (
                                <div 
                                    key={day} 
                                    className={`flex-1 min-w-[120px] border-r border-slate-50 last:border-r-0 relative z-0 transition-colors ${canEdit ? 'hover:bg-slate-50/50 cursor-cell' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, day)}
                                    onClick={(e) => {
                                        if (e.target !== e.currentTarget || !canEdit) return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const offsetY = e.clientY - rect.top;
                                        const clickedHour = Math.floor(offsetY / PIXELS_PER_HOUR) + START_HOUR;
                                        addSlot(day, clickedHour);
                                    }}
                                >
                                    {currentSlots.filter(s => s.day === day).map(slot => {
                                        const isOverlap = overlappingSlotIds.has(slot.id);
                                        const isDragged = draggedSlotId === slot.id;
                                        return (
                                            <div
                                                key={slot.id}
                                                draggable={canEdit}
                                                onDragStart={(e) => handleDragStart(e, slot.id)}
                                                onClick={(e) => { e.stopPropagation(); if(canEdit) setEditingSlot(slot); }}
                                                className={`
                                                    absolute left-1.5 right-1.5 rounded-xl p-3 text-xs shadow-md border-2
                                                    flex flex-col justify-center overflow-hidden transition-all
                                                    ${canEdit ? 'cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-lg hover:z-20' : ''}
                                                    ${isDragged ? 'opacity-40 scale-95 grayscale' : ''}
                                                    ${isOverlap ? 'border-red-500 ring-4 ring-red-500/20 z-30' : 'border-white/50'}
                                                `}
                                                style={getSlotStyle(slot)}
                                            >
                                                <div className="font-black text-slate-900 truncate leading-none mb-1 flex items-center justify-between">
                                                    <span className="truncate">{slot.subject}</span>
                                                    {isOverlap && <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 ml-1"/>}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-700/70 truncate">{slot.class}</div>
                                                <div className="text-[9px] font-mono font-bold text-slate-800/40 mt-1.5 bg-black/5 w-fit px-1.5 py-0.5 rounded uppercase">{slot.startTime} - {slot.endTime}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Slot Modal */}
            {editingSlot && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm shadow-2xl overflow-hidden border-0">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 uppercase tracking-tight"><Clock className="w-5 h-5 text-blue-600"/> Modify Slot</h3>
                            <button onClick={() => setEditingSlot(null)} className="hover:bg-slate-200 p-2 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject Title</label>
                                <input className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all" value={editingSlot.subject} onChange={e => setEditingSlot({...editingSlot, subject: e.target.value})} autoFocus />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Class</label>
                                <input className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all" value={editingSlot.class} onChange={e => setEditingSlot({...editingSlot, class: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Starts At</label>
                                    <input type="time" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 focus:ring-0 outline-none" value={editingSlot.startTime} onChange={e => setEditingSlot({...editingSlot, startTime: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ends At</label>
                                    <input type="time" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 focus:ring-0 outline-none" value={editingSlot.endTime} onChange={e => setEditingSlot({...editingSlot, endTime: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Label</label>
                                <div className="flex gap-2.5 flex-wrap">
                                    {COLORS.map(c => (
                                        <button key={c} onClick={() => setEditingSlot({...editingSlot, color: c})} className={`w-9 h-9 rounded-xl border-4 transition-all shadow-sm ${editingSlot.color === c ? 'border-white ring-4 ring-blue-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t bg-slate-50 flex justify-between gap-3">
                            <Button variant="danger" size="sm" onClick={deleteSlot} className="rounded-xl px-4 flex-1"><Trash2 className="w-4 h-4 mr-2"/> Remove</Button>
                            <Button onClick={saveSlotChanges} className="rounded-xl px-4 flex-1 shadow-lg shadow-blue-200"><CheckCircle className="w-4 h-4 mr-2"/> Update Slot</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default TimetableManager;
