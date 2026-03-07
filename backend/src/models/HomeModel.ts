import { pool } from '../config/database';

export interface Home {
    id: number;
    name: string;
    guardian: number;
    parish_priest: number;
    founder: string;
    communication_user: number;
    history: string;
    state: string;
    city: string;
    location: string;
    contacts: string;
    status?: boolean;
    create_by?: number;
    created_at?: Date;
    updated_at?: Date;
}

export class HomeModel {
    // Crear nueva fraternidad - VERSIÓN CORREGIDA
    static async create(homeData: Omit<Home, 'id' | 'status' | 'created_at' | 'updated_at'> & { create_by: number }): Promise<Home> {
        const {
            name,
            guardian,
            parish_priest,
            founder,
            communication_user,
            history,
            state,
            city,
            location,
            contacts,
            create_by  // ← ¡AGREGAR ESTO!
        } = homeData;
        
        const query = `
            INSERT INTO homes 
            (name, guardian, parish_priest, founder, communication_user, 
            history, state, city, location, contacts, create_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;  

        const values = [
            name || '',
            guardian || 0,
            parish_priest || 0,
            founder || '',
            communication_user || 0,
            history || '',
            state || '',
            city || '',
            location || '',
            contacts || '',
            create_by || 0  // ← ¡AGREGAR ESTO!
        ];
        
        try {
            const [result] = await pool.execute(query, values) as any;
            
            const [newHome] = await pool.execute(
                'SELECT * FROM homes WHERE id = ?', 
                [result.insertId]
            ) as any;
            
            console.log('✅ Fraternidad creada con ID:', result.insertId);
            return newHome[0];
            
        } catch (error) {
            console.error('❌ Error creando fraternidad:', error);
            throw error;
        }
    }
    
    // Obtener todas las fraternidades
    static async findAll(): Promise<Home[]> {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    h.*,
                    g.name as guardian_name,
                    p.name as priest_name,
                    c.name as communication_user_name
                FROM homes h
                LEFT JOIN brothers g ON g.id = h.guardian
                LEFT JOIN brothers p ON p.id = h.parish_priest
                LEFT JOIN brothers c ON c.id = h.communication_user
                WHERE h.status = 1
                ORDER BY h.name ASC
            `) as any;
            return rows;
        } catch (error) {
            console.error('Error en HomeModel.findAll:', error);
            throw error;
        }
    }
    
    // Obtener fraternidad por ID
    static async findById(id: number): Promise<Home | null> {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM homes WHERE id = ? AND status = 1',
                [id]
            ) as any;
            return rows[0] || null;
        } catch (error) {
            console.error('Error en HomeModel.findById:', error);
            throw error;
        }
    }
    
    // Actualizar fraternidad
    static async update(id: number, homeData: Partial<Home>): Promise<Home | null> {
        try {
            const allowedFields = [
                'name', 'guardian', 'parish_priest', 'founder', 
                'communication_user', 'history', 'state', 'city', 
                'location', 'contacts', 'status'
            ];
            
            const updates: string[] = [];
            const values: any[] = [];
            
            Object.keys(homeData).forEach(key => {
                if (allowedFields.includes(key) && homeData[key as keyof Home] !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(homeData[key as keyof Home]);
                }
            });
            
            if (updates.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }
            
            values.push(id);
            const query = `
                UPDATE homes 
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            await pool.execute(query, values);
            return await this.findById(id);
            
        } catch (error) {
            console.error('Error en HomeModel.update:', error);
            throw error;
        }
    }
    
    // Eliminar fraternidad (soft delete)
    static async delete(id: number): Promise<boolean> {
        try {
            const query = `
                UPDATE homes 
                SET status = 0, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            const [result] = await pool.execute(query, [id]) as any;
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en HomeModel.delete:', error);
            throw error;
        }
    }

    // Obtener todas las imágenes por ID
    static async getAllImgById(id: number): Promise<Home[] | null> {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM homes_images WHERE home_id = ?',
                [id]
            ) as any;
            return rows[0] || null;
        } catch (error) {
            console.error('Error en HomeModel.getAllImgById:', error);
            throw error;
        }
    }
}