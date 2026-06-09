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
import calendarService, { type Calendar, type CalendarInput } from "../../services/calendarService";
import homeService from "../../services/homeService";
import GroupService from "../../services/GroupService";
import brotherService from "../../services/brotherService";
import { usePermissions } from "../../hooks/usePermissions";
import { getFroalaEditorConfig } from "../../config/froalaEditorConfig";

interface Props {
  isOpen: boolean;
  calendar: Calendar | null;
  onClose: () => void;
  onSuccess: () => void;
}

type AssignmentRow = { assigned_type: number; assigned_id: number; label: string };

const ASSIGNMENT_TYPES = [
  { value: 0, label: "Todos" },
  { value: 1, label: "Fraternidad" },
  { value: 2, label: "Grupo" },
  { value: 3, label: "Usuario" },
];

export default function CalendarModal({ isOpen, calendar, onClose, onSuccess }: Props) {
  const { isAdmin, isCommunications } = usePermissions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#465fff");
  const [assignType, setAssignType] = useState(0);
  const [assignTargetId, setAssignTargetId] = useState(0);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [homes, setHomes] = useState<{ id: number; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [brothers, setBrothers] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editorKey, setEditorKey] = useState(0);

  const froalaConfig = useMemo(
    () => getFroalaEditorConfig("Escriba la descripción del calendario aquí..."),
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    loadOptions();

    const loadCalendar = async () => {
      if (calendar?.id) {
        try {
          const full = await calendarService.getById(calendar.id);
          setName(full.name ?? "");
          setDescription(full.description ?? "");
          setColor(full.color ?? "#465fff");
          setAssignments(
            (full.assignments ?? []).map((a) => ({
              assigned_type: a.assigned_type,
              assigned_id: a.assigned_id,
              label: a.assigned_name ?? ASSIGNMENT_TYPES.find((t) => t.value === a.assigned_type)?.label ?? "",
            }))
          );
          return;
        } catch {
          /* fallback below */
        }
      }
      setName(calendar?.name ?? "");
      setDescription(calendar?.description ?? "");
      setColor(calendar?.color ?? "#465fff");
      setAssignments([]);
    };

    loadCalendar();
    setEditorKey((k) => k + 1);
  }, [isOpen, calendar]);

  const loadOptions = async () => {
    try {
      const homesData = await homeService.getAllHomes();
      setHomes(homesData.map((h: any) => ({ id: h.id, name: h.name })));

      const groupsData = isCommunications && !isAdmin
        ? await GroupService.findGroupsForCommunicationUser()
        : await GroupService.getAllGroups();
      setGroups((Array.isArray(groupsData) ? groupsData : []).map((g: any) => ({ id: g.id, name: g.name })));

      const brothersData = await brotherService.getAllBrothers();
      setBrothers((brothersData ?? []).map((b: any) => ({ id: b.id, name: b.name })));
    } catch (err) {
      console.error(err);
    }
  };

  const addAssignment = () => {
    if (assignType === 0) {
      if (assignments.some((a) => a.assigned_type === 0)) return;
      setAssignments([...assignments, { assigned_type: 0, assigned_id: 0, label: "Todos" }]);
      return;
    }
    if (!assignTargetId) return;
    const label =
      assignType === 1
        ? homes.find((h) => h.id === assignTargetId)?.name
        : assignType === 2
          ? groups.find((g) => g.id === assignTargetId)?.name
          : brothers.find((b) => b.id === assignTargetId)?.name;
    if (assignments.some((a) => a.assigned_type === assignType && a.assigned_id === assignTargetId)) return;
    setAssignments([...assignments, { assigned_type: assignType, assigned_id: assignTargetId, label: label ?? "" }]);
  };

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    const emptyHtml = !description || description === "<p><br></p>" || description === "<p></p>";
    const payload: CalendarInput = {
      name: name.trim(),
      description: emptyHtml ? undefined : description,
      color,
      assignments: assignments.length
        ? assignments.map((a) => ({ assigned_type: a.assigned_type, assigned_id: a.assigned_id }))
        : [{ assigned_type: 0, assigned_id: 0 }],
    };
    setSaving(true);
    setError("");
    try {
      if (calendar?.id) {
        await calendarService.update(calendar.id, payload);
      } else {
        await calendarService.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-capuchinos fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-gray-900 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          {calendar ? "Editar calendario" : "Nuevo calendario"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Descripción</label>
            <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
              <FroalaEditorComponent
                key={editorKey}
                tag="textarea"
                model={description}
                onModelChange={setDescription}
                config={froalaConfig}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Asignaciones</label>
            <div className="flex flex-wrap gap-2">
              <select
                value={assignType}
                onChange={(e) => setAssignType(Number(e.target.value))}
                className="h-9 rounded-lg border border-gray-300 px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {ASSIGNMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {assignType === 1 && (
                <select
                  value={assignTargetId}
                  onChange={(e) => setAssignTargetId(Number(e.target.value))}
                  className="h-9 flex-1 rounded-lg border border-gray-300 px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={0}>Seleccionar fraternidad</option>
                  {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              )}
              {assignType === 2 && (
                <select
                  value={assignTargetId}
                  onChange={(e) => setAssignTargetId(Number(e.target.value))}
                  className="h-9 flex-1 rounded-lg border border-gray-300 px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={0}>Seleccionar grupo</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              )}
              {assignType === 3 && (
                <select
                  value={assignTargetId}
                  onChange={(e) => setAssignTargetId(Number(e.target.value))}
                  className="h-9 flex-1 rounded-lg border border-gray-300 px-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={0}>Seleccionar usuario</option>
                  {brothers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
              <button
                type="button"
                onClick={addAssignment}
                className="rounded-lg bg-brand-500 px-3 py-1 text-sm text-white hover:bg-brand-600"
              >
                Agregar
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {assignments.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-sm dark:bg-gray-800">
                  <span>{ASSIGNMENT_TYPES.find((t) => t.value === a.assigned_type)?.label}: {a.label}</span>
                  <button type="button" onClick={() => removeAssignment(i)} className="text-red-500">×</button>
                </li>
              ))}
            </ul>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-300">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
