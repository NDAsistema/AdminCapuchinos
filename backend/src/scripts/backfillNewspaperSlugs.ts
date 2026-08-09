/**
 * Backfill de slugs para noticias existentes + UNIQUE + NOT NULL.
 *
 * Uso (desde backend/):
 *   npx ts-node src/scripts/backfillNewspaperSlugs.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../config/database';
import { slugify, uniqueSlug } from '../utils/slugify';

async function slugExists(candidate: string, excludeId?: number): Promise<boolean> {
    if (excludeId != null) {
        const [rows] = await pool.execute(
            'SELECT id FROM newspapers WHERE slug = ? AND id != ? LIMIT 1',
            [candidate, excludeId]
        ) as any;
        return rows.length > 0;
    }
    const [rows] = await pool.execute(
        'SELECT id FROM newspapers WHERE slug = ? LIMIT 1',
        [candidate]
    ) as any;
    return rows.length > 0;
}

async function ensureSlugColumn(): Promise<void> {
    const [cols] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'newspapers' AND COLUMN_NAME = 'slug'`
    ) as any;

    if (cols.length === 0) {
        await pool.execute(
            'ALTER TABLE newspapers ADD COLUMN slug VARCHAR(255) NULL AFTER title'
        );
        console.log('✅ Columna slug añadida');
    } else {
        console.log('ℹ️  Columna slug ya existe');
    }

    try {
        await pool.execute('CREATE INDEX idx_newspapers_slug ON newspapers (slug)');
        console.log('✅ Índice idx_newspapers_slug creado');
    } catch (err: any) {
        if (!String(err.message).includes('Duplicate')) {
            console.warn('Índice:', err.message);
        }
    }
}

async function backfillSlugs(): Promise<void> {
    const [rows] = await pool.execute(
        'SELECT id, title, slug FROM newspapers ORDER BY id ASC'
    ) as any;

    console.log(`📰 Procesando ${rows.length} noticias...`);

    for (const row of rows) {
        if (row.slug && String(row.slug).trim()) {
            continue;
        }

        const base = slugify(row.title || `noticia-${row.id}`);
        const slug = await uniqueSlug(base, (candidate) => slugExists(candidate));

        await pool.execute('UPDATE newspapers SET slug = ? WHERE id = ?', [slug, row.id]);
        console.log(`  #${row.id} → ${slug}`);
    }
}

async function applyUniqueNotNull(): Promise<void> {
    const [nulls] = await pool.execute(
        'SELECT COUNT(*) AS cnt FROM newspapers WHERE slug IS NULL OR slug = \'\''
    ) as any;

    if (Number(nulls[0].cnt) > 0) {
        throw new Error(
            `Quedan ${nulls[0].cnt} filas sin slug. No se puede aplicar NOT NULL / UNIQUE.`
        );
    }

    // Quitar índice no-único si existe, luego UNIQUE
    try {
        await pool.execute('DROP INDEX idx_newspapers_slug ON newspapers');
    } catch {
        /* puede no existir o ya ser unique */
    }

    try {
        await pool.execute(
            'ALTER TABLE newspapers MODIFY COLUMN slug VARCHAR(255) NOT NULL'
        );
        console.log('✅ slug NOT NULL aplicado');
    } catch (err: any) {
        console.warn('MODIFY NOT NULL:', err.message);
    }

    try {
        await pool.execute(
            'ALTER TABLE newspapers ADD UNIQUE INDEX uq_newspapers_slug (slug)'
        );
        console.log('✅ UNIQUE constraint uq_newspapers_slug aplicado');
    } catch (err: any) {
        if (String(err.message).includes('Duplicate')) {
            console.log('ℹ️  UNIQUE ya existía');
        } else {
            throw err;
        }
    }
}

async function main() {
    try {
        await ensureSlugColumn();
        await backfillSlugs();
        await applyUniqueNotNull();
        console.log('🎉 Backfill de slugs completado');
    } catch (error: any) {
        console.error('❌ Error en backfill:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
