-- 플랫폼 관리 > DB 마이그레이션 메뉴 + PLATFORM_ADMIN 권한 (central DB 에서 1회 수동 실행)
-- 여러 번 실행해도 결과가 같다.

BEGIN;

INSERT INTO public.tb_menu (
    parent_menu_id, menu_code, menu_nm, menu_dc, icon_nm, menu_url, menu_order, use_at, created_at, updated_at
)
SELECT root.menu_id,
       'MENU_SCHEMA_MIGRATION',
       'DB 마이그레이션',
       '테이블 구조와 공통코드 변경을 전체 DB 에 적용합니다.',
       'Storage',
       '/platform/migrations',
       60,
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

INSERT INTO public.tb_role_menu_permission (role_id, menu_id, permission_id, created_at)
SELECT r.role_id, m.menu_id, p.permission_id, NOW()
FROM public.tb_role r
         JOIN public.tb_tenant t ON t.tenant_id = r.tenant_id
         JOIN public.tb_permission p ON p.tenant_id = t.tenant_id
         JOIN public.tb_menu m ON m.menu_code = 'MENU_SCHEMA_MIGRATION'
WHERE t.tenant_code = 'PLATFORM'
  AND r.role_code = 'PLATFORM_ADMIN'
  AND p.permission_code IN ('PERM_READ', 'PERM_WRITE')
    ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;

COMMIT;