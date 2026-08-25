-- Bootstrap one isolated tenant database after the shared schema is created.
-- psql variables: tenant_id, tenant_code, plan_code

BEGIN;

CREATE TABLE IF NOT EXISTS ids (
    table_name VARCHAR(50) PRIMARY KEY,
    next_id BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ids2 (
    table_name  VARCHAR(30) NOT NULL,
    condition1  VARCHAR(50) NOT NULL DEFAULT '__NONE__',
    condition2  VARCHAR(50) NOT NULL DEFAULT '__NONE__',
    next_id     BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (table_name, condition1, condition2)
);

INSERT INTO ids (table_name, next_id)
VALUES ('EA_EXE_ID', 1)
ON CONFLICT (table_name) DO NOTHING;

ALTER TABLE IF EXISTS public.tb_electronic_approval_line_info
    ALTER COLUMN arrival_at DROP NOT NULL,
    ALTER COLUMN exe_at DROP NOT NULL,
    ALTER COLUMN open_at DROP NOT NULL;

INSERT INTO tb_tenant (
    tenant_id,
    tenant_code,
    tenant_nm,
    admin_email,
    use_at,
    onboarding_status,
    created_at,
    updated_at
) VALUES (
    :'tenant_id'::bigint,
    :'tenant_code',
    :'tenant_code',
    :'tenant_code' || '@tenant.local',
    'Y',
    'EMAIL_QUEUED',
    NOW(),
    NOW()
)
ON CONFLICT (tenant_id) DO UPDATE
SET tenant_code = EXCLUDED.tenant_code,
    use_at = 'Y',
    updated_at = NOW();

SELECT setval(
    pg_get_serial_sequence('tb_tenant', 'tenant_id'),
    GREATEST((SELECT COALESCE(MAX(tenant_id), 1) FROM tb_tenant), 1),
    true
);

WITH requested_codes AS (
    SELECT DISTINCT trim(code) AS menu_code
    FROM regexp_split_to_table(:'menu_codes', ',') AS code
    WHERE trim(code) <> ''
),
source_menu AS (
    SELECT
        sm.menu_id AS source_menu_id,
        sm.parent_menu_id AS source_parent_menu_id,
        sm.menu_code,
        sm.menu_nm,
        sm.menu_dc,
        sm.menu_url,
        sm.icon_nm,
        sm.menu_order,
        parent_source.menu_code AS parent_menu_code
    FROM public.tb_menu sm
    LEFT JOIN public.tb_menu parent_source ON parent_source.menu_id = sm.parent_menu_id
    JOIN requested_codes rc ON rc.menu_code = sm.menu_code
),
inserted_menu AS (
    INSERT INTO tb_menu (
        parent_menu_id,
        menu_code,
        menu_nm,
        menu_dc,
        menu_url,
        icon_nm,
        menu_order,
        use_at,
        created_at,
        updated_at
    )
    SELECT
        NULL,
        sm.menu_code,
        sm.menu_nm,
        sm.menu_dc,
        sm.menu_url,
        COALESCE(sm.icon_nm, 'Menu'),
        COALESCE(sm.menu_order, 0),
        'Y',
        NOW(),
        NOW()
    FROM source_menu sm
    ON CONFLICT (menu_code) DO UPDATE
    SET parent_menu_id = EXCLUDED.parent_menu_id,
        menu_nm = EXCLUDED.menu_nm,
        menu_dc = EXCLUDED.menu_dc,
        menu_url = EXCLUDED.menu_url,
        icon_nm = EXCLUDED.icon_nm,
        menu_order = EXCLUDED.menu_order,
        use_at = 'Y',
        updated_at = NOW()
    RETURNING menu_id, menu_code
),
source_parent_map AS (
    SELECT
        sm.menu_code,
        sm.source_parent_menu_id,
        sm.parent_menu_code,
        inserted.menu_id AS local_menu_id,
        parent_inserted.menu_id AS local_parent_menu_id
    FROM source_menu sm
    LEFT JOIN inserted_menu inserted ON inserted.menu_code = sm.menu_code
    LEFT JOIN inserted_menu parent_inserted ON parent_inserted.menu_code = sm.parent_menu_code
)
UPDATE tb_menu target
SET parent_menu_id = source_parent_map.local_parent_menu_id,
    updated_at = NOW()
FROM source_parent_map
WHERE target.menu_code = source_parent_map.menu_code
  AND source_parent_map.local_parent_menu_id IS NOT NULL;

INSERT INTO tb_role (tenant_id, role_code, role_nm, is_system_role, use_at)
VALUES
    (:'tenant_id'::bigint, 'TENANT_ADMIN', '업체 관리자', 'Y', 'Y'),
    (:'tenant_id'::bigint, 'TENANT_USER', '업체 사용자', 'Y', 'Y')
ON CONFLICT (tenant_id, role_code) DO UPDATE
SET use_at = 'Y', is_system_role = 'Y', updated_at = NOW();

INSERT INTO tb_permission (tenant_id, permission_code, permission_nm, use_at)
VALUES
    (:'tenant_id'::bigint, 'PERM_READ', '조회', 'Y'),
    (:'tenant_id'::bigint, 'PERM_WRITE', '등록/수정', 'Y')
ON CONFLICT (tenant_id, permission_code) DO UPDATE
SET use_at = 'Y';

WITH requested_codes AS (
    SELECT DISTINCT trim(code) AS menu_code
    FROM regexp_split_to_table(:'menu_codes', ',') AS code
    WHERE trim(code) <> ''
), admin_role AS (
    SELECT role_id, tenant_id
    FROM tb_role
    WHERE tenant_id = :'tenant_id'::bigint
      AND role_code = 'TENANT_ADMIN'
    LIMIT 1
), admin_permission AS (
    SELECT permission_id
    FROM tb_permission
    WHERE tenant_id = :'tenant_id'::bigint
      AND permission_code = 'PERM_WRITE'
    LIMIT 1
)
INSERT INTO tb_role_menu_permission (role_id, menu_id, permission_id)
SELECT ar.role_id, m.menu_id, ap.permission_id
FROM admin_role ar
JOIN admin_permission ap ON TRUE
JOIN tb_menu m ON m.menu_code IN (
    SELECT menu_code FROM requested_codes
)
WHERE m.use_at = 'Y'
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;

COMMIT;
