// components/HomeComponents/Homes.tsx
import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import HomeModal from '../../components/HomeComponents/addhome';
import ModalGaleryHomeImg from '../../components/HomeComponents/ModalGaleryHomeImg';
import HomeService, { Home } from '../../services/homeService';

export default function Homes() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [selectedHomeForGallery, setSelectedHomeForGallery] = useState<{id: number, name: string} | null>(null);
    const [currentHome, setCurrentHome] = useState<Home | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [homes, setHomes] = useState<Home[]>([]);
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
                setDropdownPosition(null);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cargar homes al inicio
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        
        loadHomes();
    }, []);

    // Abrir modal para crear nuevo
    const handleAddHome = () => {
        setCurrentHome(null);
        setModalMode('create');
        setIsModalOpen(true);
        setOpenDropdown(null);
        setDropdownPosition(null);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentHome(null);
    };

    // Cerrar modal de galería
    const handleCloseGalleryModal = () => {
        setIsGalleryModalOpen(false);
        setSelectedHomeForGallery(null);
    };

    const loadHomes = async (): Promise<void> => {
        setLoading(true);
        try {
            const homesData = await HomeService.getAllHomes();
            setHomes(homesData);
            setError(null);
        } catch (err: any) {
            setError('Error al cargar las fraternidades');
            console.error('Error loading homes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHome = async (homeData: Home) => {
        const isEdit = modalMode === 'edit' && homeData.id;
        
        try {
            if (isEdit) {
                await HomeService.updateHome(homeData.id!, homeData);
                await loadHomes(); // Recargar para obtener datos actualizados
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Actualizado!',
                    text: 'La fraternidad ha sido actualizada',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                await HomeService.createHome(homeData);
                await loadHomes(); // Recargar para incluir la nueva fraternidad
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Creado!',
                    text: 'Fraternidad creada correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            
            handleCloseModal();
        } catch (error: any) {
            console.error('Error al guardar el hogar:', error);
            const errorMsg = error.response?.data?.message || 'Hubo un problema al guardar la fraternidad';
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMsg,
                timer: 2000
            });
        }
    };

    // Eliminar hogar
    const handleDeleteHome = (id: number) => {
        setOpenDropdown(null);
        setDropdownPosition(null);
        
        const homeToDelete = homes.find(h => h.id === id);
        if (!homeToDelete) return;
        
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Estás seguro de que quieres eliminar "${homeToDelete.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'dark:bg-gray-800 dark:text-white'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const deleted = await HomeService.deleteHome(id);
                    if (deleted) {
                        await loadHomes();
                        
                        Swal.fire({
                            icon: 'success',
                            title: '¡Eliminado!',
                            text: 'Fraternidad eliminada correctamente',
                            timer: 2000,
                            showConfirmButton: false,
                            customClass: {
                                popup: 'dark:bg-gray-800 dark:text-white'
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error al eliminar:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo eliminar la fraternidad',
                        customClass: {
                            popup: 'dark:bg-gray-800 dark:text-white'
                        }
                    });
                }
            }
        });
    };

    // Editar hogar
    const handleEditHome = (home: Home) => {
        setCurrentHome(home);
        setModalMode('edit');
        setIsModalOpen(true);
        setOpenDropdown(null);
        setDropdownPosition(null);
    };

    // Función para galería
    const handleGallery = (id: number) => {
        const home = homes.find(h => h.id === id);
        if (home && home.id && home.name) {
            setSelectedHomeForGallery({
                id: home.id,
                name: home.name
            });
            setIsGalleryModalOpen(true);
        }
        setOpenDropdown(null);
        setDropdownPosition(null);
    };

    // Manejar clic en los tres puntos
    const handleOptionsClick = (homeId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        
        const button = buttonRefs.current[homeId];
        if (button) {
            const rect = button.getBoundingClientRect();
            
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const scrollX = window.scrollX || document.documentElement.scrollLeft;
            
            const dropdownHeight = 130;
            const dropdownWidth = 180;
            
            let top = rect.bottom + scrollY;
            let left = rect.left + scrollX;
            
            const windowBottom = window.innerHeight + scrollY;
            if ((rect.bottom + scrollY + dropdownHeight) > windowBottom) {
                top = rect.top + scrollY - dropdownHeight;
            }
            
            if (top < scrollY) {
                top = scrollY + 10;
            }
            
            const windowRight = window.innerWidth + scrollX;
            if ((rect.left + scrollX + dropdownWidth) > windowRight) {
                left = rect.right + scrollX - dropdownWidth;
            }
            
            if (left < scrollX) {
                left = scrollX + 10;
            }
            
            setDropdownPosition({ top, left });
        }
        
        setOpenDropdown(openDropdown === homeId ? null : homeId);
    };

    return (
        <div className="col-span-12">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Módulo Fraternidad
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

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    {/* Botón Agregar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <button 
                            onClick={handleAddHome}
                            className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar Fraternidad
                        </button>
                        
                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                            {loading ? 'Cargando...' : `${homes.length} fraternidad(es)`}
                        </div>
                    </div>

                    {/* Lista de Hogares */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando fraternidades...</p>
                        </div>
                    ) : homes.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                                No hay fraternidades registradas
                            </p>
                            <button 
                                onClick={handleAddHome}
                                className="text-brand-500 hover:text-brand-600 font-medium"
                            >
                                Agregar la primera fraternidad
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Nombre
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Ciudad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Fundador
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {homes.map((home) => (
                                        <tr key={home.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 relative">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {home.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-300">
                                                    {home.city}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-300">
                                                    {home.state}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-300">
                                                    {home.founder || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                                                <div className="inline-block">
                                                    <button
                                                        ref={el => buttonRefs.current[home.id!] = el}
                                                        onClick={(e) => handleOptionsClick(home.id!, e)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        type="button"
                                                        aria-expanded={openDropdown === home.id}
                                                        aria-haspopup="true"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Dropdown flotante */}
            {openDropdown && dropdownPosition && (
                <div 
                    ref={dropdownRef}
                    className="fixed z-[9999] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        position: 'fixed'
                    }}
                >
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Opciones
                        </p>
                    </div>
                    
                    <div className="py-1">
                        <button
                            onClick={() => {
                                const home = homes.find(h => h.id === openDropdown);
                                if (home) handleEditHome(home);
                            }}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                        </button>
                        
                        <button
                            onClick={() => handleGallery(openDropdown)}
                            className="flex items-center w-full px-4 py-3 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Galería
                        </button>

                        <button
                            onClick={() => handleDeleteHome(openDropdown)}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Edición/Creación */}
            <HomeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveHome}
                home={currentHome}
                mode={modalMode}
            />

            {/* Modal de Galería */}
            {selectedHomeForGallery && (
                <ModalGaleryHomeImg
                    isOpen={isGalleryModalOpen}
                    onClose={handleCloseGalleryModal}
                    homeId={selectedHomeForGallery.id}
                    homeName={selectedHomeForGallery.name}
                />
            )}
        </div>
    );
}