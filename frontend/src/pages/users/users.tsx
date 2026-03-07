import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { UserTable } from "../../components/UserComponent/UserTable";
import { UserModal } from "../../components/UserComponent/UserModal";
import UserService from "../../services/userServices";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await UserService.getAllUser(); 
            console.log(data);
            setUsers(data);
        } catch (error) {
            console.error("Error cargando usuarios", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // 2. Manejar edición
    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    // 3. Manejar eliminación (Borrado Analógico)
    const handleDelete = (id: number) => {
        Swal.fire({
            title: "¿Estás seguro?",
            text: "El usuario será desactivado del sistema",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed) {
                // await UserService.delete(id);
                Swal.fire("Eliminado", "El usuario ha sido desactivado.", "success");
                fetchUsers();
            }
        });
    };

    return (
        <div className="col-span-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Gestión de Usuarios
                </h1>
                <button 
                    onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                >
                    <span>+</span> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2">
                {loading ? (
                    <div className="p-10 text-center text-gray-400">Cargando usuarios...</div>
                ) : (
                    <UserTable 
                        users={users} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                    />
                )}
            </div>

            <UserModal 
                isOpen={isModalOpen} 
                selectedUser={selectedUser}
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchUsers} 
            />
        </div>
    );
}