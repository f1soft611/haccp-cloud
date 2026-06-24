-- =============================================================================
-- HACCP Cloud PostgreSQL - Drop tenant_id from tb_menu
-- =============================================================================
-- Purpose:
--   Convert tb_menu to a shared menu catalog independent from tenant.
-- =============================================================================

BEGIN;

-- Drop constraints that directly reference tb_menu.tenant_id (constraint names can differ by environment).
DO $$
DECLARE
    con_record RECORD;
BEGIN
    FOR con_record IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_attribute a ON a.attrelid = t.oid
                         AND a.attnum = ANY (c.conkey)
        WHERE t.relname = 'tb_menu'
          AND a.attname = 'tenant_id'
    LOOP
        EXECUTE format('ALTER TABLE tb_menu DROP CONSTRAINT IF EXISTS %I', con_record.conname);
    END LOOP;
END $$;

ALTER TABLE tb_menu
    DROP COLUMN IF EXISTS tenant_id;

COMMIT;
