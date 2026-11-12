-- 업무(tb_drafting_work_category) 만료일 안내시점 칼럼 2개 추가
-- expiration_notice_status: 만료일 안내 기준(공통코드 EXPIRY_STATUS: NONE/DAY/MONTH/YEAR), 기본 NONE
-- expiration_notice_count: 만료일 안내 계산숫자(만료일 N일/개월/년 전), NONE 이면 NULL
-- 만료일 관리 양식(expiration_apply = 'Y') 업무만 NONE 이 아닌 값을 가진다.
-- central, tenant DB 모두 실행한다. 여러 번 실행해도 결과가 같다.
ALTER TABLE public.tb_drafting_work_category ADD COLUMN IF NOT EXISTS expiration_notice_status varchar(10) NOT NULL DEFAULT 'NONE';
ALTER TABLE public.tb_drafting_work_category ADD COLUMN IF NOT EXISTS expiration_notice_count  int4;

ALTER TABLE public.tb_drafting_work_category DROP CONSTRAINT IF EXISTS ck_drafting_work_category_expiration_notice_status;
ALTER TABLE public.tb_drafting_work_category DROP CONSTRAINT IF EXISTS ck_drafting_work_category_expiration_notice_count;

ALTER TABLE public.tb_drafting_work_category ADD CONSTRAINT ck_drafting_work_category_expiration_notice_status
    CHECK (expiration_notice_status IN ('NONE', 'DAY', 'MONTH', 'YEAR'));
ALTER TABLE public.tb_drafting_work_category ADD CONSTRAINT ck_drafting_work_category_expiration_notice_count
    CHECK (expiration_notice_count IS NULL OR expiration_notice_count > 0);

COMMENT ON COLUMN public.tb_drafting_work_category.expiration_notice_status IS '만료일 안내 기준(공통코드 EXPIRY_STATUS: NONE/DAY/MONTH/YEAR)';
COMMENT ON COLUMN public.tb_drafting_work_category.expiration_notice_count IS '만료일 안내 계산숫자';