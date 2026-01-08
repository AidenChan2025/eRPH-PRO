import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DSKPMasterAccordion } from '../../components/dskp/DSKPMasterAccordion';
import { useGlobal } from '../../../context/GlobalContext';
import { UserRole } from '../../../types';
import Button from '../../../components/Button';
import { Upload } from 'lucide-react';
import { SyncModal } from '../../components/dskp/SyncModal';
import { useTranslation } from 'react-i18next';

export const DSKPContainer = () => {
    const { t } = useTranslation();
    const { type, year } = useParams();
    const { currentUser } = useGlobal();
    const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
    const [isSyncModalOpen, setIsSyncModalOpen] = React.useState(false);

    // If type/year params exist, we could pass them to Accordion to set initial state?
    // For now, simple render.

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('dskpManagement')}</h2>
                    <p className="text-slate-500 text-sm font-medium">{t('hierarchicalRegistryExplorer')}</p>
                </div>
                {isSuperAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsSyncModalOpen(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 font-bold hover:bg-blue-700 transition-colors"
                        >
                            <Upload className="w-4 h-4" /> {t('syncRegistry')}</button>
                    </div>
                )}
            </div>

            <DSKPMasterAccordion
                isAdmin={isSuperAdmin}
                onDeleteStandard={(id) => console.log("Delete", id)}
            />

            <SyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                onSynced={() => window.location.reload()}
            />
        </div>
    );
};
