import { useState, useEffect } from "react";
import AddressPicker from './AddressPicker';
import HomeService, { ListUser } from "../../services/homeService";
import FroalaEditorComponent from "react-froala-wysiwyg";
import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.min.css";
import "froala-editor/js/plugins.pkgd.min.js";
import "froala-editor/js/plugins/colors.min.js";
import "froala-editor/js/plugins/link.min.js";
import "froala-editor/js/plugins/font_family.min.js";
import "froala-editor/js/plugins/font_size.min.js";
import "froala-editor/js/plugins/lists.min.js";
import "froala-editor/js/plugins/paragraph_format.min.js";
import "froala-editor/js/plugins/align.min.js";
import "froala-editor/js/plugins/char_counter.min.js";
import "froala-editor/js/plugins/table.min.js";
import "froala-editor/js/plugins/image.min.js";
import "froala-editor/js/plugins/video.min.js";
import "froala-editor/js/plugins/emoticons.min.js";
import "froala-editor/js/plugins/fullscreen.min.js";
import "froala-editor/js/languages/es.js";

// Agrega esta interface que falta
interface HomeData {
    id?: number;
    name: string;
    guardian: number;
    parish_priest: number;
    founder: string;
    communication_user: number;
    history: string;
    state: string;
    city: string;
    location: string;
    contacts: string;
}

interface HomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: HomeData) => void;
    home?: HomeData | null;
    mode?: 'create' | 'edit';
}

// Interface para coordenadas
interface Coordinates {
    lat: number;
    lng: number;
}

const froalaConfig = {
    placeholderText: 'Escriba la historia de la fraternidad aquí...',
    charCounterCount: true,
    fontFamily: {
        "Arial,Helvetica,sans-serif": "Arial",
        "Georgia,serif": "Georgia",
        "Impact,Charcoal,sans-serif": "Impact",
        "Tahoma,Geneva,sans-serif": "Tahoma",
        "'Times New Roman',Times,serif": "Times New Roman",
        "Verdana,Geneva,sans-serif": "Verdana",
        "'Courier New',Courier,monospace": "Courier New",
        "'Open Sans',sans-serif": "Open Sans",
        "Roboto,sans-serif": "Roboto",
        "'Source Sans Pro',sans-serif": "Source Sans Pro"
    },
    fontSize: [
        "8px", "10px", "12px", "14px", "16px", "18px", "20px", 
        "24px", "28px", "32px", "36px", "48px", "72px"
    ],
    colorsBackground: [
        "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", 
        "#FFFF00", "#00FFFF", "#FF00FF", "#C0C0C0", "#808080",
        "#800000", "#808000", "#008000", "#800080", "#008080", 
        "#000080", "#FFA500", "#FFC0CB", "#FFD700", "#ADD8E6",
        "REMOVE"
    ],
    colorsText: [
        "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", 
        "#FFFF00", "#00FFFF", "#FF00FF", "#C0C0C0", "#808080",
        "#800000", "#808000", "#008000", "#800080", "#008080", 
        "#000080", "#FFA500", "#FFC0CB", "#FFD700", "#ADD8E6",
        "REMOVE"
    ],
    colorsStep: 5,
    colorsDefaultTab: 'text',
    linkAlwaysBlank: true,
    linkAlwaysNoFollow: false,
    linkList: [
        {
            text: 'Sitio Web Capuchinos',
            href: 'https://www.capuchinos.org',
            target: '_blank'
        },
        {
            text: 'Portal de Formación',
            href: 'https://formacion.capuchinos.org',
            target: '_blank'
        }
    ],
    toolbarButtons: {
        moreText: {
            buttons: [
                'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript',
                'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 
                'inlineClass', 'inlineStyle', 'clearFormatting'
            ],
            buttonsVisible: 6
        },
        moreParagraph: {
            buttons: [
                'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
                'formatOL', 'formatUL', 'paragraphFormat', 'paragraphStyle',
                'lineHeight', 'outdent', 'indent', 'quote'
            ]
        },
        moreRich: {
            buttons: [
                'insertLink', 'insertImage', 'insertVideo', 'insertTable',
                'emoticons', 'fontAwesome', 'specialCharacters', 'embedly',
                'insertFile', 'insertHR'
            ]
        },
        moreMisc: {
            buttons: [
                'undo', 'redo', 'fullscreen', 'print', 'getPDF', 'spellChecker',
                'selectAll', 'html', 'help'
            ]
        }
    },
    quickInsertButtons: ['table', 'ul', 'ol', 'hr', 'link'],
    paragraphFormat: {
        N: 'Normal',
        H1: 'Título 1',
        H2: 'Título 2',
        H3: 'Título 3',
        H4: 'Título 4',
        PRE: 'Código'
    },
    tableStyles: {
        'table-class-1': 'Tabla Estilo 1',
        'table-class-2': 'Tabla Estilo 2',
        'table-class-3': 'Tabla Estilo 3'
    },
    tableCellStyles: {
        'cell-class-1': 'Celda Estilo 1',
        'cell-class-2': 'Celda Estilo 2',
        'cell-class-3': 'Celda Estilo 3'
    },
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    imageMaxSize: 5 * 1024 * 1024,
    imageUploadMethod: 'POST',
    imageEditButtons: [
        'imageReplace', 'imageAlign', 'imageRemove', 'imageLink', 'imageDisplay', 'imageAlt',
        'imageSize'
    ],
    linkEditButtons: ['linkOpen', 'linkEdit', 'linkRemove'],
    linkAttributes: {
        target: '_blank',
        rel: 'nofollow'
    },
    events: {
        'image.beforeUpload': function (files: any) {
            if (files[0].size > this.opts.imageMaxSize) {
                throw new Error('La imagen es demasiado grande. Máximo 5MB permitido.');
            }
            return false;
        },
        'link.inserted': function (link: any) {
        },
        'contentChanged': function () {
        }
    },
    language: 'es',
    height: 300,
    heightMax: 500,
    spellcheck: true,
    useClasses: false,
    tabSpaces: false,
    toolbarSticky: true,
    toolbarStickyOffset: 70,
    attribution: false
};

