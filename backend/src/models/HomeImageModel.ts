import { pool } from '../config/database';

export interface HomeImage {
  id: number;
  home_id: number;
  url_img: string;
  orderimg: number;
  status: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// Tipo simplificado para los datos necesarios al crear
export type CreateHomeImageData = Omit<HomeImage, 'id' | 'status' | 'created_at' | 'updated_at'>;

export class HomeImageModel {
    static async create(data: CreateHomeImageData): Promise<HomeImage> {
        const { home_id, url_img, orderimg, created_by } = data;
        
        console.log('📝 Creando imagen con datos:', data);
        
        // CORREGIDO: Usar 'created_by' y tabla 'homes_images'
        const query = `
            INSERT INTO homes_images 
            (home_id, url_img, orderimg, created_by, status)
            VALUES (?, ?, ?, ?, 1)
        `;  

        const values = [
            home_id,
            url_img,
            orderimg,
            created_by 
        ];
        
        try {
            const [result] = await pool.execute(query, values) as any;
            console.log('✅ Insert ID:', result.insertId);
            
            const [rows] = await pool.execute(
                'SELECT * FROM homes_images WHERE id = ?', 
                [result.insertId]
            ) as any;
            
            console.log('📄 Resultado:', rows[0]);
            return rows[0];
            
        } catch (error) {
            console.error('❌ Error en HomeImageModel.create:', error);
            throw error;
        }
    }

    static async findByHomeId(id: number): Promise<HomeImage[]> {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM homes_images WHERE home_id = ? AND status = 1 ORDER BY orderimg ASC', 
                [id]
            ) as any;
            return rows || [];
        } catch (error) {
            console.error('❌ Error en HomeImageModel.findByHomeId:', error);
            return [];
        }
    }

    static async findById(id: number): Promise<HomeImage | null> {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM homes_images WHERE id = ? AND status = 1', 
                [id]
            ) as any;
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Error en HomeImageModel.findById:', error);
            return null;
        }
    }

    static async delete(id: number): Promise<boolean> {
        try {
            // Soft delete: cambiar status a 0
            const [result] = await pool.execute(
                'UPDATE homes_images SET status = 0 WHERE id = ?',
                [id]
            ) as any;
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error en HomeImageModel.delete:', error);
            return false;
        }
    }

    static async updateOrder(id: number, orderimg: number): Promise<boolean> {
        try {
            const [result] = await pool.execute(
                'UPDATE homes_images SET orderimg = ? WHERE id = ?',
                [orderimg, id]
            ) as any;
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error en HomeImageModel.updateOrder:', error);
            return false;
        }
    }
}