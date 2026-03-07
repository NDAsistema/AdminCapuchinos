import React, { useState, useEffect } from 'react';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedUser?: any | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, selectedUser }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        type_user: 'user',
        id_brother: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedUser) {
            setFormData({
                email: selectedUser.email || '',
                password: '', // Por seguridad no se carga el password
                type_user: selectedUser.type_user || 'user',
                id_brother: selectedUser.id_brother || ''
            });
        } else {
            setFormData({ email: '', password: '', type_user: 'user', id_brother: '' });
        }
    }, [selectedUser, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Aquí llamarías a tu UserService.create o update
            console.log("Enviando datos:", formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error al guardar usuario", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {selectedUser ? 'Editar Acceso' : 'Nuevo Usuario de Sistema'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Contraseña {selectedUser && <span className="text-xs text-amber-500">(Dejar vacío para no cambiar)</span>}
                        </label>
                        <input
                            type="password"
                            required={!selectedUser}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    {/* Roles / Tipo de Usuario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol de Usuario</label>
                        <select 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.type_user}
                            onChange={(e) => setFormData({...formData, type_user: e.target.value})}
                        >
                            <option value="user">Usuario Estándar</option>
                            <option value="admin">Administrador</option>
                            <option value="editor">Editor / Párroco</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Guardando...' : 'Guardar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};