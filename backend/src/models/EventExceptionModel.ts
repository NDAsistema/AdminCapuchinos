import { pool } from '../config/database';

export interface EventException {
    id?: number;
    event_id: number;
    original_start_at: Date | string;
    exception_type: 'deleted' | 'modified';
    override_title?: string | null;
    override_description?: string | null;
    override_start_at?: Date | string | null;
    override_end_at?: Date | string | null;
    override_all_day?: boolean | number | null;
    created_by: number;
}

export class EventExceptionModel {
    static async create(data: EventException, connection?: any): Promise<number> {
        const executor = connection || pool;
        const [result]: any = await executor.execute(
            `INSERT INTO event_exceptions (
                event_id, original_start_at, exception_type,
                override_title, override_description,
                override_start_at, override_end_at, override_all_day,
                created_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
                exception_type = VALUES(exception_type),
                override_title = VALUES(override_title),
                override_description = VALUES(override_description),
                override_start_at = VALUES(override_start_at),
                override_end_at = VALUES(override_end_at),
                override_all_day = VALUES(override_all_day),
                status = 1`,
            [
                data.event_id,
                data.original_start_at,
                data.exception_type,
                data.override_title ?? null,
                data.override_description ?? null,
                data.override_start_at ?? null,
                data.override_end_at ?? null,
                data.override_all_day != null ? (data.override_all_day ? 1 : 0) : null,
                data.created_by,
            ]
        );
        return result.insertId;
    }

    static async findByEventIds(eventIds: number[]): Promise<any[]> {
        if (eventIds.length === 0) return [];
        const placeholders = eventIds.map(() => '?').join(', ');
        const [rows]: any = await pool.execute(
            `SELECT * FROM event_exceptions
             WHERE event_id IN (${placeholders}) AND status = 1`,
            eventIds
        );
        return rows;
    }

    static async findById(id: number): Promise<any | null> {
        const [rows]: any = await pool.execute(
            'SELECT * FROM event_exceptions WHERE id = ? AND status = 1',
            [id]
        );
        return rows[0] || null;
    }

    static async softDelete(id: number): Promise<boolean> {
        const [result]: any = await pool.execute(
            'UPDATE event_exceptions SET status = 0 WHERE id = ?',
            [id]
        );
        return (result.affectedRows ?? 0) > 0;
    }

    static async softDeleteByEvent(eventId: number, connection?: any): Promise<void> {
        const executor = connection || pool;
        await executor.execute(
            'UPDATE event_exceptions SET status = 0 WHERE event_id = ?',
            [eventId]
        );
    }
}
