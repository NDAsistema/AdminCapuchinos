import { pool } from '../config/database';

interface ReleationsGroupsBrotther {
    id: number;
    id_group: number;
    id_brotther: number;
    leader: number;
    activity: string;
    status: number;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}

export class ReleationsGroupsBrottherModel {

    static async create(data: any) {
        const { id_group, id_brotther, leader, activity, status, created_by } = data;
        const result = await pool.query(
            'INSERT INTO releations_groups_brotther (id_group, id_brotther, leader, activity, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [id_group, id_brotther, leader, activity, status, created_by]
        );
        return result;
    }

    static async update(id: any, data: any) {
        const { id_group, id_brotther, leader, activity, status, created_by } = data;
        const result = await pool.query(
            'UPDATE releations_groups_brotther SET id_group = ?, id_brotther = ?, leader = ?, activity = ?, status = ?, created_by = ? WHERE id = ?',
            [id_group, id_brotther, leader, activity, status, created_by, id]
        );
        return result;
    }

    static async delete(id: any) {
        const result = await pool.query(
            'DELETE FROM releations_groups_brotther WHERE id = ?',
            [id]
        );
        return result;
    }

    static async findAll() {
        const result = await pool.query('SELECT * FROM releations_groups_brotther');
        return result;
    }

    static async findById(id: any) {
        const result = await pool.query(
            'SELECT * FROM releations_groups_brotther WHERE id = ?',
            [id]
        );
        return result;
    }

    static async deleteRelationBrothers(id_group: number, created_by: number) {
        try {
            const query = `
                UPDATE releations_groups_brotthers 
                SET 
                    status = 0, 
                    updated_at = CURRENT_TIMESTAMP, 
                    created_by = ? 
                WHERE id_group = ? AND status = 1
            `;
            
            const [result] = await pool.execute(query, [created_by, id_group]) as any;
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en GroupModel.deleteRelationBrothers:', error);
            throw error;
        }
    }

    static async assignMembers(groupId: number, members: any[], createdBy: number) {
        try {
            const values = members.map(m => [
                groupId,            
                m.id,             
                m.isLeader ? 1 : 0,  
                m.activity,        
                1,                
                createdBy          
            ]);

            const query = `
                INSERT INTO releations_groups_brotthers 
                (id_group, id_brotther, leader, activity, status, created_by) 
                VALUES ?
            `;

            const [result] = await pool.query(query, [values]) as any;
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en ReleationsGroupsBrottherModel.assignMembers:', error);
            throw error;
        }
    }

    static async getListBrotherAssing(id: any) {
        const query = `
            SELECT DISTINCT
                b.id, 
                b.name,
                IF(rgb.id_group = ?, 1, 0) as is_member
            FROM brothers b
            LEFT JOIN releations_groups_brotthers rgb 
                ON b.id = rgb.id_brotther 
                AND rgb.status = 1
            WHERE 
                rgb.id_group = ? 
                OR rgb.id_brotther IS NULL
            ORDER BY b.name ASC
        `;
        const [result] = await pool.query(query, [id, id]);
        return result;
    }

    static async getListBrotherAssingByGroup(id: any) {
        const query = `
            SELECT 
                rgb.id_brotther, 
                b.name, 
                rgb.leader, 
                rgb.activity 
            FROM 
                releations_groups_brotthers rgb 
            LEFT JOIN 
                brothers b on (rgb.id_brotther = b.id and rgb.status = 1) 
            WHERE 
                rgb.id_group = ? 
                AND rgb.status = 1

        `;
        const [result] = await pool.query(query, [id]);
        return result;
    }


}
