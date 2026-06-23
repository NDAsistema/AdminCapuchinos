import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import Calendar from "@toast-ui/calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import type { CalendarEventInstance } from "../../services/eventService";

export interface ToastCalendarSource {
  id: string;
  name: string;
  color: string;
}

export interface ToastCalendarHandle {
  prev: () => void;
  next: () => void;
  today: () => void;
  changeView: (view: "month" | "week" | "day") => void;
  getViewName: () => "month" | "week" | "day";
  getTitleDate: () => Date;
  clearSelection: () => void;
}

interface Props {
  calendarSources: ToastCalendarSource[];
  events: CalendarEventInstance[];
  canManage: boolean;
  onRangeChange: (start: string, end: string) => void;
  onEventClick: (event: CalendarEventInstance) => void;
  onSelectRange: (start: string, end: string, isAllday: boolean) => void;
}

function formatApiDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatApiDateTime(date: Date, isAllday: boolean): string {
  if (isAllday) return formatApiDate(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatApiDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function toTzDate(value: string): Date {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(normalized);
}

function syncCalendarHeight(el: HTMLElement, view: "month" | "week" | "day"): number {
  const width = el.clientWidth;
  if (width <= 0) return 720;

  if (view === "month") {
    const cellWidth = width / 7;
    return Math.round(Math.max(600, cellWidth * 6 + 31));
  }

  const viewportHeight = window.innerHeight - 220;
  return Math.round(Math.max(600, Math.min(900, viewportHeight)));
}

const ToastCalendarView = forwardRef<ToastCalendarHandle, Props>(function ToastCalendarView(
  { calendarSources, events, canManage, onRangeChange, onEventClick, onSelectRange },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<Calendar | null>(null);
  const handlersRef = useRef({ onRangeChange, onEventClick, onSelectRange, canManage });

  handlersRef.current = { onRangeChange, onEventClick, onSelectRange, canManage };

  const notifyRange = () => {
    const instance = calendarRef.current;
    if (!instance) return;
    const start = formatApiDate(instance.getDateRangeStart().toDate());
    const end = formatApiDate(instance.getDateRangeEnd().toDate());
    handlersRef.current.onRangeChange(start, end);
  };

  useImperativeHandle(ref, () => ({
    prev: () => {
      calendarRef.current?.prev();
      notifyRange();
    },
    next: () => {
      calendarRef.current?.next();
      notifyRange();
    },
    today: () => {
      calendarRef.current?.today();
      notifyRange();
    },
    changeView: (view) => {
      const instance = calendarRef.current;
      const el = containerRef.current;
      if (!instance || !el) return;
      instance.changeView(view);
      el.style.height = `${syncCalendarHeight(el, view)}px`;
      requestAnimationFrame(() => instance.render());
      notifyRange();
    },
    getViewName: () => calendarRef.current?.getViewName() ?? "month",
    getTitleDate: () => calendarRef.current?.getDate().toDate() ?? new Date(),
    clearSelection: () => calendarRef.current?.clearGridSelections(),
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new Calendar(containerRef.current, {
      defaultView: "month",
      useFormPopup: false,
      useDetailPopup: false,
      isReadOnly: false,
      gridSelection: canManage
        ? { enableClick: true, enableDblClick: false }
        : false,
      month: {
        dayNames: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        startDayOfWeek: 0,
        isAlways6Weeks: true,
      },
      week: {
        dayNames: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        startDayOfWeek: 0,
        hourStart: 6,
        hourEnd: 22,
      },
      calendars: calendarSources.map((c) => ({
        id: c.id,
        name: c.name,
        backgroundColor: c.color,
        borderColor: c.color,
        dragBackgroundColor: c.color,
        color: "#ffffff",
      })),
      theme: {
        common: {
          holiday: { color: "#ef4444" },
          saturday: { color: "#465fff" },
          today: { color: "#465fff" },
        },
      },
    });

    calendarRef.current = instance;

    instance.on("clickEvent", ({ event }) => {
      const raw = event.raw as CalendarEventInstance | undefined;
      if (raw) handlersRef.current.onEventClick(raw);
    });

    instance.on("selectDateTime", ({ start, end, isAllday }) => {
      if (!handlersRef.current.canManage) return;
      handlersRef.current.onSelectRange(
        formatApiDateTime(start, isAllday),
        formatApiDateTime(end, isAllday),
        isAllday
      );
      instance.clearGridSelections();
    });

    notifyRange();

    const syncLayout = () => {
      const el = containerRef.current;
      if (!el) return;
      const view = instance.getViewName();
      el.style.height = `${syncCalendarHeight(el, view)}px`;
      requestAnimationFrame(() => instance.render());
    };

    syncLayout();

    const resizeObserver = new ResizeObserver(syncLayout);
    resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", syncLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncLayout);
      instance.destroy();
      calendarRef.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = calendarRef.current;
    if (!instance) return;

    instance.setOptions({
      isReadOnly: !canManage,
      gridSelection: canManage
        ? { enableClick: true, enableDblClick: false }
        : false,
    });
  }, [canManage]);

  useEffect(() => {
    const instance = calendarRef.current;
    if (!instance) return;

    instance.setCalendars(
      calendarSources.map((c) => ({
        id: c.id,
        name: c.name,
        backgroundColor: c.color,
        borderColor: c.color,
        dragBackgroundColor: c.color,
        color: "#ffffff",
      }))
    );
  }, [calendarSources]);

  useEffect(() => {
    const instance = calendarRef.current;
    if (!instance) return;

    instance.clear();
    instance.createEvents(
      events.map((e) => ({
        id: e.id,
        calendarId: String(e.calendarId),
        title: e.title,
        start: toTzDate(e.start),
        end: toTzDate(e.end),
        isAllday: e.allDay,
        category: e.allDay ? "allday" : "time",
        raw: e,
      }))
    );
    instance.render();
  }, [events]);

  return (
    <div
      ref={containerRef}
      className="toast-calendar-capuchinos w-full"
    />
  );
});

export default ToastCalendarView;
