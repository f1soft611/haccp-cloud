-- 등록주기 공통코드화 (WF_FORM_CYCLE)
-- 1) reg_term 컬럼 확장 (VARCHAR(6) -> VARCHAR(50): QUARTER/ANYTIME 7자 저장)
-- 2) 모든 테넌트에 WF_FORM_CYCLE 그룹 + 7개 코드 등록 (이미 있으면 건너뜀)
-- 3) 기존 WF_FORM_CYCLE의 EVENT(발생시) 코드는 ANYTIME(수시)로 대체되므로 미사용 처리
-- 4) 기존 reg_term 한글 값 -> 코드 변환
-- 여러 번 실행해도 결과가 같다.

BEGIN;

ALTER TABLE public.tb_drafting_work_category
ALTER COLUMN reg_term TYPE VARCHAR(50);

INSERT INTO public.tb_common_code_group (tenant_id, group_code, group_nm, group_dc, sort_order, use_at)
SELECT t.tenant_id,
       'WF_FORM_CYCLE',
       '기안양식 등록주기',
       '업무 등록주기',
       COALESCE((SELECT MAX(g.sort_order) FROM public.tb_common_code_group g WHERE g.tenant_id = t.tenant_id), 0) + 10,
       'Y'
FROM public.tb_tenant t
WHERE NOT EXISTS (
    SELECT 1
    FROM public.tb_common_code_group g
    WHERE g.tenant_id = t.tenant_id
      AND g.group_code = 'WF_FORM_CYCLE'
);

INSERT INTO public.tb_common_code_item (tenant_id, group_id, item_code, item_nm, sort_order, use_at)
SELECT g.tenant_id, g.common_code_group_id, c.item_code, c.item_nm, c.sort_order, 'Y'
FROM public.tb_common_code_group g
         CROSS JOIN (VALUES
                         ('DAY', '일', 10),
                         ('WEEK', '주', 20),
                         ('MONTH', '월', 30),
                         ('QUARTER', '분기', 40),
                         ('HALF', '반기', 50),
                         ('YEAR', '연간', 60),
                         ('ANYTIME', '수시', 70)
) AS c(item_code, item_nm, sort_order)
WHERE g.group_code = 'WF_FORM_CYCLE'
  AND NOT EXISTS (
    SELECT 1
    FROM public.tb_common_code_item i
    WHERE i.group_id = g.common_code_group_id
      AND i.item_code = c.item_code
);

UPDATE public.tb_common_code_item i
SET use_at = 'N',
    updated_at = CURRENT_TIMESTAMP
    FROM public.tb_common_code_group g
WHERE g.common_code_group_id = i.group_id
  AND g.group_code = 'WF_FORM_CYCLE'
  AND i.item_code = 'EVENT'
  AND i.use_at = 'Y';

UPDATE public.tb_drafting_work_category
SET reg_term = CASE
                   WHEN TRIM(reg_term) IN ('일', '매일') THEN 'DAY'
                   WHEN TRIM(reg_term) IN ('주', '매주') THEN 'WEEK'
                   WHEN TRIM(reg_term) IN ('월', '매월') THEN 'MONTH'
                   WHEN TRIM(reg_term) IN ('년', '매년', '연간') THEN 'YEAR'
                   WHEN TRIM(reg_term) IN ('DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF', 'YEAR', 'ANYTIME') THEN TRIM(reg_term)
                   ELSE 'ANYTIME'
    END
WHERE reg_term IS NULL
   OR reg_term NOT IN ('DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF', 'YEAR', 'ANYTIME');

COMMIT;