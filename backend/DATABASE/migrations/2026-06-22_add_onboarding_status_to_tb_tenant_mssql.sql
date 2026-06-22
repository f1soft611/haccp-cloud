IF COL_LENGTH('tb_tenant', 'onboarding_status') IS NULL
BEGIN
    ALTER TABLE tb_tenant
    ADD onboarding_status VARCHAR(50) NOT NULL CONSTRAINT DF_tb_tenant_onboarding_status DEFAULT 'EMAIL_QUEUED';
END
