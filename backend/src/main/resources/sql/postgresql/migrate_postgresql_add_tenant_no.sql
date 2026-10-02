-- tb_tenant 업체번호(랜덤 6자리, 100000~999999) 컬럼 추가 및 기존 테넌트 일괄 발급.
-- 여러 번 실행해도 안전하다.

BEGIN;

ALTER TABLE tb_tenant ADD COLUMN IF NOT EXISTS tenant_no VARCHAR(6);

DO $$
DECLARE
target RECORD;
    candidate VARCHAR(6);
BEGIN
FOR target IN SELECT tenant_id FROM tb_tenant WHERE tenant_no IS NULL ORDER BY tenant_id LOOP
        LOOP
            candidate := (100000 + FLOOR(random() * 900000))::INT::TEXT;
EXIT WHEN NOT EXISTS (SELECT 1 FROM tb_tenant WHERE tenant_no = candidate);
END LOOP;
UPDATE tb_tenant SET tenant_no = candidate WHERE tenant_id = target.tenant_id;
END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_tenant_tenant_no ON tb_tenant (tenant_no);

COMMIT;