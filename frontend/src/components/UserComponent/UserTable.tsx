import React from 'react';

interface UserTableProps {
    users: any[];
    onEdit: (user: any) => void;
    onDelete: (id: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 text-sm uppercase">
                        <th className="px-4 py-3 font-medium">Nombre y Apellido</th>
                        <th className="px-4 py-3 font-medium">Rol</th>  
                        <th className="px-4 py-3 font-medium">email</th>
                        <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.length > 0 ? (
                        users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-700 dark:text-gray-200 font-medium">{user.name_brother}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="px-2 py-1 rounded-md text-xs font-semibold">
                                        {user.typ_name}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                                    {user.email}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button 
                                        onClick={() => onEdit(user)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => onDelete(user.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                                No se encontraron usuarios registrados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};