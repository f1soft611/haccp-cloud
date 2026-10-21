-- 업무 분류 WF_TYPE 자동 등록 + 전자결재 sub 테이블
-- 1) tb_drafting_work_category_group / tb_drafting_work_category 의 cata_code 를 VARCHAR(50) 으로 늘린다 (HCP-CALIB 등 WF_TYPE 코드 저장).
-- 2) 공통코드 WF_TYPE 을 업무 분류로 등록한다 (이미 있으면 건너뜀).
-- 3) tb_electronic_approval_sub 가 없으면 만든다.
-- 4) material_type 이 bigint 이면 공통코드 id 를 item_code 로 바꿔 VARCHAR(50) 으로 변환한다.
-- central DB, 각 tenant_xxx DB 모두에서 실행 (apply_migration_to_all_tenants.ps1). 여러 번 실행해도 결과가 같다.
-- 신규 테넌트는 migrate_postgresql_add_drafting_work_category_tables.sql, migrate_postgresql_add_electronic_approval_tables.sql 에 반영되어 있어 이 스크립트가 필요 없다.

BEGIN;

ALTER TABLE public.tb_drafting_work_category_group ALTER COLUMN cata_code TYPE VARCHAR(50);
ALTER TABLE public.tb_drafting_work_category ALTER COLUMN cata_code TYPE VARCHAR(50);

INSERT INTO public.tb_drafting_work_category_group (tenant_id, cata_code, cata_name, view_seq, use_at)
SELECT i.tenant_id, i.item_code, LEFT(i.item_nm, 20), i.sort_order, 'Y'
FROM public.tb_common_code_item i
    JOIN public.tb_common_code_group g ON g.common_code_group_id = i.group_id
    JOIN public.tb_tenant t ON t.tenant_id = i.tenant_id
WHERE g.group_code = 'WF_TYPE'
  AND i.use_at = 'Y'
ON CONFLICT (tenant_id, cata_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tb_electronic_approval_sub (
                                                                 electronic_approval_sub_id BIGSERIAL PRIMARY KEY,
                                                                 electronic_approval_id BIGINT NOT NULL,
                                                                 tenant_id BIGINT NOT NULL,
                                                                 drafting_work_category_id BIGINT NOT NULL,
                                                                 equipment_id BIGINT,
                                                                 material_type VARCHAR(50),
    certification_user_id BIGINT,
    inspected_date VARCHAR(8) NOT NULL,
    expiration_date VARCHAR(8) NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_electronic_approval_sub_category
    FOREIGN KEY (drafting_work_category_id)
    REFERENCES public.tb_drafting_work_category(drafting_work_category_id)
    ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_sub_main
    FOREIGN KEY (electronic_approval_id)
    REFERENCES public.tb_electronic_approval_main(electronic_approval_id)
    ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_sub_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES public.tb_tenant(tenant_id)
    ON DELETE CASCADE
    );

-- ALTER ... USING 에는 서브쿼리를 쓸 수 없어서 임시 컬럼을 거친다.
DO $$
BEGIN
    IF EXISTS (SELECT 1
               FROM information_schema.columns
               WHERE table_schema = 'public'
                 AND table_name = 'tb_electronic_approval_sub'
                 AND column_name = 'material_type'
                 AND data_type = 'bigint') THEN
ALTER TABLE public.tb_electronic_approval_sub ADD COLUMN material_type_code VARCHAR(50);

UPDATE public.tb_electronic_approval_sub s
SET material_type_code = i.item_code
    FROM public.tb_common_code_item i
WHERE i.common_code_item_id = s.material_type;

ALTER TABLE public.tb_electronic_approval_sub DROP COLUMN material_type;
ALTER TABLE public.tb_electronic_approval_sub RENAME COLUMN material_type_code TO material_type;
END IF;
END $$;

COMMENT ON COLUMN public.tb_electronic_approval_sub.drafting_work_category_id IS '결재양식id';
COMMENT ON COLUMN public.tb_electronic_approval_sub.equipment_id IS '설비id';
COMMENT ON COLUMN public.tb_electronic_approval_sub.material_type IS '품목유형(공통코드 MATERIAL_TYPE item_code)';
COMMENT ON COLUMN public.tb_electronic_approval_sub.certification_user_id IS '증명서소유_사원정보';
COMMENT ON COLUMN public.tb_electronic_approval_sub.inspected_date IS '검사일(검교정,유효성평가,자가 품질평가,보건증등록 등)';
COMMENT ON COLUMN public.tb_electronic_approval_sub.expiration_date IS '만료일(검교정예정,유효성평가만료,자가품질검사만료,보건증만료 등)';
COMMENT ON COLUMN public.tb_electronic_approval_sub.created_by IS '등록자';
COMMENT ON COLUMN public.tb_electronic_approval_sub.created_at IS '등록일시';
COMMENT ON COLUMN public.tb_electronic_approval_sub.updated_by IS '변경자';
COMMENT ON COLUMN public.tb_electronic_approval_sub.updated_at IS '변경일시';

COMMIT;