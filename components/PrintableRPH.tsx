
import React from 'react';
import { LessonPlan, Language } from '../types';
import { translations } from '../utils/translations';
import { getRPHLanguage } from '../utils/constants';
import { useTranslation } from 'react-i18next';

const PrintableRPH = ({ plan, schoolName, weekNumber }: { plan: LessonPlan, schoolName: string, weekNumber: number }) => {
    const { t } = useTranslation();
    const rphLang = getRPHLanguage(plan.subject);
    const tr = (key: string) => translations[rphLang]?.[key] || translations[Language.EN][key] || key;
    const dateObj = new Date(plan.date);
    const dayName = dateObj.toLocaleDateString(rphLang === Language.MS ? 'ms-MY' : 'en-GB', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const renderList = (items?: string[], type: 'decimal' | 'disc' = 'disc') => (!items || items.length === 0) ? '-' : <ul className={`list-${type} list-inside m-0 p-0`}>{items.map((item, i) => <li key={i} className="mb-1 leading-snug">{item}</li>)}</ul>;

    return (
        <div className="bg-white text-black font-sans text-sm leading-tight border-2 border-black w-full max-w-[210mm] mx-auto print-border shadow-lg print:shadow-none">
            {/* Header */}
            <div className="flex border-b border-black">
                <div className="w-24 border-r border-black flex items-center justify-center p-2">
                    <div className="w-14 h-14 border border-black flex items-center justify-center text-[8px] text-center font-bold">{t('logo')}</div>
                </div>
                <div className="flex-1 text-center p-2 bg-purple-100 print:bg-purple-100 border-r border-black flex flex-col justify-center">
                    <h1 className="text-xl font-bold uppercase">{schoolName}</h1>
                    {/* <div className="text-xs font-bold mt-1">PROGRAM TS25</div> */}
                </div>
                <div className="w-48 text-xs flex flex-col">
                    <div className="bg-blue-200 border-b border-black p-1 text-center font-bold print:bg-blue-200">{t('nilaiPendidikanSivik')}</div>
                    <div className="p-2 text-center flex-1 flex flex-col justify-center">
                        <div>{plan.civicValues || 'Kasih Sayang'}</div>
                    </div>
                </div>
            </div>

            {/* Teacher Info Row */}
            <div className="flex border-b border-black">
                <div className="w-32 bg-blue-200 p-2 font-bold border-r border-black flex flex-col justify-center text-center text-xs print:bg-blue-200">
                    {tr('teacher')}<br/><span className="uppercase text-[10px]">{t('namaGuru')}</span>
                </div>
                <div className="flex-1 p-2 uppercase font-bold bg-white flex items-center text-sm">
                    {plan.teacherName}
                </div>
                <div className="w-20 bg-blue-200 p-2 font-bold border-l border-r border-black flex flex-col justify-center text-center text-xs print:bg-blue-200">
                    {tr('week')}<br/><span className="text-[10px]">{t('minggu')}</span>
                </div>
                <div className="w-20 flex items-center justify-center font-bold text-xl bg-yellow-50 print:bg-yellow-50">
                    {weekNumber || '1'}
                </div>
            </div>

            {/* Date & Day Row */}
            <div className="flex border-b border-black h-12 text-center">
                <div className="flex-1 border-r border-black flex flex-col">
                    <div className="bg-blue-200 font-bold p-1 border-b border-black print:bg-blue-200 text-[10px]">{tr('date')} {t('tarikh')}</div>
                    <div className="flex-1 flex items-center justify-center font-bold bg-yellow-50 print:bg-yellow-50">{formattedDate}</div>
                </div>
                <div className="flex-1 border-r border-black flex flex-col">
                    <div className="bg-blue-200 font-bold p-1 border-b border-black print:bg-blue-200 text-[10px]">{t('hari')}</div>
                    <div className="flex-1 flex items-center justify-center font-bold uppercase bg-yellow-50 print:bg-yellow-50">{dayName}</div>
                </div>
                <div className="flex-[2] flex items-center justify-center bg-blue-200 font-bold text-slate-800 uppercase border-r border-black print:bg-blue-200 text-xs px-2">
                    {t('disahkanOlehHantarErph')}</div>
            </div>

            {/* Title Bar */}
            <div className="bg-blue-300 border-b border-black p-1.5 text-center font-bold text-sm print:bg-blue-300 uppercase border-t border-black">
                {t('rancanganPengajaranHarianTs25Cup')}</div>

            {/* Subject/Class Info */}
            <div className="flex border-b border-black min-h-[40px] text-xs">
                <div className="flex-1 flex flex-col">
                     <div className="bg-blue-200 border-b border-black text-center font-bold p-1">{t('time')}</div>
                     <div className="flex-1 flex items-center justify-center font-bold p-1 border-r border-black">{plan.time}</div>
                </div>
                <div className="flex-1 flex flex-col">
                     <div className="bg-blue-200 border-b border-black text-center font-bold p-1">{t('class')}</div>
                     <div className="flex-1 flex items-center justify-center font-bold p-1 border-r border-black">{plan.className || plan.grade}</div>
                </div>
                <div className="flex-[2] flex flex-col">
                     <div className="bg-blue-200 border-b border-black text-center font-bold p-1">{t('subject_1')}</div>
                     <div className="flex-1 flex items-center justify-center font-bold p-1 uppercase">{plan.subject}</div>
                </div>
            </div>

            {/* Main Content Rows */}
            <div className="flex border-b border-black">
                <div className="w-48 bg-blue-200 p-2 font-bold border-r border-black text-xs shrink-0 print:bg-blue-200">{t('themeTopic')}</div>
                <div className="flex-1 p-2 font-semibold">{plan.topic}</div>
            </div>
            
            <div className="flex border-b border-black">
                <div className="w-48 bg-blue-200 p-2 font-bold border-r border-black text-xs shrink-0 print:bg-blue-200">{t('standard')}</div>
                <div className="flex-1 p-2">
                    <div className="mb-2"><span className="font-bold text-xs block text-slate-500">{t('contentStandard_1')}</span> {plan.contentStandard}</div>
                    <div><span className="font-bold text-xs block text-slate-500">{t('learningStandard')}</span> {plan.learningStandard}</div>
                </div>
            </div>

            <div className="flex border-b border-black">
                <div className="w-48 bg-blue-200 p-2 font-bold border-r border-black text-xs shrink-0 print:bg-blue-200">{t('objectives')}</div>
                <div className="flex-1 p-2">{renderList(plan.objectives, 'decimal')}</div>
            </div>

            <div className="flex border-b border-black">
                <div className="w-48 bg-blue-200 p-2 font-bold border-r border-black text-xs shrink-0 print:bg-blue-200">{t('successCriteria')}</div>
                <div className="flex-1 p-2">{renderList(plan.successCriteria, 'disc')}</div>
            </div>

            <div className="flex border-b border-black">
                <div className="w-48 bg-blue-200 p-2 font-bold border-r border-black text-xs shrink-0 print:bg-blue-200">{t('activities')}</div>
                <div className="flex-1 p-2">
                    {renderList(plan.activities)}
                    <div className="mt-4 pt-2 border-t border-dashed border-slate-400 grid grid-cols-2 gap-2 text-xs">
                        <div><strong className="block text-slate-500 mb-1">{t('bbmTeachingAids')}</strong> {plan.teachingAids?.length ? plan.teachingAids.join(', ') : '-'}</div>
                        <div><strong className="block text-slate-500 mb-1">{t('pak21')}</strong> {plan.pak21?.length ? plan.pak21.join(', ') : '-'}</div>
                        <div><strong className="block text-slate-500 mb-1">{t('kbatHots')}</strong> {plan.hots?.length ? plan.hots.join(', ') : '-'}</div>
                        <div><strong className="block text-slate-500 mb-1">{t('assessment')}</strong> {plan.assessment?.length ? plan.assessment.join(', ') : '-'}</div>
                    </div>
                </div>
            </div>

            <div className="flex min-h-[80px]">
                <div className="w-48 bg-blue-200 p-2 font-bold border-r border-black text-xs shrink-0 print:bg-blue-200">{t('reflection')}</div>
                <div className="flex-1 p-2 italic">{plan.reflection || <span className="text-slate-300">{t('noReflectionRecorded')}</span>}</div>
            </div>
        </div>
    );
};

export default PrintableRPH;
