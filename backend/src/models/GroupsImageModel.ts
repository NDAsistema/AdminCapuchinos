import { pool } from '../config/database'; 

export interface GroupsImage {
    id?: number;
    group_id: number;
    url_img: string;
    orderimg: number;
    created_by: number;
    status?: number;
}

export class GroupsImageModel {
    
    /**
     * Obtiene todas las imágenes activas de un grupo específico
     */
    static async findByGroupId(groupId: number) {
        try {
            const query = `
                SELECT id, group_id, url_img, orderimg, status 
                FROM groups_images 
                WHERE group_id = ? AND status = 1 
                ORDER BY orderimg ASC
            `;
            const [rows]: any = await pool.execute(query, [groupId]);
            return rows;
        } catch (error) {
            console.error('❌ Error en GroupsImageModel.findByGroupId:', error);
            throw error;
        }
    }

    /**
     * Busca una imagen específica por su ID (útil para antes de borrar de S3)
     */
    static async findById(id: number) {
        try {
            const query = `SELECT * FROM groups_images WHERE id = ? LIMIT 1`;
            const [rows]: any = await pool.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Error en GroupsImageModel.findById:', error);
            throw error;
        }
    }

    /**
     * Registra una nueva imagen en la base de datos
     */
    static async create(data: GroupsImage) {
        try {
            const query = `
                INSERT INTO groups_images (group_id, url_img, orderimg, created_by)
                VALUES (?, ?, ?, ?)
            `;
            const [result]: any = await pool.execute(query, [
                data.group_id,
                data.url_img,
                data.orderimg,
                data.created_by
            ]);

            return { id: result.insertId, ...data };
        } catch (error) {
            console.error('❌ Error en GroupsImageModel.create:', error);
            throw error;
        }
    }

    /**
     * Eliminación lógica (Cambia status a 0)
     */
    static async delete(id: number, _create_by: number) {
        try {
            const query = `UPDATE groups_images SET status = 0 WHERE id = ?`;
            const [result]: any = await pool.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error en GroupsImageModel.delete:', error);
            throw error;
        }
    }

    /**
     * Buscar listado de img de grupos por tipo
     */
    static async searchByTypeGroup(id: number) {
        try {
            // 1. Usamos backticks `` para `groups` por ser palabra reservada
            const query = `
                SELECT gi.* FROM groups_images gi 
                LEFT JOIN \`groups\` g ON g.id = gi.group_id 
                WHERE gi.status = 1 
                AND g.status = 1 
                AND g.typegroup = ?`;
            
            const [rows]: any = await pool.execute(query, [id]);
            
            // 2. DEVOLVEMOS EL ARRAY DE FILAS
            return rows || []; 
        } catch (error) {
            console.error('❌ Error en GroupsImageModel.searchByTypeGroup:', error);
            return []; // Devolvemos array vacío en caso de error para no romper el for del controller
        }
    }
}