-- =============================================================================
-- HACCP Cloud PostgreSQL - F1soft(PLATFORM) Plan Bootstrap
-- =============================================================================
-- Purpose:
--   Apply a deterministic plan subscription for the PLATFORM tenant
--   so tenant/menu/role management can be used immediately.
--
-- Preconditions:
--   1) add_postgresql_plan_subscription_feature_tables.sql applied
--   2) seed_postgresql_minimal_platform_admin.sql applied
--
-- Default policy in this script:
--   - tenant_code: PLATFORM
--   - active plan: P (Platform Admin)
--   - critical features:
--       FEATURE_PLATFORM_TENANT_MGMT = Y
--       FEATURE_PLATFORM_MENU_MGMT   = Y
--       FEATURE_PLATFORM_ROLE_MGMT   = Y
--       FEATURE_TENANT_USER_MGMT     = Y
--       FEATURE_DOC_WORKFLOW         = Y
--       FEATURE_AUDIT_LOG = Y
--       LIMIT_USER_COUNT  = 1000
--
-- Note:
--   This script updates plan-feature rows globally for plan P.
--   If multiple platform tenants share plan P and need different values,
--   introduce tenant-level override table in phase 2.
-- =============================================================================

BEGIN;

-- 2) Expire previous ACTIVE subscription for PLATFORM
UPDATE tb_tenant_subscription s
SET subscription_status = 'EXPIRED',
    ends_at = COALESCE(ends_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
WHERE s.tenant_id = (
        SELECT tenant_id
        FROM tb_tenant
        WHERE tenant_code = 'PLATFORM'
    )
  AND s.subscription_status = 'ACTIVE';

-- 3) Create new ACTIVE subscription for PLATFORM with plan P
INSERT INTO tb_tenant_subscription (
    tenant_id,
    plan_id,
    subscription_status,
    starts_at,
    ends_at,
    auto_renew,
    created_by,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    p.plan_id,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    NULL,
    'Y',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT tenant_id
    FROM tb_tenant
    WHERE tenant_code = 'PLATFORM'
) t
CROSS JOIN (
    SELECT plan_id
    FROM tb_plan
    WHERE plan_code = 'P'
) p;

-- 4) Ensure plan P feature matrix for platform operation
--    (platform tenant/menu/role management + login-history)
INSERT INTO tb_plan_feature (plan_id, feature_code, feature_nm, feature_type, enabled_at, limit_value)
SELECT p.plan_id, v.feature_code, v.feature_nm, v.feature_type, v.enabled_at, v.limit_value
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
) AS v(feature_code, feature_nm, feature_type, enabled_at, limit_value)
WHERE p.plan_code = 'P'
ON CONFLICT (plan_id, feature_code) DO UPDATE
SET feature_nm = EXCLUDED.feature_nm,
    feature_type = EXCLUDED.feature_type,
    enabled_at = EXCLUDED.enabled_at,
    limit_value = EXCLUDED.limit_value,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- =============================================================================
-- Verification
-- =============================================================================
-- 1) PLATFORM active subscription
-- SELECT t.tenant_code, p.plan_code, s.subscription_status, s.starts_at, s.ends_at
-- FROM tb_tenant_subscription s
-- JOIN tb_tenant t ON t.tenant_id = s.tenant_id
-- JOIN tb_plan p ON p.plan_id = s.plan_id
-- WHERE t.tenant_code = 'PLATFORM'
--   AND s.subscription_status = 'ACTIVE';
--
-- 2) P plan features
-- SELECT p.plan_code, f.feature_code, f.feature_type, f.enabled_at, f.limit_value
-- FROM tb_plan p
-- JOIN tb_plan_feature f ON f.plan_id = p.plan_id
-- WHERE p.plan_code = 'P'
-- ORDER BY f.feature_code;
-- =============================================================================
