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
        if (user && isOpen) {
            loadTypeUsers();
            setFormData({
                email: user.email || '',
                password: '',
                type_user: String(user.type_user ?? ''),
            });
        }
    }, [user, isOpen]);

    const loadTypeUsers = async () => {
        try {
            const data = await userServices.listTypeUsers();
            setOptionsTypeUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error cargando roles:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.type_user) {
            Swal.fire('Atención', 'Seleccione un rol de usuario', 'warning');
            return;
        }

        const newPassword = formData.password.trim();
        const payload: { type_user: string; password?: string } = {
            type_user: formData.type_user,
        };

        if (newPassword !== '') {
            if (newPassword.length < 6) {
                Swal.fire('Atención', 'La contraseña debe tener al menos 6 caracteres', 'warning');
                return;
            }
            payload.password = newPassword;
        }

        setLoading(true);
        try {
            const response = await userServices.updateUser(user.id, payload);
            const passwordUpdated = response?.passwordUpdated === true;

            Swal.fire(
                'Actualizado',
                passwordUpdated
                    ? 'Usuario y contraseña guardados. El usuario ya puede iniciar sesión con la nueva clave.'
                    : 'Rol actualizado. La contraseña no cambió (dejó el campo vacío).',
                'success'
            );
            onSuccess();
            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'No se pudo actualizar el usuario';
            Swal.fire('Error', msg, 'error');
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
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Correo Electrónico de acceso
                        </label>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formData.email || <span className="text-gray-400 italic font-normal">Sin correo</span>}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Rol de Usuario
                        </label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.type_user}
                            onChange={(e) => setFormData({ ...formData, type_user: e.target.value })}
                            required
                        >
                            <option value="">Seleccione un tipo...</option>
                            {optionsTypeUser.map((t: any) => (
                                <option key={t.id} value={String(t.id)}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300">
                            Nueva Contraseña
                        </label>
                        <p className="text-xs text-gray-400 mb-1">
                            Escriba la clave nueva en texto plano. Déjelo vacío si no desea cambiarla.
                        </p>
                        <input
                            type="password"
                            name="new_user_password"
                            autoComplete="new-password"
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-amber-500 text-white rounded-lg font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
