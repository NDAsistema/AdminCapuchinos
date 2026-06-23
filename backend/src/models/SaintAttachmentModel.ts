import { pool } from '../config/database';

export class SaintAttachmentModel {
    static async create(data: { url: string; filename: string; created_by: number }): Promise<void> {
        await pool.execute(
            `INSERT INTO saint_attachments (url, filename, created_by, status)
             VALUES (?, ?, ?, 'temp')`,
            [data.url, data.filename, data.created_by]
        );
    }

    static async bindToSaint(saintId: number, urls: string[]): Promise<void> {
        if (urls.length === 0) return;
        const placeholders = urls.map(() => '?').join(', ');
        await pool.execute(
            `UPDATE saint_attachments
             SET id_saint = ?, status = 'active'
             WHERE url IN (${placeholders}) AND status = 'temp'`,
            [saintId, ...urls]
        );
    }
}
