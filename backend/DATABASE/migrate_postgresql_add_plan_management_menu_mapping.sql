-- =============================================================================
-- HACCP Cloud PostgreSQL - Add platform plan management menu mapping
-- =============================================================================
-- Purpose:
--   Ensure '/platform/plans' menu is present and included in plan P menu matrix.
-- =============================================================================

BEGIN;

-- 1) Add platform plan management menu under platform root if missing.
INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
  menu_dc,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT
    root.menu_id,
    'MENU_PLAN_MANAGEMENT',
    '플랜 관리',
  '플랜별 메뉴 매핑과 기능 설정을 관리합니다.',
    '/platform/plans',
    15,
    'Y',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT'
  AND NOT EXISTS (
    SELECT 1
    FROM tb_menu m
    WHERE m.menu_code = 'MENU_PLAN_MANAGEMENT'
  );

UPDATE tb_menu
SET menu_dc = '플랜별 메뉴 매핑과 기능 설정을 관리합니다.',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'MENU_PLAN_MANAGEMENT'
  AND COALESCE(menu_dc, '') = '';

-- 2) Include plan management menu in plan P matrix.
INSERT INTO tb_plan_menu (plan_id, menu_code, use_at, created_at, updated_at)
SELECT p.plan_id, 'MENU_PLAN_MANAGEMENT', 'Y', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM tb_plan p
WHERE p.plan_code = 'P'
ON CONFLICT (plan_id, menu_code) DO UPDATE
SET use_at = EXCLUDED.use_at,
    updated_at = CURRENT_TIMESTAMP;

DELETE FROM tb_plan_menu
WHERE menu_code = 'MENU_ROLE_MENU_MANAGEMENT'
  AND plan_id IN (SELECT plan_id FROM tb_plan WHERE plan_code = 'P');

UPDATE tb_menu
SET menu_dc = CASE menu_code
    WHEN 'MENU_PLATFORM_ROOT' THEN '플랫폼 운영 관리 메뉴 그룹'
    WHEN 'MENU_PLAN_MANAGEMENT' THEN '플랜별 메뉴 매핑과 기능 설정을 관리합니다.'
    WHEN 'MENU_TENANT_MANAGEMENT' THEN '업체 운영 현황과 온보딩 대상을 관리합니다.'
    WHEN 'MENU_MENU_MANAGEMENT' THEN '플랫폼 메뉴를 등록하고 정렬 순서를 관리합니다.'
    WHEN 'MENU_AUTHORITY_MANAGEMENT' THEN '플랫폼 권한과 역할을 관리합니다.'
    WHEN 'MENU_LOGIN_HISTORY' THEN '플랫폼 로그인 이력을 조회합니다.'
    ELSE menu_dc
  END,
  icon_nm = CASE menu_code
    WHEN 'MENU_PLATFORM_ROOT' THEN 'Settings'
    WHEN 'MENU_PLAN_MANAGEMENT' THEN 'Settings'
    WHEN 'MENU_TENANT_MANAGEMENT' THEN 'Business'
    WHEN 'MENU_MENU_MANAGEMENT' THEN 'Menu'
    WHEN 'MENU_AUTHORITY_MANAGEMENT' THEN 'Security'
    WHEN 'MENU_LOGIN_HISTORY' THEN 'AccessTime'
    ELSE icon_nm
  END,
  menu_order = CASE menu_code
    WHEN 'MENU_PLAN_MANAGEMENT' THEN 10
    WHEN 'MENU_TENANT_MANAGEMENT' THEN 20
    WHEN 'MENU_MENU_MANAGEMENT' THEN 30
    WHEN 'MENU_AUTHORITY_MANAGEMENT' THEN 40
    WHEN 'MENU_LOGIN_HISTORY' THEN 50
    ELSE menu_order
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE menu_code IN (
  'MENU_PLATFORM_ROOT',
  'MENU_PLAN_MANAGEMENT',
  'MENU_TENANT_MANAGEMENT',
  'MENU_MENU_MANAGEMENT',
  'MENU_AUTHORITY_MANAGEMENT',
  'MENU_LOGIN_HISTORY'
);

DELETE FROM tb_role_menu_permission
WHERE menu_id IN (
  SELECT menu_id
  FROM tb_menu
  WHERE menu_code = 'MENU_ROLE_MENU_MANAGEMENT'
);

DELETE FROM tb_menu
WHERE menu_code = 'MENU_ROLE_MENU_MANAGEMENT';

-- 3) Grant PLATFORM_ADMIN read/write permissions to this menu.
INSERT INTO tb_role_menu_permission (role_id, menu_id, permission_id, created_at)
SELECT r.role_id, m.menu_id, perm.permission_id, CURRENT_TIMESTAMP
FROM tb_role r
JOIN tb_tenant t ON t.tenant_id = r.tenant_id
JOIN tb_menu m ON m.menu_code = 'MENU_PLAN_MANAGEMENT'
JOIN tb_permission perm
  ON perm.tenant_id = t.tenant_id
 AND perm.permission_code IN ('PERM_READ', 'PERM_WRITE')
WHERE t.tenant_code = 'PLATFORM'
  AND r.role_code = 'PLATFORM_ADMIN'
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;

COMMIT;
