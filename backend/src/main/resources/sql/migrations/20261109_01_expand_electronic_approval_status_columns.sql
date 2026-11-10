-- 전자결재 상태 컬럼을 VARCHAR(30) 으로 확장한다 (in_progress 등 10자 초과 값 저장).
-- v_expiration_target_latest 뷰가 컬럼을 참조하므로 삭제 후 같은 정의로 다시 만든다.
-- central 에는 전자결재 테이블이 없으므로 건너뛴다. 여러 번 실행해도 결과가 같다.
DO $$
DECLARE
    target record;
BEGIN
    IF to_regclass('public.tb_electronic_approval_main') IS NULL THEN
        RAISE NOTICE 'tb_electronic_approval_main 없음, 상태 컬럼 확장 건너뜀';
        RETURN;
    END IF;

    DROP VIEW IF EXISTS public.v_expiration_target_latest;

    FOR target IN
        SELECT t.table_name, t.column_name
        FROM (
            VALUES
                ('tb_electronic_approval_main', 'status_type'),
                ('tb_electronic_approval_main', 'end_status'),
                ('tb_electronic_approval_main', 'weight_status'),
                ('tb_electronic_approval_main', 'ea_locked_status'),
                ('tb_electronic_approval_main', 'delete_status'),
                ('tb_electronic_approval_line_info', 'app_status'),
                ('tb_electronic_approval_line_info', 'arbdec_status'),
                ('tb_electronic_approval_line_info', 'repdec_status'),
                ('tb_electronic_approval_line_info', 'muldec_status'),
                ('tb_electronic_approval_line_info', 'approval_type'),
                ('tb_electronic_approval_line_info', 'last_owner_status'),
                ('tb_electronic_approval_line_info', 'last_cnfrmer_status'),
                ('tb_electronic_approval_line_info', 'ok_type'),
                ('tb_electronic_approval_line_info', 'decide_status'),
                ('tb_electronic_approval_line_info', 'referencer_view_status'),
                ('tb_electronic_approval_line_info', 'conn_official_status'),
                ('tb_electronic_approval_history_main', 'not_open_status'),
                ('tb_electronic_approval_history_main', 'main_view_status'),
                ('tb_electronic_approval_history_main', 'approval_type'),
                ('tb_electronic_approval_open_info', 'approval_type')
        ) AS t(table_name, column_name)
        JOIN information_schema.columns c
          ON c.table_schema = 'public'
         AND c.table_name::text = t.table_name
         AND c.column_name::text = t.column_name
        WHERE c.character_maximum_length < 30
    LOOP
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE VARCHAR(30)',
                       target.table_name, target.column_name);
    END LOOP;

    EXECUTE $view$
CREATE OR REPLACE VIEW public.v_expiration_target_latest AS
SELECT DISTINCT ON (m.tenant_id, m.drafting_work_category_id,
                    s.equipment_id, COALESCE(s.material_type, ''), s.certification_user_id)
       m.tenant_id,
       m.drafting_work_category_id,
       m.electronic_approval_id,
       COALESCE(m.status_type, '') AS status_type,
       CAST(COALESCE(m.updated_at, m.created_at) AS timestamp) AS status_at,
       s.equipment_id,
       COALESCE(s.material_type, '') AS material_type,
       s.certification_user_id,
       s.inspected_date,
       s.expiration_date,
       COALESCE(e.equip_nm, u.user_nm, '') AS target_name
FROM public.tb_electronic_approval_sub s
JOIN public.tb_electronic_approval_main m
  ON m.tenant_id = s.tenant_id
 AND m.electronic_approval_id = s.electronic_approval_id
LEFT JOIN public.tb_equipment_info e
  ON e.tenant_id = s.tenant_id
 AND e.equipment_id = s.equipment_id
LEFT JOIN public.tb_user u
  ON u.tenant_id = s.tenant_id
 AND u.user_id = s.certification_user_id
WHERE COALESCE(m.delete_status, 'N') != 'Y'
  AND COALESCE(m.status_type, '') != 'pre_apply'
ORDER BY m.tenant_id, m.drafting_work_category_id,
         s.equipment_id, COALESCE(s.material_type, ''), s.certification_user_id,
         s.inspected_date DESC, m.electronic_approval_id DESC
$view$;
END
$$;