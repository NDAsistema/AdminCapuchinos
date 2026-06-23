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
import eventService, { type EventInput, type CalendarEventInstance, type RecurrenceRule } from "../../services/eventService";
import { type Calendar } from "../../services/calendarService";
import { getFroalaEditorConfig } from "../../config/froalaEditorConfig";

interface Props {
  isOpen: boolean;
  event: CalendarEventInstance | null;
  calendars: Calendar[];
  defaultStart?: string;
  defaultEnd?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REMINDER_OPTIONS = [
  { value: 15, label: "15 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 día antes" },
  { value: 10080, label: "1 semana antes" },
];

const WEEKDAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const WEEKDAY_NAMES = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

function parseStartDate(startAt: string): Date | null {
  if (!startAt) return null;
  const normalized = startAt.includes("T") ? startAt : `${startAt}T12:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** True si la fecha es el último [día de semana] de ese mes (ej. último viernes). */
function isLastWeekdayOfMonth(date: Date): boolean {
  const next = new Date(date);
  next.setDate(date.getDate() + 7);
  return next.getMonth() !== date.getMonth();
}

function encodeMonthlyFromStart(startAt: string): string | undefined {
  const date = parseStartDate(startAt);
  if (!date) return undefined;
  if (isLastWeekdayOfMonth(date)) {
    return `last:${date.getDay()}`;
  }
  return String(date.getDate());
}

function encodeYearlyFromStart(startAt: string): string | undefined {
  const date = parseStartDate(startAt);
  if (!date) return undefined;
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function encodeRecurrenceDays(
  rule: RecurrenceRule,
  startAt: string,
  weeklyDays: number[]
): string | undefined {
  switch (rule) {
    case "weekly":
      return weeklyDays.length ? weeklyDays.join(",") : undefined;
    case "monthly":
      return encodeMonthlyFromStart(startAt);
    case "yearly":
      return encodeYearlyFromStart(startAt);
    default:
      return undefined;
  }
}

function getRecurrenceHint(
  rule: RecurrenceRule,
  startAt: string,
  interval: number,
  recurrenceDays: number[]
): string {
  const date = parseStartDate(startAt);

  switch (rule) {
    case "weekly": {
      const selectedDays = recurrenceDays
        .slice()
        .sort((a, b) => a - b)
        .map((d) => WEEKDAYS.find((w) => w.value === d)?.label)
        .filter(Boolean)
        .join(", ");
      if (!selectedDays) return "Selecciona al menos un día de la semana.";
      return interval === 1
        ? `Se repite cada semana los: ${selectedDays}.`
        : `Se repite cada ${interval} semanas los: ${selectedDays}.`;
    }
    case "monthly":
      if (!date) return "Indica la fecha de inicio del evento.";
      if (isLastWeekdayOfMonth(date)) {
        return `Se repetirá el último ${WEEKDAY_NAMES[date.getDay()]} de cada mes.`;
      }
      return `Se repetirá el día ${date.getDate()} de cada mes.`;
    case "yearly":
      if (!date) return "Indica la fecha de inicio del evento.";
      return `Se repetirá cada año el ${date.getDate()} de ${MONTHS_ES[date.getMonth()]}.`;
    default:
      return "";
  }
}

function resolveWeeklyDays(startAt: string, recurrenceDays: number[]): number[] {
  if (recurrenceDays.length > 0) return recurrenceDays;
  const date = parseStartDate(startAt);
  return date ? [date.getDay()] : [];
}

function toLocalInput(iso: string, allDay: boolean): string {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T"));
  if (allDay) return d.toISOString().slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toApiDateTime(value: string, allDay: boolean, isEnd = false): string {
  if (allDay) return `${value}${isEnd ? " 23:59:59" : " 00:00:00"}`;
  return value.replace("T", " ") + ":00";
}

function isEmptyHtml(html: string): boolean {
  return !html || html === "<p><br></p>" || html === "<p></p>";
}

export default function EventModal({
  isOpen,
  event,
  calendars,
  defaultStart,
  defaultEnd,
  onClose,
  onSuccess,
}: Props) {
  const [calendarId, setCalendarId] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [reminders, setReminders] = useState<number[]>([60]);
  const [editScope, setEditScope] = useState<"instance" | "series" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editorKey, setEditorKey] = useState(0);

  const manageableCalendars = useMemo(
    () => calendars.filter((c) => c.canManage !== false),
    [calendars]
  );

  const froalaConfig = useMemo(
    () => getFroalaEditorConfig("Escriba la descripción del evento aquí..."),
    []
  );

  const recurrenceHint = useMemo(
    () => getRecurrenceHint(recurrenceRule, startAt, recurrenceInterval, recurrenceDays),
    [recurrenceRule, startAt, recurrenceInterval, recurrenceDays]
  );

  useEffect(() => {
    if (!isOpen || !isRecurring || recurrenceRule !== "weekly" || !startAt) return;
    setRecurrenceDays((prev) => {
      if (prev.length > 0) return prev;
      const date = parseStartDate(startAt);
      return date ? [date.getDay()] : prev;
    });
  }, [isOpen, isRecurring, recurrenceRule, startAt]);

  useEffect(() => {
    if (!isOpen) return;

    const manageable = calendars.filter((c) => c.canManage !== false);

    if (event) {
      setCalendarId(event.calendarId);
      setTitle(event.title);
      setDescription(event.description ?? "");
      setAllDay(event.allDay);
      setStartAt(toLocalInput(event.start, event.allDay));
      setEndAt(toLocalInput(event.end, event.allDay));
      setIsRecurring(event.isRecurring);
      setEditScope(event.isRecurring ? null : "series");
    } else {
      setCalendarId(manageable[0]?.id ?? 0);
      setTitle("");
      setDescription("");
      setAllDay(false);
      setStartAt(defaultStart ? toLocalInput(defaultStart, false) : "");
      setEndAt(defaultEnd ? toLocalInput(defaultEnd, false) : "");
      setIsRecurring(false);
      setRecurrenceRule("weekly");
      setRecurrenceInterval(1);
      setRecurrenceEndDate("");
      setRecurrenceDays([]);
      setReminders([60]);
      setEditScope(null);
    }
    setError("");
    setEditorKey((k) => k + 1);
  }, [isOpen, event, defaultStart, defaultEnd, calendars]);

  const toggleDay = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleRecurrenceRuleChange = (rule: RecurrenceRule) => {
    setRecurrenceRule(rule);
    if (rule === "weekly") {
      const date = parseStartDate(startAt);
      setRecurrenceDays(date ? [date.getDay()] : []);
      setRecurrenceInterval(1);
    } else {
      setRecurrenceDays([]);
      setRecurrenceInterval(1);
    }
  };

  const buildPayload = (): EventInput => {
    const weeklyDays = resolveWeeklyDays(startAt, recurrenceDays);

    return {
      calendar_id: calendarId,
      title: title.trim(),
      description: isEmptyHtml(description) ? undefined : description,
      start_at: toApiDateTime(startAt, allDay),
      end_at: toApiDateTime(endAt, allDay, true),
      all_day: allDay,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? recurrenceRule : undefined,
      recurrence_interval: isRecurring ? recurrenceInterval : undefined,
      recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
      recurrence_days: isRecurring
        ? encodeRecurrenceDays(recurrenceRule, startAt, weeklyDays)
        : undefined,
      reminders,
    };
  };

  const handleSave = async () => {
    if (!title.trim() || !calendarId || !startAt || !endAt) {
      setError("Completa título, calendario y fechas");
      return;
    }

    if (event?.isRecurring && editScope === null) {
      setError("Selecciona si editas solo esta ocurrencia o toda la serie");
      return;
    }

    if (isRecurring) {
      if (recurrenceRule === "weekly") {
        if (recurrenceInterval < 1) {
          setError("El intervalo debe ser al menos 1");
          return;
        }
        if (resolveWeeklyDays(startAt, recurrenceDays).length === 0) {
          setError("Selecciona al menos un día de la semana");
          return;
        }
      }
      if (
        (recurrenceRule === "monthly" || recurrenceRule === "yearly") &&
        !parseStartDate(startAt)
      ) {
        setError("Indica la fecha de inicio para calcular la repetición");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      if (event && event.isRecurring && editScope === "instance") {
        await eventService.createException(event.eventId, {
          original_start_at: event.originalStartAt,
          exception_type: "modified",
          override_title: title.trim(),
          override_description: isEmptyHtml(description) ? undefined : description,
          override_start_at: toApiDateTime(startAt, allDay),
          override_end_at: toApiDateTime(endAt, allDay, true),
          override_all_day: allDay,
        });
      } else if (event) {
        await eventService.update(event.eventId, buildPayload());
      } else {
        await eventService.create(buildPayload());
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Error al guardar evento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!window.confirm("¿Eliminar este evento?")) return;

    setSaving(true);
    try {
      if (event.isRecurring) {
        const scope = editScope ?? (window.confirm("¿Eliminar solo esta ocurrencia? (Cancelar = toda la serie)") ? "instance" : "series");
        if (scope === "instance") {
          await eventService.createException(event.eventId, {
            original_start_at: event.originalStartAt,
            exception_type: "deleted",
          });
        } else {
          await eventService.delete(event.eventId);
        }
      } else {
        await eventService.delete(event.eventId);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Error al eliminar");
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
          {event ? "Editar evento" : "Nuevo evento"}
        </h3>

        {event?.isRecurring && editScope === null && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="mb-2 text-sm text-amber-800 dark:text-amber-200">Este evento es recurrente. ¿Qué deseas editar?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditScope("instance")} className="rounded bg-white px-3 py-1 text-sm border dark:bg-gray-800 dark:border-gray-600">
                Solo esta ocurrencia
              </button>
              <button type="button" onClick={() => setEditScope("series")} className="rounded bg-brand-500 px-3 py-1 text-sm text-white">
                Toda la serie
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Calendario</label>
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(Number(e.target.value))}
              disabled={!!event && editScope === "instance"}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {manageableCalendars.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Inicio</label>
              <input type={allDay ? "date" : "datetime-local"} value={startAt} onChange={(e) => setStartAt(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Fin</label>
              <input type={allDay ? "date" : "datetime-local"} value={endAt} onChange={(e) => setEndAt(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            Todo el día
          </label>

          {!event && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                Evento recurrente
              </label>

              {isRecurring && (
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Repetir:</label>
                    <select
                      value={recurrenceRule}
                      onChange={(e) => handleRecurrenceRuleChange(e.target.value as RecurrenceRule)}
                      className="h-9 rounded border px-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <option value="weekly">Por semana</option>
                      <option value="monthly">Por mes</option>
                      <option value="yearly">Por año</option>
                    </select>

                    {recurrenceRule === "weekly" && (
                      <>
                        <span className="text-sm text-gray-600 dark:text-gray-400">— cada</span>
                        <input
                          type="number"
                          min={1}
                          value={recurrenceInterval}
                          onChange={(e) =>
                            setRecurrenceInterval(Math.max(1, Number(e.target.value) || 1))
                          }
                          className="h-9 w-20 rounded border px-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {recurrenceInterval === 1 ? "semana" : "semanas"}
                        </span>
                      </>
                    )}
                  </div>

                  {recurrenceRule === "weekly" && (
                    <div>
                      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        Días de la semana:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map((d) => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleDay(d.value)}
                            className={`rounded px-2 py-1 text-xs ${
                              recurrenceDays.includes(d.value)
                                ? "bg-brand-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {recurrenceHint}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                      Repetir hasta (opcional)
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="h-9 w-full rounded border px-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {editScope === "series" && event && (
            <p className="text-xs text-gray-500">Editando toda la serie recurrente</p>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Recordatorios</label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((r) => (
                <label key={r.value} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={reminders.includes(r.value)}
                    onChange={(e) =>
                      setReminders((prev) =>
                        e.target.checked ? [...prev, r.value] : prev.filter((v) => v !== r.value)
                      )
                    }
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-between">
          {event ? (
            <button type="button" onClick={handleDelete} disabled={saving} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600">
              Eliminar
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-300">Cancelar</button>
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
