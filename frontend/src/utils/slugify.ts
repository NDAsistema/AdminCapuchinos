/**
 * Convierte texto a slug SEO-friendly (preview en admin).
 * Debe mantenerse alineado con backend/src/utils/slugify.ts
 */
export function slugify(text: string): string {
    if (!text || !text.trim()) {
        return '';
    }

    const normalized = text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ñ/gi, 'n')
        .toLowerCase()
        .trim();

    return normalized
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
