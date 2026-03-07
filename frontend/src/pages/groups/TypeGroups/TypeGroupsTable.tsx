import React from 'react';
import TypeGroupService from '../../../services/TypeGroupService';
import Swal from "sweetalert2";

interface TableProps {
    data: any[];
    loading: boolean;
    onEdit: (group: any) => void;
    onDelete: () => void;
}

const TypeGroupsTable: React.FC<TableProps> = ({ data, loading, onEdit, onDelete }) => {
    
    const handleDelete = async (id: number) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Estás seguro de que quieres eliminar este grupo?`,
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
                    await TypeGroupService.delete(id);
                    onDelete();
                    
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: 'Tipo de grupo eliminado correctamente',
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'dark:bg-gray-800 dark:text-white'
                        }
                    });
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo eliminar el tipo de grupo',
                        customClass: {
                            popup: 'dark:bg-gray-800 dark:text-white'
                        }
                    });
                }
            }
        });
    };

    if (loading) return <div className="text-center py-10">Cargando datos...</div>;

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full table-auto">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.length > 0 ? data.map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                {group.img ? (
                                    <img src={group.img} alt={group.name} className="w-10 h-10 rounded-full object-cover border" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                                )}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                            <td className="px-6 py-4 text-center space-x-2">
                                <button 
                                    onClick={() => onEdit(group)}
                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => handleDelete(group.id)}
                                    className="text-red-600 hover:text-red-900 font-medium"
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-gray-400">No hay registros disponibles</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TypeGroupsTable;