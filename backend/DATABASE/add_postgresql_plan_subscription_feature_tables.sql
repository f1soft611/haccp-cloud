-- =============================================================================
-- HACCP Cloud PostgreSQL - Plan/Subscription/Feature Extension
-- =============================================================================
-- Purpose:
--   Add SaaS pricing plan model (A/B/C) and tenant subscription/entitlement
--   tables without changing existing role-menu-permission schema.
--
-- Strategy:
--   - Keep existing authorization tables:
--       tb_role, tb_menu, tb_permission, tb_role_menu_permission
--   - Add plan tables and evaluate final permission as:
--       PLAN_ALLOW AND ROLE_ALLOW
--
-- Run target:
--   PostgreSQL 13+
-- =============================================================================

BEGIN;

-- 1) Plan master
CREATE TABLE IF NOT EXISTS tb_plan (
    plan_id BIGSERIAL PRIMARY KEY,
    plan_code VARCHAR(20) NOT NULL,
    plan_nm VARCHAR(100) NOT NULL,
    plan_desc VARCHAR(500),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL CHECK (use_at IN ('Y', 'N')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (plan_code)
);

-- 2) Plan feature/limit matrix
-- feature_type:
--   BOOLEAN = on/off feature gate
--   LIMIT   = quota type feature gate (limit_value required)
CREATE TABLE IF NOT EXISTS tb_plan_feature (
    plan_feature_id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    feature_code VARCHAR(100) NOT NULL,
    feature_nm VARCHAR(200) NOT NULL,
    feature_type VARCHAR(20) NOT NULL CHECK (feature_type IN ('BOOLEAN', 'LIMIT')),
    enabled_at CHAR(1) DEFAULT 'Y' NOT NULL CHECK (enabled_at IN ('Y', 'N')),
    limit_value BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (plan_id, feature_code),
    FOREIGN KEY (plan_id) REFERENCES tb_plan(plan_id) ON DELETE CASCADE,
    CHECK (
        (feature_type = 'BOOLEAN' AND limit_value IS NULL)
        OR
        (feature_type = 'LIMIT' AND limit_value IS NOT NULL)
    )
);

-- 2-1) Plan menu visibility matrix
-- menu_code is used instead of menu_id so one plan can be reused across tenants.
CREATE TABLE IF NOT EXISTS tb_plan_menu (
    plan_menu_id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    menu_code VARCHAR(100) NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL CHECK (use_at IN ('Y', 'N')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (plan_id, menu_code),
    FOREIGN KEY (plan_id) REFERENCES tb_plan(plan_id) ON DELETE CASCADE
);

-- 3) Tenant subscription history/current state
-- subscription_status:
--   ACTIVE, SUSPENDED, EXPIRED, CANCELED
CREATE TABLE IF NOT EXISTS tb_tenant_subscription (
    tenant_subscription_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    subscription_status VARCHAR(20) NOT NULL
        CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELED')),
    starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP,
    auto_renew CHAR(1) DEFAULT 'Y' NOT NULL CHECK (auto_renew IN ('Y', 'N')),
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES tb_plan(plan_id) ON DELETE RESTRICT,
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- Only one ACTIVE subscription per tenant.
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_active_subscription
ON tb_tenant_subscription(tenant_id)
WHERE subscription_status = 'ACTIVE';

-- Performance indexes.
CREATE INDEX IF NOT EXISTS idx_tenant_subscription_tenant
ON tb_tenant_subscription(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_subscription_plan
ON tb_tenant_subscription(plan_id);

CREATE INDEX IF NOT EXISTS idx_tenant_subscription_status
ON tb_tenant_subscription(subscription_status);

CREATE INDEX IF NOT EXISTS idx_plan_feature_plan
ON tb_plan_feature(plan_id);

CREATE INDEX IF NOT EXISTS idx_plan_feature_code
ON tb_plan_feature(feature_code);

CREATE INDEX IF NOT EXISTS idx_plan_menu_plan
ON tb_plan_menu(plan_id);

CREATE INDEX IF NOT EXISTS idx_plan_menu_code
ON tb_plan_menu(menu_code);

-- 4) Seed base plans (A/B/C/P)
INSERT INTO tb_plan (plan_code, plan_nm, plan_desc, use_at)
VALUES
    ('A', 'Basic', 'Entry plan', 'Y'),
    ('B', 'Professional', 'Mid-tier plan', 'Y'),
    ('C', 'Enterprise', 'Advanced plan', 'Y'),
    ('P', 'Platform Admin', 'Platform control plan for internal admin tenant', 'Y')
ON CONFLICT (plan_code) DO UPDATE
SET plan_nm = EXCLUDED.plan_nm,
    plan_desc = EXCLUDED.plan_desc,
    use_at = EXCLUDED.use_at,
    updated_at = CURRENT_TIMESTAMP;

-- 5) Seed sample feature matrix
-- Feature catalog strategy:
--   Keep feature_code stable, and change values by plan.

