import { useCallback, useEffect, useRef, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import calendarService, { type Calendar } from "../services/calendarService";
import eventService, { type CalendarEventInstance } from "../services/eventService";
import CalendarModal from "../components/calendar/CalendarModal";
import EventModal from "../components/calendar/EventModal";
import EventDetailModal from "../components/calendar/EventDetailModal";
import ToastCalendarView, {
  type ToastCalendarHandle,
} from "../components/calendar/ToastCalendarView";
import { usePermissions } from "../hooks/usePermissions";
import Swal from "sweetalert2";

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatTitle(date: Date, view: string): string {
  if (view === "day") {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return `${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`;
}

const CalendarPage: React.FC = () => {
  const { isAdmin, isCommunications } = usePermissions();
  const canManage = isAdmin || isCommunications;

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<number[]>([]);
  const [events, setEvents] = useState<CalendarEventInstance[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [viewLabel, setViewLabel] = useState("month");
  const [headerTitle, setHeaderTitle] = useState("");

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventInstance | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<CalendarEventInstance | null>(null);
  const [defaultStart, setDefaultStart] = useState("");
  const [defaultEnd, setDefaultEnd] = useState("");

  const toastRef = useRef<ToastCalendarHandle>(null);

  const loadCalendars = useCallback(async () => {
    try {
      const data = await calendarService.getAll();
      setCalendars(data);
      setSelectedCalendarIds((prev) =>
        prev.length ? prev.filter((id) => data.some((c) => c.id === id)) : data.map((c) => c.id)
      );
    } catch (err) {
      console.error("Error cargando calendarios:", err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    if (!dateRange.start || !dateRange.end || selectedCalendarIds.length === 0) {
      setEvents([]);
      return;
    }
    try {
      const data = await eventService.getInRange(
        dateRange.start,
        dateRange.end,
        selectedCalendarIds
      );
      setEvents(data);
    } catch (err) {
      console.error("Error cargando eventos:", err);
    }
  }, [dateRange, selectedCalendarIds]);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const updateHeader = useCallback(() => {
    const handle = toastRef.current;
    if (!handle) return;
    setViewLabel(handle.getViewName());
    setHeaderTitle(formatTitle(handle.getTitleDate(), handle.getViewName()));
  }, []);

  const handleRangeChange = useCallback((start: string, end: string) => {
    setDateRange({ start, end });
    requestAnimationFrame(updateHeader);
  }, [updateHeader]);

  const toggleCalendar = (id: number) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const promptCreateCalendar = async () => {
    const result = await Swal.fire({
      title: "Sin calendarios",
      text: "No tienes calendarios creados. Debes crear uno antes de agregar eventos.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Crear calendario",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#465fff",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      setEditingCalendar(null);
      setCalendarModalOpen(true);
    }
  };

  const openNewEvent = async (start?: string, end?: string) => {
    if (!canManage) return;

    const manageable = calendars.filter((c) => c.canManage);
    if (manageable.length === 0) {
      toastRef.current?.clearSelection();
      await promptCreateCalendar();
      return;
    }

    setEditingEvent(null);
    setDefaultStart(start ?? "");
    setDefaultEnd(end ?? "");
    setEventModalOpen(true);
  };

  const handleSelectRange = (start: string, end: string) => {
    openNewEvent(start, end || start);
  };

  const handleEventClick = (instance: CalendarEventInstance) => {
    const calendar = calendars.find((c) => c.id === instance.calendarId);
    if (canManage && calendar?.canManage) {
      setEditingEvent(instance);
      setEventModalOpen(true);
      return;
    }
    setViewingEvent(instance);
    setDetailModalOpen(true);
  };

  const openEditFromDetail = () => {
    if (!viewingEvent) return;
    setDetailModalOpen(false);
    setEditingEvent(viewingEvent);
    setEventModalOpen(true);
  };

  const visibleCalendars = calendars.filter((c) => selectedCalendarIds.includes(c.id));
  const toastSources = visibleCalendars.map((c) => ({
    id: String(c.id),
    name: c.name,
    color: c.color ?? "#465fff",
  }));

  const manageableCalendars = calendars.filter((c) => c.canManage);

  const toolbarBtn =
    "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";
  const toolbarBtnActive =
    "rounded-lg bg-brand-500 px-3 py-1.5 text-sm text-white hover:bg-brand-600";

  return (
    <>
      <PageMeta title="Calendario | AdminCapuchinos" description="Calendarios y eventos" />

      <div className="flex flex-col gap-4 xl:flex-row">
        <aside className="w-full shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] xl:w-64">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white">Calendarios</h3>
            {canManage && (
              <button
                type="button"
                onClick={() => { setEditingCalendar(null); setCalendarModalOpen(true); }}
                className="rounded-lg bg-brand-500 px-2 py-1 text-xs text-white hover:bg-brand-600"
              >
                + Nuevo
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {calendars.map((cal) => (
              <li key={cal.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCalendarIds.includes(cal.id)}
                  onChange={() => toggleCalendar(cal.id)}
                  className="rounded"
                />
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: cal.color ?? "#465fff" }}
                />
                <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                  {cal.name}
                </span>
                {cal.canManage && (
                  <button
                    type="button"
                    onClick={() => { setEditingCalendar(cal); setCalendarModalOpen(true); }}
                    className="text-xs text-brand-500 hover:underline"
                  >
                    Editar
                  </button>
                )}
              </li>
            ))}
            {calendars.length === 0 && (
              <p className="text-sm text-gray-500">No hay calendarios visibles</p>
            )}
          </ul>
        </aside>

        <div className="flex-1 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <button type="button" className={toolbarBtn} onClick={() => toastRef.current?.prev()}>
                ‹
              </button>
              <button type="button" className={toolbarBtn} onClick={() => toastRef.current?.next()}>
                ›
              </button>
              <button type="button" className={toolbarBtn} onClick={() => toastRef.current?.today()}>
                Hoy
              </button>
              <span className="ml-2 text-base font-semibold capitalize text-gray-800 dark:text-white">
                {headerTitle}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["month", "week", "day"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={viewLabel === v ? toolbarBtnActive : toolbarBtn}
                  onClick={() => toastRef.current?.changeView(v)}
                >
                  {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
                </button>
              ))}
              {canManage && (
                <button
                  type="button"
                  className={toolbarBtnActive}
                  onClick={() => openNewEvent()}
                >
                  Nuevo evento
                </button>
              )}
            </div>
          </div>

          <div className="p-2">
            <ToastCalendarView
              ref={toastRef}
              calendarSources={toastSources}
              events={events}
              canManage={canManage}
              onRangeChange={handleRangeChange}
              onEventClick={handleEventClick}
              onSelectRange={handleSelectRange}
            />
          </div>
        </div>
      </div>

      <CalendarModal
        isOpen={calendarModalOpen}
        calendar={editingCalendar}
        onClose={() => setCalendarModalOpen(false)}
        onSuccess={loadCalendars}
      />

      <EventModal
        isOpen={eventModalOpen}
        event={editingEvent}
        calendars={manageableCalendars.length ? manageableCalendars : calendars}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        onClose={() => setEventModalOpen(false)}
        onSuccess={loadEvents}
      />

      <EventDetailModal
        isOpen={detailModalOpen}
        event={viewingEvent}
        calendarName={
          viewingEvent?.calendarName ??
          calendars.find((c) => c.id === viewingEvent?.calendarId)?.name
        }
        calendarColor={
          viewingEvent?.color ??
          calendars.find((c) => c.id === viewingEvent?.calendarId)?.color ??
          "#465fff"
        }
        canEdit={
          !!viewingEvent &&
          canManage &&
          !!calendars.find((c) => c.id === viewingEvent.calendarId)?.canManage
        }
        onEdit={openEditFromDetail}
        onClose={() => setDetailModalOpen(false)}
      />
    </>
  );
};

export default CalendarPage;
