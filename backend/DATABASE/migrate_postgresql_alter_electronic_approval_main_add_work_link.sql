-- =============================================================================
-- HACCP Cloud PostgreSQL - Alter electronic approval main work linkage
-- =============================================================================
-- Purpose:
--   Add work linkage column to existing tb_electronic_approval_main table
--   so todo aggregation can map approval status per work.
-- =============================================================================

BEGIN;

ALTER TABLE tb_electronic_approval_main
    ADD COLUMN IF NOT EXISTS drafting_work_category_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_electronic_approval_main_work'
    ) THEN
        ALTER TABLE tb_electronic_approval_main
            ADD CONSTRAINT fk_electronic_approval_main_work
            FOREIGN KEY (drafting_work_category_id)
            REFERENCES tb_drafting_work_category(drafting_work_category_id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_work_id
    ON tb_electronic_approval_main(drafting_work_category_id);

COMMIT;
