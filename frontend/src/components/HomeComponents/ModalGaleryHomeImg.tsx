// components/HomeComponents/ModalGaleryHomeImg.tsx
import { useState, useEffect } from "react";
import HomeService, { GalleryImage } from "../../services/homeService";
import Swal from "sweetalert2";

interface ModalGaleryHomeImgProps {
    isOpen: boolean;
    onClose: () => void;
    homeId: number;
    homeName: string;
}

export default function ModalGaleryHomeImg({ 
    isOpen, 
    onClose, 
    homeId,
    homeName 
}: ModalGaleryHomeImgProps) {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    const [newImage, setNewImage] = useState<{
        file: File | null;
        orderimg: number;
    }>({
        file: null,
        orderimg: 1
    });

    // Cargar imágenes cuando se abre el modal
    useEffect(() => {
        if (isOpen && homeId) {
            getAllImgById(homeId);
        } else {
            // Resetear estado cuando se cierra
            setImages([]);
            setSelectedImage(null);
            setNewImage({ file: null, orderimg: 1 });
            setPreviewUrl(null);
        }
    }, [isOpen, homeId]);

    const getAllImgById = async (homeId: number) => {
        setLoading(true);
        try {
            const response = await HomeService.getAllImgById(homeId);
            if (response && Array.isArray(response)) {
                const sortedImages = response.sort((a, b) => a.orderimg - b.orderimg);
                setImages(sortedImages);
                // Actualizar próximo orderimg
                setNewImage(prev => ({ ...prev, orderimg: sortedImages.length + 1 }));
            }
        } catch (error) {
            console.error('Error al cargar imágenes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para subir nueva imagen - CORREGIDA
    // En tu componente ModalGaleryHomeImg.tsx - MODIFICAR LA FUNCIÓN handleUploadImage
    const handleUploadImage = async () => {
        if (!newImage.file) {
            alert("Por favor selecciona una imagen");
            return;
        }

        setUploading(true);

        try {
            const savedImg = await HomeService.createImgHome(
                homeId, 
                newImage.file, 
                newImage.orderimg
            );
            console.log('✅ Respuesta del servicio:', savedImg);
            if(savedImg.success){
                const updatedImages = [...images, savedImg.data].sort((a, b) => a.orderimg - b.orderimg);
                setImages(updatedImages);
                setNewImage({ file: null, orderimg: updatedImages.length + 1 });
                setPreviewUrl(null);
                Swal.fire({
                    icon: 'success',
                    title: '¡Imagen subida exitosamente!',
                    text: 'La imagen ha sido subida',
                    timer: 2000,
                    showConfirmButton: false
                });
            }else{
                Swal.fire({
                    icon: 'error',
                    title: '¡Error al subir la imagen!',
                    text: 'La imagen no ha sido subida',
                    timer: 2000,
                    showConfirmButton: false
                });
            }

        } catch (error: any) {
            console.error('❌ Error detallado:', error.response?.data || error.message);
            const serverMsg = error.response?.data?.message || 'Error desconocido';
            alert(`Error al subir: ${serverMsg}`);
        } finally {
            setUploading(false);
        }
    };

    // Función para eliminar imagen
    const handleDeleteImage = async (id: number) => {
        Swal.fire({
            title: '¿Estás seguro esta imagen?',
            text: 'No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo'
        }).then(async (result) => { 
            if (result.isConfirmed) {
                try {
                    const deleteImgHome = await HomeService.deleteImgHome(id);
                    if(deleteImgHome.success){
                        const updatedImages = images.filter(img => img.id !== id);
                        const reorderedImages = updatedImages
                            .map((img, index) => ({ ...img, orderimg: index + 1 }))
                            .sort((a, b) => a.orderimg - b.orderimg);
                        
                        setImages(reorderedImages);
                        
                        if (selectedImage?.id === id) {
                            setSelectedImage(null);
                        }
                        setNewImage(prev => ({ ...prev, orderimg: reorderedImages.length + 1 }));
                        
                        Swal.fire({
                            icon: 'success',
                            title: '¡Imagen eliminada!',
                            text: 'La imagen ha sido eliminada',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }else{
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo eliminar la imagen'
                        });
                    }
                } catch (error) {
                    console.error('Error al eliminar la imagen:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo eliminar la imagen'
                    });
                }
            }
        });
       
    };

    // Función para manejar selección de archivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tipo de archivo
            if (!file.type.match('image.*')) {
                alert('Por favor, selecciona solo archivos de imagen');
                return;
            }
            
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar los 5MB');
                return;
            }
            
            setNewImage(prev => ({ ...prev, file }));
            
            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Función para actualizar orderimg
    const updateImageOrder = (id: number, newOrder: number) => {
        if (newOrder < 1 || newOrder > images.length) return;
        
        const updatedImages = images.map(img => {
            if (img.id === id) {
                return { ...img, orderimg: newOrder };
            }
            return img;
        }).sort((a, b) => a.orderimg - b.orderimg);
        
        setImages(updatedImages);
      
    };


    if (!isOpen) return null;

    return (
        <div className="modal-capuchinos fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-70 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                
                {/* Header del Modal */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Galería de Imágenes
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Fraternidad: <span className="font-medium">{homeName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido principal */}
                <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
                    
                    {/* Columna izquierda - Subir nueva imagen */}
                    <div className="lg:w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                            Subir Nueva Imagen
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Preview de imagen seleccionada */}
                            {previewUrl && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Vista previa:
                                    </p>
                                    <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                        <img 
                                            src={previewUrl} 
                                            alt="Preview" 
                                            className="w-full h-48 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewImage(prev => ({ ...prev, file: null }));
                                                setPreviewUrl(null);
                                            }}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Selección de archivo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Seleccionar Imagen *
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        {newImage.file ? (
                                            <div className="space-y-2">
                                                <div className="text-green-600 dark:text-green-400">
                                                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium truncate">{newImage.file.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(newImage.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Haz clic para seleccionar una imagen
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    PNG, JPG, GIF (Máx. 5MB)
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                            
                            
                            {/* Botón para subir */}
                            <button
                                onClick={handleUploadImage}
                                disabled={uploading || !newImage.file}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Subir Imagen
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {/* Columna derecha - Galería de imágenes */}
                    <div className="lg:w-2/3 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                                Imágenes de la Fraternidad ({images.length})
                            </h3>
                            {loading && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Cargando...
                                </div>
                            )}
                        </div>
                        
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando imágenes...</p>
                            </div>
                        ) : images.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-4 text-gray-500">No hay imágenes en la galería</p>
                                <p className="text-sm text-gray-400 mt-1">Sube la primera imagen usando el formulario</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {images.map((image) => (
                                    <div 
                                        key={image.id}
                                        className={`relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow ${selectedImage?.id === image.id ? 'ring-2 ring-blue-500' : ''}`}
                                    >
                                        {/* Imagen */}
                                        <div 
                                            className="aspect-square overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-900"
                                            onClick={() => setSelectedImage(image)}
                                        >
                                            <img 
                                                src={image.url_img} 
                                                alt={`Imagen ${image.orderimg}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        
                                        {/* Overlay con información y controles */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">
                                                        Orden: {image.orderimg}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteImage(image.id);
                                                        }}
                                                        className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                                                        title="Eliminar imagen"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer del Modal */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {images.length} imagen{images.length !== 1 ? 'es' : ''} en la galería
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}