-- 전자결재 상태명 '반송' -> '반려' 통일
-- 대상: tb_electronic_approval_main.status_type_name, tb_electronic_approval_line_info.option_name
-- 전자결재 테이블은 tenant DB 에만 있다. central 에는 테이블이 없어 건너뛴다.
-- 여러 번 실행해도 결과가 같다.

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.tb_electronic_approval_main') IS NOT NULL THEN
        UPDATE public.tb_electronic_approval_main
        SET status_type_name = '반려'
        WHERE status_type_name = '반송';
    END IF;

    IF to_regclass('public.tb_electronic_approval_line_info') IS NOT NULL THEN
        UPDATE public.tb_electronic_approval_line_info
        SET option_name = '반려'
        WHERE option_name = '반송';
    END IF;
END $$;

COMMIT;
