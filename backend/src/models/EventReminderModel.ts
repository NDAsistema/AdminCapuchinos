import { pool } from '../config/database';

export class EventReminderModel {
    static async createMultiple(
        eventId: number,
        minutes: number[],
        connection?: any
    ): Promise<void> {
        if (minutes.length === 0) return;
        const executor = connection || pool;
        const rows = minutes.map((m) => [eventId, m, 1]);
        await executor.query(
            'INSERT INTO event_reminders (event_id, remind_before_minutes, status) VALUES ?',
            [rows]
        );
    }

    static async replaceAll(eventId: number, minutes: number[], connection?: any): Promise<void> {
        const executor = connection || pool;
        await executor.execute(
            'UPDATE event_reminders SET status = 0 WHERE event_id = ?',
            [eventId]
        );
        await this.createMultiple(eventId, minutes, connection);
    }

    static async findByEventId(eventId: number): Promise<any[]> {
        const [rows]: any = await pool.execute(
            'SELECT * FROM event_reminders WHERE event_id = ? AND status = 1',
            [eventId]
        );
        return rows;
    }

    static async softDeleteByEvent(eventId: number, connection?: any): Promise<void> {
        const executor = connection || pool;
        await executor.execute(
            'UPDATE event_reminders SET status = 0 WHERE event_id = ?',
            [eventId]
        );
    }

    static async logSent(params: {
        eventId: number;
        instanceStartAt: string;
        userId: number;
        remindBeforeMinutes: number;
        notificationId?: number;
    }): Promise<void> {
        await pool.execute(
            `INSERT INTO event_reminder_logs
             (event_id, instance_start_at, user_id, remind_before_minutes, notification_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE sent_at = NOW()`,
            [
                params.eventId,
                params.instanceStartAt,
                params.userId,
                params.remindBeforeMinutes,
                params.notificationId ?? null,
            ]
        );
    }

    static async wasSent(
        eventId: number,
        instanceStartAt: string,
        userId: number,
        remindBeforeMinutes: number
    ): Promise<boolean> {
        const [rows]: any = await pool.execute(
            `SELECT 1 FROM event_reminder_logs
             WHERE event_id = ? AND instance_start_at = ? AND user_id = ? AND remind_before_minutes = ?
             LIMIT 1`,
            [eventId, instanceStartAt, userId, remindBeforeMinutes]
        );
        return rows.length > 0;
    }
}
