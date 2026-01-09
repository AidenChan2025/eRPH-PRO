import React, { useState, useEffect } from 'react';
import { firebaseService } from '../../../services/firebaseService';
import { TimetableConfig } from '../../../types';
import SlotCard from './SlotCard';
import { Plus } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_HOUR = 7;
const END_HOUR = 19;
const PIXELS_PER_HOUR = 80;

interface TimetableGridProps {
    config: TimetableConfig;
    onEditSlot: (slot: any) => void;
    onAddSlot: (day: number, hour: number) => void;
}

const timeToMinutes = (time: string) => {
    const [h, m] = (time || '00:00').split(':').map(Number);
    return h * 60 + m;
};

const TimetableGrid: React.FC<TimetableGridProps> = ({ config, onEditSlot, onAddSlot }) => {

    const getSlotStyle = (slot: any) => {
        const startMins = timeToMinutes(slot.startTime);
        const endMins = timeToMinutes(slot.endTime);
        const durationMins = endMins - startMins;
        const topOffsetMins = startMins - (START_HOUR * 60);
        const topPixels = (topOffsetMins / 60) * PIXELS_PER_HOUR;
        const heightPixels = (durationMins / 60) * PIXELS_PER_HOUR;
        return { top: `${topPixels}px`, height: `${heightPixels}px` };
    };

    // Simple overlap detection for this grid
    const getOverlaps = (slots: any[]) => {
        const overlaps = new Set();
        slots.forEach((s1, i) => {
            slots.forEach((s2, j) => {
                if (i >= j) return;
                if (s1.day !== s2.day) return;
                const start1 = timeToMinutes(s1.startTime);
                const end1 = timeToMinutes(s1.endTime);
                const start2 = timeToMinutes(s2.startTime);
                const end2 = timeToMinutes(s2.endTime);
                if (start1 < end2 && start2 < end1) {
                    overlaps.add(s1);
                    overlaps.add(s2);
                }
            });
        });
        return overlaps;
    };

    const overlaps = getOverlaps(config.slots || []);

    return (
        <div className="flex-1 overflow-auto bg-white relative custom-scrollbar shadow-inner rounded-xl border border-slate-200">
            <div className="absolute top-0 left-0 w-16 bg-white border-r border-slate-100 z-10 h-full min-h-max">
                <div className="h-10 border-b bg-slate-50 sticky top-0 z-20"></div>
                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map(hour => (
                    <div key={hour} className="border-b border-slate-50 text-[10px] text-slate-400 font-bold text-right pr-2 relative" style={{ height: `${PIXELS_PER_HOUR}px` }}>
                        <span className="relative top-4">{hour}:00</span>
                    </div>
                ))}
            </div>

            <div className="ml-16 min-w-[800px]">
                {/* Header */}
                <div className="flex sticky top-0 z-10 bg-white border-b border-slate-100">
                    {DAYS.map((day, index) => (
                        <div key={day} className="flex-1 min-w-[100px] py-3 text-center text-xs font-black text-slate-500 uppercase tracking-widest border-r border-slate-50 last:border-r-0 bg-slate-50/50">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="flex relative" style={{ height: `${(END_HOUR - START_HOUR + 1) * PIXELS_PER_HOUR}px` }}>
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                            <div key={i} className="border-b border-slate-50 w-full" style={{ height: `${PIXELS_PER_HOUR}px` }}></div>
                        ))}
                    </div>

                    {DAYS.map((dayName, dayIndex) => (
                        <div
                            key={dayName}
                            className="flex-1 min-w-[100px] border-r border-slate-50 last:border-r-0 relative group hover:bg-slate-50/30 transition-colors"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const offsetY = e.clientY - rect.top;
                                const clickedHour = Math.floor(offsetY / PIXELS_PER_HOUR) + START_HOUR;
                                onAddSlot(dayIndex, clickedHour);
                            }}
                        >
                            {/* Hover Add Icon */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none">
                                <Plus className="w-8 h-8 text-slate-400" />
                            </div>

                            {config.slots.filter(s => s.day === dayIndex).map((slot, idx) => (
                                <SlotCard
                                    key={idx}
                                    slot={slot}
                                    onClick={() => onEditSlot(slot)}
                                    isOverlap={overlaps.has(slot)}
                                    style={getSlotStyle(slot)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TimetableGrid;
