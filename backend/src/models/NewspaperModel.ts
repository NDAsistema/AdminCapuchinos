import { pool } from '../config/database';


export interface Newspaper {
    id: number;
    title: string;
    content: string;
    img?: string | null;
    type_news: number;
    type_assing: number; // 0: Todo el mundo, 1: Home, 2: Grupos
    sub_type_assing: number; // ID de la Home o del Grupo
    status: number;
    created_by: number;
    created_at?: Date;
    updated_at?: Date;
}

export class NewspaperModel {

    static async findAll(): Promise<any[]> {
        const query = `
            SELECT 
                n.*, 
                b.name AS name_created_by, 
                CASE 
                    WHEN n.type_assing = 1 THEN h.name 
                    WHEN n.type_assing = 2 THEN g.name 
                    ELSE 'General' 
                END AS assigned_to_name 
            FROM newspapers n 
            LEFT JOIN brothers b ON (b.id = n.created_by) 
            LEFT JOIN homes h ON (n.type_assing = 1 AND h.id = n.sub_type_assing) 
            LEFT JOIN \`groups\` g ON (n.type_assing = 2 AND g.id = n.sub_type_assing) 
            WHERE n.status = 1 
            ORDER BY n.created_at DESC
        `;

        const [rows] = await pool.execute(query) as any;
        return rows;
    }

    static async findById(id: number): Promise<Newspaper | null> {
        const [rows] = await pool.execute('SELECT * FROM newspapers WHERE id = ?', [id]) as any;
        return rows[0] || null;
    }

    static async create(newspaperData: Omit<Newspaper, 'id' | 'created_at' | 'updated_at'>): Promise<Newspaper> {
        const { title, content, img, type_news, type_assing, sub_type_assing, status, created_by } = newspaperData;
        const [result] = await pool.execute(
            'INSERT INTO newspapers (title, content, img, type_news, type_assing, sub_type_assing, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, content, img, type_news, type_assing, sub_type_assing, status, created_by]
        ) as any;
        
        return { id: result.insertId, ...newspaperData };
    }

    static async update(id: number, data: Partial<Newspaper>): Promise<boolean> {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
        const [result] = await pool.execute(
            `UPDATE newspapers SET ${fields}, updated_at = NOW() WHERE id = ?`,
            [...values, id]
        ) as any;

        return result.affectedRows > 0;
    }

    static async delete(id: number, created_by: number): Promise<boolean> {
        const [result] = await pool.execute('UPDATE newspapers SET status = 0, updated_at = NOW(), created_by = ? WHERE id = ?', [created_by, id]) as any;
        return result.affectedRows > 0;
    }
}