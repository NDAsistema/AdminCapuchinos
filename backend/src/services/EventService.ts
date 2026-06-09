import { pool } from '../config/database';
import { CalendarModel } from '../models/CalendarModel';
import { EventModel, CalendarEvent } from '../models/EventModel';
import { EventExceptionModel } from '../models/EventExceptionModel';
import { EventReminderModel } from '../models/EventReminderModel';
import { CalendarService } from './CalendarService';
import { NotificationService } from './NotificationService';
import { expandEventOccurrences, buildInstanceId } from '../utils/recurrenceUtils';

interface AuthUser {
    id: number;
    id_brother: number | null;
    type_user: number;
    name_brother?: string;
}

interface EventInput {
    calendar_id: number;
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
    all_day?: boolean;
    is_recurring?: boolean;
    recurrence_rule?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurrence_interval?: number;
    recurrence_end_date?: string;
    recurrence_count?: number;
    recurrence_days?: string;
    reminders?: number[];
}

interface ExceptionInput {
    original_start_at: string;
    exception_type: 'deleted' | 'modified';
    override_title?: string;
    override_description?: string;
    override_start_at?: string;
    override_end_at?: string;
    override_all_day?: boolean;
}

function formatDateTime(d: Date | string): string {
    if (typeof d === 'string') return d.slice(0, 19).replace('T', ' ');
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export class EventService {
    static async listInRange(
        user: AuthUser,
        start: string,
        end: string,
        calendarId?: number
    ) {
        let calendarIds = await CalendarService.getVisibleCalendarIds(user);

        if (calendarId) {
            const canView = await CalendarModel.userCanView(calendarId, user.id, user.id_brother);
            if (!canView && user.type_user !== 1) {
                throw new Error('No autorizado');
            }
            calendarIds = calendarIds.includes(calendarId) ? [calendarId] : [];
        }

        if (calendarIds.length === 0) return [];

        const rangeStart = new Date(start);
        const rangeEnd = new Date(end);
        const instances: any[] = [];

        const simpleEvents = await EventModel.findSimpleInRange(calendarIds, start, end);
        for (const ev of simpleEvents) {
            instances.push(this.toInstance(ev, formatDateTime(ev.start_at), formatDateTime(ev.end_at), false));
        }

        const masters = await EventModel.findRecurringMasters(calendarIds);
        const masterIds = masters.map((m: { id: number }) => m.id);
        const exceptions = await EventExceptionModel.findByEventIds(masterIds);
        const exceptionMap = new Map<string, any>();

        for (const ex of exceptions) {
            const key = `${ex.event_id}_${formatDateTime(ex.original_start_at)}`;
            exceptionMap.set(key, ex);
        }

        for (const master of masters) {
            if (!master.recurrence_rule) continue;

            const masterStart = new Date(master.start_at);
            if (master.recurrence_end_date) {
                const recEnd = new Date(master.recurrence_end_date);
                if (recEnd < rangeStart) continue;
            }
            if (masterStart > rangeEnd) continue;

            const occurrences = expandEventOccurrences(master, rangeStart, rangeEnd);

            for (const occ of occurrences) {
                const key = `${master.id}_${occ.originalStartAt}`;
                const ex = exceptionMap.get(key);

                if (ex?.exception_type === 'deleted') continue;

                if (ex?.exception_type === 'modified') {
                    instances.push(
                        this.toInstance(
                            {
                                ...master,
                                title: ex.override_title ?? master.title,
                                description: ex.override_description ?? master.description,
                                all_day: ex.override_all_day ?? master.all_day,
                            },
                            formatDateTime(ex.override_start_at ?? occ.startAt),
                            formatDateTime(ex.override_end_at ?? occ.endAt),
                            true,
                            occ.originalStartAt
                        )
                    );
                    continue;
                }

                instances.push(this.toInstance(master, occ.startAt, occ.endAt, false, occ.originalStartAt));
            }
        }

        return instances.sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );
    }

    private static toInstance(
        ev: any,
        startAt: string,
        endAt: string,
        isException: boolean,
        originalStartAt?: string
    ) {
        const orig = originalStartAt || startAt;
        const color = ev.calendar_color || '#465fff';
        return {
            id: buildInstanceId(ev.id, orig),
            eventId: ev.id,
            calendarId: ev.calendar_id,
            calendarName: ev.calendar_name,
            title: ev.title,
            description: ev.description,
            start: startAt,
            end: endAt,
            allDay: Boolean(ev.all_day),
            color,
            isRecurring: Boolean(ev.is_recurring),
            isException,
            originalStartAt: orig,
        };
    }

    static async getById(eventId: number, user: AuthUser) {
        const event = await EventModel.findById(eventId);
        if (!event) throw new Error('Evento no encontrado');

        const canView = await CalendarModel.userCanView(
            event.calendar_id,
            user.id,
            user.id_brother
        );
        if (!canView && user.type_user !== 1) {
            throw new Error('No autorizado');
        }

        const reminders = await EventReminderModel.findByEventId(eventId);
        const exceptions = await EventExceptionModel.findByEventIds([eventId]);
        const canManage = await CalendarModel.userCanManage(
            event.calendar_id,
            user.id,
            user.type_user,
            user.id_brother
        );

        return { ...event, reminders, exceptions, canManage };
    }

    static async create(data: EventInput, user: AuthUser) {
        const canManage = await CalendarModel.userCanManage(
            data.calendar_id,
            user.id,
            user.type_user,
            user.id_brother
        );
        if (!canManage) throw new Error('No autorizado');

        if (!data.title?.trim()) throw new Error('El título es requerido');
        if (!data.start_at || !data.end_at) throw new Error('Las fechas son requeridas');

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const eventId = await EventModel.create(
                {
                    calendar_id: data.calendar_id,
                    title: data.title.trim(),
                    description: data.description || null,
                    start_at: data.start_at,
                    end_at: data.end_at,
                    all_day: data.all_day,
                    is_recurring: data.is_recurring,
                    recurrence_rule: data.recurrence_rule || null,
                    recurrence_interval: data.recurrence_interval ?? 1,
                    recurrence_end_date: data.recurrence_end_date || null,
                    recurrence_count: data.recurrence_count ?? null,
                    recurrence_days: data.recurrence_days || null,
                    created_by: user.id,
                } as CalendarEvent,
                connection
            );

            if (data.reminders?.length) {
                await EventReminderModel.createMultiple(eventId, data.reminders, connection);
            }

            await NotificationService.notifyEventCreated({
                eventId,
                title: data.title.trim(),
                calendarId: data.calendar_id,
                creatorUserId: user.id,
                creatorName: user.name_brother,
                connection,
            });

            await connection.commit();
            return eventId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(eventId: number, data: EventInput, user: AuthUser) {
        const event = await EventModel.findById(eventId);
        if (!event) throw new Error('Evento no encontrado');

        const canManage = await CalendarModel.userCanManage(
            event.calendar_id,
            user.id,
            user.type_user,
            user.id_brother
        );
        if (!canManage) throw new Error('No autorizado');

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await EventModel.update(
                eventId,
                {
                    title: data.title?.trim() || event.title,
                    description: data.description ?? event.description,
                    start_at: data.start_at ?? event.start_at,
                    end_at: data.end_at ?? event.end_at,
                    all_day: data.all_day ?? event.all_day,
                    is_recurring: data.is_recurring ?? event.is_recurring,
                    recurrence_rule: data.recurrence_rule ?? event.recurrence_rule,
                    recurrence_interval: data.recurrence_interval ?? event.recurrence_interval,
                    recurrence_end_date: data.recurrence_end_date ?? event.recurrence_end_date,
                    recurrence_count: data.recurrence_count ?? event.recurrence_count,
                    recurrence_days: data.recurrence_days ?? event.recurrence_days,
                },
                connection
            );

            if (data.reminders) {
                await EventReminderModel.replaceAll(eventId, data.reminders, connection);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(eventId: number, user: AuthUser) {
        const event = await EventModel.findById(eventId);
        if (!event) throw new Error('Evento no encontrado');

        const canManage = await CalendarModel.userCanManage(
            event.calendar_id,
            user.id,
            user.type_user,
            user.id_brother
        );
        if (!canManage) throw new Error('No autorizado');

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await EventExceptionModel.softDeleteByEvent(eventId, connection);
            await EventReminderModel.softDeleteByEvent(eventId, connection);
            await EventModel.softDelete(eventId, connection);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async createException(eventId: number, data: ExceptionInput, user: AuthUser) {
        const event = await EventModel.findById(eventId);
        if (!event) throw new Error('Evento no encontrado');
        if (!event.is_recurring) throw new Error('Solo aplica a eventos recurrentes');

        const canManage = await CalendarModel.userCanManage(
            event.calendar_id,
            user.id,
            user.type_user,
            user.id_brother
        );
        if (!canManage) throw new Error('No autorizado');

        if (!data.original_start_at) throw new Error('original_start_at es requerido');

        const exceptionId = await EventExceptionModel.create({
            event_id: eventId,
            original_start_at: data.original_start_at,
            exception_type: data.exception_type,
            override_title: data.override_title,
            override_description: data.override_description,
            override_start_at: data.override_start_at,
            override_end_at: data.override_end_at,
            override_all_day: data.override_all_day,
            created_by: user.id,
        });

        return exceptionId;
    }

    static async deleteException(exceptionId: number, user: AuthUser) {
        const ex = await EventExceptionModel.findById(exceptionId);
        if (!ex) throw new Error('Excepción no encontrada');

        const event = await EventModel.findById(ex.event_id);
        if (!event) throw new Error('Evento no encontrado');

        const canManage = await CalendarModel.userCanManage(
            event.calendar_id,
            user.id,
            user.type_user,
            user.id_brother
        );
        if (!canManage) throw new Error('No autorizado');

        await EventExceptionModel.softDelete(exceptionId);
        return true;
    }
}
