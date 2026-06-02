import { useState, useEffect } from "react";
import { useAuth } from "../../components/UserProfile/AuthProvider";
import { TaskFilters } from "../../components/task/TaskFilters"; 
import { TaskTable } from "../../components/task/tasktable";
import { TaskModal } from "../../components/task/TaskModal"; // Asegúrate de importar el modal
import TaskService from "../../services/taskServices";

export default function Tasks() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'reportes' | 'gestion'>('reportes');
    const [filters, setFilters] = useState({ groupId: '', userId: '' });

    // --- ESTADOS PARA EL MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null); // Para editar
    const [refreshKey, setRefreshKey] = useState(0); // Para refrescar la tabla
    const [taskList, setTaskList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const isAdmin = user?.type_user === 1;
    const isUser = user?.type_user === 2;
    const isComms = user?.type_user === 3;

    useEffect(() => {
        loadTasks();
    }, [filters, activeTab]);

    // --- FUNCIONES DE MANEJO ---
    const handleCreate = () => {
        setSelectedTask(null); // Limpiar datos previos
        loadTasks();
        setIsModalOpen(true);
    };

    const handleEdit = (task: any) => {
        setSelectedTask(task); // Cargar datos de la tarea a editar
        loadTasks();
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        loadTasks();
        setRefreshKey(prev => prev + 1); // Incrementa la clave para disparar el useEffect de la tabla
        setIsModalOpen(false);
    };


    const loadTasks = async (): Promise<void> => {
        setLoading(true); // Indica que está cargando
        try {
            const response = await TaskService.getAllTask(filters); 
            console.log("Datos recibidos:", response);
            setTaskList(response); // 2. Guarda el array en el estado correcto
        } catch (err: any) {
            console.error('Error loading tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="col-span-12 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold dark:text-white">
                    {isAdmin ? "Modulo de Tareas Administrador" : "Mis Tareas Asignadas"}
                </h1>

                {/* Switch de pestañas exclusivo para Admin */}
                {isAdmin && (
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('reportes')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reportes' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600' : 'text-gray-500'}`}
                        >
                            Reportes Usuarios
                        </button>
                        <button 
                            onClick={() => setActiveTab('gestion')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'gestion' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600' : 'text-gray-500'}`}
                        >
                            Mis Informes / Gestión
                        </button>
                    </div>
                )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2">
                {/* FILTROS: Solo en Reportes si es Admin */}
                {isAdmin && activeTab === 'reportes' && (
                    <div className="mb-6 px-4 pt-4">
                        <TaskFilters 
                            onFilterChange={(newFilters) => setFilters(newFilters)} 
                        />
                    </div>
                )}

                {/* BOTÓN CREAR: Solo para Admin/Comms en pestaña gestión */}
                {(isAdmin || isComms) && activeTab === 'gestion' && (
                    <div className="mb-4 flex justify-end px-4">
                        <button 
                            onClick={handleCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            + Crear Nuevo Informe
                        </button>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl p-4 transition-all">
                    <TaskTable 
                        key={refreshKey} // Clave para forzar recarga tras éxito
                        view={activeTab} 
                        tasks={taskList}
                        loading={loading}
                        filters={isAdmin ? filters : { userId: user?.id }} 
                        userType={user?.type_user}
                        onEdit={handleEdit} // Pasa la función de edición a la tabla
                    />
                </div>
            </div>

            {/* --- COMPONENTE MODAL --- */}
            <TaskModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                initialData={selectedTask}
            />
            
        </div>
    );
}