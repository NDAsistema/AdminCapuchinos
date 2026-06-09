import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg, DatesSetArg } from "@fullcalendar/core";
import PageMeta from "../components/common/PageMeta";
import calendarService, { type Calendar } from "../services/calendarService";
import eventService, { type CalendarEventInstance } from "../services/eventService";
import CalendarModal from "../components/calendar/CalendarModal";
import EventModal from "../components/calendar/EventModal";
import { usePermissions } from "../hooks/usePermissions";
import Swal from "sweetalert2";

const CalendarPage: React.FC = () => {
  const { isAdmin, isCommunications } = usePermissions();
  const canManage = isAdmin || isCommunications;

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<number[]>([]);
  const [events, setEvents] = useState<CalendarEventInstance[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventInstance | null>(null);
  const [defaultStart, setDefaultStart] = useState("");
  const [defaultEnd, setDefaultEnd] = useState("");

  const calendarRef = useRef<FullCalendar>(null);

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

  const handleDatesSet = (info: DatesSetArg) => {
    setDateRange({
      start: info.startStr.slice(0, 10),
      end: info.endStr.slice(0, 10),
    });
  };

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
      calendarRef.current?.getApi().unselect();
      await promptCreateCalendar();
      return;
    }

    setEditingEvent(null);
    setDefaultStart(start ?? "");
    setDefaultEnd(end ?? "");
    setEventModalOpen(true);
  };

  const handleDateSelect = (info: DateSelectArg) => {
    openNewEvent(info.startStr, info.endStr || info.startStr);
  };

  const handleEventClick = (info: EventClickArg) => {
    const props = info.event.extendedProps;
    const instance: CalendarEventInstance = {
      id: info.event.id,
      eventId: props.eventId,
      calendarId: props.calendarId,
      title: info.event.title,
      description: props.description,
      start: info.event.startStr,
      end: info.event.endStr ?? info.event.startStr,
      allDay: info.event.allDay,
      color: info.event.backgroundColor ?? "#465fff",
      isRecurring: props.isRecurring,
      isException: props.isException,
      originalStartAt: props.originalStartAt,
    };
    if (canManage && calendars.find((c) => c.id === instance.calendarId)?.canManage) {
      setEditingEvent(instance);
      setEventModalOpen(true);
    }
  };

  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: e.color,
    borderColor: e.color,
    extendedProps: {
      eventId: e.eventId,
      calendarId: e.calendarId,
      description: e.description,
      isRecurring: e.isRecurring,
      isException: e.isException,
      originalStartAt: e.originalStartAt,
    },
  }));

  const manageableCalendars = calendars.filter((c) => c.canManage);

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
          <div className="custom-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="es"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: canManage ? "dayGridMonth,timeGridWeek,timeGridDay addEventButton" : "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              customButtons={
                canManage
                  ? {
                      addEventButton: {
                        text: "Nuevo evento",
                        click: () => openNewEvent(),
                      },
                    }
                  : undefined
              }
              events={fcEvents}
              selectable={canManage}
              select={handleDateSelect}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              height="auto"
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
    </>
  );
};

export default CalendarPage;
