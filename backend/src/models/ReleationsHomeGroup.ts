import { pool } from '../config/database';

interface ReleationHomeGroup {
    id?: number;          // Opcional porque lo crea la DB (Auto_increment)
    id_home: number;
    id_group: number;
    status?: number;      // Opcional porque suele tener valor default (1)
    created_by: number;
}

export class ReleationHomeGroupModel {
    
    // Usamos Partial<ReleationHomeGroup> o simplemente la interfaz con los campos opcionales
    static async create(data: ReleationHomeGroup) {
        const query = `
            INSERT INTO releations_home_groups (id_home, id_group, created_by)
            VALUES (?, ?, ?)
        `;
        
        // Ejecutamos el query con los datos que recibimos
        const [result] = await pool.query(query, [
            data.id_home, 
            data.id_group, 
            data.created_by
        ]);
        
        return result;
    }


    static async ReleationHomeGroupModel(id_group: number) {
        const [rows] = await pool.execute('SELECT * FROM brothers WHERE id = ?', [id_group]) as any;
        return rows[0] || null;
    }

    /** Eliminar relación entre fraternidad y grupo */
    static async deteleReleationHomeGroup(id_group: number, created_by: number) {
        try {
            const query = `
                UPDATE releations_home_groups 
                SET status = 0, 
                    created_by = ?, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id_group = ?
            `;
            const [result] = await pool.query(query, [created_by, id_group]) as any;
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en deteleReleationHomeGroup:', error);
            throw error;
        }
    }
}