BEGIN;

DELETE FROM tb_role_menu_permission;
DELETE FROM tb_menu;
DELETE FROM tb_permission
WHERE tenant_id = (
    SELECT tenant_id
    FROM tb_tenant
    WHERE tenant_code = 'PLATFORM'
);

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

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
) VALUES
    (NULL, 'MENU_PLATFORM_ROOT', '플랫폼 관리', '플랫폼 운영 관리 메뉴 그룹', 'Settings', '/platform', 0, 'Y', NOW()),
    (NULL, 'MENU_DOCUMENT_ROOT', '문서 관리', '문서 운영 메뉴 그룹', 'Assignment', '/documents', 100, 'Y', NOW()),
    (NULL, 'MENU_SYSTEM_ROOT', '시스템 관리', '시스템 운영 메뉴 그룹', 'Build', '/users', 200, 'Y', NOW());

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    root.menu_id,
    'MENU_PLAN_MANAGEMENT',
    '플랜 관리',
    '플랜별 메뉴 매핑과 기능 설정을 관리합니다.',
    'Settings',
    '/platform/plans',
    10,
    'Y',
    NOW()
FROM tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT';

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    root.menu_id,
    'MENU_TENANT_MANAGEMENT',
    '업체 관리',
    '업체 운영 현황과 온보딩 대상을 관리합니다.',
    'Business',
    '/platform/tenants',
    20,
    'Y',
    NOW()
FROM tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT';

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    root.menu_id,
    'MENU_MENU_MANAGEMENT',
    '메뉴 관리',
    '플랫폼 메뉴를 등록하고 정렬 순서를 관리합니다.',
    'Menu',
    '/platform/menus',
    30,
    'Y',
    NOW()
FROM tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT';

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    root.menu_id,
    'MENU_AUTHORITY_MANAGEMENT',
    '권한 관리',
    '플랫폼 권한과 역할을 관리합니다.',
    'Security',
    '/platform/roles',
    40,
    'Y',
    NOW()
FROM tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT';

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    root.menu_id,
    'MENU_LOGIN_HISTORY',
    '로그인 이력 관리',
    '플랫폼 로그인 이력을 조회합니다.',
    'AccessTime',
    '/platform/login-history',
    50,
    'Y',
    NOW()
FROM tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT';

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    sys_root.menu_id,
    'MENU_TENANT_USERS',
    '사용자 관리',
    '업체 사용자 계정과 권한을 관리합니다.',
    'People',
    '/users',
    210,
    'Y',
    NOW()
FROM tb_menu sys_root
WHERE sys_root.menu_code = 'MENU_SYSTEM_ROOT';

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    sys_root.menu_id,
    'MENU_TENANT_DEPARTMENTS',
    '부서 관리',
    '업체 부서 정보를 등록하고 수정합니다.',
    'Category',
    '/departments',
    220,
    'Y',
    NOW()
FROM tb_menu sys_root
WHERE sys_root.menu_code = 'MENU_SYSTEM_ROOT';

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    doc_root.menu_id,
    'MENU_TENANT_DOCUMENTS',
    '문서 관리',
    '업체 문서 템플릿과 문서를 관리합니다.',
    'Assignment',
    '/documents',
    110,
    'Y',
    NOW()
FROM tb_menu doc_root
WHERE doc_root.menu_code = 'MENU_DOCUMENT_ROOT';

INSERT INTO tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at
)
SELECT
    doc_root.menu_id,
    'MENU_TENANT_HISTORY',
    '문서 이력',
    '업체 문서 변경 이력을 조회합니다.',
    'History',
    '/document-history',
    120,
    'Y',
    NOW()
FROM tb_menu doc_root
WHERE doc_root.menu_code = 'MENU_DOCUMENT_ROOT';

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
  ON m.menu_code IN (
      'MENU_PLATFORM_ROOT',
      'MENU_DOCUMENT_ROOT',
      'MENU_SYSTEM_ROOT',
      'MENU_PLAN_MANAGEMENT',
      'MENU_MENU_MANAGEMENT',
      'MENU_AUTHORITY_MANAGEMENT',
      'MENU_TENANT_MANAGEMENT',
      'MENU_LOGIN_HISTORY',
      'MENU_TENANT_USERS',
      'MENU_TENANT_DEPARTMENTS',
      'MENU_TENANT_DOCUMENTS',
      'MENU_TENANT_HISTORY'
  )
JOIN tb_permission p
  ON p.tenant_id = t.tenant_id
 AND p.permission_code IN ('PERM_READ', 'PERM_WRITE')
WHERE t.tenant_code = 'PLATFORM'
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;

COMMIT;