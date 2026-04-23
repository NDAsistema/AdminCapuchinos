import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import userServices from '../../services/userServices';
import Swal from 'sweetalert2';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedUser?: any | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, selectedUser }) => {
    // 1. Definición del estado inicial para limpieza absoluta
    const initialFormState = {
        email: '',
        password: '',
        type_user: '',
        id_brother: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [optionsBrother, setOptionsBrother] = useState<any[]>([]);
    const [optionsTypeUser, setOptionsTypeUsers] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadBrothers();
            loadTypeUsers();
            
            if (selectedUser) {
                // Modo Edición: Cargamos data del usuario existente
                setFormData({
                    email: selectedUser.email || '',
                    password: '', 
                    type_user: selectedUser.type_user || '',
                    id_brother: selectedUser.id_brother || ''
                });
            } else {
                // Modo Creación: Forzamos el reset de todos los campos
                setFormData(initialFormState);
            }
        }
    }, [selectedUser, isOpen]);

    const loadBrothers = async () => {
        try {
            const data = await userServices.listBrotherByCreate();
            const formattedOptions = data.map((b: any) => ({
                value: b.id,
                // Formato pedido: Nombre (email)
                label: `${b.name} (${b.email || 'Sin correo'})`, 
                email: b.email 
            }));
            setOptionsBrother(formattedOptions);
        } catch (error) {
            console.error('Error cargando hermanos:', error);
        } 
    };

    const loadTypeUsers = async () => {
        try {
            const data = await userServices.listTypeUsers();
            setOptionsTypeUsers(data);
        } catch (error) {
            console.error('Error cargando roles:', error);
        } 
    };

    const handleBrotherChange = (selectedOption: any) => {
        setFormData({
            ...formData,
            id_brother: selectedOption ? selectedOption.value : '',
            email: selectedOption ? (selectedOption.email || '') : ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.id_brother && !selectedUser) {
            Swal.fire("Atención", "Debe seleccionar un hermano", "warning");
            return;
        }

        setLoading(true);
        try {
            if (selectedUser) {
                // Update: Solo enviamos password y type_user según lo blindado en el backend
                await userServices.updateUser(selectedUser.id, {
                    type_user: formData.type_user,
                    password: formData.password
                });
                Swal.fire("¡Actualizado!", "Usuario modificado con éxito", "success");
            } else {
                // Create: Enviamos todo el objeto
                await userServices.createUser(formData);
                Swal.fire("¡Creado!", "Usuario registrado con éxito", "success");
            }
            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire("Error", "No se pudo procesar la solicitud", "error");
        } finally {
            setLoading(false);
        }
    };

    // Estilos personalizados para el Select (Fondo Blanco)
    const customStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'white',
            borderColor: '#d1d5db',
            borderRadius: '0.625rem',
            minHeight: '42px',
            boxShadow: 'none',
            '&:hover': { borderColor: '#3b82f6' }
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 9999
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#f3f4f6' : 'white',
            color: state.isSelected ? 'white' : '#374151',
            cursor: 'pointer',
            padding: '10px 12px',
            fontSize: '14px'
        }),
        singleValue: (base: any) => ({
            ...base,
            color: '#374151',
        })
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-capuchinos">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {selectedUser ? 'Editar Acceso' : 'Nuevo Usuario de Sistema'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-light">✕</button>
                </div>

                {/* Formulario con autocomplete off para evitar sugerencias del navegador */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5" autoComplete="off">
                    
                    {/* BUSCADOR DE HERMANOS */}
                    <div>  
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            {selectedUser ? 'Hermano Asignado' : 'Seleccionar Hermano'}
                        </label>
                        <Select
                            name="hermano_select_field"
                            placeholder="Buscar por nombre o (email)..."
                            options={optionsBrother}
                            onChange={handleBrotherChange}
                            styles={customStyles}
                            noOptionsMessage={() => "No hay resultados"}
                            // value={null} limpia visualmente el select al crear
                            value={optionsBrother.find(opt => opt.value === formData.id_brother) || null}
                            isDisabled={!!selectedUser}
                        />
                    </div>

                    {/* EMAIL COMO LABEL (Informativo) */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Correo Electrónico de acceso
                        </label>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formData.email ? formData.email : <span className="text-gray-400 italic font-normal">Pendiente de selección</span>}
                        </p>
                    </div>

                    {/* PASSWORD con fix de autocompletado */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Contraseña</label>
                        <input
                            type="password"
                            name="user_password_new"
                            autoComplete="new-password"
                            required={!selectedUser}
                            placeholder={selectedUser ? "••••••••" : "Escriba una clave"}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    {/* ROLES DINÁMICOS */}
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

                    <div className="flex justify-end gap-3 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-gray-600 font-medium transition-colors">
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`px-6 py-2 ${selectedUser ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg font-bold shadow-lg disabled:opacity-50 transition-all`}
                        >
                            {loading ? 'Procesando...' : selectedUser ? 'Actualizar' : 'Guardar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};