-- Ensure tenant onboarding/branding columns exist for public onboarding flow.
ALTER TABLE tb_tenant
    ADD COLUMN IF NOT EXISTS logo_image TEXT;

ALTER TABLE tb_tenant
    ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'EMAIL_QUEUED';

UPDATE tb_tenant
SET onboarding_status = 'EMAIL_QUEUED'
WHERE onboarding_status IS NULL OR TRIM(onboarding_status) = '';
