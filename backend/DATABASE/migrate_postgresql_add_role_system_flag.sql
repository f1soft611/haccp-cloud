-- =============================================================================
-- Add system-role flag to tb_role and backfill core system roles
-- =============================================================================

BEGIN;

ALTER TABLE tb_role
    ADD COLUMN IF NOT EXISTS is_system_role CHAR(1) NOT NULL DEFAULT 'N';

UPDATE tb_role
SET is_system_role = 'Y',
    updated_at = NOW()
WHERE role_code IN ('PLATFORM_ADMIN', 'TENANT_ADMIN', 'TENANT_USER', 'TENENT_USER');

COMMIT;
