import React, { useState, useRef, useEffect } from 'react';
import GroupService from '../../../services/GroupService';
import Swal from "sweetalert2";
import { MoreHorizontal, Edit3, Image as ImageIcon, Trash2, UserIcon, ChevronRight, ChevronLeft, Search, ArrowUpDown } from 'lucide-react';
import ModalGaleryGroupImg from './GroupsGaleryModal';
import ModalAssignGroupImg from './GroupsModalAssing';

interface TableProps {
    data: any[];
    loading: boolean;
    onEdit: (group: any) => void;
    onDelete: () => void;
    onSuccess: () => void; 
}

type SortConfig = {
    key: 'name' | 'type_group_name' | 'contact' | null;
    direction: 'asc' | 'desc';
};

const GroupsTable: React.FC<TableProps> = ({ data, loading, onEdit, onDelete, onSuccess }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; 
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [selectedGroupForGallery, setSelectedGroupForGallery] = useState<{id: number, name: string} | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedGroupForAssign, setSelectedGroupForAssign] = useState<{id: number, name: string} | null>(null);

    const filteredData = data.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aValue = a[sortConfig.key] ?? '';
        let bValue = b[sortConfig.key] ?? '';

        if (sortConfig.key === 'contact') {
            aValue = Number(aValue);
            bValue = Number(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const currentItems = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key: 'name' | 'type_group_name' | 'contact') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenGallery = (group: any) => {
        setSelectedGroupForGallery({ id: group.id, name: group.name });
        setIsGalleryModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleOpenAssign = (group: any) => {
        setSelectedGroupForAssign({ id: group.id, name: group.name }); 
        setIsAssignModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleCloseGallery = () => {
        setIsGalleryModalOpen(false);
        setSelectedGroupForGallery(null);
    };

    const handleCloseAssign = () => {
        setIsAssignModalOpen(false);
        setSelectedGroupForAssign(null);
    };

    const handleDelete = async (id: number) => {
        setOpenDropdownId(null);
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará el grupo permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await GroupService.delete(id);
                onDelete();
                Swal.fire({ icon: 'success', title: 'Grupo eliminado correctamente!', timer: 1500, showConfirmButton: false });
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el grupo.', 'error');
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="relative w-full max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar grupo por nombre..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto overflow-y-visible bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr className="text-gray-400 text-[11px] font-bold uppercase tracking-widest border-b dark:border-gray-700">
                            <th className="px-6 py-4 text-left cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Nombre <ArrowUpDown size={12} className={sortConfig.key === 'name' ? 'text-blue-500' : 'text-gray-300'} />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Fraternidad
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('type_group_name')}>
                                <div className="flex items-center gap-2">
                                    Tipo <ArrowUpDown size={12} className={sortConfig.key === 'type_group_name' ? 'text-blue-500' : 'text-gray-300'} />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('contact')}>
                                <div className="flex items-center gap-2">
                                    Integrantes <ArrowUpDown size={12} className={sortConfig.key === 'contact' ? 'text-blue-500' : 'text-gray-300'} />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {currentItems.length > 0 ? (
                            currentItems.map((group, index) => {
                                const isLastItem = index >= currentItems.length - 2 && currentItems.length > 3;
                                return (
                                    <tr key={group.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 text-[14px] font-medium text-gray-700 dark:text-white">{group.name}</td>
                                        <td className="px-6 py-4 text-[14px] font-medium text-gray-700 dark:text-white">{( group.home_name ) ? group.home_name : 'Sin Asignar a Fraternidad'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/30">
                                                {group.type_group_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-gray-500 dark:text-gray-400">{group.total_members}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="relative inline-block">
                                                <button 
                                                    onClick={() => setOpenDropdownId(openDropdownId === group.id ? null : group.id)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-500 transition-colors"
                                                >
                                                    <MoreHorizontal size={20} />
                                                </button>
                                                {openDropdownId === group.id && (
                                                    <div ref={dropdownRef} className={`absolute right-0 z-[100] w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden ${isLastItem ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b dark:border-gray-700">Opciones</div>
                                                        <div className="py-1 text-left">
                                                            <button onClick={() => { onEdit(group); setOpenDropdownId(null); }} className="w-full flex items-center px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 gap-3">
                                                                <Edit3 size={16} className="text-gray-400" /> Editar
                                                            </button>
                                                            <button onClick={() => handleOpenGallery(group)} className="w-full flex items-center px-4 py-2.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700 gap-3">
                                                                <ImageIcon size={16} /> Galería
                                                            </button>
                                                            <button onClick={() => handleOpenAssign(group)} className="w-full flex items-center px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 gap-3">
                                                                <UserIcon size={16} /> Asignar
                                                            </button>
                                                            <button onClick={() => handleDelete(group.id)} className="w-full flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 gap-3">
                                                                <Trash2 size={16} /> Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">No se encontraron grupos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="px-6 py-4 flex items-center justify-between border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-medium text-gray-700 dark:text-gray-300">{currentItems.length}</span> de <span className="font-medium text-gray-700 dark:text-gray-300">{filteredData.length}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedGroupForGallery && (
                <ModalGaleryGroupImg 
                    isOpen={isGalleryModalOpen}
                    onClose={handleCloseGallery}
                    groupId={selectedGroupForGallery.id}
                    groupName={selectedGroupForGallery.name}
                />
            )}

            {selectedGroupForAssign && (
                <ModalAssignGroupImg 
                    isOpen={isAssignModalOpen}
                    onClose={handleCloseAssign}
                    onSuccess={onSuccess}
                    groupId={selectedGroupForAssign.id}
                    groupName={selectedGroupForAssign.name}
                />
            )}
        </div>
    );
};

export default GroupsTable;