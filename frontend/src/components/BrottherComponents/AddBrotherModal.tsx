import { useState, useEffect } from "react";
import brotherService from '../../services/brotherService';
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

interface BrotherData {
  id?: number;
  name: string;
  email: string;
  birth_date: string;
  study: string;
  cv: string;
  server: string;
  year_profession: string;
  img: File | null;
}

interface BrotherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BrotherData) => void;
  brother?: BrotherData | null;
  mode?: 'create' | 'edit';
}

const froalaConfig = {
    placeholderText: 'Escriba el curriculum vitae aquí...',
    charCounterCount: true,
    charCounterMax: 2000,
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
            console.log('Enlace insertado:', link.getAttribute('href'));
        },
        'contentChanged': function () {
            console.log('Contenido cambiado');
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

export default function BrotherModal({ 
  isOpen, 
  onClose, 
  onSave, 
  brother = null,
  mode = 'create' 
}: BrotherModalProps) {
  const [formData, setFormData] = useState<BrotherData>({
    name: "",
    email: "",
    birth_date: "",
    study: "",
    cv: "",
    server: "",
    year_profession: "",
    img: null
  });

  const [services, setServices] = useState<TypeUserService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadServices();
      
      if (brother && mode === 'edit') {
        setFormData(brother);
      } else {
        setFormData({
          name: "",
          email: "",
          birth_date: "",
          study: "",
          cv: "",
          server: "",
          year_profession: "",
          img: null
        });
      }
    }
  }, [brother, mode, isOpen]);

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const servicesData = await brotherService.getListTypeUserServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, cv: content }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, img: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const title = mode === 'create' ? 'Agregar Nuevo Hermano' : 'Editar Hermano';
  const buttonText = mode === 'create' ? 'Guardar' : 'Actualizar';

  return (
    <div className="modal-capuchinos fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Ingrese el nombre completo"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="ejemplo@email.com"
            />
          </div>

          {/* Fecha de Cumpleaños */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Cumpleaños
            </label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Estudios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estudios
            </label>
            <input
              type="text"
              name="study"
              value={formData.study}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Títulos académicos"
            />
          </div>

          {/* CV */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Curriculum Vitae
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden dark:border-gray-600">
              <FroalaEditorComponent
                tag="textarea"
                model={formData.cv}
                onModelChange={handleEditorChange}
                config={froalaConfig}
              />
            </div>
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Servicio *
            </label>
            <select
              name="server"
              value={formData.server}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleccione un servicio</option>
              {loadingServices ? (
                <option disabled>Cargando servicios...</option>
              ) : (
                services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))
              )}
            </select>
            {services.length === 0 && !loadingServices && (
              <p className="text-sm text-red-500 mt-1">No se pudieron cargar los servicios</p>
            )}
          </div>

          {/* Fecha Inicio Profesión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Inicio de Profesión
            </label>
            <input
              type="date"
              name="year_profession"
              value={formData.year_profession}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto de Perfil
            </label>
            <input
              type="file"
              name="img"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}