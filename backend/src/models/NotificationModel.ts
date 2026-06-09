import { pool } from '../config/database';

export type NotificationType = 'task_assigned' | 'report_approved' | 'newspaper_published';

export interface Notification {
    id: number;
    user_id: number;
    type: NotificationType | string;
    reference_id: number;
    message: string;
    is_read: number;
    read_at: Date | null;
    created_at: Date;
}

export class NotificationModel {
    static async createMany(
        rows: { user_id: number; type: string; reference_id: number; message: string }[],
        connection?: any
    ): Promise<void> {
        if (rows.length === 0) return;

        const executor = connection || pool;
        const placeholders = rows.map(() => '(?, ?, ?, ?, 0)').join(', ');
        const values = rows.flatMap((r) => [r.user_id, r.type, r.reference_id, r.message]);

        await executor.execute(
            `INSERT INTO notifications (user_id, type, reference_id, message, is_read) VALUES ${placeholders}`,
            values
        );
    }

    static async findByUser(userId: number, limit = 30): Promise<Notification[]> {
        const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 50));
        const [rows] = await pool.execute(
            `SELECT * FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ${safeLimit}`,
            [userId]
        );
        return rows as Notification[];
    }

    static async countUnread(userId: number): Promise<number> {
        const [rows]: any = await pool.execute(
            'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return Number(rows[0]?.total ?? 0);
    }

    static async markAsRead(id: number, userId: number): Promise<boolean> {
        const [result]: any = await pool.execute(
            `UPDATE notifications SET is_read = 1, read_at = NOW()
             WHERE id = ? AND user_id = ? AND is_read = 0`,
            [id, userId]
        );
        return (result.affectedRows ?? 0) > 0;
    }

    static async markAllAsRead(userId: number): Promise<number> {
        const [result]: any = await pool.execute(
            `UPDATE notifications SET is_read = 1, read_at = NOW()
             WHERE user_id = ? AND is_read = 0`,
            [userId]
        );
        return result.affectedRows ?? 0;
    }
}
