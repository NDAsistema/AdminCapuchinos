import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
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
import SaintService, { type Saint } from "../../services/saintService";
import { API_URL } from "../../config/env";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Saint | null;
}

function toInputDate(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function isEmptyHtml(html: string): boolean {
  return !html || html === "<p></p>" || html === "<p><br></p>";
}

export default function SaintModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dateBirth, setDateBirth] = useState("");
  const [dateDeath, setDateDeath] = useState("");
  const [saintType, setSaintType] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const isEdit = !!initialData?.id;

  const froalaConfig = useMemo(
    () => ({
      placeholderText: "Escriba la biografía del santo aquí...",
      heightMin: 300,
      imageUploadURL: `${API_URL}/attachments/upload-saint-image`,
      imageUploadMethod: "POST" as const,
      imageUploadParam: "file",
      requestHeaders: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      toolbarButtons: [
        "bold", "italic", "underline", "strikeThrough", "|",
        "paragraphFormat", "align", "formatOL", "formatUL", "|",
        "insertLink", "insertImage", "insertVideo", "insertTable", "|",
        "undo", "redo", "html",
      ],
      charCounterCount: true,
      language: "es",
      events: {
        "image.error": () => {
          Swal.fire("Error", "Hubo un problema al guardar la imagen", "error");
        },
      },
    }),
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title ?? "");
      setContent(initialData.content ?? "");
      setDateBirth(toInputDate(initialData.date_birth));
      setDateDeath(toInputDate(initialData.date_death));
      setSaintType(String(initialData.type ?? 1));
    } else {
      setTitle("");
      setContent("");
      setDateBirth("");
      setDateDeath("");
      setSaintType("");
    }

    setImage(null);
    setErrors([]);
    setTouched(false);
    setEditorKey((k) => k + 1);
  }, [isOpen, initialData?.id]);

  const validate = () => {
    const newErrors: string[] = [];
    if (!title.trim()) newErrors.push("Nombre del santo");
    if (isEmptyHtml(content)) newErrors.push("Contenido / biografía");
    if (!isEdit && !image) newErrors.push("Imagen del santo");
    if (saintType !== "1" && saintType !== "2") newErrors.push("Tipo de santo");
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    setTouched(true);
    if (!validate()) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content);
    formData.append("type", saintType);
    if (dateBirth) formData.append("date_birth", dateBirth);
    if (dateDeath) formData.append("date_death", dateDeath);
    if (image) formData.append("image", image);

    setSaving(true);
    try {
      if (isEdit && initialData?.id) {
        await SaintService.update(initialData.id, formData);
        Swal.fire("¡Actualizado!", "El santo se actualizó correctamente", "success");
      } else {
        await SaintService.create(formData);
        Swal.fire("¡Creado!", "El santo se registró con éxito", "success");
      }
      onSuccess();
      onClose();
    } catch {
      Swal.fire("Error", "No se pudo guardar el santo", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-capuchinos fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between border-b pb-4 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {isEdit ? "Editar Santo" : "Crear Nuevo Santo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-red-500"
          >
            ×
          </button>
        </div>

        {touched && errors.length > 0 && (
          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
            <p className="mb-2 text-sm font-bold text-orange-800 dark:text-orange-200">
              Campos requeridos:
            </p>
            <ul className="list-inside list-disc text-sm text-orange-700 dark:text-orange-300">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Nombre del Santo *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del Santo"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                Fecha Nacimiento
              </label>
              <input
                type="date"
                value={dateBirth}
                onChange={(e) => setDateBirth(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                Fecha Muerte
              </label>
              <input
                type="date"
                value={dateDeath}
                onChange={(e) => setDateDeath(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Tipo de santo *
            </label>
            <select
              value={saintType}
              onChange={(e) => setSaintType(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Seleccione un tipo de santo</option>
              <option value="1">Santo</option>
              <option value="2">Beato</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Contenido *
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
              {isOpen && (
                <FroalaEditorComponent
                  key={`saint-editor-${editorKey}-${isEdit ? initialData?.id : "new"}`}
                  tag="textarea"
                  model={content}
                  onModelChange={setContent}
                  config={froalaConfig}
                />
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Imagen del Santo {isEdit ? "(opcional)" : "*"}
            </label>
            {isEdit && initialData?.img && !image && (
              <img
                src={initialData.img}
                alt={initialData.title}
                className="mb-2 h-24 w-24 rounded-lg object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-5 py-2 text-sm dark:border-gray-700 dark:text-gray-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Santo"}
          </button>
        </div>
      </div>
    </div>
  );
}
