-- =============================================================================
-- HACCP Cloud PostgreSQL - Sample Tenant A/B/C Plan Validation
-- =============================================================================
-- Purpose:
--   Create one sample tenant and provide repeatable SQL to validate
--   menu visibility differences across plans A/B/C.
--
-- Preconditions:
--   1) create_postgresql_schema_active_tables.sql applied
--   2) add_postgresql_plan_subscription_feature_tables.sql applied
--
-- Sample tenant:
--   tenant_code: TENANT_SAMPLE
--   tenant_name: 요금제 검증 샘플업체
-- =============================================================================

BEGIN;

-- 1) Sample tenant
INSERT INTO tb_tenant (tenant_code, tenant_nm, admin_email, use_at, created_by)
VALUES ('TENANT_SAMPLE', '요금제 검증 샘플업체', 'sample-admin@tenant-sample.local', 'Y', NULL)
ON CONFLICT (tenant_code) DO UPDATE
SET tenant_nm = EXCLUDED.tenant_nm,
    admin_email = EXCLUDED.admin_email,
    use_at = 'Y',
    updated_at = NOW();

-- 2) Domain
INSERT INTO tb_tenant_domain (tenant_id, email_domain, is_primary, use_at, created_at, updated_at)
SELECT tenant_id, 'tenant-sample.local', 'Y', 'Y', NOW(), NOW()
FROM tb_tenant
WHERE tenant_code = 'TENANT_SAMPLE'
ON CONFLICT (email_domain) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id,
    is_primary = 'Y',
    use_at = 'Y',
    updated_at = NOW();

-- 3) Roles
INSERT INTO tb_role (tenant_id, role_code, role_nm, use_at)
SELECT t.tenant_id, r.role_code, r.role_nm, 'Y'
FROM tb_tenant t
CROSS JOIN (
    VALUES
      ('TENANT_ADMIN', '업체 관리자'),
      ('TENANT_USER', '업체 사용자')
) AS r(role_code, role_nm)
WHERE t.tenant_code = 'TENANT_SAMPLE'
ON CONFLICT (tenant_id, role_code) DO UPDATE
SET role_nm = EXCLUDED.role_nm,
    use_at = 'Y';

-- 4) Permissions
INSERT INTO tb_permission (tenant_id, permission_code, permission_nm, use_at, created_at)
SELECT t.tenant_id, p.permission_code, p.permission_nm, 'Y', NOW()
FROM tb_tenant t
CROSS JOIN (
    VALUES
      ('PERM_READ', '조회'),
      ('PERM_WRITE', '등록/수정')
) AS p(permission_code, permission_nm)
WHERE t.tenant_code = 'TENANT_SAMPLE'
ON CONFLICT (tenant_id, permission_code) DO UPDATE
SET permission_nm = EXCLUDED.permission_nm,
    use_at = 'Y';

-- 5) Tenant menus (recreate seed-owned rows)
DELETE FROM tb_menu
WHERE menu_code IN (
    'MENU_TENANT_DASHBOARD',
    'MENU_TENANT_USERS',
    'MENU_TENANT_DEPARTMENTS',
    'MENU_TENANT_DOCUMENTS',
    'MENU_TENANT_HISTORY'
  );

INSERT INTO tb_menu (parent_menu_id, menu_code, menu_nm, menu_url, menu_order, use_at, created_at)
VALUES
    (NULL, 'MENU_TENANT_DASHBOARD', '대시보드', '/dashboard', 10, 'Y', NOW()),
    (NULL, 'MENU_TENANT_USERS', '사용자 관리', '/users', 20, 'Y', NOW()),
    (NULL, 'MENU_TENANT_DEPARTMENTS', '부서 관리', '/departments', 25, 'Y', NOW()),
    (NULL, 'MENU_TENANT_DOCUMENTS', '문서 관리', '/documents', 30, 'Y', NOW()),
    (NULL, 'MENU_TENANT_HISTORY', '문서 이력', '/document-history', 40, 'Y', NOW());

