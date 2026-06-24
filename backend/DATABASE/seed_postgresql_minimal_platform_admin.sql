-- =============================================================================
-- HACCP Cloud PostgreSQL Minimal Seed
-- =============================================================================
-- Goal: provide the smallest seed set for the platform admin to operate
--       - one tenant (에프원소프트)
--       - one tenant domain (f1soft.co.kr)
--       - one platform admin account
--       - platform roles
--       - menu/permission mappings
-- =============================================================================

BEGIN;

-- 1) Core tenant
INSERT INTO tb_tenant (
    tenant_code,
    tenant_nm,
    admin_email,
    use_at,
    created_by
) VALUES (
    'PLATFORM',
    '에프원소프트',
    'socra710@f1soft.co.kr',
    'Y',
    NULL
)
ON CONFLICT (tenant_code) DO UPDATE
SET tenant_nm = EXCLUDED.tenant_nm,
    admin_email = EXCLUDED.admin_email,
    use_at = 'Y',
    updated_at = NOW(),
    created_by = EXCLUDED.created_by;

-- 1-1) Tenant domain mapping for domain-based login
INSERT INTO tb_tenant_domain (
    tenant_id,
    email_domain,
    is_primary,
    use_at,
    created_at,
    updated_at
)
SELECT
    tenant_id,
    'f1soft.co.kr',
    'Y',
    'Y',
    NOW(),
    NOW()
FROM tb_tenant
WHERE tenant_code = 'PLATFORM'
ON CONFLICT (email_domain) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id,
    is_primary = 'Y',
    use_at = 'Y',
    updated_at = NOW();

-- 2) Roles used by login / authorization
INSERT INTO tb_role (
    tenant_id,
    role_code,
    role_nm,
    use_at
)
SELECT
    t.tenant_id,
    v.role_code,
    v.role_nm,
    'Y'
FROM tb_tenant t
CROSS JOIN (
    VALUES
        ('PLATFORM_ADMIN', '플랫폼 관리자'),
        ('TENANT_ADMIN', '업체 관리자'),
        ('TENANT_USER', '업체 사용자')
) AS v(role_code, role_nm)
WHERE t.tenant_code = 'PLATFORM'
ON CONFLICT (tenant_id, role_code) DO UPDATE
SET role_nm = EXCLUDED.role_nm,
    use_at = 'Y';

-- 3) Menu permissions
INSERT INTO tb_permission (
    tenant_id,
    permission_code,
    permission_nm,
    use_at,
    created_at
)
SELECT
    t.tenant_id,
    v.permission_code,
    v.permission_nm,
    'Y',
    NOW()
FROM tb_tenant t
CROSS JOIN (
    VALUES
        ('PERM_READ', '조회'),
        ('PERM_WRITE', '등록/수정')
) AS v(permission_code, permission_nm)
WHERE t.tenant_code = 'PLATFORM'
ON CONFLICT (tenant_id, permission_code) DO UPDATE
SET permission_nm = EXCLUDED.permission_nm,
    use_at = 'Y';

-- 4) Platform menu tree (delete and recreate the seed-owned menu rows)
DELETE FROM tb_menu
WHERE tenant_id = (
        SELECT tenant_id
        FROM tb_tenant
        WHERE tenant_code = 'PLATFORM'
    )
  AND menu_code IN (
      'MENU_PLATFORM_ROOT',
      'MENU_MENU_MANAGEMENT',
      'MENU_AUTHORITY_MANAGEMENT',
      'MENU_TENANT_MANAGEMENT',
      'MENU_LOGIN_HISTORY'
  );

