-- 만료일 관리 업무: 업무 + 대상(설비, 품목유형, 증명서 소유자)별 최신 문서 뷰
-- 삭제, 임시저장(pre_apply) 문서는 제외한다. 대시보드 미작성 판단과 업무 미작성 목록이 같이 쓴다.
-- central 에는 전자결재 테이블이 없으므로 건너뛴다. 여러 번 실행해도 결과가 같다.
DO $$
BEGIN
    IF to_regclass('public.tb_electronic_approval_main') IS NULL THEN
        RAISE NOTICE 'tb_electronic_approval_main 없음, v_expiration_target_latest 생성 건너뜀';
        RETURN;
    END IF;

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