import { pool } from '../config/database';

export interface Saint {
    id: number;
    title: string;
    content: string;
    date_birth?: string | null;
    date_death?: string | null;
    type: number;
    img?: string | null;
    status: number;
    created_by: number;
    created_at?: Date;
    updated_at?: Date;
}

export class SaintModel {
    static async findAll(): Promise<any[]> {
        const [rows] = await pool.execute(
            `SELECT s.*, b.name AS name_created_by
             FROM saints s
             LEFT JOIN brothers b ON b.id = s.created_by
             WHERE s.status = 1
             ORDER BY s.title ASC`
        ) as any;
        return rows;
    }

    static async findById(id: number): Promise<Saint | null> {
        const [rows] = await pool.execute('SELECT * FROM saints WHERE id = ? AND status = 1', [id]) as any;
        return rows[0] || null;
    }

    static async create(data: Omit<Saint, 'id' | 'created_at' | 'updated_at'>): Promise<Saint> {
        const { title, content, date_birth, date_death, type, img, status, created_by } = data;
        const [result] = await pool.execute(
            `INSERT INTO saints (title, content, date_birth, date_death, type, img, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, content, date_birth || null, date_death || null, type, img || null, status, created_by]
        ) as any;
        return { id: result.insertId, ...data };
    }

    static async update(id: number, data: Partial<Saint>): Promise<boolean> {
        const fields: string[] = [];
        const values: unknown[] = [];

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        });

        if (fields.length === 0) return false;

        const [result] = await pool.execute(
            `UPDATE saints SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND status = 1`,
            [...values, id]
        ) as any;
        return result.affectedRows > 0;
    }

    static async softDelete(id: number, updatedBy: number): Promise<boolean> {
        const [result] = await pool.execute(
            'UPDATE saints SET status = 0, created_by = ?, updated_at = NOW() WHERE id = ? AND status = 1',
            [updatedBy, id]
        ) as any;
        return result.affectedRows > 0;
    }
}
