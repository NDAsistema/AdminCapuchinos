import { pool } from '../config/database';

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CalendarEvent {
    id?: number;
    calendar_id: number;
    title: string;
    description?: string | null;
    start_at: Date | string;
    end_at: Date | string;
    all_day?: boolean | number;
    is_recurring?: boolean | number;
    recurrence_rule?: RecurrenceRule | null;
    recurrence_interval?: number;
    recurrence_end_date?: string | null;
    recurrence_count?: number | null;
    recurrence_days?: string | null;
    status?: number;
    created_by: number;
}

export class EventModel {
    static async create(event: CalendarEvent, connection?: any): Promise<number> {
        const executor = connection || pool;
        const [result]: any = await executor.execute(
            `INSERT INTO events (
                calendar_id, title, description, start_at, end_at, all_day,
                is_recurring, recurrence_rule, recurrence_interval, recurrence_end_date,
                recurrence_count, recurrence_days, created_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                event.calendar_id,
                event.title,
                event.description || null,
                event.start_at,
                event.end_at,
                event.all_day ? 1 : 0,
                event.is_recurring ? 1 : 0,
                event.recurrence_rule || null,
                event.recurrence_interval ?? 1,
                event.recurrence_end_date || null,
                event.recurrence_count ?? null,
                event.recurrence_days || null,
                event.created_by,
            ]
        );
        return result.insertId;
    }

    static async findById(id: number): Promise<any | null> {
        const [rows]: any = await pool.execute(
            `SELECT e.*, c.name AS calendar_name, c.color AS calendar_color
             FROM events e
             INNER JOIN calendars c ON c.id = e.calendar_id AND c.status = 1
             WHERE e.id = ? AND e.status = 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async update(id: number, data: Partial<CalendarEvent>, connection?: any): Promise<boolean> {
        const executor = connection || pool;
        const map: Record<string, any> = {};

        if (data.title !== undefined) map.title = data.title;
        if (data.description !== undefined) map.description = data.description;
        if (data.start_at !== undefined) map.start_at = data.start_at;
        if (data.end_at !== undefined) map.end_at = data.end_at;
        if (data.all_day !== undefined) map.all_day = data.all_day ? 1 : 0;
        if (data.is_recurring !== undefined) map.is_recurring = data.is_recurring ? 1 : 0;
        if (data.recurrence_rule !== undefined) map.recurrence_rule = data.recurrence_rule;
        if (data.recurrence_interval !== undefined) map.recurrence_interval = data.recurrence_interval;
        if (data.recurrence_end_date !== undefined) map.recurrence_end_date = data.recurrence_end_date;
        if (data.recurrence_count !== undefined) map.recurrence_count = data.recurrence_count;
        if (data.recurrence_days !== undefined) map.recurrence_days = data.recurrence_days;

        const keys = Object.keys(map);
        if (keys.length === 0) return false;

        const fields = keys.map((k) => `${k} = ?`).join(', ');
        const values = keys.map((k) => map[k]);

        const [result]: any = await executor.execute(
            `UPDATE events SET ${fields}, updated_at = NOW() WHERE id = ? AND status = 1`,
            [...values, id]
        );
        return (result.affectedRows ?? 0) > 0;
    }

    static async softDelete(id: number, connection?: any): Promise<boolean> {
        const executor = connection || pool;
        const [result]: any = await executor.execute(
            'UPDATE events SET status = 0, updated_at = NOW() WHERE id = ? AND status = 1',
            [id]
        );
        return (result.affectedRows ?? 0) > 0;
    }

    static async findSimpleInRange(calendarIds: number[], start: string, end: string): Promise<any[]> {
        if (calendarIds.length === 0) return [];
        const placeholders = calendarIds.map(() => '?').join(', ');
        const [rows]: any = await pool.execute(
            `SELECT e.*, c.name AS calendar_name, c.color AS calendar_color
             FROM events e
             INNER JOIN calendars c ON c.id = e.calendar_id
             WHERE e.status = 1 AND e.is_recurring = 0
               AND e.calendar_id IN (${placeholders})
               AND e.start_at < ? AND e.end_at > ?
             ORDER BY e.start_at ASC`,
            [...calendarIds, end, start]
        );
        return rows;
    }

    static async findRecurringMasters(calendarIds: number[]): Promise<any[]> {
        if (calendarIds.length === 0) return [];
        const placeholders = calendarIds.map(() => '?').join(', ');
        const [rows]: any = await pool.execute(
            `SELECT e.*, c.name AS calendar_name, c.color AS calendar_color
             FROM events e
             INNER JOIN calendars c ON c.id = e.calendar_id
             WHERE e.status = 1 AND e.is_recurring = 1
               AND e.calendar_id IN (${placeholders})`,
            calendarIds
        );
        return rows;
    }
}
