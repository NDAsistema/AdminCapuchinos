import { pool } from '../config/database';
import { CalendarAssignment } from './CalendarModel';

export class CalendarAssignmentModel {
    static async findByCalendarId(calendarId: number): Promise<CalendarAssignment[]> {
        const [rows]: any = await pool.execute(
            `SELECT ca.*,
                CASE
                    WHEN ca.assigned_type = 1 THEN h.name
                    WHEN ca.assigned_type = 2 THEN g.name
                    WHEN ca.assigned_type = 3 THEN b.name
                    ELSE 'Todos'
                END AS assigned_name
             FROM calendar_assignments ca
             LEFT JOIN homes h ON ca.assigned_type = 1 AND h.id = ca.assigned_id
             LEFT JOIN \`groups\` g ON ca.assigned_type = 2 AND g.id = ca.assigned_id
             LEFT JOIN brothers b ON ca.assigned_type = 3 AND b.id = ca.assigned_id
             WHERE ca.calendar_id = ? AND ca.status = 1`,
            [calendarId]
        );
        return rows;
    }

    static async createMultiple(
        calendarId: number,
        assignments: { assigned_type: number; assigned_id: number }[],
        connection?: any
    ): Promise<void> {
        if (assignments.length === 0) return;
        const executor = connection || pool;
        const rows = assignments.map((a) => [calendarId, a.assigned_type, a.assigned_id, 1]);
        await executor.query(
            'INSERT INTO calendar_assignments (calendar_id, assigned_type, assigned_id, status) VALUES ?',
            [rows]
        );
    }

    static async replaceAll(
        calendarId: number,
        assignments: { assigned_type: number; assigned_id: number }[],
        connection?: any
    ): Promise<void> {
        const executor = connection || pool;
        await executor.execute(
            'UPDATE calendar_assignments SET status = 0 WHERE calendar_id = ?',
            [calendarId]
        );
        await this.createMultiple(calendarId, assignments, connection);
    }

    static async softDeleteByCalendar(calendarId: number, connection?: any): Promise<void> {
        const executor = connection || pool;
        await executor.execute(
            'UPDATE calendar_assignments SET status = 0 WHERE calendar_id = ?',
            [calendarId]
        );
    }
}
