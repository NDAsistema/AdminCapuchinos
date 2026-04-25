import React, { useState, useMemo } from 'react';

interface NewspaperTableProps {
    newspaper: any[];
    onEdit: (newspaper: any) => void;
    onDelete: (id: number) => void;
    onNew: () => void; 
}

export const NewspaperTable: React.FC<NewspaperTableProps> = ({ newspaper, onEdit, onDelete, onNew }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredNews = useMemo(() => {
        return newspaper.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [newspaper, searchTerm]);

    const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
    const currentItems = filteredNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatDate = (dateString: string | Date) => {
        if (!dateString) return '---';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        }).format(date);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar noticia por nombre..."
                        className="block w-full pl-11 pr-4 py-3 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-500 shadow-sm text-sm"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <button 
                    onClick={onNew} 
                    className="bg-[#1d4ed8] hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm"
                >
                    + Nueva Noticia
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Título</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Publicado Por</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Asignado a</th>
                            <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {currentItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6 text-[13px] font-bold text-gray-700">{item.title}</td>
                                <td className="px-8 py-6 text-[13px] text-gray-500">{formatDate(item.created_at)}</td>
                                <td className="px-8 py-6 text-[13px] text-gray-500">{item.name_created_by || 'Admin'}</td>
                                <td className="px-8 py-6">
                                    <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl uppercase">
                                        {item.assigned_to_name}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-4">
                                        <button onClick={() => onEdit(item)} className="text-[11px] font-black text-gray-400 hover:text-blue-600 uppercase">
                                            ✏️
                                        </button>
                                        <button onClick={() => onDelete(item.id)} className="text-[11px] font-black text-gray-400 hover:text-red-500 uppercase">
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 text-gray-400">&larr;</button>
                    <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 text-gray-400">&rarr;</button>
                </div>
            )}
        </div>
    );
};