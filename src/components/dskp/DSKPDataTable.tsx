import React, { useState } from 'react';
import { Trash2, Search, FileText } from 'lucide-react';
import { DSKPStandard } from '../../lib/dskp/parser';

interface DSKPDataTableProps {
    data: DSKPStandard[];
    onDelete?: (id: string) => void;
    isEditable?: boolean;
}

export const DSKPDataTable = ({ data, onDelete, isEditable = false }: DSKPDataTableProps) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 50;

    const filtered = data.filter(item => {
        if (!search) return true;
        const lower = search.toLowerCase();
        return (
            item.contentStandard.toLowerCase().includes(lower) ||
            item.learningStandard.toLowerCase().includes(lower) ||
            item.tema.toLowerCase().includes(lower) ||
            item.tajuk.toLowerCase().includes(lower)
        );
    });

    const totalPages = Math.ceil(filtered.length / LIMIT);
    const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

    return (
        <div className="space-y-4">
            {/* Local Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Filter current list..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[9px] tracking-wider">
                        <tr>
                            <th className="p-4 w-1/4">Standard Kandungan (SK)</th>
                            <th className="p-4 w-1/4">Standard Pembelajaran (SP)</th>
                            <th className="p-4 w-1/4">Tema / Bidang</th>
                            <th className="p-4 w-1/4">Tajuk</th>
                            {isEditable && <th className="p-4">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginated.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                    No standards found matching your filter.
                                </td>
                            </tr>
                        )}
                        {paginated.map((row, i) => (
                            <tr key={row.id || i} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 align-top">
                                    <div className="font-bold text-slate-700">{row.contentStandard}</div>
                                </td>
                                <td className="p-4 align-top">
                                    <div className="text-slate-600 font-medium">{row.learningStandard}</div>
                                </td>
                                <td className="p-4 align-top text-slate-500">{row.tema || row.temaBidang || '-'}</td>
                                <td className="p-4 align-top text-slate-500">{row.tajuk || row.tajukKemahiran || '-'}</td>
                                {isEditable && (
                                    <td className="p-4 align-top">
                                        <button
                                            onClick={() => onDelete?.(row.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                            title="Delete Standard"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-white border disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-slate-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-white border disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};
