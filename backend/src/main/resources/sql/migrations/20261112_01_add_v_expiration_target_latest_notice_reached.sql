-- 만료일 관리 업무 대상별 최신 문서 뷰에 안내 시작일 도달 여부(notice_reached) 컬럼을 추가한다.
-- 안내 시작일 = 만료일 - 업무의 만료일 안내 계산숫자(DAY/MONTH/YEAR), NONE 이면 만료일 당일.
-- 만료일이 8자리 숫자가 아니면 도달로 본다(미작성으로 드러나게).
-- 대시보드 미작성 건수와 업무 미작성 목록이 이 값으로 미작성을 판단한다.
-- central 에는 전자결재 테이블이 없으므로 건너뛴다. 여러 번 실행해도 결과가 같다.
DO $$
BEGIN
    IF to_regclass('public.tb_electronic_approval_main') IS NULL THEN
        RAISE NOTICE 'tb_electronic_approval_main 없음, v_expiration_target_latest 갱신 건너뜀';
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
       COALESCE(e.equip_nm, u.user_nm, '') AS target_name,
       CASE
         WHEN COALESCE(s.expiration_date, '') !~ '^[0-9]{8}$' THEN TRUE
         ELSE CURRENT_DATE >= TO_DATE(s.expiration_date, 'YYYYMMDD')
                - CASE COALESCE(w.expiration_notice_status, 'NONE')
                    WHEN 'DAY' THEN make_interval(days => COALESCE(w.expiration_notice_count, 0))
                    WHEN 'MONTH' THEN make_interval(months => COALESCE(w.expiration_notice_count, 0))
                    WHEN 'YEAR' THEN make_interval(years => COALESCE(w.expiration_notice_count, 0))
                    ELSE INTERVAL '0 day'
                  END
       END AS notice_reached
FROM public.tb_electronic_approval_sub s
JOIN public.tb_electronic_approval_main m
  ON m.tenant_id = s.tenant_id
 AND m.electronic_approval_id = s.electronic_approval_id
LEFT JOIN public.tb_drafting_work_category w
  ON w.tenant_id = m.tenant_id
 AND w.drafting_work_category_id = m.drafting_work_category_id
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
