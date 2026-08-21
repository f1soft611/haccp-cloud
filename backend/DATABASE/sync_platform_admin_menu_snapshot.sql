BEGIN;

-- 1) Upsert the exact menu snapshot supplied by the user.
INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT NULL,
       'MENU_HACCP_PORTAL',
       'HACCP 문서포탈',
       '관리자용 분류별 문서 목록을 확인합니다.',
       'Dashboard',
       '/docs/portal',
       10,
       'Y',
       NOW(),
       NOW()
ON CONFLICT (menu_code) DO UPDATE
SET menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT NULL,
       'MENU_BASICINFO_MANAGEMENT',
       '기준정보 관리',
       '기준정보를 관리하는 화면입니다.',
       'Business',
       '/basicinfo',
       4,
       'Y',
       NOW(),
       NOW()
ON CONFLICT (menu_code) DO UPDATE
SET menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT NULL,
       'MENU_PLATFORM_ROOT',
       '플랫폼 관리',
       '플랫폼 운영 관리 메뉴 그룹',
       'Settings',
       '/platform',
       1,
       'Y',
       NOW(),
       NOW()
ON CONFLICT (menu_code) DO UPDATE
SET menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT NULL,
       'MENU_DOC_MANAGEMENT',
       '문서 관리',
       '문서 관리',
       'Build',
       '/docs',
       2,
       'Y',
       NOW(),
       NOW()
ON CONFLICT (menu_code) DO UPDATE
SET menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT NULL,
       'MENU_ORGANIZATION_MANAGEMENT',
       '조직 관리',
       '조직 관리',
       'Settings',
       '/org',
       3,
       'Y',
       NOW(),
       NOW()
ON CONFLICT (menu_code) DO UPDATE
SET menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_USERS_MANAGEMENT',
       '사용자 관리',
       '사용자 관리',
       'People',
       '/org/users',
       10,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_ORGANIZATION_MANAGEMENT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_DEPT_MANAGEMENT',
       '부서 관리',
       '부서 관리',
       'Menu',
       '/org/departments',
       20,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_ORGANIZATION_MANAGEMENT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_AUTHORITY_MANAGEMENT',
       '권한 관리',
       '업체별 권한과 역할을 관리합니다.',
       'Security',
       '/org/roles',
       30,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_ORGANIZATION_MANAGEMENT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_CUSTOMER_MANAGEMENT',
       '거래처관리',
       '거래처를 관리하는 화면입니다.',
       'Business',
       '/basicinfo/customers',
       10,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_BASICINFO_MANAGEMENT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_MATERIAL_MANAGEMENT',
       '품목 관리',
       '품목을 관리하는 화면입니다.',
       'Inventory',
       '/basicinfo/materials',
       20,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_BASICINFO_MANAGEMENT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_EQUIPMENT_MANAGEMENT',
       '설비관리',
       '설비 및 자산을 등록하는 화면입니다.',
       'Build',
       '/basicinfo/equipment',
       30,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_BASICINFO_MANAGEMENT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_HACCP_BASE_MANAGEMENT',
       'HACCP 양식관리',
       '양식 기준정보를 조회하고 담당자/문서 편집 화면으로 이동해 상세 작업을 진행합니다.',
       'Category',
       '/docs/haccp-base',
       20,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_DOC_MANAGEMENT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_HACCP_DOC_MANAGEMENT',
       'HACCP 문서관리',
       '업무분류, 기안번호, 제목 등 다양한 조건으로 문서를 조회하는 페이지 레이아웃입니다.',
       'AccessTime',
       '/docs/haccp-doc',
       30,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_DOC_MANAGEMENT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_PLAN_MANAGEMENT',
       '플랜 관리',
       '플랜별 메뉴 매핑과 기능 설정을 관리합니다.',
       'Settings',
       '/platform/plans',
       10,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_TENANT_MANAGEMENT',
       '업체 관리',
       '업체 운영 현황과 온보딩 대상을 관리합니다.',
       'Business',
       '/platform/tenants',
       20,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_MENU_MANAGEMENT',
       '메뉴 관리',
       '플랫폼 메뉴를 등록하고 정렬 순서를 관리합니다.',
       'Menu',
       '/platform/menus',
       30,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

INSERT INTO public.tb_menu (
    parent_menu_id,
    menu_code,
    menu_nm,
    menu_dc,
    icon_nm,
    menu_url,
    menu_order,
    use_at,
    created_at,
    updated_at
)
SELECT root.menu_id,
       'MENU_LOGIN_HISTORY',
       '로그인 이력 관리',
       '플랫폼 로그인 이력을 조회합니다.',
       'AccessTime',
       '/platform/login-history',
       50,
       'Y',
       NOW(),
       NOW()
FROM public.tb_menu root
WHERE root.menu_code = 'MENU_PLATFORM_ROOT'
ON CONFLICT (menu_code) DO UPDATE
SET parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    icon_nm = EXCLUDED.icon_nm,
    menu_url = EXCLUDED.menu_url,
    menu_order = EXCLUDED.menu_order,
    use_at = EXCLUDED.use_at,
    updated_at = NOW();

-- 2) Reset platform admin mapping to the exact menu set above.
DELETE FROM public.tb_role_menu_permission
WHERE role_id = (
    SELECT r.role_id
    FROM public.tb_role r
    JOIN public.tb_tenant t ON t.tenant_id = r.tenant_id
    WHERE t.tenant_code = 'PLATFORM'
      AND r.role_code = 'PLATFORM_ADMIN'
);

INSERT INTO public.tb_role_menu_permission (role_id, menu_id, permission_id, created_at)
SELECT r.role_id,
       m.menu_id,
       p.permission_id,
       NOW()
FROM public.tb_role r
JOIN public.tb_tenant t ON t.tenant_id = r.tenant_id
JOIN public.tb_permission p ON p.tenant_id = t.tenant_id
JOIN public.tb_menu m ON m.menu_code IN (
    'MENU_HACCP_PORTAL',
    'MENU_BASICINFO_MANAGEMENT',
    'MENU_USERS_MANAGEMENT',
    'MENU_DEPT_MANAGEMENT',
    'MENU_AUTHORITY_MANAGEMENT',
    'MENU_PLATFORM_ROOT',
    'MENU_DOC_MANAGEMENT',
    'MENU_ORGANIZATION_MANAGEMENT',
    'MENU_CUSTOMER_MANAGEMENT',
    'MENU_MATERIAL_MANAGEMENT',
    'MENU_EQUIPMENT_MANAGEMENT',
    'MENU_HACCP_BASE_MANAGEMENT',
    'MENU_HACCP_DOC_MANAGEMENT',
    'MENU_PLAN_MANAGEMENT',
    'MENU_TENANT_MANAGEMENT',
    'MENU_MENU_MANAGEMENT',
    'MENU_LOGIN_HISTORY'
)
WHERE t.tenant_code = 'PLATFORM'
  AND r.role_code = 'PLATFORM_ADMIN'
  AND p.permission_code IN ('PERM_READ', 'PERM_WRITE')
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;

COMMIT;
