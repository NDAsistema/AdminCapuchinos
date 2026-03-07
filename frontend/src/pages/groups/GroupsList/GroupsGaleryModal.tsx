import { useState, useEffect } from "react";
import GroupService from "../../../services/GroupService"; 
import Swal from "sweetalert2";

interface ModalGaleryGroupImgProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: number;
    groupName: string;
}

export default function ModalGaleryGroupImg({ 
    isOpen, 
    onClose, 
    groupId,
    groupName 
}: ModalGaleryGroupImgProps) {
    // ESTADOS
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [newImage, setNewImage] = useState<{ file: File | null }>({ file: null });

    // 1. Cargar imágenes al abrir el modal
    useEffect(() => {
        if (isOpen && groupId) {
            loadImages();
        }
    }, [isOpen, groupId]);

    const loadImages = async () => {
        try {
            setLoading(true);
            // CORREGIDO: Usamos getAllImgById según el nuevo Service
            const response = await GroupService.getAllImgById(groupId);
            setImages(response || []);
        } catch (error) {
            console.error("Error cargando imágenes:", error);
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    // 2. Manejar la selección de archivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewImage({ file });
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    // 3. Subir la imagen al servidor
    const handleUploadImage = async () => {
        if (!newImage.file || !groupId) return;

        try {
            setUploading(true);
            
            await GroupService.createImgGroup(groupId, newImage.file, 0);

            Swal.fire({
                title: "¡Éxito!",
                text: "Imagen añadida a la galería",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

            setPreviewUrl(null);
            setNewImage({ file: null });
            loadImages(); 
        } catch (error: any) {
            console.error("Error al subir:", error);
            Swal.fire("Error", "No se pudo subir la imagen al servidor", "error");
        } finally {
            setUploading(false);
        }
    };

    // 4. Eliminar imagen
    const handleDeleteImage = async (imageId: number) => {
        const result = await Swal.fire({
            title: "¿Eliminar imagen?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            try {
                // CORREGIDO: Usamos deleteImgGroup según el nuevo Service
                const success = await GroupService.deleteImgGroup(imageId);
                if (success) {
                    loadImages();
                } else {
                    throw new Error("Error en la respuesta del servidor");
                }
            } catch (error) {
                Swal.fire("Error", "No se pudo eliminar la imagen", "error");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-capuchinos fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white text-gray-800">Galería del Grupo</h2>
                        <p className="text-sm text-gray-500 mt-1">Grupo: <span className="font-medium text-blue-500">{groupName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    
                    {/* Panel Izquierdo - Upload */}
                    <div className="lg:w-1/3 border-r dark:border-gray-700 p-6 bg-gray-50/30 dark:bg-gray-900/20 overflow-y-auto">
                        <h3 className="text-lg font-medium dark:text-white mb-4">Añadir Nueva Foto</h3>
                        
                        <div className="space-y-4">
                            {previewUrl ? (
                                <div className="relative rounded-xl overflow-hidden border-2 border-blue-400 shadow-md">
                                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                                    <button 
                                        onClick={() => {setNewImage({file: null}); setPreviewUrl(null);}}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <div className="text-center p-4">
                                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seleccionar imagen</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                                    </div>
                                </label>
                            )}

                            <button
                                onClick={handleUploadImage}
                                disabled={uploading || !newImage.file}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Subiendo...</span>
                                    </>
                                ) : "Guardar en Galería"}
                            </button>
                        </div>
                    </div>

                    {/* Panel Derecho - Grid de Imágenes */}
                    <div className="lg:w-2/3 p-6 overflow-y-auto bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium dark:text-white">Fotos en la Galería ({images.length})</h3>
                        </div>
                        
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-gray-500">Conectando con S3...</p>
                            </div>
                        ) : images.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl">
                                <div className="text-gray-300 dark:text-gray-600 mb-2">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="text-gray-500">No hay fotos registradas para este grupo.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {images.map((img) => (
                                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border dark:border-gray-700 shadow-sm bg-gray-100 dark:bg-gray-900">
                                        <img 
                                            src={img.url_img} 
                                            alt="Gallery item"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                            <button 
                                                onClick={() => handleDeleteImage(img.id)}
                                                className="p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                                                title="Eliminar de S3"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}