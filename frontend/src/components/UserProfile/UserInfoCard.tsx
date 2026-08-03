import { useEffect, useMemo, useState } from "react";
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
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "./AuthProvider";
import authService from "../../services/authService";
import AlertService from "../../services/alertService";
import { getFroalaEditorConfig } from "../../config/froalaEditorConfig";

function formatDate(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function displayDate(value?: string | null) {
  const formatted = formatDate(value);
  if (!formatted) return "—";
  const [y, m, d] = formatted.split("-");
  return `${d}/${m}/${y}`;
}

function hasCvContent(cv?: string | null) {
  if (!cv) return false;
  const text = cv.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length > 0;
}

export default function UserInfoCard() {
  const { user, updateUser } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const [saving, setSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    study: "",
    cv: "",
    birth_date: "",
    year_profession: "",
  });

  const froalaConfig = useMemo(
    () => getFroalaEditorConfig("Escriba su curriculum vitae aquí..."),
    []
  );

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name_brother || "",
      email: user.email || "",
      study: user.study || "",
      cv: user.cv || "",
      birth_date: formatDate(user.birth_date),
      year_profession: formatDate(user.year_profession),
    });
    if (isOpen) setEditorKey((k) => k + 1);
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      AlertService.warning("Campos requeridos", "Nombre y email son obligatorios");
      return;
    }

    try {
      setSaving(true);
      AlertService.loading("Guardando...");
      const updated = await authService.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        study: form.study,
        cv: form.cv,
        birth_date: form.birth_date || null,
        year_profession: form.year_profession || null,
      });
      updateUser(updated);
      AlertService.close();
      closeModal();
      await AlertService.success("Listo", "Tus datos personales se actualizaron");
    } catch (error: any) {
      AlertService.close();
      AlertService.error("Error", error.message || "No se pudieron guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Información personal
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nombre
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.name_brother || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.email || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Estudios
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.study || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Fecha de nacimiento
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {displayDate(user.birth_date)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Año de profesión
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {displayDate(user.year_profession)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              CV / Notas
            </p>
            {hasCvContent(user.cv) ? (
              <div
                className="fr-view text-sm text-gray-800 dark:text-white/90 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: user.cv || "" }}
              />
            ) : (
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">—</p>
            )}
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto shrink-0"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Editar
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar información personal
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Solo puedes actualizar tus datos personales.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="px-2 pb-3 overflow-y-auto custom-scrollbar max-h-[60vh]">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Nombre</Label>
                  <Input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Estudios</Label>
                  <Input
                    type="text"
                    name="study"
                    value={form.study}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Fecha de nacimiento</Label>
                  <Input
                    type="date"
                    name="birth_date"
                    value={form.birth_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Año de profesión</Label>
                  <Input
                    type="date"
                    name="year_profession"
                    value={form.year_profession}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2">
                  <Label>CV / Notas</Label>
                  <div className="overflow-hidden border border-gray-300 rounded-lg dark:border-gray-600">
                    <FroalaEditorComponent
                      key={editorKey}
                      tag="textarea"
                      model={form.cv}
                      onModelChange={(content: string) =>
                        setForm((prev) => ({ ...prev, cv: content }))
                      }
                      config={froalaConfig}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
