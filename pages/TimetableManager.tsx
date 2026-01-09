
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/Button';
import { TimetableConfig } from '../types';
import { firebaseService } from '../services/firebaseService';
import { Save, Calendar as CalendarIcon, Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import TimetableGrid from '../src/components/timetable/TimetableGrid';
import AddSlotModal from '../src/components/timetable/AddSlotModal';

const TimetableManager = () => {
    const { t } = useLanguage();
    const { currentUser } = useGlobal();

    // State
    const [config, setConfig] = useState<TimetableConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<any | null>(null); // Slot being edited or null for new

    // Initial Fetch
    useEffect(() => {
        if (!currentUser) return;
        const loadTimetable = async () => {
            setIsLoading(true);
            const data = await firebaseService.getTimetable(currentUser.id);
            if (data) {
                setConfig(data);
            } else {
                // Initialize default empty config
                setConfig({
                    id: 'default',
                    label: 'Default Timetable',
                    slots: []
                });
            }
            setIsLoading(false);
        };
        loadTimetable();
    }, [currentUser]);

    // Handlers
    const handleSaveConfig = async () => {
        if (!currentUser || !config) return;
        setIsSaving(true);
        const res = await firebaseService.saveTimetableConfig(currentUser.id, config);
        if (res.success) {
            // maybe show toast
            alert("Timetable saved successfully!");
        } else {
            alert("Failed to save: " + res.message);
        }
        setIsSaving(false);
    };

    const handleSlotSave = (slotData: any) => {
        if (!config) return;

        let newSlots = [...config.slots];

        if (editingSlot) {
            // Update existing
            // Since we don't have unique IDs on slots in the Config type explicitly often, 
            // but we might want one for editing. 
            // For now, let's assume we replace based on index or reference if possible, 
            // but since we are passing objects around, we might need a better way.
            // Let's rely on filter/map. 
            // Better: Assign a temp ID if missing or use index.
            // Actually, let's just replace the object reference if we can find it, 
            // OR simpler: Remove the old one and add the new one (edit).
            // But wait, `editingSlot` is the OLD object.

            // Remove old slot by reference
            const idx = newSlots.indexOf(editingSlot);
            if (idx !== -1) {
                newSlots[idx] = slotData;
            }
        } else {
            // Add new
            newSlots.push(slotData);
        }

        setConfig({ ...config, slots: newSlots });
        setIsModalOpen(false);
        setEditingSlot(null);
    };

    const handleSlotDelete = (slotData: any) => {
        if (!config) return;
        if (!confirm("Are you sure you want to remove this slot?")) return;
        const newSlots = config.slots.filter(s => s !== slotData); // Identity check might fail if strictness, but usually ok from state
        // To be safe, let's filter by properties if needed, but identity usually works since it comes from state
        setConfig({ ...config, slots: newSlots });
        setIsModalOpen(false);
        setEditingSlot(null);
    };

    const openAddModal = (day: number, hour: number) => {
        setEditingSlot(null); // New mode
        // Pre-fill
        setEditingSlot({ // actually this sets the "initial data" for the modal, but logic above uses it as 'existing' flag
            // Wait, confusion. 
            // Let's use a separate state `initialModalData` vs `isEditing`.
            // Simplified: passing `null` to modal means "Add", passing object means "Edit". 
            // But we want to prefill Add with day/hour.
            // So we need: `modalMode` ('add'|'edit') and `modalData`.
        });
        // Let's fix the modal logic below.
    };

    // Refined Modal Logic
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [modalPreFill, setModalPreFill] = useState<any>(null);

    const onAddSlotClick = (day: number, hour: number) => {
        setModalMode('add');
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
        setModalPreFill({ day, startTime, endTime });
        setIsModalOpen(true);
    };

    const onEditSlotClick = (slot: any) => {
        setModalMode('edit');
        setModalPreFill(slot); // This is the reference to the existing slot
        setIsModalOpen(true);
    };

    const handleModalSaveWrapper = (formData: any) => {
        if (!config) return;
        let newSlots = [...config.slots];

        if (modalMode === 'edit') {
            // Find index of the specific object we started editing
            // Note: `modalPreFill` holds the reference to the original slot object from state
            const index = newSlots.indexOf(modalPreFill);
            if (index !== -1) {
                newSlots[index] = formData;
            }
        } else {
            newSlots.push(formData);
        }
        setConfig({ ...config, slots: newSlots });
        setIsModalOpen(false);
    };

    const handleModalDeleteWrapper = (slotToRemove: any) => {
        if (!config) return;
        if (!confirm("Remove this slot?")) return;
        // `slotToRemove` is likely just `formData` from modal, which is a copy.
        // We need the original reference `modalPreFill` if in edit mode.
        if (modalMode === 'edit') {
            const newSlots = config.slots.filter(s => s !== modalPreFill);
            setConfig({ ...config, slots: newSlots });
        }
        setIsModalOpen(false);
    };


    if (!currentUser) return null;
    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 overflow-hidden bg-slate-50">
            {/* Toolbar */}
            <div className="bg-white border-b px-8 py-5 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Timetable Setup</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Manage your weekly routine</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={() => onAddSlotClick(1, 8)} variant="secondary" className="hidden md:flex">
                        <Plus className="w-4 h-4 mr-2" /> Add Slot
                    </Button>
                    <Button onClick={handleSaveConfig} disabled={isSaving} className="rounded-xl px-6 shadow-lg shadow-blue-200">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden p-6">
                {config && (
                    <TimetableGrid
                        config={config}
                        onEditSlot={onEditSlotClick}
                        onAddSlot={onAddSlotClick}
                    />
                )}
                {!config && !isLoading && (
                    <div className="m-auto text-center p-10">
                        <p className="text-slate-400 font-bold">No timetable configuration found.</p>
                        <Button onClick={() => setConfig({ id: 'default', label: 'My Timetable', slots: [] })} className="mt-4">
                            Create Timetable
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AddSlotModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                slot={modalPreFill}
                onSave={handleModalSaveWrapper}
                onDelete={modalMode === 'edit' ? handleModalDeleteWrapper : undefined}
            />
        </div>
    );
};

export default TimetableManager;
