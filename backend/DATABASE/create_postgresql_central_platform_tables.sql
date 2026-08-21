-- =============================================================================
-- HACCP Cloud PostgreSQL - Central Platform Metadata Tables
-- =============================================================================
-- Purpose:
--   Restore central DB metadata tables required for tenant domain lookup,
--   tenant DB registry, and auth token lifecycle.
--
-- These tables belong to the central platform database and must not be created in
-- tenant-only schema provisioning.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.tb_tenant_domain (
    tenant_domain_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    email_domain VARCHAR(200) NOT NULL,
    is_primary CHAR(1) DEFAULT 'N' NOT NULL CHECK (is_primary IN ('Y', 'N')),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL CHECK (use_at IN ('Y', 'N')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (email_domain),
    FOREIGN KEY (tenant_id) REFERENCES public.tb_tenant(tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tb_tenant_domain_tenant_id
    ON public.tb_tenant_domain (tenant_id);

CREATE INDEX IF NOT EXISTS idx_tb_tenant_domain_primary
    ON public.tb_tenant_domain (tenant_id, is_primary, use_at);

CREATE TABLE IF NOT EXISTS public.tb_tenant_database (
    tenant_database_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    db_key VARCHAR(100) NOT NULL,
    db_name VARCHAR(100) NOT NULL,
    jdbc_url TEXT NOT NULL,
    jdbc_username VARCHAR(100) NOT NULL,
    jdbc_password_secret_ref VARCHAR(255),
    driver_class_name VARCHAR(200) DEFAULT 'org.postgresql.Driver',
    schema_name VARCHAR(100),
    pool_min_idle INT DEFAULT 1,
    pool_max_size INT DEFAULT 5,
    provisioning_status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL CHECK (use_at IN ('Y', 'N')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (tenant_id),
    UNIQUE (db_name),
    UNIQUE (db_key),
    FOREIGN KEY (tenant_id) REFERENCES public.tb_tenant(tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tb_tenant_database_status
    ON public.tb_tenant_database (provisioning_status, use_at);

CREATE TABLE IF NOT EXISTS public.tb_tenant_auth_token (
    auth_token_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    login_id BIGINT,
    tenant_code VARCHAR(50) NOT NULL,
    auth_token VARCHAR(255) NOT NULL,
    token_type VARCHAR(30) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (auth_token),
    FOREIGN KEY (tenant_id) REFERENCES public.tb_tenant(tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tb_tenant_auth_token_tenant_code
    ON public.tb_tenant_auth_token (tenant_code, expires_at);

CREATE INDEX IF NOT EXISTS idx_tb_tenant_auth_token_login_id
    ON public.tb_tenant_auth_token (login_id);

COMMIT;
