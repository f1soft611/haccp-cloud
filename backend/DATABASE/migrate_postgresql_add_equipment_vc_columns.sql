-- 설비(tb_equipment_info) 컬럼 2개 추가
-- 검교정구분(공통코드 VC_KIND item_code: INTERNAL/ACCREDITED), 검교정주기(개월, NULL 또는 1 이상)
-- central DB, 각 tenant_xxx DB 모두에서 실행 (apply_migration_to_all_tenants.ps1). 여러 번 실행해도 결과가 같다.
-- 신규 테넌트는 create_postgresql_schema_active_tables.sql 에 반영되어 있어 이 스크립트가 필요 없다.

BEGIN;

ALTER TABLE public.tb_equipment_info ADD COLUMN IF NOT EXISTS vc_kind  varchar(50);
ALTER TABLE public.tb_equipment_info ADD COLUMN IF NOT EXISTS vc_cycle int4;

ALTER TABLE public.tb_equipment_info DROP CONSTRAINT IF EXISTS ck_tb_equipment_info_vc_cycle;
ALTER TABLE public.tb_equipment_info ADD CONSTRAINT ck_tb_equipment_info_vc_cycle
    CHECK (vc_cycle IS NULL OR vc_cycle > 0);

COMMENT ON COLUMN public.tb_equipment_info.vc_kind IS '검교정구분(공통코드 VC_KIND)';
COMMENT ON COLUMN public.tb_equipment_info.vc_cycle IS '검교정주기(개월)';

COMMIT;