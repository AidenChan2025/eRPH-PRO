import React, { useState, useEffect } from 'react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import { X, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { firebaseService } from '../../../services/firebaseService';

const COLORS = [
    '#bfdbfe', '#bbf7d0', '#fef08a', '#fed7aa', '#fbcfe8', '#ddd6fe', '#e2e8f0', '#fecaca'
];

interface AddSlotModalProps {
    slot: any | null; // Using any for flexibility during transition
    isOpen: boolean;
    onClose: () => void;
    onSave: (slot: any) => void;
    onDelete?: (slot: any) => void;
}

const AddSlotModal: React.FC<AddSlotModalProps> = ({ slot, isOpen, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState({
        subjectId: '',
        classId: '',
        day: 0,
        startTime: '08:00',
        endTime: '09:00',
        color: COLORS[0]
    });

    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    useEffect(() => {
        if (slot) {
            setFormData({
                subjectId: slot.subjectId || '',
                classId: slot.classId || '',
                day: slot.day || 0,
                startTime: slot.startTime || '08:00',
                endTime: slot.endTime || '09:00',
                color: slot.color || COLORS[0]
            });
        }
    }, [slot]);

    useEffect(() => {
        const fetchSubjects = async () => {
            setLoadingSubjects(true);
            const subjects = await firebaseService.getAvailableSubjects();
            setAvailableSubjects(subjects);
            setLoadingSubjects(false);
        };
        if (isOpen) fetchSubjects();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-sm shadow-2xl overflow-hidden border-0">
                <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <Clock className="w-5 h-5 text-blue-600" /> {slot ? 'Edit Slot' : 'Add Slot'}
                    </h3>
                    <button onClick={onClose} className="hover:bg-slate-200 p-2 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Day Selector */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Day</label>
                        <select
                            className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                            value={formData.day}
                            onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                        >
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                                <option key={i} value={i}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Selector (DSKP) */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject (Curriculum)</label>
                        {loadingSubjects ? (
                            <div className="animate-pulse h-10 bg-slate-100 rounded-xl"></div>
                        ) : (
                            <div className="relative">
                                <input
                                    list="subjects-list"
                                    className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                                    placeholder="Select or type subject..."
                                    value={formData.subjectId}
                                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                />
                                <datalist id="subjects-list">
                                    {availableSubjects.map(sub => <option key={sub} value={sub} />)}
                                </datalist>
                            </div>
                        )}
                    </div>

                    {/* Class Name */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Class Name</label>
                        <input
                            className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none"
                            placeholder="e.g. 1 Cemerlang"
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        />
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Starts At</label>
                            <input type="time" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold/ outline-none"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ends At</label>
                            <input type="time" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold outline-none"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Label</label>
                        <div className="flex gap-2.5 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setFormData({ ...formData, color: c })}
                                    className={`w-9 h-9 rounded-xl border-4 transition-all shadow-sm ${formData.color === c ? 'border-white ring-4 ring-blue-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t bg-slate-50 flex justify-between gap-3">
                    {slot && onDelete && (
                        <Button variant="danger" size="sm" onClick={() => onDelete(slot)} className="rounded-xl px-4 flex-1">
                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                        </Button>
                    )}
                    <Button onClick={() => onSave(formData)} className="rounded-xl px-4 flex-1 shadow-lg shadow-blue-200">
                        <CheckCircle className="w-4 h-4 mr-2" /> {slot ? 'Update Slot' : 'Add Slot'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default AddSlotModal;
