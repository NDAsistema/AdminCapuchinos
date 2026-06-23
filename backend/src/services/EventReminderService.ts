import { pool } from '../config/database';
import { EventModel } from '../models/EventModel';
import { EventReminderModel } from '../models/EventReminderModel';
import { CalendarAssignmentModel } from '../models/CalendarAssignmentModel';
import { NotificationModel } from '../models/NotificationModel';
import { expandEventOccurrences } from '../utils/recurrenceUtils';
import { EventExceptionModel } from '../models/EventExceptionModel';

function formatDateTime(d: Date | string): string {
    if (typeof d === 'string') return d.slice(0, 19).replace('T', ' ');
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export class EventReminderService {
    /** Resuelve user_ids destinatarios según asignaciones del calendario */
    static async resolveCalendarRecipientUserIds(
        calendarId: number,
        excludeUserId?: number
    ): Promise<number[]> {
        const assignments = await CalendarAssignmentModel.findByCalendarId(calendarId);
        const userIdSet = new Set<number>();

        for (const a of assignments) {
            let query = '';
            let params: any[] = [];

            if (a.assigned_type === 0) {
                query = 'SELECT id FROM users WHERE status = 1';
                if (excludeUserId) {
                    query += ' AND id != ?';
                    params.push(excludeUserId);
                }
            } else if (a.assigned_type === 1) {
                query = `SELECT DISTINCT u.id FROM users u
                         INNER JOIN releations_groups_brotthers rgb ON rgb.id_brotther = u.id_brother AND rgb.status = 1
                         INNER JOIN releations_home_groups rhg ON rhg.id_group = rgb.id_group AND rhg.id_home = ?
                         WHERE u.status = 1`;
                params = [a.assigned_id];
                if (excludeUserId) {
                    query += ' AND u.id != ?';
                    params.push(excludeUserId);
                }
            } else if (a.assigned_type === 2) {
                query = `SELECT DISTINCT u.id FROM users u
                         INNER JOIN releations_groups_brotthers rgb ON rgb.id_brotther = u.id_brother AND rgb.status = 1
                         WHERE u.status = 1 AND rgb.id_group = ?`;
                params = [a.assigned_id];
                if (excludeUserId) {
                    query += ' AND u.id != ?';
                    params.push(excludeUserId);
                }
            } else if (a.assigned_type === 3) {
                query = 'SELECT id FROM users WHERE status = 1 AND id_brother = ?';
                params = [a.assigned_id];
                if (excludeUserId) {
                    query += ' AND id != ?';
                    params.push(excludeUserId);
                }
            }

            if (!query) continue;
            const [rows]: any = await pool.execute(query, params);
            rows.forEach((r: { id: number }) => userIdSet.add(Number(r.id)));
        }

        return Array.from(userIdSet);
    }

    /** Procesa recordatorios pendientes en una ventana de ±5 minutos */
    static async processDueReminders(): Promise<number> {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 5 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + 5 * 60 * 1000);
        const lookAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [events]: any = await pool.execute(
            `SELECT e.*, c.name AS calendar_name
             FROM events e
             INNER JOIN calendars c ON c.id = e.calendar_id AND c.status = 1
             WHERE e.status = 1`
        );

        let sentCount = 0;

        for (const event of events) {
            const reminders = await EventReminderModel.findByEventId(event.id);
            if (reminders.length === 0) continue;

            const instances: { startAt: string; originalStartAt: string }[] = [];

            if (event.is_recurring && event.recurrence_rule) {
                const exceptions = await EventExceptionModel.findByEventIds([event.id]);
                const deletedSet = new Set(
                    exceptions
                        .filter((ex: any) => ex.exception_type === 'deleted')
                        .map((ex: any) => formatDateTime(ex.original_start_at))
                );

                const occs = expandEventOccurrences(event, windowStart, lookAhead);
                for (const occ of occs) {
                    if (!deletedSet.has(occ.originalStartAt)) {
                        instances.push({
                            startAt: occ.startAt,
                            originalStartAt: occ.originalStartAt,
                        });
                    }
                }
            } else {
                instances.push({
                    startAt: formatDateTime(event.start_at),
                    originalStartAt: formatDateTime(event.start_at),
                });
            }

            const recipientIds = await this.resolveCalendarRecipientUserIds(event.calendar_id);
            if (recipientIds.length === 0) continue;

            for (const instance of instances) {
                const instanceStart = new Date(instance.startAt.replace(' ', 'T'));

                for (const reminder of reminders) {
                    const remindAt = new Date(
                        instanceStart.getTime() - reminder.remind_before_minutes * 60 * 1000
                    );

                    if (remindAt < windowStart || remindAt > windowEnd) continue;

                    for (const userId of recipientIds) {
                        const alreadySent = await EventReminderModel.wasSent(
                            event.id,
                            instance.originalStartAt,
                            userId,
                            reminder.remind_before_minutes
                        );
                        if (alreadySent) continue;

                        const mins = reminder.remind_before_minutes;
                        const timeLabel =
                            mins >= 1440
                                ? `${Math.round(mins / 1440)} día(s)`
                                : mins >= 60
                                  ? `${Math.round(mins / 60)} hora(s)`
                                  : `${mins} min`;

                        const message = `Recordatorio: "${event.title}" comienza en ${timeLabel}`.slice(0, 500);

                        await NotificationModel.createMany([
                            {
                                user_id: userId,
                                type: 'event_reminder',
                                reference_id: event.id,
                                message,
                            },
                        ]);

                        await EventReminderModel.logSent({
                            eventId: event.id,
                            instanceStartAt: instance.originalStartAt,
                            userId,
                            remindBeforeMinutes: reminder.remind_before_minutes,
                        });

                        sentCount++;
                    }
                }
            }
        }

        return sentCount;
    }
}
