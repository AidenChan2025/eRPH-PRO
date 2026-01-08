import React, { useState, useMemo } from 'react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import {
    DatabaseZap, X, AlertCircle, Link as LinkIcon, ChevronRight,
    TableProperties
} from 'lucide-react';
import { dskpService } from '../../lib/dskp';
import { useTranslation } from 'react-i18next';

export const SyncModal = ({ isOpen, onClose, onSynced }: { isOpen: boolean; onClose: () => void; onSynced: () => void }) => {
    const { t } = useTranslation();
    // Default URL provided by user
    const REQUESTED_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1mW401zSgjPLjtahPCaeiLFpv3Zpk3AL-2Dgc6s5sDAA/edit?usp=sharing';

    const [sheetUrl, setSheetUrl] = useState(REQUESTED_SHEET_URL);
    const [step, setStep] = useState<1 | 2>(1); // Simplified steps for 2-stage process
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [rawRows, setRawRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, number>>({
        schoolType: 0,
        subject: 1,
        grade: 2, // TAHUN (Index 2)
        contentStandard: 3, // SK (Col D - Index 3)
        learningStandard: 4, // SP (Col E - Index 4)
        temaBidang: 6, // TEMA / BIDANG (Col G - Index 6)
        tema: 6,
        tajukKemahiran: 8, // TAJUK (Col I - Index 8)
        tajuk: 8
    });

    // 2-Stage States
    const [isStage1Complete, setIsStage1Complete] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [error, setError] = useState('');

    const parseCsv = (csvText: string) => {
        const lines = csvText.split(/\r?\n/);
        const results: string[][] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            results.push(cols);
        }
        return results;
    };

    const handleFetch = async () => {
        setError('');
        setIsFetching(true);
        try {
            const match = sheetUrl.match(/\/d\/(.*?)(\/|$)/);
            if (!match) throw new Error("Invalid Google Sheet URL format.");
            const sheetId = match[1];
            const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            const response = await fetch(exportUrl);
            if (!response.ok) throw new Error("Could not fetch sheet. Ensure 'Anyone with link can view' is enabled.");
            const text = await response.text();
            const data = parseCsv(text);
            if (data.length < 2) throw new Error("Sheet is empty or has no data rows.");

            setHeaders(data[0]);
            setRawRows(data.slice(1));
            setStep(2); // Move to Mapping/Sync View
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsFetching(false);
        }
    };

    // Helper for delay
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // STAGE 1: SYNC RAW
    const handleSyncRaw = async () => {
        setIsSaving(true);
        setSyncStatus('Stage 1: Uploading Raw Data to Staging...');
        setError('');

        try {
            const res = await dskpService.syncRawToStaging(rawRows);
            if (res.success) {
                setSyncStatus(`✅ Stage 1 Complete! Uploaded ${res.count} rows.`);
                setIsStage1Complete(true);
            } else {
                throw new Error(res.message);
            }
        } catch (e: any) {
            console.error(e);
            setError(`Stage 1 Failed: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // STAGE 2: PROCESS & MAP
    const handleProcessRegistry = async () => {
        setIsSaving(true);
        setSyncStatus('Stage 2: Processing & Mapping Registry (This may take a while)...');
        setError('');

        try {
            const res = await dskpService.processStagingToRegistry(mapping);
            if (res.success) {
                setSyncStatus(`✅ Stage 2 Complete! Processed ${res.count} standards.`);
                await sleep(1500);
                onSynced();
                onClose();
                alert(`Sync Complete!\n\n${res.count} standards have been processed and mapped to the registry.`);
            } else {
                throw new Error(res.message);
            }
        } catch (e: any) {
            console.error(e);
            setError(`Stage 2 Failed: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
            <Card className="w-full max-w-5xl shadow-2xl overflow-hidden border-0 rounded-[2.5rem] max-h-[90vh] flex flex-col bg-white">
                {/* Header */}
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200">
                            <DatabaseZap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-slate-800 tracking-tight">{t('dskpMasterSync')}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('2stageSyncProcess')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    {/* Error Banner */}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: URL Input */}
                    {step === 1 && (
                        <div className="max-w-2xl mx-auto py-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2">
                                <h4 className="text-lg font-black text-slate-800">{t('1ConnectDataSource')}</h4>
                                <p className="text-sm text-slate-500 font-medium">{t('linkTheOfficialCurriculumGoogle')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                                    <input
                                        className="w-full border-2 border-slate-100 rounded-[1.5rem] p-4 pl-12 text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-inner bg-slate-50/50"
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        value={sheetUrl}
                                        onChange={e => setSheetUrl(e.target.value)}
                                    />
                                </div>
                                <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-200" onClick={handleFetch} isLoading={isFetching} disabled={!sheetUrl}>
                                    {t('fetchData')}<ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: 2-Stage Execution */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('rowsFound')}</div>
                                    <div className="text-2xl font-black text-slate-800">{rawRows.length}</div>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('columnsDetected')}</div>
                                    <div className="text-2xl font-black text-slate-800">{headers.length}</div>
                                </div>
                            </div>

                            {/* Column Mapping Configuration */}
                            <Card className="p-8 rounded-[2rem] border-slate-100 shadow-sm bg-slate-50/30 space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <TableProperties className="w-5 h-5 text-blue-600" />
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('columnMapping')}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(mapping).map(([key, colIndex]) => (
                                        <div key={key} className="space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{key}</label>
                                            <select
                                                className="w-full border-2 border-slate-100 p-2 rounded-xl text-xs font-bold bg-white outline-none focus:border-blue-500"
                                                value={colIndex}
                                                onChange={e => setMapping({ ...mapping, [key]: parseInt(e.target.value) })}
                                            >
                                                {headers.map((h, i) => <option key={i} value={i}>{i}: {h.substring(0, 30)}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Status Display */}
                            <div className={`p-6 rounded-3xl border-2 transition-all text-center
                                ${isStage1Complete ? (syncStatus.includes('Stage 2 Complete') ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100') : 'bg-slate-50 border-slate-100'}`}>
                                <h4 className="font-black text-lg text-slate-800 mb-1">
                                    {isSaving ? 'Processing...' : (isStage1Complete ? 'Ready for Stage 2' : 'Ready for Stage 1')}
                                </h4>
                                <p className="text-sm font-medium text-slate-500 animate-pulse">
                                    {syncStatus || 'Waiting to start...'}
                                </p>
                            </div>

                            {/* 2-Stage Buttons */}
                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <Button
                                    variant="secondary"
                                    onClick={handleSyncRaw}
                                    disabled={isSaving || isStage1Complete}
                                    className={isStage1Complete ? 'opacity-50' : ''}
                                >
                                    {t('step1SyncRawData')}</Button>
                                <Button
                                    onClick={handleProcessRegistry}
                                    disabled={isSaving || !isStage1Complete}
                                    className="flex-1"
                                >
                                    {t('step2ProcessMapRegistry')}</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
