import { pool } from '../config/database';

export interface Calendar {
    id?: number;
    name: string;
    description?: string | null;
    color?: string;
    status?: number;
    created_by: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface CalendarAssignment {
    id?: number;
    calendar_id: number;
    assigned_type: number;
    assigned_id: number;
    status?: number;
}

export class CalendarModel {
    static async create(data: Calendar, connection?: any): Promise<number> {
        const executor = connection || pool;
        const [result]: any = await executor.execute(
            `INSERT INTO calendars (name, description, color, status, created_by)
             VALUES (?, ?, ?, 1, ?)`,
            [data.name, data.description || null, data.color || '#465fff', data.created_by]
        );
        return result.insertId;
    }

    static async findById(id: number): Promise<any | null> {
        const [rows]: any = await pool.execute(
            `SELECT c.*, b.name AS creator_name
             FROM calendars c
             LEFT JOIN users u ON u.id = c.created_by
             LEFT JOIN brothers b ON b.id = u.id_brother
             WHERE c.id = ? AND c.status = 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async update(id: number, data: Partial<Calendar>, connection?: any): Promise<boolean> {
        const executor = connection || pool;
        const fields: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }

        if (fields.length === 0) return false;

        const [result]: any = await executor.execute(
            `UPDATE calendars SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND status = 1`,
            [...values, id]
        );
        return (result.affectedRows ?? 0) > 0;
    }

    static async softDelete(id: number, connection?: any): Promise<boolean> {
        const executor = connection || pool;
        const [result]: any = await executor.execute(
            'UPDATE calendars SET status = 0, updated_at = NOW() WHERE id = ? AND status = 1',
            [id]
        );
        return (result.affectedRows ?? 0) > 0;
    }

    static async findAllActive(): Promise<any[]> {
        const [rows]: any = await pool.execute(
            `SELECT c.*, b.name AS creator_name
             FROM calendars c
             LEFT JOIN users u ON u.id = c.created_by
             LEFT JOIN brothers b ON b.id = u.id_brother
             WHERE c.status = 1
             ORDER BY c.name ASC`
        );
        return rows;
    }

    /** Calendarios visibles para un usuario según asignaciones */
    static async findVisibleForUser(
        userId: number,
        brotherId: number | null
    ): Promise<any[]> {
        const params: any[] = [userId];
        let brotherClause = '0=1';

        if (brotherId) {
            brotherClause = `(
                EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    WHERE ca.calendar_id = c.id AND ca.status = 1 AND ca.assigned_type = 0
                )
                OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    WHERE ca.calendar_id = c.id AND ca.status = 1
                      AND ca.assigned_type = 3 AND ca.assigned_id = ?
                )
                OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    INNER JOIN releations_groups_brotthers rgb ON rgb.id_brotther = ? AND rgb.status = 1
                    WHERE ca.calendar_id = c.id AND ca.status = 1
                      AND ca.assigned_type = 2 AND ca.assigned_id = rgb.id_group
                )
                OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    INNER JOIN releations_home_groups rhg ON rhg.id_home = ca.assigned_id
                    INNER JOIN releations_groups_brotthers rgb ON rgb.id_group = rhg.id_group AND rgb.status = 1
                    WHERE ca.calendar_id = c.id AND ca.status = 1
                      AND ca.assigned_type = 1 AND rgb.id_brotther = ?
                )
            )`;
            params.push(brotherId, brotherId, brotherId);
        }

        const [rows]: any = await pool.execute(
            `SELECT DISTINCT c.*, b.name AS creator_name
             FROM calendars c
             LEFT JOIN users u ON u.id = c.created_by
             LEFT JOIN brothers b ON b.id = u.id_brother
             WHERE c.status = 1
               AND (
                 c.created_by = ?
                 OR ${brotherClause}
               )
             ORDER BY c.name ASC`,
            params
        );
        return rows;
    }

    /** Calendarios gestionables por usuario de comunicaciones */
    static async findManageableForComms(userId: number, brotherId: number): Promise<any[]> {
        const [rows]: any = await pool.execute(
            `SELECT DISTINCT c.*, b.name AS creator_name
             FROM calendars c
             LEFT JOIN users u ON u.id = c.created_by
             LEFT JOIN brothers b ON b.id = u.id_brother
             WHERE c.status = 1
               AND (
                 c.created_by = ?
                 OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    INNER JOIN homes h ON h.id = ca.assigned_id AND h.status = 1
                    WHERE ca.calendar_id = c.id AND ca.status = 1
                      AND ca.assigned_type = 1 AND h.communication_user = ?
                 )
                 OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    INNER JOIN releations_home_groups rhg ON rhg.id_group = ca.assigned_id
                    INNER JOIN homes h ON h.id = rhg.id_home AND h.status = 1
                    WHERE ca.calendar_id = c.id AND ca.status = 1
                      AND ca.assigned_type = 2 AND h.communication_user = ?
                 )
               )
             ORDER BY c.name ASC`,
            [userId, brotherId, brotherId]
        );
        return rows;
    }

    static async userCanView(calendarId: number, userId: number, brotherId: number | null): Promise<boolean> {
        if (!brotherId) {
            const [rows]: any = await pool.execute(
                'SELECT id FROM calendars WHERE id = ? AND status = 1 AND created_by = ?',
                [calendarId, userId]
            );
            return rows.length > 0;
        }

        const [rows]: any = await pool.execute(
            `SELECT 1 FROM calendars c
             WHERE c.id = ? AND c.status = 1
               AND (
                 c.created_by = ?
                 OR EXISTS (SELECT 1 FROM calendar_assignments ca WHERE ca.calendar_id = c.id AND ca.status = 1 AND ca.assigned_type = 0)
                 OR EXISTS (SELECT 1 FROM calendar_assignments ca WHERE ca.calendar_id = c.id AND ca.status = 1 AND ca.assigned_type = 3 AND ca.assigned_id = ?)
                 OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    INNER JOIN releations_groups_brotthers rgb ON rgb.id_brotther = ? AND rgb.status = 1
                    WHERE ca.calendar_id = c.id AND ca.status = 1 AND ca.assigned_type = 2 AND ca.assigned_id = rgb.id_group
                 )
                 OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    INNER JOIN releations_home_groups rhg ON rhg.id_home = ca.assigned_id
                    INNER JOIN releations_groups_brotthers rgb ON rgb.id_group = rhg.id_group AND rgb.status = 1
                    WHERE ca.calendar_id = c.id AND ca.status = 1 AND ca.assigned_type = 1 AND rgb.id_brotther = ?
                 )
               )
             LIMIT 1`,
            [calendarId, userId, brotherId, brotherId, brotherId]
        );
        return rows.length > 0;
    }

    static async userCanManage(
        calendarId: number,
        userId: number,
        typeUser: number,
        brotherId: number | null
    ): Promise<boolean> {
        if (typeUser === 1) return true;
        if (typeUser !== 3 || !brotherId) return false;

        const [rows]: any = await pool.execute(
            `SELECT 1 FROM calendars c
             WHERE c.id = ? AND c.status = 1
               AND (
                 c.created_by = ?
                 OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    INNER JOIN homes h ON h.id = ca.assigned_id AND h.status = 1
                    WHERE ca.calendar_id = c.id AND ca.status = 1
                      AND ca.assigned_type = 1 AND h.communication_user = ?
                 )
                 OR EXISTS (
                    SELECT 1 FROM calendar_assignments ca
                    INNER JOIN releations_home_groups rhg ON rhg.id_group = ca.assigned_id
                    INNER JOIN homes h ON h.id = rhg.id_home AND h.status = 1
                    WHERE ca.calendar_id = c.id AND ca.status = 1
                      AND ca.assigned_type = 2 AND h.communication_user = ?
                 )
               )
             LIMIT 1`,
            [calendarId, userId, brotherId, brotherId]
        );
        return rows.length > 0;
    }
}
