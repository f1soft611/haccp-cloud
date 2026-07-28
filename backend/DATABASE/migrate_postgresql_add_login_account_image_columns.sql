-- =============================================================================
-- Add login account image columns
-- =============================================================================
-- DB: PostgreSQL 12+
-- Description: Add profile/stamp image columns to tb_login_account for my-page uploads
-- =============================================================================

ALTER TABLE tb_login_account
    ADD COLUMN IF NOT EXISTS profile_image TEXT,
    ADD COLUMN IF NOT EXISTS stamp_image TEXT;
