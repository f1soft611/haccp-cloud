-- 기준정보 관리 > 설비관리
-- tb_equipment_info: 이미 dev DB(haccp_cloud_dev2)에는 존재함. 아래는 신규 환경(로컬 등)에서
-- 동일한 구조로 맞추기 위한 참고용 스크립트이며, information_schema 조회로 확인한 실제 컬럼 기준으로 작성했다.

CREATE TABLE IF NOT EXISTS public.tb_equipment_info (
    equipment_id         bigserial NOT NULL,
    tenant_id            bigint NOT NULL,
    equip_sys_cd         varchar(6) NOT NULL,         -- 관리코드 (테넌트별 자동채번)
    equip_cd             varchar(20) NOT NULL,        -- 설비코드 (사용자 직접입력)
    equip_nm             varchar(99),                 -- 설비명
    equip_kind           varchar(6),                  -- 설비종류
    pur_date             varchar(12),                 -- 구입일 (YYYY-MM-DD)
    pur_amount           numeric(19, 4),
    pur_cust             varchar(100),                -- 구입처
    mak_cust             varchar(99),                 -- 제조사
    manager1_code        character(10),
    manager2_code        character(10),
    location             varchar(1000),               -- 설치장소
    disuse_status        varchar(10),
    disuse_date          character(8),
    disuse_reg_charge    varchar(10),
    equip_status         varchar(10),
    equip_spec           varchar(99),                 -- 설비규격
    bigo                 varchar(1000),                -- 비고
    use_status           varchar(10),
    use_at               character(1) NOT NULL DEFAULT 'Y',
    created_by           varchar(10),
    created_at           timestamp,
    updated_by           character(10),
    updated_at           timestamp,
    CONSTRAINT tb_equipment_info_pkey PRIMARY KEY (equipment_id),
    CONSTRAINT uq_equipment_id_tenant_id UNIQUE (equipment_id, tenant_id),
    CONSTRAINT fk_tb_equipment_info_tenant FOREIGN KEY (tenant_id) REFERENCES public.tb_tenant(tenant_id)
);

CREATE INDEX IF NOT EXISTS ix_tb_equipment_info_tenant_id ON public.tb_equipment_info USING btree (tenant_id);

COMMENT ON TABLE public.tb_equipment_info IS '설비 정보';
COMMENT ON COLUMN public.tb_equipment_info.equip_sys_cd IS '관리코드';
COMMENT ON COLUMN public.tb_equipment_info.equip_cd IS '설비코드';
COMMENT ON COLUMN public.tb_equipment_info.equip_nm IS '설비명';
COMMENT ON COLUMN public.tb_equipment_info.equip_kind IS '설비종류';
COMMENT ON COLUMN public.tb_equipment_info.pur_date IS '구입일';
COMMENT ON COLUMN public.tb_equipment_info.pur_cust IS '구입처';
COMMENT ON COLUMN public.tb_equipment_info.mak_cust IS '제조사';
COMMENT ON COLUMN public.tb_equipment_info.equip_spec IS '설비규격';
COMMENT ON COLUMN public.tb_equipment_info.location IS '설치장소';
COMMENT ON COLUMN public.tb_equipment_info.bigo IS '비고';
COMMENT ON COLUMN public.tb_equipment_info.use_at IS '사용여부';

-- ---------------------------------------------------------------------
-- 기존 테넌트의 TENANT_ADMIN / TENANT_USER 권한에 설비관리 메뉴 READ/WRITE 권한 부여
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
  AND m.menu_url IN ('/basicinfo', '/basicinfo/equipment')
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;
