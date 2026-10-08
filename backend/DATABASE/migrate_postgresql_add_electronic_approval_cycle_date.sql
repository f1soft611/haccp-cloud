-- tb_electronic_approval_main 주기 기준일(cycle_date) 컬럼 추가 및 기존 데이터 채우기.
-- 업무 마스터(tb_drafting_work_category.reg_term) 주기에 따라
--   일/발생시 -> 해당 일자, 주 -> 그 주 월요일, 월 -> 그 달 1일 (yyyyMMdd)
-- 기존 데이터는 reg_date(없으면 created_at) 기준으로 채운다.
-- 여러 번 실행해도 안전하다.

BEGIN;

ALTER TABLE tb_electronic_approval_main ADD COLUMN IF NOT EXISTS cycle_date VARCHAR(8);

UPDATE tb_electronic_approval_main m
SET cycle_date = TO_CHAR(
        date_trunc(
                CASE
                    WHEN COALESCE(NULLIF(TRIM(w.reg_term), ''), '') IN ('월', '매월', 'month', 'MONTH', 'monthly', 'MONTHLY') THEN 'month'
                    WHEN COALESCE(NULLIF(TRIM(w.reg_term), ''), '') IN ('주', '매주', 'week', 'WEEK', 'weekly', 'WEEKLY') THEN 'week'
                    ELSE 'day'
                    END,
                CASE
                    WHEN NULLIF(TRIM(m.reg_date), '') ~ '^[0-9]{8}$' THEN TO_DATE(TRIM(m.reg_date), 'YYYYMMDD')::timestamp
            ELSE m.created_at
        END
        ),
        'YYYYMMDD'
                 )
    FROM tb_drafting_work_category w
WHERE w.drafting_work_category_id = m.drafting_work_category_id
  AND m.cycle_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_work_cycle_date
    ON tb_electronic_approval_main(drafting_work_category_id, cycle_date);

COMMIT;