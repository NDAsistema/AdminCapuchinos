import { pool } from '../config/database';
import { slugify, uniqueSlug } from '../utils/slugify';

export interface Newspaper {
    id: number;
    title: string;
    slug: string;
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

    static async findBySlug(slug: string): Promise<Newspaper | null> {
        const [rows] = await pool.execute(
            'SELECT * FROM newspapers WHERE slug = ? AND status = 1 LIMIT 1',
            [slug]
        ) as any;
        return rows[0] || null;
    }

    /** true si el slug ya está tomado (opcionalmente excluyendo un id al editar) */
    static async slugExists(slug: string, excludeId?: number): Promise<boolean> {
        if (excludeId != null) {
            const [rows] = await pool.execute(
                'SELECT id FROM newspapers WHERE slug = ? AND id != ? LIMIT 1',
                [slug, excludeId]
            ) as any;
            return rows.length > 0;
        }
        const [rows] = await pool.execute(
            'SELECT id FROM newspapers WHERE slug = ? LIMIT 1',
            [slug]
        ) as any;
        return rows.length > 0;
    }

    /**
     * Genera un slug único a partir del título (o de un slug propuesto).
     */
    static async generateUniqueSlug(
        titleOrSlug: string,
        excludeId?: number,
        alreadySlugified = false
    ): Promise<string> {
        const base = alreadySlugified ? (titleOrSlug || 'noticia') : slugify(titleOrSlug);
        return uniqueSlug(base, (candidate) => this.slugExists(candidate, excludeId));
    }

    static async create(
        newspaperData: Omit<Newspaper, 'id' | 'created_at' | 'updated_at' | 'slug'> & { slug?: string }
    ): Promise<Newspaper> {
        const { title, content, img, type_news, type_assing, sub_type_assing, status, created_by } = newspaperData;

        const slug = newspaperData.slug
            ? await this.generateUniqueSlug(newspaperData.slug, undefined, true)
            : await this.generateUniqueSlug(title);

        const [result] = await pool.execute(
            `INSERT INTO newspapers
                (title, slug, content, img, type_news, type_assing, sub_type_assing, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, content, img, type_news, type_assing, sub_type_assing, status, created_by]
        ) as any;

        return {
            id: result.insertId,
            title,
            slug,
            content,
            img,
            type_news,
            type_assing,
            sub_type_assing,
            status,
            created_by,
        };
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

    static async delete(id: number): Promise<boolean> {
        const [result] = await pool.execute('DELETE FROM newspapers WHERE id = ?', [id]) as any;
        return result.affectedRows > 0;
    }
}
