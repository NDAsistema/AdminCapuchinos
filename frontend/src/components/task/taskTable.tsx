import { Task } from "../../services/taskServices";

interface TableProps {
    view: 'reportes' | 'gestion';
    tasks: any[]; // Aquí recibimos el array desde la vista Tasks.tsx
    loading: boolean;
    userType?: number;
    onEdit: (task: any) => void;
}

export function TaskTable({ view, tasks, loading, userType, onEdit }: TableProps) {
    
    // Función para renderizar el badge de estado
    const renderStatus = (status: number) => {
        // Asumiendo status 1: Activo/Pendiente, 2: Completado (puedes ajustarlo)
        if (status === 1) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                    Pendiente
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Completado
            </span>
        );
    };

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status">
                    <span className="sr-only">Cargando...</span>
                </div>
                <p className="mt-2 text-gray-500 font-medium">Cargando tareas...</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                <thead>
                    <tr className="text-gray-400 uppercase text-[10px] tracking-wider">
                        <th className="px-6 py-3 font-bold">Detalle del Informe</th>
                        
                        {view === 'reportes' ? (
                            <th className="px-6 py-3 font-bold">Hermano / Usuario</th>
                        ) : (
                            <th className="px-6 py-3 font-bold">Destinatario</th>
                        )}

                        <th className="px-6 py-3 font-bold text-center">Estado</th>
                        <th className="px-6 py-3 font-bold">Fecha</th>
                        <th className="px-6 py-3 font-bold text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y-0">
                    {tasks && tasks.length > 0 ? (
                        tasks.map((task) => (
                            <tr key={task.id} className="bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group shadow-sm">
                                <td className="px-6 py-4 rounded-l-2xl">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800 dark:text-gray-100 uppercase text-xs">
                                            {task.title}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    {view === 'reportes' ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                                {task.userName?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                                                {task.userName || 'Usuario Desconocido'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                            {task.groupName || 'Individual / Libre'}
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-center">
                                    {renderStatus(task.status)}
                                </td>

                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {task.created_at ? new Date(task.created_at).toLocaleDateString() : '---'}
                                </td>

                                <td className="px-6 py-4 text-right rounded-r-2xl">
                                    <div className="flex justify-end gap-1">
                                        {/* Ver Detalles */}
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        
                                        {/* Editar - Solo Admin o si estamos en Gestión */}
                                        {(userType === 1 || view === 'gestion') && (
                                            <>
                                                <button 
                                                    onClick={() => onEdit(task)}
                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="py-20 text-center text-gray-400 italic">
                                No se encontraron tareas disponibles.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}