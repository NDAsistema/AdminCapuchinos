import React, { useState, useEffect } from 'react';
import userServices from '../../services/userServices';
import Swal from 'sweetalert2';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
}

export const UserEditModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, user }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        type_user: '',
    });
    const [loading, setLoading] = useState(false);
    const [optionsTypeUser, setOptionsTypeUsers] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            loadTypeUsers();
            setFormData({
                email: user.email || '',
                password: '',
                type_user: user.type_user || 'user'
            });
        }
    }, [user, isOpen]);


    const loadTypeUsers = async () => {
        try {
            const data = await userServices.listTypeUsers();
            setOptionsTypeUsers(data);
        } catch (error) {
            console.error('Error cargando roles:', error);
        } 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await userServices.updateUser(user.id, formData);
            Swal.fire("Actualizado", "Usuario modificado correctamente", "success");
            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire("Error", "No se pudo actualizar", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="modal-capuchinos fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Editar: {user.name_brother}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Correo Electrónico de acceso
                        </label>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formData.email ? formData.email : <span className="text-gray-400 italic font-normal">Pendiente de selección</span>}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rol de Usuario</label>
                        <select 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.type_user}
                            onChange={(e) => setFormData({...formData, type_user: e.target.value})}
                            required
                        >
                            <option value="">Seleccione un tipo...</option>
                            {optionsTypeUser.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Nueva Contraseña</label>
                        <input
                            type="password"
                            placeholder="Dejar vacío para no cambiar"
                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white outline-none"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-amber-500 text-white rounded-lg font-semibold">
                            {loading ? 'Actualizando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};