-- =============================================================================
-- Add role_dc (role description) column to tb_role
-- Run per tenant database via apply_migration_to_all_tenants.ps1
-- =============================================================================

ALTER TABLE tb_role
    ADD COLUMN IF NOT EXISTS role_dc VARCHAR(500);
