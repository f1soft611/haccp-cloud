BEGIN;

ALTER TABLE public.tb_tenant
    ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(12),
    ADD COLUMN IF NOT EXISTS corporate_number VARCHAR(14),
    ADD COLUMN IF NOT EXISTS business_type VARCHAR(200),
    ADD COLUMN IF NOT EXISTS business_category VARCHAR(200),
    ADD COLUMN IF NOT EXISTS registration_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_tenant_business_registration_number_active
    ON public.tb_tenant (business_registration_number)
    WHERE business_registration_number IS NOT NULL AND use_at = 'Y';

CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_tenant_corporate_number_active
    ON public.tb_tenant (corporate_number)
    WHERE corporate_number IS NOT NULL AND use_at = 'Y';

COMMIT;