-- A plan
INSERT INTO tb_plan_feature (plan_id, feature_code, feature_nm, feature_type, enabled_at, limit_value)
SELECT p.plan_id, x.feature_code, x.feature_nm, x.feature_type, x.enabled_at, x.limit_value
FROM tb_plan p
CROSS JOIN (
    VALUES
    ('FEATURE_PLATFORM_TENANT_MGMT', 'Platform tenant management', 'BOOLEAN', 'N', NULL),
    ('FEATURE_PLATFORM_MENU_MGMT', 'Platform menu management', 'BOOLEAN', 'N', NULL),
    ('FEATURE_PLATFORM_ROLE_MGMT', 'Platform role management', 'BOOLEAN', 'N', NULL),
    ('FEATURE_TENANT_USER_MGMT', 'Tenant user management', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_DOC_WORKFLOW', 'Document workflow', 'BOOLEAN', 'N', NULL),
        ('FEATURE_AUDIT_LOG', 'Audit log', 'BOOLEAN', 'N', NULL),
        ('FEATURE_API_EXPORT', 'API export', 'BOOLEAN', 'N', NULL),
        ('LIMIT_USER_COUNT', 'Maximum users', 'LIMIT', 'Y', 20)
) AS x(feature_code, feature_nm, feature_type, enabled_at, limit_value)
WHERE p.plan_code = 'A'
ON CONFLICT (plan_id, feature_code) DO UPDATE
SET feature_nm = EXCLUDED.feature_nm,
    feature_type = EXCLUDED.feature_type,
    enabled_at = EXCLUDED.enabled_at,
    limit_value = EXCLUDED.limit_value,
    updated_at = CURRENT_TIMESTAMP;

-- B plan
INSERT INTO tb_plan_feature (plan_id, feature_code, feature_nm, feature_type, enabled_at, limit_value)
SELECT p.plan_id, x.feature_code, x.feature_nm, x.feature_type, x.enabled_at, x.limit_value
FROM tb_plan p
CROSS JOIN (
    VALUES
    ('FEATURE_PLATFORM_TENANT_MGMT', 'Platform tenant management', 'BOOLEAN', 'N', NULL),
    ('FEATURE_PLATFORM_MENU_MGMT', 'Platform menu management', 'BOOLEAN', 'N', NULL),
    ('FEATURE_PLATFORM_ROLE_MGMT', 'Platform role management', 'BOOLEAN', 'N', NULL),
    ('FEATURE_TENANT_USER_MGMT', 'Tenant user management', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_DOC_WORKFLOW', 'Document workflow', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_AUDIT_LOG', 'Audit log', 'BOOLEAN', 'N', NULL),
        ('FEATURE_API_EXPORT', 'API export', 'BOOLEAN', 'Y', NULL),
        ('LIMIT_USER_COUNT', 'Maximum users', 'LIMIT', 'Y', 100)
) AS x(feature_code, feature_nm, feature_type, enabled_at, limit_value)
WHERE p.plan_code = 'B'
ON CONFLICT (plan_id, feature_code) DO UPDATE
SET feature_nm = EXCLUDED.feature_nm,
    feature_type = EXCLUDED.feature_type,
    enabled_at = EXCLUDED.enabled_at,
    limit_value = EXCLUDED.limit_value,
    updated_at = CURRENT_TIMESTAMP;

-- C plan
INSERT INTO tb_plan_feature (plan_id, feature_code, feature_nm, feature_type, enabled_at, limit_value)
SELECT p.plan_id, x.feature_code, x.feature_nm, x.feature_type, x.enabled_at, x.limit_value
FROM tb_plan p
CROSS JOIN (
    VALUES
        ('FEATURE_PLATFORM_TENANT_MGMT', 'Platform tenant management', 'BOOLEAN', 'N', NULL),
        ('FEATURE_PLATFORM_MENU_MGMT', 'Platform menu management', 'BOOLEAN', 'N', NULL),
        ('FEATURE_PLATFORM_ROLE_MGMT', 'Platform role management', 'BOOLEAN', 'N', NULL),
        ('FEATURE_TENANT_USER_MGMT', 'Tenant user management', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_DOC_WORKFLOW', 'Document workflow', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_AUDIT_LOG', 'Audit log', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_API_EXPORT', 'API export', 'BOOLEAN', 'Y', NULL),
        ('LIMIT_USER_COUNT', 'Maximum users', 'LIMIT', 'Y', 1000)
) AS x(feature_code, feature_nm, feature_type, enabled_at, limit_value)
WHERE p.plan_code = 'C'
ON CONFLICT (plan_id, feature_code) DO UPDATE
SET feature_nm = EXCLUDED.feature_nm,
    feature_type = EXCLUDED.feature_type,
    enabled_at = EXCLUDED.enabled_at,
    limit_value = EXCLUDED.limit_value,
    updated_at = CURRENT_TIMESTAMP;

-- P plan (platform internal tenant)
INSERT INTO tb_plan_feature (plan_id, feature_code, feature_nm, feature_type, enabled_at, limit_value)
SELECT p.plan_id, x.feature_code, x.feature_nm, x.feature_type, x.enabled_at, x.limit_value
FROM tb_plan p
CROSS JOIN (
    VALUES
        ('FEATURE_PLATFORM_TENANT_MGMT', 'Platform tenant management', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_PLATFORM_MENU_MGMT', 'Platform menu management', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_PLATFORM_ROLE_MGMT', 'Platform role management', 'BOOLEAN', 'Y', NULL),
    ('FEATURE_TENANT_USER_MGMT', 'Tenant user management', 'BOOLEAN', 'Y', NULL),
    ('FEATURE_DOC_WORKFLOW', 'Document workflow', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_AUDIT_LOG', 'Audit log', 'BOOLEAN', 'Y', NULL),
        ('FEATURE_API_EXPORT', 'API export', 'BOOLEAN', 'Y', NULL),
        ('LIMIT_USER_COUNT', 'Maximum users', 'LIMIT', 'Y', 1000)
) AS x(feature_code, feature_nm, feature_type, enabled_at, limit_value)
WHERE p.plan_code = 'P'
ON CONFLICT (plan_id, feature_code) DO UPDATE
SET feature_nm = EXCLUDED.feature_nm,
    feature_type = EXCLUDED.feature_type,
    enabled_at = EXCLUDED.enabled_at,
    limit_value = EXCLUDED.limit_value,
    updated_at = CURRENT_TIMESTAMP;

-- 5-1) Seed plan-menu matrix
-- A: tenant basic menu set (no document template menu)
INSERT INTO tb_plan_menu (plan_id, menu_code, use_at)
SELECT p.plan_id, x.menu_code, x.use_at
FROM tb_plan p
CROSS JOIN (
    VALUES
        ('MENU_TENANT_DASHBOARD', 'Y'),
        ('MENU_TENANT_USERS', 'Y'),
        ('MENU_TENANT_DEPARTMENTS', 'Y'),
        ('MENU_TENANT_HISTORY', 'Y')
) AS x(menu_code, use_at)
WHERE p.plan_code = 'A'
ON CONFLICT (plan_id, menu_code) DO UPDATE
SET use_at = EXCLUDED.use_at,
    updated_at = CURRENT_TIMESTAMP;

-- B: A + documents
INSERT INTO tb_plan_menu (plan_id, menu_code, use_at)
SELECT p.plan_id, x.menu_code, x.use_at
FROM tb_plan p
CROSS JOIN (
    VALUES
        ('MENU_TENANT_DASHBOARD', 'Y'),
        ('MENU_TENANT_USERS', 'Y'),
        ('MENU_TENANT_DEPARTMENTS', 'Y'),
        ('MENU_TENANT_DOCUMENTS', 'Y'),
        ('MENU_TENANT_HISTORY', 'Y')
) AS x(menu_code, use_at)
WHERE p.plan_code = 'B'
ON CONFLICT (plan_id, menu_code) DO UPDATE
SET use_at = EXCLUDED.use_at,
    updated_at = CURRENT_TIMESTAMP;

-- C: B + enterprise still uses same menu surface
INSERT INTO tb_plan_menu (plan_id, menu_code, use_at)
SELECT p.plan_id, x.menu_code, x.use_at
FROM tb_plan p
CROSS JOIN (
    VALUES
        ('MENU_TENANT_DASHBOARD', 'Y'),
        ('MENU_TENANT_USERS', 'Y'),
        ('MENU_TENANT_DEPARTMENTS', 'Y'),
        ('MENU_TENANT_DOCUMENTS', 'Y'),
        ('MENU_TENANT_HISTORY', 'Y')
) AS x(menu_code, use_at)
WHERE p.plan_code = 'C'
ON CONFLICT (plan_id, menu_code) DO UPDATE
SET use_at = EXCLUDED.use_at,
    updated_at = CURRENT_TIMESTAMP;

-- P: platform super tenant menu surface
INSERT INTO tb_plan_menu (plan_id, menu_code, use_at)
SELECT p.plan_id, x.menu_code, x.use_at
FROM tb_plan p
CROSS JOIN (
    VALUES
        ('MENU_PLATFORM_ROOT', 'Y'),
        ('MENU_DOCUMENT_ROOT', 'Y'),
        ('MENU_SYSTEM_ROOT', 'Y'),
        ('MENU_PLAN_MANAGEMENT', 'Y'),
        ('MENU_MENU_MANAGEMENT', 'Y'),
        ('MENU_AUTHORITY_MANAGEMENT', 'Y'),
        ('MENU_TENANT_MANAGEMENT', 'Y'),
        ('MENU_LOGIN_HISTORY', 'Y'),
        ('MENU_TENANT_USERS', 'Y'),
        ('MENU_TENANT_DEPARTMENTS', 'Y'),
        ('MENU_TENANT_DOCUMENTS', 'Y'),
        ('MENU_TENANT_HISTORY', 'Y'),
        ('MENU_TENANT_DASHBOARD', 'Y')
) AS x(menu_code, use_at)
WHERE p.plan_code = 'P'
ON CONFLICT (plan_id, menu_code) DO UPDATE
SET use_at = EXCLUDED.use_at,
    updated_at = CURRENT_TIMESTAMP;

-- 6) Optional bootstrap: assign default plan A for tenants with no ACTIVE subscription
INSERT INTO tb_tenant_subscription (
    tenant_id,
    plan_id,
    subscription_status,
    starts_at,
    ends_at,
    auto_renew,
    created_by
)
SELECT
    t.tenant_id,
    p.plan_id,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    NULL,
    'Y',
    NULL
FROM tb_tenant t
JOIN tb_plan p
  ON p.plan_code = 'A'
LEFT JOIN tb_tenant_subscription s
  ON s.tenant_id = t.tenant_id
 AND s.subscription_status = 'ACTIVE'
WHERE s.tenant_subscription_id IS NULL;

COMMIT;

-- =============================================================================
-- Verification queries
-- =============================================================================
-- 1) Plan list
-- SELECT plan_id, plan_code, plan_nm, use_at FROM tb_plan ORDER BY plan_id;
--
-- 2) Feature matrix
-- SELECT p.plan_code, f.feature_code, f.feature_type, f.enabled_at, f.limit_value
-- FROM tb_plan_feature f
-- JOIN tb_plan p ON p.plan_id = f.plan_id
-- ORDER BY p.plan_code, f.feature_code;
--
-- 3) Tenant active subscriptions
-- SELECT t.tenant_code, p.plan_code, s.subscription_status, s.starts_at, s.ends_at
-- FROM tb_tenant_subscription s
-- JOIN tb_tenant t ON t.tenant_id = s.tenant_id
-- JOIN tb_plan p ON p.plan_id = s.plan_id
-- WHERE s.subscription_status = 'ACTIVE'
-- ORDER BY t.tenant_code;
-- =============================================================================
