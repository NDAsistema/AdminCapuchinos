/**
 * Convierte texto a slug SEO-friendly (minúsculas, guiones, sin acentos ni puntuación).
 * Ej: "¡Noticia de Prueba 2026!" -> "noticia-de-prueba-2026"
 */
export function slugify(text: string): string {
    if (!text || !text.trim()) {
        return 'noticia';
    }

    const normalized = text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita diacríticos (á->a, ñ->n se maneja aparte)
        .replace(/ñ/gi, 'n')
        .toLowerCase()
        .trim();

    return normalized
        .replace(/[^a-z0-9\s-]/g, '') // solo alfanumérico, espacios y guiones
        .replace(/[\s_]+/g, '-')      // espacios/underscores -> guiones
        .replace(/-+/g, '-')          // colapsa guiones múltiples
        .replace(/^-|-$/g, '')        // quita guiones extremos
        || 'noticia';
}

/**
 * Genera un candidato de slug único añadiendo sufijo incremental si hace falta.
 * @param baseSlug slug base ya slugificado
 * @param existsFn async (candidate) => true si ya existe en DB
 */
export async function uniqueSlug(
    baseSlug: string,
    existsFn: (candidate: string) => Promise<boolean>
): Promise<string> {
    let candidate = baseSlug || 'noticia';
    let suffix = 1;

    while (await existsFn(candidate)) {
        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
    }

    return candidate;
}
