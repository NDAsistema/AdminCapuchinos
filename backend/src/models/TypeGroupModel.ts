import { pool } from '../config/database';

export interface TypeGroup {
    id: number;
    name: string;
    activity: string;
    img: string;
    created_by: number;
    status: boolean;
    created_at: Date;
    updated_at: Date;
}

export class TypeGroupModel {
    // Crear nuevo tipo de grupo
    static async create(typeGroupData: Omit<TypeGroup, 'id' | 'status' | 'created_at' | 'updated_at'> & { created_by: number }): Promise<TypeGroup> {
        const { name, activity, img , created_by } = typeGroupData;
        
        const query = `
            INSERT INTO type_groups (name, activity, img, created_by)
            VALUES (?, ?, ?, ?)
        `;  

        const values = [
            name || '',
            activity || '',
            img || '',
            created_by || 0
        ];
        
        try {
            const [result] = await pool.execute(query, values) as any;
            
            const [newTypeGroup] = await pool.execute(
                'SELECT * FROM type_groups WHERE id = ?', 
                [result.insertId]
            ) as any;
            
            console.log('✅ Tipo de grupo creado con ID:', result.insertId);
            return newTypeGroup[0];
            
        } catch (error) {
            console.error('❌ Error creando tipo de grupo:', error);
            throw error;
        }
    }
    
    static async findAll(): Promise<TypeGroup[]> {
        try {
            const [rows] = await pool.execute('SELECT * FROM type_groups WHERE status = 1 ORDER BY name ASC') as any;
            return rows;
        } catch (error) {
            console.error('Error en TypeGroupModel.findAll:', error);
            throw error;
        }
    }
    
    static async findById(id: number): Promise<TypeGroup | null> {
        try {
            const [rows] = await pool.execute('SELECT * FROM type_groups WHERE id = ? AND status = 1', [id]) as any;
            return rows[0] || null;
        } catch (error) {
            console.error('Error en TypeGroupModel.findById:', error);
            throw error;
        }
    }
    
    static async update(id: number, typeGroupData: Partial<TypeGroup>): Promise<TypeGroup | null> {
        try {
            const allowedFields = ['name', 'activity', 'created_by', 'status', 'img']; 
            const updates: string[] = [];
            const values: any[] = [];
            
            Object.keys(typeGroupData).forEach(key => {
                if (allowedFields.includes(key) && typeGroupData[key as keyof TypeGroup] !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(typeGroupData[key as keyof TypeGroup]);
                }
            });
            
            if (updates.length === 0) throw new Error('No hay campos válidos para actualizar');
            
            values.push(id);
            const query = `UPDATE type_groups SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            await pool.execute(query, values);
            return await this.findById(id);
        } catch (error) {
            console.error('Error en TypeGroupModel.update:', error);
            throw error;
        }
    }
    
    static async delete(id: number): Promise<boolean> {
        try {
            const query = 'UPDATE type_groups SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            const [result] = await pool.execute(query, [id]) as any;
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en TypeGroupModel.delete:', error);
            throw error;
        }
    }
}