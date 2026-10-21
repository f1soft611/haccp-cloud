-- 업무(tb_drafting_work_category) 칼럼 2개 추가
-- expiration_apply: 만료일 관리 양식(Y:해당, N:미해당), 기본 N. 등록주기가 수시(ANYTIME)일 때만 Y를 쓴다.
-- approval_apply: 결재 적용 여부(Y:적용, N:미적용), 기본 Y
-- central DB, 각 tenant_xxx DB 모두에서 실행 (apply_migration_to_all_tenants.ps1). 여러 번 실행해도 결과가 같다.
-- 신규 테넌트는 migrate_postgresql_add_drafting_work_category_tables.sql 에 반영되어 있어 이 스크립트가 필요 없다.

BEGIN;

ALTER TABLE public.tb_drafting_work_category ADD COLUMN IF NOT EXISTS expiration_apply CHAR(1) NOT NULL DEFAULT 'N';
ALTER TABLE public.tb_drafting_work_category ADD COLUMN IF NOT EXISTS approval_apply   CHAR(1) NOT NULL DEFAULT 'Y';

ALTER TABLE public.tb_drafting_work_category DROP CONSTRAINT IF EXISTS ck_drafting_work_category_expiration_apply;
ALTER TABLE public.tb_drafting_work_category DROP CONSTRAINT IF EXISTS ck_drafting_work_category_approval_apply;

ALTER TABLE public.tb_drafting_work_category ADD CONSTRAINT ck_drafting_work_category_expiration_apply
    CHECK (expiration_apply IN ('Y', 'N'));
ALTER TABLE public.tb_drafting_work_category ADD CONSTRAINT ck_drafting_work_category_approval_apply
    CHECK (approval_apply IN ('Y', 'N'));

COMMENT ON COLUMN public.tb_drafting_work_category.expiration_apply IS '만료일 관리 양식(Y:해당, N:미해당)';
COMMENT ON COLUMN public.tb_drafting_work_category.approval_apply IS '결재 적용 여부(Y:적용, N:미적용)';

COMMIT;