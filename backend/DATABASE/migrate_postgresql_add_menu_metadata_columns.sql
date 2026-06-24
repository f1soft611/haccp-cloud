-- =============================================================================
-- HACCP Cloud PostgreSQL - Add menu metadata columns
-- =============================================================================
-- Purpose:
--   Ensure menu description/icon are persisted so platform menu icon edits
--   are reflected in both menu management and user menu rendering.
-- =============================================================================

BEGIN;

ALTER TABLE tb_menu
    ADD COLUMN IF NOT EXISTS menu_dc VARCHAR(500),
    ADD COLUMN IF NOT EXISTS icon_nm VARCHAR(100);

UPDATE tb_menu
SET icon_nm = COALESCE(NULLIF(TRIM(icon_nm), ''), 'Menu')
WHERE icon_nm IS NULL OR TRIM(icon_nm) = '';

COMMIT;
