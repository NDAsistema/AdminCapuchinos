import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import BrotherModal from '../../components/BrottherComponents/AddBrotherModal';
import brotherService, { Brother, CreateBrotherData } from '../../services/brotherService';
import AlertService from '../../services/alertService';

// Interface local para el modal
interface BrotherData {
  id?: number;
  name: string;
  email: string;
  birth_date: string;
  study: string;
  cv: string;
  server: string;
  year_profession: string;
  img: File | null;
}

export default function Brothers() {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [brothers, setBrothers] = useState<Brother[]>([]);
    const [filteredBrothers, setFilteredBrothers] = useState<Brother[]>([]);
    const [editingBrother, setEditingBrother] = useState<BrotherData | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(5);
    const hasFetched = useRef<boolean>(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        
        loadBrothers();
    }, []);

    // Efecto para filtrar hermanos cuando cambia el término de búsqueda
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredBrothers(brothers);
        } else {
            const filtered = brothers.filter(brother =>
                brother.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                brother.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredBrothers(filtered);
        }
        setCurrentPage(1);
    }, [searchTerm, brothers]);

    // Calcular hermanos a mostrar en la página actual
    const indexOfLastBrother = currentPage * itemsPerPage;
    const indexOfFirstBrother = indexOfLastBrother - itemsPerPage;
    const currentBrothers = filteredBrothers.slice(indexOfFirstBrother, indexOfLastBrother);
    const totalPages = Math.ceil(filteredBrothers.length / itemsPerPage);

    const loadBrothers = async (): Promise<void> => {
        setLoading(true);
        try {
            const brothersData = await brotherService.getAllBrothers();
            setBrothers(brothersData);
            setFilteredBrothers(brothersData);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Error al cargar la lista de hermanos');
            console.error('Error loading brothers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBrother = async (modalData: BrotherData): Promise<void> => {
        try {
            const brotherData: CreateBrotherData = {
                name: modalData.name || '',
                email: modalData.email || '',
                birth_date: modalData.birth_date || null,
                study: modalData.study || '',
                cv: modalData.cv || '',
                server: modalData.server || '',
                year_profession: modalData.year_profession || null,
                img: modalData.img
            };

            const loadingAlert = AlertService.loading(
                modalMode === 'create' ? 'Creando hermano...' : 'Actualizando hermano...'
            );

            if (modalMode === 'create') {
                await brotherService.createBrother(brotherData);
                AlertService.close();
                AlertService.success('¡Éxito!', 'Hermano creado exitosamente');
            } else {
                if (modalData.id) {
                    await brotherService.updateBrother(modalData.id, brotherData);
                    AlertService.close();
                    AlertService.success('¡Éxito!', 'Hermano actualizado exitosamente');
                }
            }
            
            await loadBrothers();
            
        } catch (err: any) {
            console.error('Error completo al guardar:', err);
            setError(err.response?.data?.message || err.message || 'Error al guardar el hermano');
        }
    };

    const handleEditBrother = (brother: Brother): void => {
        const formatDateForInput = (dateString: string | null): string => {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            return date.toISOString().split('T')[0];
        };
        
        const modalData: BrotherData = {
            id: brother.id,
            name: brother.name,
            email: brother.email,
            birth_date: formatDateForInput(brother.birth_date),
            study: brother.study || '',
            cv: brother.cv || '',
            server: brother.server || '',
            year_profession: formatDateForInput(brother.year_profession),
            img: null
        };
        
        setEditingBrother(modalData);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDeleteBrother = async (id: number, brotherName: string): Promise<void> => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Estás seguro de que quieres eliminar a "${brotherName}"? Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: {
                popup: 'dark:bg-gray-800 dark:text-white'
            }
        });
        if (result.isConfirmed) {
            try {
                await brotherService.deleteBrother(id);
                
                await Swal.fire({
                    title: '¡Eliminado!',
                    text: `"${brotherName}" ha sido eliminado exitosamente.`,
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Aceptar',
                    customClass: {
                        popup: 'dark:bg-gray-800 dark:text-white'
                    }
                });
                
                await loadBrothers();
            } catch (err: any) {
                console.error('Error eliminando hermano:', err);
                
                await Swal.fire({
                    title: 'Error',
                    text: `No se pudo eliminar a "${brotherName}". ${err.response?.data?.message || err.message || 'Error al eliminar el hermano'}`,
                    icon: 'error',
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'Aceptar',
                    customClass: {
                        popup: 'dark:bg-gray-800 dark:text-white'
                    }
                });
            }
        }
    };

    const handleAddBrother = (): void => {
        setEditingBrother(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleCloseModal = (): void => {
        setIsModalOpen(false);
        setEditingBrother(null);
        setError(null);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    const handlePageChange = (pageNumber: number): void => {
        setCurrentPage(pageNumber);
    };

    const renderPagination = (): JSX.Element => {
        const pageNumbers: number[] = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                    ← Anterior
                </button>
                
                <div className="flex space-x-1">
                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            className={`px-3 py-1 rounded-lg ${
                                currentPage === number
                                    ? 'bg-brand-500 text-white'
                                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                        >
                            {number}
                        </button>
                    ))}
                </div>
                
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                    Siguiente →
                </button>
            </div>
        );
    };

    return (
        <div className="col-span-12">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Modulo Hermanos
            </h1>
            
            {/* Mensaje de error */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                    <button 
                        onClick={() => setError(null)}
                        className="float-right text-red-800 hover:text-red-900"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400">Cargando hermanos...</p>
                </div>
            )}

            {/* Lista de hermanos */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <button 
                            onClick={handleAddBrother}
                            className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar Hermano
                        </button>
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="relative">
                                <input 
                                    type="text"
                                    placeholder="Buscar por nombre o email..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full md:w-64"
                                />
                                <svg 
                                    className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            
                            <div className="text-center md:text-right">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Hermanos ({filteredBrothers.length})
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Página {currentPage} de {totalPages}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {filteredBrothers.length === 0 && !loading ? (
                        <div className="text-center py-12">
                            {searchTerm ? (
                                <>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                                        No se encontraron hermanos para "{searchTerm}"
                                    </p>
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="text-brand-500 hover:text-brand-600 underline"
                                    >
                                        Ver todos los hermanos
                                    </button>
                                </>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-lg">
                                    No hay hermanos registrados
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {currentBrothers.map((brother) => (
                                    <div 
                                        key={brother.id} 
                                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center">
                                                <img 
                                                    src={brother.img || "/defaultusercapuchinos.jpg"} 
                                                    alt={`Foto de ${brother.name}`}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "/defaultusercapuchinos.jpg";
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-800 dark:text-white text-lg">
                                                    {brother.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    📧 {brother.email}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {brother.name_service}
                                                </p>
                                                {brother.birth_date && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                        🎂 {new Date(brother.birth_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex space-x-2 self-end md:self-center">
                                            <button
                                                onClick={() => handleEditBrother(brother)}
                                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => brother.id && handleDeleteBrother(brother.id, brother.name)}
                                                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Paginación */}
                            {totalPages > 1 && renderPagination()}
                        </>
                    )}
                </div>
            </div>

            {/* Modal reutilizable */}
            <BrotherModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveBrother}
                brother={editingBrother}
                mode={modalMode}
            />
        </div>
    );
}