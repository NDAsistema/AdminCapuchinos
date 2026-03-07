import React, { useState, useEffect } from 'react';
import FroalaEditorComponent from "react-froala-wysiwyg";
import GroupService from "../../../services/GroupService";
import TypeGroupService from "../../../services/TypeGroupService";
import HomeService from "../../../services/HomeService";
import Swal from "sweetalert2";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedGroup: any;
}

export default function GroupsModal({ isOpen, onClose, onSuccess, selectedGroup }: Props) {
    const [formData, setFormData] = useState({
        name: '',
        activity: '',
        description: '',
        schedules: '',
        typegroup: '' ,
        id_home: ''
    });
    
    // Estado para capturar la lista de errores
    const [errors, setErrors] = useState<string[]>([]);
    const [typeGroups, setTypeGroups] = useState([]);
    const [homes, setHomes] = useState([]);

    useEffect(() => {
        const loadTypes = async () => {
            try {
                const types = await TypeGroupService.getAll();
                setTypeGroups(types);
            } catch (error) {
                console.error("Error cargando tipos:", error);
            }
        };
        if (isOpen) loadTypes();
    }, [isOpen]);


    useEffect(() => {
        const loadHomes = async () => {
            try {
                const homes = await HomeService.getAllHomes();
                setHomes(homes);
            } catch (error) {
                console.error("Error cargando casas:", error);
            }
        };
        if (isOpen) loadHomes();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setErrors([]); // Limpiar errores al abrir el modal
            if (selectedGroup) {
                setFormData({
                    name: selectedGroup.name || '',
                    activity: selectedGroup.activity || '',
                    description: selectedGroup.description || '',
                    schedules: selectedGroup.schedules || '',
                    typegroup: selectedGroup.type_group_id || selectedGroup.typegroup?.id || selectedGroup.typegroup || ''
                });
            } else {
                setFormData({ name: '', activity: '', description: '', schedules: '', typegroup: '' });
            }
        }
    }, [selectedGroup, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditorChange = (model: string) => {
        setFormData(prev => ({ ...prev, description: model }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- VALIDACIÓN DE CAMPOS ---
        const missingFields: string[] = [];
        if (!formData.name.trim()) missingFields.push("Nombre del Grupo");
        if (!formData.typegroup) missingFields.push("Tipo de Grupo");
        if (!formData.id_home) missingFields.push("Fraternidad");
        if (!formData.activity.trim()) missingFields.push("Actividad Principal");
        if (!formData.schedules.trim()) missingFields.push("Contacto (Teléfono/Email)");
        // Validación para Froala (evitar que se guarde vacío o solo con etiquetas de párrafo vacías)
        if (!formData.description.trim() || formData.description === "<p><br></p>") {
            missingFields.push("Descripción Detallada");
        }

        if (missingFields.length > 0) {
            setErrors(missingFields);
            // Scroll al inicio del modal para ver la alerta
            const modalBody = document.querySelector('.overflow-y-auto');
            if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setErrors([]); 
        let responseStatus; 

        try {
            if (selectedGroup) {
                responseStatus = await GroupService.update(selectedGroup.id, formData);
            } else {
                responseStatus = await GroupService.create(formData);
            }

            if (responseStatus && responseStatus.success) {
                Swal.fire({
                    title: selectedGroup ? '¡Actualizado!' : '¡Creado!',
                    text: selectedGroup ? 'El grupo se actualizó correctamente' : 'El grupo se creó correctamente',
                    icon: "success",
                    confirmButtonColor: '#3085d6',
                });
                onSuccess(); 
                onClose();
            }
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'No se pudo procesar la solicitud', icon: "error" });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-capuchinos fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-semibold dark:text-white">
                        {selectedGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* --- ALERTA DE CAMPOS FALTANTES --- */}
                {errors.length > 0 && (
                    <div className="px-6 pt-4">
                        <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-gray-700 dark:text-yellow-300 dark:border-yellow-800" role="alert">
                            <div className="flex items-center font-bold mb-1">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                Faltan los siguientes campos obligatorios:
                            </div>
                            <ul className="list-disc list-inside">
                                {errors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nombre del Grupo *</label>
                            <input 
                                type="text" 
                                name="name" 
                                placeholder='Nombre del Grupo'
                                value={formData.name} 
                                onChange={handleChange} 
                                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.includes("Nombre del Grupo") ? 'border-red-500' : 'border-gray-300'}`} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tipo de Grupo *</label>
                            <select 
                                name="typegroup" 
                                value={formData.typegroup} 
                                onChange={handleChange} 
                                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.includes("Tipo de Grupo") ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Seleccione un tipo</option>
                                {typeGroups.map((t: any) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fraternidad *</label>
                        <select 
                            name="id_home" 
                            value={formData.id_home}
                            onChange={handleChange} 
                            className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.includes("Fraternidad") ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <option value="">Seleccione una Fraternidad</option>
                            {homes.map((h: any) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Actividad Principal *</label>
                        <input 
                            type="text" 
                            name="activity" 
                            placeholder='Actividad Principal'
                            value={formData.activity} 
                            onChange={handleChange} 
                            className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.includes("Actividad Principal") ? 'border-red-500' : 'border-gray-300'}`} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300 text-fg-default">Contacto (Teléfono/Email) *</label>
                        <input 
                            type="text" 
                            name="schedules" 
                            placeholder='Contacto (Teléfono/Email)'
                            value={formData.schedules} 
                            onChange={handleChange} 
                            className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.includes("Contacto (Teléfono/Email)") ? 'border-red-500' : 'border-gray-300'}`} 
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1 dark:text-gray-300 ${errors.includes("Descripción Detallada") ? 'text-red-600 font-bold' : ''}`}>Descripción Detallada *</label>
                        <div className={`rounded-lg overflow-hidden border ${errors.includes("Descripción Detallada") ? 'border-red-500' : 'border-gray-300'}`}>
                            <FroalaEditorComponent
                                tag='textarea'
                                model={formData.description}
                                onModelChange={handleEditorChange}
                                config={{ 
                                    placeholderText: 'Escribe la descripción...', 
                                    language: 'es', 
                                    heightMin: 150,
                                    toolbarButtons: ['bold', 'italic', 'underline', 'insertLink', 'formatOL', 'formatUL']
                                }}
                            />
                        </div>
                    </div>

                    {/* Footer / Botones */}
                    <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95">
                            {selectedGroup ? 'Actualizar Grupo' : 'Guardar Grupo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}