import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, School as SchoolIcon, Loader2, DatabaseZap } from 'lucide-react';
import { dskpFetcher } from '../../lib/dskp/data-fetcher'; // Import from new lib
import { DSKPDataTable } from './DSKPDataTable';
import { DSKPStandard } from '../../lib/dskp/parser';
import { useTranslation } from 'react-i18next';

interface DSKPMasterAccordionProps {
    isAdmin?: boolean;
    onDeleteStandard?: (id: string) => void;
}

export const DSKPMasterAccordion = ({ isAdmin, onDeleteStandard }: DSKPMasterAccordionProps) => {
    const { t } = useTranslation();
    // Level 1: Types
    const [types, setTypes] = useState<string[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [expandedType, setExpandedType] = useState<string | null>(null);

    // Level 2: Years
    const [yearsCache, setYearsCache] = useState<Record<string, string[]>>({});
    const [loadingYears, setLoadingYears] = useState<string | null>(null);
    const [expandedYear, setExpandedYear] = useState<string | null>(null);

    // Level 3: Subjects
    const [subjectsCache, setSubjectsCache] = useState<Record<string, any[]>>({});
    const [loadingSubjects, setLoadingSubjects] = useState<string | null>(null);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

    // Level 4: Standards
    const [standardsCache, setStandardsCache] = useState<Record<string, DSKPStandard[]>>({});
    const [loadingStandards, setLoadingStandards] = useState<string | null>(null);

    // Fetch Types on Mount
    useEffect(() => {
        const loadTypes = async () => {
            setLoadingTypes(true);
            const res = await dskpFetcher.getSchoolTypes();
            if (res.success && res.data) {
                const sorted = res.data.sort((a: string, b: string) => {
                    if (a === 'SK') return -1;
                    if (b === 'SK') return 1;
                    return a.localeCompare(b);
                });
                setTypes(sorted);
            }
            setLoadingTypes(false);
        };
        loadTypes();
    }, []);

    // Handlers
    const toggleType = async (type: string) => {
        if (expandedType === type) {
            setExpandedType(null);
            return;
        }
        setExpandedType(type);
        setExpandedYear(null);
        setExpandedSubject(null);

        if (!yearsCache[type]) {
            setLoadingYears(type);
            const res = await dskpFetcher.getYears(type);
            if (res.success && res.data) {
                setYearsCache(prev => ({ ...prev, [type]: res.data }));
            }
            setLoadingYears(null);
        }
    };

    const toggleYear = async (year: string) => {
        if (!expandedType) return;
        if (expandedYear === year) {
            setExpandedYear(null);
            return;
        }
        setExpandedYear(year);
        setExpandedSubject(null);
        const key = `${expandedType}_${year}`;

        if (!subjectsCache[key]) {
            setLoadingSubjects(key);
            const res = await dskpFetcher.getSubjects(expandedType, year);
            if (res.success && res.data) {
                const sorted = res.data.sort((a: any, b: any) => a.title.localeCompare(b.title));
                setSubjectsCache(prev => ({ ...prev, [key]: sorted }));
            }
            setLoadingSubjects(null);
        }
    };

    const toggleSubject = async (subjectTitle: string) => {
        if (!expandedType || !expandedYear) return;
        if (expandedSubject === subjectTitle) {
            setExpandedSubject(null);
            return;
        }
        setExpandedSubject(subjectTitle);
        const key = `${expandedType}_${expandedYear}_${subjectTitle}`;

        if (!standardsCache[key]) {
            setLoadingStandards(key);
            const res = await dskpFetcher.getStandards(expandedType, expandedYear, subjectTitle);
            if (res.success && res.data) {
                setStandardsCache(prev => ({ ...prev, [key]: res.data }));
            }
            setLoadingStandards(null);
        }
    };

    // Render
    if (loadingTypes) return <div className="p-12 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />{t('loadingRegistry')}</div>;

    if (!loadingTypes && types.length === 0) {
        return (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50">
                <DatabaseZap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-400">{t('registryEmpty')}</h3>
                <p className="text-xs text-slate-400 mb-4">{t('syncDataToBuildThe')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {types.map(type => (
                <div key={type} className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm transition-all">
                    {/* LEVEL 1: TYPE */}
                    <div
                        onClick={() => toggleType(type)}
                        className={`p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${expandedType === type ? 'bg-slate-50' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${expandedType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                <SchoolIcon className="w-5 h-5" />
                            </div>
                            <span className="font-black text-slate-700 text-lg tracking-tight">{type}</span>
                        </div>
                        {expandedType === type ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-300" />}
                    </div>

                    {/* LEVEL 2: YEARS */}
                    {expandedType === type && (
                        <div className="bg-slate-50/50 border-t border-slate-100 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            {loadingYears === type && <div className="text-xs text-center text-slate-400 p-2">{t('loadingYears')}</div>}

                            {yearsCache[type]?.map(year => (
                                <div key={year} className="border border-slate-100 rounded-2xl bg-white overflow-hidden">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); toggleYear(year); }}
                                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${expandedYear === year ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${expandedYear === year ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                            <span className="font-bold text-slate-700 text-sm">{year}</span>
                                        </div>
                                        {expandedYear === year ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                                    </div>

                                    {/* LEVEL 3: SUBJECTS */}
                                    {expandedYear === year && (
                                        <div className="bg-slate-50 p-3 space-y-2 border-t border-slate-100 animate-in slide-in-from-top-1">
                                            {loadingSubjects === `${type}_${year}` && <div className="text-[10px] text-center text-slate-400">{t('loadingSubjects')}</div>}

                                            {subjectsCache[`${type}_${year}`]?.map(sub => (
                                                <div key={sub.id} className="border border-slate-100 rounded-xl bg-white overflow-hidden">
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); toggleSubject(sub.title); }}
                                                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${expandedSubject === sub.title ? 'bg-indigo-50/30' : ''}`}
                                                    >
                                                        <span className="font-bold text-slate-600 text-xs ml-2">{sub.title}</span>
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{sub.count || '?'} {t('sk')}</span>
                                                    </div>

                                                    {/* LEVEL 4: DATA TABLE */}
                                                    {expandedSubject === sub.title && (
                                                        <div className="bg-white border-t border-slate-100 p-4 animate-in fade-in">
                                                            {loadingStandards === `${type}_${year}_${sub.title}` ? (
                                                                <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-500" /></div>
                                                            ) : (
                                                                <DSKPDataTable
                                                                    data={standardsCache[`${type}_${year}_${sub.title}`] || []}
                                                                    isEditable={isAdmin}
                                                                    onDelete={onDeleteStandard}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
