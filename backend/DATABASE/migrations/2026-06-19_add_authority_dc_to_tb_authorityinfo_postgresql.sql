BEGIN;

ALTER TABLE tb_authorityinfo
  ADD COLUMN IF NOT EXISTS authority_dc VARCHAR(500);

COMMENT ON COLUMN tb_authorityinfo.authority_dc IS '권한 설명';

COMMIT;