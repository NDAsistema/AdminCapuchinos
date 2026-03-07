import { useState, useEffect, useCallback } from "react";
import { TypeGroupModal } from "./TypeGroupModal";
import TypeGroupsTable from "./TypeGroupsTable";
import TypeGroupService from "../../../services/TypeGroupService";

export default function GroupsList() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // Función para obtener los datos
    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const data = await TypeGroupService.getAll();
            setGroups(data);
        } catch (error) {
            console.error("Error cargando grupos:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar al montar el componente
    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreateClick = () => {
        setSelectedGroup(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (group: any) => {
        setSelectedGroup(group);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        fetchGroups(); // ✅ Refresca la lista automáticamente
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Sección de Tipos de Grupos</h2>
                <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md" 
                    onClick={handleCreateClick}
                >
                    + Nuevo Tipo de Grupo
                </button>
            </div>

            {/* Pasamos los datos y la función de editar a la tabla */}
            <TypeGroupsTable 
                data={groups} 
                loading={loading} 
                onEdit={handleEditClick}
                onDelete={fetchGroups} // Refrescar si se elimina
            />

            <TypeGroupModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={handleSuccess}
                selectedGroup={selectedGroup}
            />
        </div>
    );
}