-- 6) Tenant admin role-menu-permission mapping (read/write)
INSERT INTO tb_role_menu_permission (role_id, menu_id, permission_id, created_at)
SELECT r.role_id, m.menu_id, p.permission_id, NOW()
FROM tb_tenant t
JOIN tb_role r ON r.tenant_id = t.tenant_id AND r.role_code = 'TENANT_ADMIN'
JOIN tb_menu m
  ON m.menu_code IN ('MENU_TENANT_DASHBOARD', 'MENU_TENANT_USERS', 'MENU_TENANT_DEPARTMENTS', 'MENU_TENANT_DOCUMENTS', 'MENU_TENANT_HISTORY')
JOIN tb_permission p ON p.tenant_id = t.tenant_id AND p.permission_code IN ('PERM_READ', 'PERM_WRITE')
WHERE t.tenant_code = 'TENANT_SAMPLE'
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;

-- 7) Initial ACTIVE subscription = Plan A
UPDATE tb_tenant_subscription s
SET subscription_status = 'EXPIRED',
    ends_at = COALESCE(ends_at, NOW()),
    updated_at = NOW()
WHERE s.tenant_id = (SELECT tenant_id FROM tb_tenant WHERE tenant_code = 'TENANT_SAMPLE')
  AND s.subscription_status = 'ACTIVE';

INSERT INTO tb_tenant_subscription (
    tenant_id, plan_id, subscription_status, starts_at, ends_at, auto_renew, created_by, created_at, updated_at
)
SELECT t.tenant_id, p.plan_id, 'ACTIVE', NOW(), NULL, 'Y', NULL, NOW(), NOW()
FROM tb_tenant t
JOIN tb_plan p ON p.plan_code = 'A'
WHERE t.tenant_code = 'TENANT_SAMPLE';

COMMIT;

-- =============================================================================
-- Plan switch helper (run one block at a time)
-- =============================================================================
-- [A] Switch sample tenant active plan to A
-- WITH target_tenant AS (
--   SELECT tenant_id FROM tb_tenant WHERE tenant_code = 'TENANT_SAMPLE'
-- ), target_plan AS (
--   SELECT plan_id FROM tb_plan WHERE plan_code = 'A'
-- )
-- UPDATE tb_tenant_subscription s
-- SET subscription_status = 'EXPIRED', ends_at = COALESCE(ends_at, NOW()), updated_at = NOW()
-- FROM target_tenant t
-- WHERE s.tenant_id = t.tenant_id AND s.subscription_status = 'ACTIVE';
-- INSERT INTO tb_tenant_subscription (tenant_id, plan_id, subscription_status, starts_at, ends_at, auto_renew, created_by, created_at, updated_at)
-- SELECT t.tenant_id, p.plan_id, 'ACTIVE', NOW(), NULL, 'Y', NULL, NOW(), NOW()
-- FROM target_tenant t CROSS JOIN target_plan p;

-- [B] Switch sample tenant active plan to B
-- (same query as [A], only plan_code = 'B')

-- [C] Switch sample tenant active plan to C
-- (same query as [A], only plan_code = 'C')

-- =============================================================================
-- Visibility verification query (tenant admin perspective)
-- =============================================================================
-- SELECT
--   t.tenant_code,
--   p.plan_code,
--   m.menu_url,
--   m.menu_nm,
--   CASE
--     WHEN m.menu_url = '/users' THEN 'FEATURE_TENANT_USER_MGMT'
--     WHEN m.menu_url = '/documents' THEN 'FEATURE_DOC_WORKFLOW'
--     ELSE NULL
--   END AS required_feature_code,
--   COALESCE(pf.enabled_at, 'Y') AS feature_enabled_at,
--   CASE
--     WHEN pf.enabled_at = 'N' THEN 'HIDE'
--     ELSE 'SHOW'
--   END AS expected_visibility
-- FROM tb_tenant t
-- JOIN tb_tenant_subscription s
--   ON s.tenant_id = t.tenant_id
--  AND s.subscription_status = 'ACTIVE'
-- JOIN tb_plan p ON p.plan_id = s.plan_id
-- JOIN tb_menu m ON 1 = 1
-- LEFT JOIN tb_plan_feature pf
--   ON pf.plan_id = p.plan_id
--  AND pf.feature_code = CASE
--       WHEN m.menu_url = '/users' THEN 'FEATURE_TENANT_USER_MGMT'
--       WHEN m.menu_url = '/documents' THEN 'FEATURE_DOC_WORKFLOW'
--       ELSE NULL
--  END
-- WHERE t.tenant_code = 'TENANT_SAMPLE'
-- ORDER BY m.menu_order;