export default function addhome({ 
    isOpen, 
    onClose, 
    onSave, 
    home = null,
    mode = 'create'
}: HomeModalProps) {
    const [formData, setFormData] = useState<HomeData>({
        name: "",
        guardian: 0,
        parish_priest: 0,
        founder: "",
        communication_user: 0,
        history: "",
        state: "",
        city: "",
        location: "",
        contacts: ""
    });

    // Estado para coordenadas
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

    const [guardians, setGuardians] = useState<ListUser[]>([]);
    const [loadingGuardians, setLoadingGuardians] = useState(false);
    const [parishPriests, setParishPriests] = useState<ListUser[]>([]);
    const [communicationUsers, setCommunicationUsers] = useState<ListUser[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadBrothers();
            
            if (home && mode === 'edit') {
                setFormData(home);
                // Extraer coordenadas si existen en location
                if (home.location) {
                    extractCoordinatesFromLocation(home.location);
                }
            } else {
                setFormData({
                    name: "",
                    guardian: 0,
                    parish_priest: 0,
                    founder: "",
                    communication_user: 0,
                    history: "",
                    state: "",
                    city: "",
                    location: "",
                    contacts: ""
                });
                setCoordinates(null);
            }
        }
    }, [home, mode, isOpen]);

    // Función para extraer coordenadas de location
    const extractCoordinatesFromLocation = (location: string) => {
        // Formato esperado: "Dirección (Lat: 10.123456, Lng: -66.123456)"
        const coordMatch = location.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)\)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            setCoordinates({ lat, lng });
        } else {
            setCoordinates(null);
        }
    };

    const loadBrothers = async () => {
        setLoadingGuardians(true);
        try {
            const listGuardian = await HomeService.findBrothersForGuardian();
            const listParishPriest = await HomeService.findBrothersForParishPriest();
            const listUserComunication = await HomeService.findBrothersForCommunicationUser();
            setGuardians(listGuardian);
            setParishPriests(listParishPriest);  
            setCommunicationUsers(listUserComunication);  
        } catch (error) {
            console.error('Error loading brothers:', error);
        } finally {
            setLoadingGuardians(false);
        }
    };

    const handleEditorChange = (content: string) => {
        setFormData(prev => ({ ...prev, history: content }));
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        
        if (type === 'number') {
            setFormData(prev => ({ 
                ...prev, 
                [name]: value === '' ? 0 : parseInt(value) 
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Función para manejar cambio de dirección
    const handleAddressChange = (address: string) => {
        setFormData(prev => ({ ...prev, location: address }));
    };

    // Función para manejar cambio de coordenadas
    const handleCoordinatesChange = (lat: number, lng: number) => {
        setCoordinates({ lat, lng });
        
        // Formatear la dirección con coordenadas
        const addressWithoutCoords = formData.location.replace(/\s*\(Lat:[\d.-]+,\s*Lng:[\d.-]+\)$/g, '').trim();
        const addressWithCoords = `${addressWithoutCoords} (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)})`;
        
        setFormData(prev => ({ ...prev, location: addressWithCoords }));
    };

    // Función para preparar datos antes de guardar
    const prepareDataForSave = (data: HomeData): HomeData => {
        // Asegurarnos de que la dirección tenga coordenadas si están disponibles
        if (coordinates && !data.location.includes('(Lat:')) {
            return {
                ...data,
                location: `${data.location.trim()} (Lat: ${coordinates.lat.toFixed(6)}, Lng: ${coordinates.lng.toFixed(6)})`
            };
        }
        return data;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = prepareDataForSave(formData);
        onSave(dataToSave);
        onClose();
    };

    if (!isOpen) return null;

    const title = mode === 'create' ? 'Crear Fraternidad' : 'Editar Fraternidad';
    const buttonText = mode === 'create' ? 'Guardar' : 'Actualizar';

    return (
        <div className="modal-capuchinos fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                
                {/* Header del Modal */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Nombre del Hogar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Hogar *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Hogar San Francisco"
                        />
                    </div>

                    {/* Guardián */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Guardián *
                        </label>
                        <select
                            name="guardian"
                            value={formData.guardian}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loadingGuardians}
                        >
                            <option value="0">Seleccione un guardián</option>
                            {loadingGuardians ? (
                                <option disabled>Cargando guardianes...</option>
                            ) : (
                                guardians.map(brother => (
                                    <option key={brother.id} value={brother.id}>
                                        {brother.name} - {brother.name_service}
                                    </option>
                                ))
                            )}
                        </select>
                        {guardians.length === 0 && !loadingGuardians && (
                            <p className="text-sm text-red-500 mt-1">No se pudieron cargar los guardianes</p>
                        )}
                    </div>

                    {/* Sacerdote Parroquial */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sacerdote Parroquial *
                        </label>
                        <select
                            name="parish_priest"
                            value={formData.parish_priest}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loadingGuardians}
                        >
                            <option value="0">Seleccione un sacerdote</option>
                            {loadingGuardians ? (
                                <option disabled>Cargando sacerdotes...</option>
                            ) : (
                                parishPriests.map(brother => (
                                    <option key={brother.id} value={brother.id}>
                                        {brother.name} - {brother.name_service}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Usuario de Comunicación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Responsable de Comunicación
                        </label>
                        <select
                            name="communication_user"
                            value={formData.communication_user}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loadingGuardians}
                        >
                            <option value="0">Seleccione responsable</option>
                            {loadingGuardians ? (
                                <option disabled>Cargando...</option>
                            ) : (
                                communicationUsers.map(brother => (
                                    <option key={brother.id} value={brother.id}>
                                        {brother.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Fundador */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fundador
                        </label>
                        <input
                            type="text"
                            name="founder"
                            value={formData.founder}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre del fundador"
                        />
                    </div>

                    {/* Ubicación */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Estado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado *
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Estado o Provincia"
                            />
                        </div>

                        {/* Ciudad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ciudad *
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ciudad"
                            />
                        </div>
                    </div>

                    {/* Address Picker MODIFICADO */}
                    <div>
                        <AddressPicker
                            value={formData.location}
                            onChange={handleAddressChange}
                            onCoordinatesChange={handleCoordinatesChange}
                            required={true}
                            initialCoordinates={coordinates} // PASA LAS COORDENADAS
                        />
                    </div>

                    {/* Historia */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Historia
                        </label>
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <FroalaEditorComponent
                                tag="textarea"
                                model={formData.history}
                                onModelChange={handleEditorChange}
                                config={froalaConfig}
                            />
                        </div>
                    </div>

                    {/* Contactos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contactos *
                        </label>
                        <textarea
                            name="contacts"
                            value={formData.contacts}
                            onChange={handleInputChange}
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder='teléfono/email/horarios'
                        />
                    </div>


                    {/* Botones */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {buttonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}