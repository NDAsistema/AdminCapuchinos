import { useState, useEffect } from "react";
import { UserTable } from "../../components/UserComponent/UserTable";
import { UserModal } from "../../components/UserComponent/UserModal";
import { UserEditModal } from "../../components/UserComponent/UserEditModal";
import UserService from "../../services/userServices";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await UserService.getAllUser(); 
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    return (
        <div className="col-span-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Gestión de Usuarios</h1>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2"
                >
                    <span>+</span> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2">
                <UserTable 
                    users={users} 
                    onEdit={(u) => { setSelectedUser(u); setIsEditOpen(true); }} 
                    onDelete={(id) => {/* lógica borrar */}} 
                />
            </div>

            {/* Modal de CREACIÓN */}
            <UserModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onSuccess={fetchUsers} 
            />

            {/* Modal de EDICIÓN */}
            <UserEditModal 
                isOpen={isEditOpen} 
                user={selectedUser} 
                onClose={() => setIsEditOpen(false)} 
                onSuccess={fetchUsers} 
            />
        </div>
    );
}