INSERT INTO tb_menu (
    tenant_id,
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    t.tenant_id,
    NULL,
    'MENU_PLATFORM_ROOT',
    '플랫폼 관리',
    '/platform',
    0,
    'Y',
    NOW()
FROM tb_tenant t
WHERE t.tenant_code = 'PLATFORM';

INSERT INTO tb_menu (
    tenant_id,
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    t.tenant_id,
    root.menu_id,
    'MENU_MENU_MANAGEMENT',
    '메뉴 관리',
    '/platform/menus',
    10,
    'Y',
    NOW()
FROM tb_tenant t
JOIN tb_menu root
  ON root.tenant_id = t.tenant_id
 AND root.menu_code = 'MENU_PLATFORM_ROOT'
WHERE t.tenant_code = 'PLATFORM';

INSERT INTO tb_menu (
    tenant_id,
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    t.tenant_id,
    root.menu_id,
    'MENU_AUTHORITY_MANAGEMENT',
    '권한 관리',
    '/platform/roles',
    20,
    'Y',
    NOW()
FROM tb_tenant t
JOIN tb_menu root
  ON root.tenant_id = t.tenant_id
 AND root.menu_code = 'MENU_PLATFORM_ROOT'
WHERE t.tenant_code = 'PLATFORM';

INSERT INTO tb_menu (
    tenant_id,
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    t.tenant_id,
    root.menu_id,
    'MENU_TENANT_MANAGEMENT',
    '업체 관리',
    '/platform/tenants',
    30,
    'Y',
    NOW()
FROM tb_tenant t
JOIN tb_menu root
  ON root.tenant_id = t.tenant_id
 AND root.menu_code = 'MENU_PLATFORM_ROOT'
WHERE t.tenant_code = 'PLATFORM';

INSERT INTO tb_menu (
    tenant_id,
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    t.tenant_id,
    root.menu_id,
    'MENU_LOGIN_HISTORY',
    '로그인 이력 관리',
    '/platform/login-history',
    40,
    'Y',
    NOW()
FROM tb_tenant t
JOIN tb_menu root
  ON root.tenant_id = t.tenant_id
 AND root.menu_code = 'MENU_PLATFORM_ROOT'
WHERE t.tenant_code = 'PLATFORM';

-- 5) Platform admin account
INSERT INTO tb_login_account (
    tenant_id,
    login_code,
    password_hash,
    login_attempt_count,
    locked_at,
    password_changed_at,
    use_at,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    'socra710',
    'tHaU6E4leMVISzSKoByGd9DG/6uEhXmmxp9yt9soRvQ=',
    0,
    NULL,
    NOW(),
    'Y',
    NOW(),
    NOW()
FROM tb_tenant t
WHERE t.tenant_code = 'PLATFORM'
ON CONFLICT (tenant_id, login_code) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    login_attempt_count = 0,
    locked_at = NULL,
    password_changed_at = NOW(),
    use_at = 'Y',
    updated_at = NOW();

INSERT INTO tb_user (
    tenant_id,
    login_id,
    user_nm,
    email_addr,
    department_id,
    mobile_no,
    use_at,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    la.login_id,
    '소크라710',
    'socra710@f1soft.co.kr',
    NULL,
    NULL,
    'Y',
    NOW(),
    NOW()
FROM tb_tenant t
JOIN tb_login_account la
  ON la.tenant_id = t.tenant_id
 AND la.login_code = 'socra710'
WHERE t.tenant_code = 'PLATFORM'
ON CONFLICT (tenant_id, email_addr) DO UPDATE
SET login_id = EXCLUDED.login_id,
    user_nm = EXCLUDED.user_nm,
    department_id = EXCLUDED.department_id,
    mobile_no = EXCLUDED.mobile_no,
    use_at = 'Y',
    updated_at = NOW();

-- 6) Mapping: platform admin -> platform admin role
INSERT INTO tb_login_account_role (
    login_id,
    role_id,
    created_at
)
SELECT
    la.login_id,
    r.role_id,
    NOW()
FROM tb_tenant t
JOIN tb_login_account la
  ON la.tenant_id = t.tenant_id
 AND la.login_code = 'socra710'
JOIN tb_role r
  ON r.tenant_id = t.tenant_id
 AND r.role_code = 'PLATFORM_ADMIN'
WHERE t.tenant_code = 'PLATFORM'
ON CONFLICT (login_id, role_id) DO NOTHING;

-- 7) Mapping: platform admin role -> platform menus + read/write permissions
INSERT INTO tb_role_menu_permission (
    role_id,
    menu_id,
    permission_id,
    created_at
)
SELECT
    r.role_id,
    m.menu_id,
    p.permission_id,
    NOW()
FROM tb_tenant t
JOIN tb_role r
  ON r.tenant_id = t.tenant_id
 AND r.role_code = 'PLATFORM_ADMIN'
JOIN tb_menu m
  ON m.tenant_id = t.tenant_id
 AND m.menu_code IN (
      'MENU_PLATFORM_ROOT',
      'MENU_MENU_MANAGEMENT',
      'MENU_AUTHORITY_MANAGEMENT',
      'MENU_TENANT_MANAGEMENT',
      'MENU_LOGIN_HISTORY'
  )
JOIN tb_permission p
    ON p.tenant_id = t.tenant_id
 AND p.permission_code IN ('PERM_READ', 'PERM_WRITE')
WHERE t.tenant_code = 'PLATFORM'
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;

COMMIT;

-- Verification hints
-- SELECT tenant_code, tenant_nm, admin_email FROM tb_tenant WHERE tenant_code = 'PLATFORM';
-- SELECT email_domain, is_primary, use_at FROM tb_tenant_domain WHERE tenant_id = (SELECT tenant_id FROM tb_tenant WHERE tenant_code = 'PLATFORM');
-- SELECT login_code FROM tb_login_account WHERE login_code = 'socra710';
-- SELECT menu_code, menu_nm FROM tb_menu WHERE tenant_id = (SELECT tenant_id FROM tb_tenant WHERE tenant_code = 'PLATFORM') ORDER BY menu_order;