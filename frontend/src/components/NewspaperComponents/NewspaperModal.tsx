import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/js/plugins.pkgd.min.js'; 
import FroalaEditorComponent from 'react-froala-wysiwyg';
import NewspaperService from '../../services/newspaperServices';
import { API_URL } from '../../config/env';
import HomeService from '../../services/homeService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // Prop para recibir los datos al editar
}

export const NewspaperModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [typeNews, setTypeNews] = useState('0');
    const [typeAssing, setTypeAssing] = useState('0');
    const [idAssing, setIdAssing] = useState('0');
    const [image, setImage] = useState<File | null>(null);
    const [options, setOptions] = useState<{id: number, name: string}[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [touched, setTouched] = useState(false);
    const isEdit = !!initialData;

    const froalaConfig = {
        placeholderText: 'Escribe el contenido de la noticia aquí...',
        heightMin: 300,
        imageUploadURL: `${API_URL}/attachments/upload-newspaper-image`,
        imageUploadMethod: 'POST',
        imageUploadParam: 'file', 
        requestHeaders: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        toolbarButtons: [
            'bold', 'italic', 'underline', 'strikeThrough', '|', 
            'paragraphFormat', 'align', 'formatOL', 'formatUL', '|', 
            'insertLink', 'insertImage', 'insertVideo', 'embedly', 'insertFile', 'insertTable', '|', 
            'undo', 'redo', 'html'
        ],
        imageEditButtons: ['imageReplace', 'imageAlign', 'imageCaption', 'imageRemove', '|', 'imageLink', 'linkStyle', 'imageDisplay', 'imageStyle', 'imageAlt', 'imageSize'],
        imageInsertButtons: ['imageBack', '|', 'imageUpload', 'imageByURL'],
        events: {
            'image.error': function (error: any) {
                console.error('❌ Error en subida:', error);
                Swal.fire('Error', 'Hubo un problema al guardar la imagen en S3', 'error');
            }
        },
        charCounterCount: true,
        quickInsertEnabled: true
    };

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setTypeNews(String(initialData.type_news || '0'));
            setTypeAssing(String(initialData.type_assing || '0'));
            setIdAssing(String(initialData.sub_type_assing || '0'));
            setImage(null); 
        } else if (!isOpen) {
            setTitle(''); setContent(''); setTypeAssing('0'); 
            setIdAssing('0'); setImage(null); setOptions([]);
            setErrors([]); setTouched(false);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (typeAssing === '1') {
            HomeService.getAllHomes().then(res => {
                const homes = Array.isArray(res) ? res : res.data;
                setOptions(homes.map((h: any) => ({ id: h.id, name: h.name_home || h.name })));
            });
        } else {
            setOptions([]);
        }
    }, [typeAssing]);

    const validate = () => {
        const newErrors: string[] = [];
        if (!title.trim()) newErrors.push("Título de la noticia");
        if (!content.trim() || content === '<p></p>') newErrors.push("Contenido de la noticia");
        if (typeAssing !== '0' && idAssing === '0') newErrors.push("Destino de asignación");
        if (!isEdit && !image) newErrors.push("Imagen de portada");
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSave = async () => {
        setTouched(true); 
        if (!validate()) return; 

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('type_news', typeNews);
        formData.append('type_assing', typeAssing);
        formData.append('idAssing', idAssing);
        
        // Solo adjuntamos imagen si el usuario seleccionó una nueva
        if (image) {
            formData.append('image', image);
        }

        try {
            if (isEdit) {
                await NewspaperService.updateNews(initialData.id, formData);
                Swal.fire('¡Actualizado!', 'La noticia se actualizó correctamente', 'success');
            } else {
                await NewspaperService.createNews(formData);
                Swal.fire('¡Creado!', 'La noticia se publicó con éxito', 'success');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-capuchinos fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[95vh] overflow-y-auto">
                
                <div className="flex justify-between border-b pb-4 mb-4">
                    <h2 className="text-xl font-bold dark:text-white">
                        {isEdit ? 'Editar Noticia' : 'Crear Noticia'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 text-2xl hover:text-red-500 transition-colors">&times;</button>
                </div>

                {touched && errors.length > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl animate-fade-in">
                        <div className="flex items-center gap-2 text-orange-800 font-bold mb-2">
                            <span className="bg-orange-200 rounded-full w-5 h-5 flex items-center justify-center text-xs">i</span>
                            Campos requeridos:
                        </div>
                        <ul className="list-disc list-inside text-orange-700 text-sm ml-4">
                            {errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}

                <div className="space-y-4 text-left">
                    {/* Título */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${touched && !title ? 'text-red-600' : 'dark:text-gray-200'}`}>
                            Título *
                        </label>
                        <input 
                            className={`w-full p-2 border rounded-lg outline-none ${touched && !title ? 'border-red-500 bg-red-50' : 'dark:bg-gray-700 dark:border-gray-600'}`} 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                        />
                    </div>
                    
                    {/* Contenido Froala */}
                    <div> 
                        <label className={`block text-sm font-medium mb-1 ${touched && (!content || content === '<p></p>') ? 'text-red-600' : 'dark:text-gray-200'}`}>
                            Contenido *
                        </label>
                        <div className={`rounded-lg overflow-hidden border ${touched && (!content || content === '<p></p>') ? 'border-red-500 shadow-sm' : 'border-transparent'}`}>
                            <FroalaEditorComponent 
                                tag='textarea'
                                config={froalaConfig}
                                model={content}
                                onModelChange={(m: string) => setContent(m)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-200 mb-1">Categoría</label>
                            <select className="w-full p-2 border rounded-lg dark:bg-gray-700" value={typeNews} onChange={e => setTypeNews(e.target.value)}>
                                <option value="0">No Administrativa</option>
                                <option value="1">Administrativa</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-200 mb-1">Asignar a</label>
                            <select className="w-full p-2 border rounded-lg dark:bg-gray-700" value={typeAssing} onChange={e => setTypeAssing(e.target.value)}>
                                <option value="0">General (Todos)</option>
                                <option value="1">Casa</option>
                                <option value="2">Grupo</option>
                            </select>
                        </div>
                    </div>

                    {typeAssing !== '0' && (
                        <div className="animate-fade-in">
                            <label className={`block text-sm font-medium mb-1 ${touched && idAssing === '0' ? 'text-red-600' : 'dark:text-gray-200'}`}>
                                Seleccionar Destino *
                            </label>
                            <select 
                                className={`w-full p-2 border rounded-lg ${touched && idAssing === '0' ? 'border-red-500 bg-red-50' : 'dark:bg-gray-700'}`} 
                                value={idAssing} 
                                onChange={e => setIdAssing(e.target.value)}
                            >
                                <option value="0">Seleccionar...</option>
                                {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Imagen de Portada */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${touched && !image && !isEdit ? 'text-red-600' : 'dark:text-gray-200'}`}>
                            Imagen de portada {isEdit ? '(Opcional si no desea cambiarla)' : '*'}
                        </label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={e => setImage(e.target.files?.[0] || null)} 
                            className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold
                                ${touched && !image && !isEdit ? 'bg-red-50 border border-red-500 p-1 rounded-lg' : 'file:bg-blue-50 file:text-blue-700'}`} 
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 border-t pt-4">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors dark:bg-gray-700 dark:text-white">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
                        {isEdit ? 'Guardar Cambios' : 'Crear Noticia'}
                    </button>
                </div>
            </div>
        </div>
    );
};