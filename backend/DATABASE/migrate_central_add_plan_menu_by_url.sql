-- menu_url 로 찾은 메뉴와 그 부모 메뉴들을 지정한 플랜에 매핑한다 (central DB 에서 실행).
-- 여러 번 실행해도 결과가 같다.
--
-- 사용:
--   psql -h 218.155.74.34 -p 5433 -U postgres -d haccp_cloud_central -v ON_ERROR_STOP=1 ^
--        -v menu_url=/basicinfo/workday -v plan_codes=B,C -f migrate_central_add_plan_menu_by_url.sql

-- DO 블록 안에서는 psql 변수가 치환되지 않아 세션 설정으로 넘긴다.
SELECT set_config('migr.menu_url', :'menu_url', false);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.tb_menu
        WHERE menu_url = current_setting('migr.menu_url') AND use_at = 'Y'
    ) THEN
        RAISE EXCEPTION 'menu_url 에 해당하는 사용 중 메뉴가 없습니다: %', current_setting('migr.menu_url');
END IF;
END $$;

BEGIN;

WITH RECURSIVE picked AS (
    SELECT m.menu_id, m.parent_menu_id, m.menu_code
    FROM public.tb_menu m
    WHERE m.menu_url = :'menu_url'
    AND m.use_at = 'Y'
UNION
SELECT p.menu_id, p.parent_menu_id, p.menu_code
FROM public.tb_menu p
         JOIN picked c ON p.menu_id = c.parent_menu_id
    ), target_plan AS (
    SELECT p.plan_id
    FROM public.tb_plan p
    WHERE p.plan_code IN (
        SELECT trim(code) FROM regexp_split_to_table(:'plan_codes', ',') AS code WHERE trim(code) <> ''
    )
)
INSERT INTO public.tb_plan_menu (plan_id, menu_code, use_at, created_at, updated_at)
SELECT tp.plan_id, pk.menu_code, 'Y', NOW(), NOW()
FROM target_plan tp
         CROSS JOIN (SELECT DISTINCT menu_code FROM picked) pk
    ON CONFLICT (plan_id, menu_code) DO UPDATE
SET use_at = 'Y',
    updated_at = NOW();

COMMIT;

SELECT p.plan_code, pm.menu_code, pm.use_at
FROM public.tb_plan_menu pm
         JOIN public.tb_plan p ON p.plan_id = pm.plan_id
         JOIN public.tb_menu m ON m.menu_code = pm.menu_code
WHERE m.menu_url = :'menu_url'
ORDER BY p.plan_code;