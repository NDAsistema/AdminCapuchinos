import { ResultSetHeader } from 'mysql2';
import { pool } from '../config/database';

interface Group {
    id: number;
    name: string;
    activity: string;
    description: string;
    schedules: string;
    typegroup: number;
    status: number;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}

export class GroupModel {
    
    static async create(data: any) {
        const { name, activity, description, schedules, typegroup, status, created_by } = data;
        
        const query = `
            INSERT INTO \`groups\` 
            (name, activity, description, schedules, typegroup, status, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            name || '', 
            activity || '',
            description || '', 
            schedules || '', 
            typegroup || null, // 👈 Ahora usamos la variable correcta
            status || 1, 
            created_by || 1
        ];

        const [result] = await pool.query<ResultSetHeader>(query, values);
        return result.insertId;
    }

    static async update(id: any, data: any) {
        const { name, description, schedules, typegroup, created_by } = data;
        const result = await pool.query(
            'UPDATE `groups` SET name = ?, description = ?, schedules = ?, typegroup = ?, created_by = ? , updated_at = CURRENT_TIMESTAMP  WHERE id = ?',
            [name, description, schedules, typegroup, created_by, id]
        );
        return result;
    }

    static async delete(id: number, updated_by: number) {
        try {
            const query = `
                UPDATE \`groups\` 
                SET 
                    status = 0, 
                    created_by = ?, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            const [result]: any = await pool.execute(query, [updated_by, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error en GroupModel.delete (lógico):', error);
            throw error;
        }
    }
    static async findAll() {
        const result = await pool.query('SELECT g.*, tg.name as type_group_name, h.id as id_home, h.name as home_name, COUNT(rgb.id) as total_members FROM `groups` as g LEFT JOIN type_groups tg on (g.typegroup = tg.id) LEFT JOIN releations_home_groups rhg on (rhg.id_group = g.id) LEFT JOIN homes h on (rhg.id_home = h.id) LEFT JOIN releations_groups_brotthers rgb on (rgb.id_group = g.id AND rgb.status = 1) WHERE g.status = 1 GROUP BY g.id, tg.id, h.id;');
        return result;
    }

    static async findById(id: any) {
        const result = await pool.query(
            'SELECT * FROM `groups` WHERE id = ?',
            [id]
        );
        return result;
    }

    static async findBytype(id: any) {
        const result = await pool.query(
            'SELECT * FROM `groups` WHERE typegroup = ?',
            [id]
        );
        return result;
    }

}