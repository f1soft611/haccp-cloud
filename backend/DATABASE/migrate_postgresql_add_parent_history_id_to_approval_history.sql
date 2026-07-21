-- Add parent comment reference for threaded replies in approval history comments
BEGIN;

ALTER TABLE tb_electronic_approval_history_main
    ADD COLUMN IF NOT EXISTS parent_history_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_electronic_approval_history_main_parent'
    ) THEN
        ALTER TABLE tb_electronic_approval_history_main
            ADD CONSTRAINT fk_electronic_approval_history_main_parent
            FOREIGN KEY (parent_history_id)
            REFERENCES tb_electronic_approval_history_main(electronic_approval_history_id)
            ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_electronic_approval_history_main_parent_id
    ON tb_electronic_approval_history_main(parent_history_id);

COMMIT;
