-- 기준정보 관리 > 품목 관리
-- tb_material_info: 이미 dev DB(haccp_cloud_dev2)에는 존재함. 아래는 신규 환경(로컬 등)에서
-- 동일한 구조로 맞추기 위한 참고용 스크립트이며, information_schema 조회로 확인한 실제 컬럼 기준으로 작성했다.

CREATE TABLE IF NOT EXISTS public.tb_material_info (
    material_id           bigserial NOT NULL,
    tenant_id             bigint NOT NULL,
    material_code         varchar(20) NOT NULL,        -- 품목코드 (테넌트별 자동채번)
    material_name         varchar(200) NOT NULL,       -- 품목명
    material_eng_name     varchar(200),
    material_model_name   varchar(200),
    material_spec         varchar(100),                -- 규격
    material_weight       bigint,                      -- 중량
    unit                  varchar(6),                  -- 단위
    material_type_code    varchar(14) NOT NULL,        -- 품목계정코드 (현재는 item_type 텍스트를 임시로 복사)
    customer_code         varchar(10),                 -- 제조사
    safe_invoice          double precision,
    accounting_code       varchar(7),
    warehouse_code        varchar(10),
    drawing               varchar(10),
    etc                   varchar(100),                -- 비고
    part_no               varchar(30),
    manufactory           varchar(100),
    deleted_at            timestamp,
    mat_cata_type         varchar(10) NOT NULL DEFAULT ''::character varying,
    location              varchar(1000),
    material_spec2        varchar(100),
    item_type             varchar(10),                 -- 품목계정 (제품/상품/원재료/부재료/소모품)
    search_item_name      varchar(200),
    material_quality      varchar(6),
    item_barcode          varchar(20),
    material_no           varchar(20),
    delete_status         varchar(10) NOT NULL DEFAULT 'N',  -- 삭제여부(Y=삭제됨, N=정상)
    created_by            varchar(10),
    created_at            timestamp,
    updated_by            varchar(10),
    updated_at            timestamp,
    CONSTRAINT tb_material_info_pkey PRIMARY KEY (material_id),
    CONSTRAINT uq_material_id_tenant_id UNIQUE (material_id, tenant_id),
    CONSTRAINT uq_tb_material_info_tenant_material_code UNIQUE (tenant_id, material_code),
    CONSTRAINT fk_tb_material_info_tenant FOREIGN KEY (tenant_id) REFERENCES public.tb_tenant(tenant_id)
);

CREATE INDEX IF NOT EXISTS ix_tb_material_info_tenant_id ON public.tb_material_info USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS ix_tb_material_info_material_name ON public.tb_material_info USING btree (material_name);

COMMENT ON TABLE public.tb_material_info IS '품목 정보';
COMMENT ON COLUMN public.tb_material_info.material_code IS '품목코드';
COMMENT ON COLUMN public.tb_material_info.material_name IS '품목명';
COMMENT ON COLUMN public.tb_material_info.material_spec IS '품목규격';
COMMENT ON COLUMN public.tb_material_info.material_weight IS '중량';
COMMENT ON COLUMN public.tb_material_info.unit IS '단위';
COMMENT ON COLUMN public.tb_material_info.item_type IS '품목계정(제품/상품/원재료/부재료/소모품)';
COMMENT ON COLUMN public.tb_material_info.etc IS '비고';
COMMENT ON COLUMN public.tb_material_info.delete_status IS '삭제여부';

-- ---------------------------------------------------------------------
-- 기존 테넌트의 TENANT_ADMIN / TENANT_USER 권한에 품목 관리 메뉴 READ/WRITE 권한 부여
-- (이미 거래처관리 마이그레이션에서 /basicinfo/materials 를 포함해 실행했다면 ON CONFLICT로 스킵됨)
-- ---------------------------------------------------------------------
INSERT INTO tb_role_menu_permission (role_id, menu_id, permission_id, created_at)
SELECT r.role_id, m.menu_id, p.permission_id, CURRENT_TIMESTAMP
FROM tb_role r
JOIN tb_permission p
  ON p.tenant_id = r.tenant_id
 AND p.permission_code IN ('PERM_READ', 'PERM_WRITE')
 AND p.use_at = 'Y'
CROSS JOIN tb_menu m
WHERE r.role_code IN ('TENANT_ADMIN', 'TENANT_USER')
  AND r.use_at = 'Y'
  AND m.menu_url IN ('/basicinfo', '/basicinfo/materials')
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;
