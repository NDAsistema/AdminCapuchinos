import { useState, useEffect, useCallback } from "react";
import GroupsModal from "./GroupsModal";
import GroupService from "../../../services/GroupService";
import GroupsTable from "./GroupsTable";

export default function GroupsList() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [groups, setGroups] = useState<any[]>([]); // Aseguramos que sea un array
    const [loading, setLoading] = useState(true);

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const data: any = await GroupService.getAll();
            if (Array.isArray(data) && Array.isArray(data[0])) {
                setGroups(data[0]);
            } else {
                setGroups(data);
            }
        } catch (error) {
            console.error("Error cargando grupos:", error);
            setGroups([]); 
        } finally {
            setLoading(false);
        }
    }, []);

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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white">Sección de Grupos</h2>
                <button 
                    onClick={handleCreateClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                    + Nuevo Grupo
                </button>
            </div>

            {/* Tabla de resultados */}
            <GroupsTable 
                data={groups} 
                loading={loading} 
                onEdit={handleEditClick}
                onDelete={fetchGroups} 
                onSuccess={fetchGroups}
            />

            {/* Modal para Crear/Editar */}
            <GroupsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchGroups} 
                selectedGroup={selectedGroup}
            />
        </div>
    );
}