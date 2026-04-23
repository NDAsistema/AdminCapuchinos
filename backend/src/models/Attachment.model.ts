import { pool } from '../config/database';

export interface Attachment {
    id: number;
    url: string;
    filename?: string;
    id_newspaper: number | null;
    status: 'temp' | 'active';
    created_by: number;
    created_at?: Date;
    modified_at?: Date;
}

export class AttachmentModel {

    
    /**
     * Crea un registro inicial cuando Froala sube la imagen (Status: temp)
     */
    static async create(data: { url: string; filename: string; created_by: number }): Promise<Attachment> {
        const query = `
            INSERT INTO newspaper_attachments 
            (url, filename, created_by, status)
            VALUES (?, ?, ?, 'temp')
        `;
        
        const values = [data.url, data.filename, data.created_by];

        try {
            const [result] = await pool.execute(query, values) as any;
            
            const [newRecord] = await pool.execute(
                'SELECT * FROM newspaper_attachments WHERE id = ?',
                [result.insertId]
            ) as any;

            return newRecord[0];
        } catch (error) {
            console.error('❌ Error guardando adjunto:', error);
            throw error;
        }
    }

    /**
     * VINCULACIÓN PROFESIONAL: 
     * Actualiza las imágenes que están en el HTML de la noticia pasándolas de 'temp' a 'active'
     */
    static async bindToNewspaper(newspaperId: number, urls: string[]): Promise<boolean> {
        if (urls.length === 0) return true;

        try {
            const placeholders = urls.map(() => '?').join(', ');
            const query = `
                UPDATE newspaper_attachments 
                SET id_newspaper = ?, status = 'active'
                WHERE url IN (${placeholders}) AND status = 'temp'
            `;
            const [result] = await pool.execute(query, [newspaperId, ...urls]) as any;
            console.log(`✅ Se vincularon ${result.affectedRows} imágenes a la noticia ${newspaperId}`);
            return true;
        } catch (error) {
            console.error('❌ Error vinculando adjuntos a la noticia:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los adjuntos de una noticia específica
     */
    static async findByNewspaperId(newspaperId: number): Promise<Attachment[]> {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM newspaper_attachments WHERE id_newspaper = ?',
                [newspaperId]
            ) as any;
            return rows;
        } catch (error) {
            console.error('Error buscando adjuntos:', error);
            throw error;
        }
    }

    /**
     * Elimina un adjunto de la DB (usar antes de borrar de S3)
     */
    static async delete(id: number): Promise<boolean> {
        try {
            const [result] = await pool.execute(
                'DELETE FROM newspaper_attachments WHERE id = ?',
                [id]
            ) as any;
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error eliminando registro de adjunto:', error);
            throw error;
        }
    }
}