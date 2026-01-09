import React, { useMemo } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
// import { TimetableSlot } from '../../types'; // Legacy Type
// Need to map Legacy Type to New Config Type or update SlotCard to use new type.
// The user prompt asks to use "getTimetable" service which returns TimetableConfig.
// TimetableConfig.slots has { day, period, subjectId, classId, startTime, endTime }
// Current UI uses TimetableSlot which has { id, day, startTime, endTime, subject, class, ... }
// I will adapt SlotCard to accept the new structure but for visuals we might need props.

interface SlotProps {
    slot: {
        id?: string;
        day: number;
        subjectId: string;
        classId: string;
        startTime: string;
        endTime: string;
        color?: string;
    };
    onClick: () => void;
    isOverlap?: boolean;
    style?: React.CSSProperties;
}

const SlotCard: React.FC<SlotProps> = ({ slot, onClick, isOverlap, style }) => {
    return (
        <div
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`
                absolute left-1.5 right-1.5 rounded-xl p-3 text-xs shadow-md border-2
                flex flex-col justify-center overflow-hidden transition-all cursor-pointer
                hover:scale-[1.02] hover:shadow-lg hover:z-20 border-white/50
                ${isOverlap ? 'border-red-500 ring-4 ring-red-500/20 z-30' : ''}
            `}
            style={{
                ...style,
                backgroundColor: slot.color || '#e2e8f0'
            }}
        >
            <div className="font-black text-slate-900 truncate leading-none mb-1 flex items-center justify-between">
                <span className="truncate">{slot.subjectId}</span>
                {isOverlap && <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 ml-1" />}
            </div>
            <div className="text-[10px] font-bold text-slate-700/70 truncate">{slot.classId}</div>
            <div className="text-[9px] font-mono font-bold text-slate-800/40 mt-1.5 bg-black/5 w-fit px-1.5 py-0.5 rounded uppercase">
                {slot.startTime} - {slot.endTime}
            </div>
        </div>
    );
};

export default SlotCard;
