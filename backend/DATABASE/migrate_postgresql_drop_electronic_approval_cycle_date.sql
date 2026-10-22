-- tb_electronic_approval_main 주기 기준일을 report_date 하나로 통일하고 cycle_date 컬럼을 제거한다.
-- 1) cycle_date 값을 report_date 로 옮기고
-- 2) 인덱스를 report_date 기준으로 바꾼 뒤
-- 3) cycle_date 를 DROP 한다.
-- 전자결재 테이블은 테넌트 DB 에만 있으므로 central 에서는 건너뛴다.
-- 여러 번 실행해도 안전하다.

DO $$
BEGIN
    IF to_regclass('public.tb_electronic_approval_main') IS NULL THEN
        RETURN;
END IF;

    IF EXISTS (SELECT 1
               FROM information_schema.columns
               WHERE table_schema = 'public'
                 AND table_name = 'tb_electronic_approval_main'
                 AND column_name = 'cycle_date') THEN
UPDATE public.tb_electronic_approval_main
SET report_date = cycle_date
WHERE cycle_date IS NOT NULL
  AND report_date IS DISTINCT FROM cycle_date;
END IF;

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_work_report_date
    ON public.tb_electronic_approval_main(drafting_work_category_id, report_date);

DROP INDEX IF EXISTS public.idx_electronic_approval_main_work_cycle_date;

ALTER TABLE public.tb_electronic_approval_main DROP COLUMN IF EXISTS cycle_date;
END $$;