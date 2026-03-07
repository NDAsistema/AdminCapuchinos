import React, { useState, useEffect } from 'react';
import FroalaEditorComponent from "react-froala-wysiwyg";
import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.min.css";
import "froala-editor/js/plugins.pkgd.min.js";
import "froala-editor/js/languages/es.js";
import TypeGroupService from "../../../services/TypeGroupService";

interface TypeGroup {
    id?: number;
    name: string;
    activity: string;
    img?: string;
}

interface TypeGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedGroup: TypeGroup | null;
}

export const TypeGroupModal: React.FC<TypeGroupModalProps> = ({ isOpen, onClose, onSuccess, selectedGroup }) => {
    const [formData, setFormData] = useState({
        name: '',
        activity: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // Sincronización de datos al abrir para editar o crear nuevo
    useEffect(() => {
        if (isOpen) {
            if (selectedGroup) {
                setFormData({
                    name: selectedGroup.name,
                    activity: selectedGroup.activity || '',
                });
                setFile(null); // Resetear archivo al editar
            } else {
                setFormData({ name: '', activity: '' });
                setFile(null);
            }
        }
    }, [selectedGroup, isOpen]);

    // Manejador del editor Froala
    const handleEditorChange = (content: string) => {
        setFormData(prev => ({ ...prev, activity: content }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación básica en frontend
        if (!formData.name.trim() || !formData.activity.trim()) {
            alert("El nombre y la actividad son obligatorios");
            return;
        }

        setLoading(true);
        
        // Creamos el FormData para enviar archivos y texto
        const data = new FormData();
        data.append('name', formData.name);
        data.append('activity', formData.activity);
        
        // Si hay un archivo seleccionado, se adjunta
        if (file) {
            data.append('img', file); 
        }

        try {
            if (selectedGroup?.id) {
                // Modo Edición
                await TypeGroupService.update(selectedGroup.id, data);
            } else {
                // Modo Creación
                await TypeGroupService.create(data);
            }
            
            onSuccess(); // Refrescar lista en el componente padre
            onClose();   // Cerrar modal
        } catch (error: any) {
            console.error("Error al guardar tipo de grupo:", error);
            alert(error.response?.data?.message || "Error al procesar la solicitud");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 modal-capuchinos">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[95vh]">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                    {selectedGroup ? 'Editar Tipo de Grupo' : 'Nuevo Tipo de Grupo'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del tipo de grupo</label>
                        <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Grupo de Oración"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>

                    {/* Editor de Actividad (Froala) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actividad / Descripción</label>
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <FroalaEditorComponent
                                tag="textarea"
                                model={formData.activity}
                                onModelChange={handleEditorChange}
                                config={{
                                    placeholderText: 'Escriba la descripción de la actividad aquí...',
                                    language: 'es',
                                    height: 250,
                                    attribution: false,
                                    toolbarButtons: [
                                        'bold', 'italic', 'underline', '|', 
                                        'formatOL', 'formatUL', '|', 
                                        'insertLink', 'undo', 'redo'
                                    ],
                                }}
                            />
                        </div>
                    </div>

                    {/* Campo Imagen / Icono */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Icono / Imagen Representativa</label>
                        {selectedGroup?.img && !file && (
                            <div className="mb-2">
                                <p className="text-xs text-gray-500 mb-1">Imagen actual:</p>
                                <img 
                                    src={selectedGroup.img} 
                                    alt="Actual" 
                                    className="h-12 w-12 object-cover rounded border"
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-gray-400 mt-1 italic">Formatos permitidos: JPG, PNG. Máx 2MB.</p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-white rounded-md shadow-sm ${
                                loading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Procesando...
                                </span>
                            ) : (
                                selectedGroup ? 'Actualizar Cambios' : 'Guardar Tipo de Grupo'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};