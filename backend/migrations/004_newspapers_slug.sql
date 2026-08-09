-- =============================================================================
-- Migración: Slugs SEO-friendly para newspapers
-- =============================================================================
-- 1) Añade columna slug (NULL temporalmente para permitir backfill)
-- 2) Índice (UNIQUE se aplica tras poblar datos — ver script backfill)
--
-- Ejecutar backfill después:
--   npx ts-node src/scripts/backfillNewspaperSlugs.ts
-- =============================================================================

ALTER TABLE newspapers
    ADD COLUMN slug VARCHAR(255) NULL AFTER title;

CREATE INDEX idx_newspapers_slug ON newspapers (slug);
