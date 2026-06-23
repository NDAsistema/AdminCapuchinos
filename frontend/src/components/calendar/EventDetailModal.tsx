import type { CalendarEventInstance } from "../../services/eventService";

interface Props {
  isOpen: boolean;
  event: CalendarEventInstance | null;
  calendarName?: string;
  calendarColor?: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onClose: () => void;
}

function parseDate(value: string): Date {
  return new Date(value.includes("T") ? value : value.replace(" ", "T"));
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatEventSchedule(event: CalendarEventInstance): string {
  const start = parseDate(event.start);
  const end = parseDate(event.end);

  if (event.allDay) {
    const startLabel = formatDateLong(start);
    const endLabel = formatDateLong(end);
    if (startLabel === endLabel) {
      return `${startLabel} · Todo el día`;
    }
    return `${startLabel} — ${endLabel} · Todo el día`;
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${formatDateLong(start)} · ${formatTime(start)} – ${formatTime(end)}`;
  }

  return `${formatDateLong(start)} ${formatTime(start)} — ${formatDateLong(end)} ${formatTime(end)}`;
}

function hasDescription(html?: string): boolean {
  if (!html) return false;
  const stripped = html.replace(/<[^>]*>/g, "").trim();
  return stripped.length > 0;
}

export default function EventDetailModal({
  isOpen,
  event,
  calendarName,
  calendarColor = "#465fff",
  canEdit,
  onEdit,
  onClose,
}: Props) {
  if (!isOpen || !event) return null;

  return (
    <div className="modal-capuchinos fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-gray-900 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              Detalle del evento
            </p>
            <h3 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white">
              {event.title}
            </h3>
            {calendarName && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: calendarColor }}
                />
                <span>{calendarName}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Fecha y hora
            </p>
            <p className="mt-1 text-sm capitalize text-gray-800 dark:text-gray-200">
              {formatEventSchedule(event)}
            </p>
          </div>

          {event.isRecurring && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Este evento forma parte de una serie recurrente.
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Descripción
            </p>
            {hasDescription(event.description) ? (
              <div
                className="prose prose-sm max-w-none rounded-lg border border-gray-200 bg-white p-4 dark:prose-invert dark:border-gray-700 dark:bg-gray-800/30"
                dangerouslySetInnerHTML={{ __html: event.description! }}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700">
                Sin descripción
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
            >
              Editar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
