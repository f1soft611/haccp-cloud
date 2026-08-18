-- 기준정보 관리 > 거래처관리
-- tb_customer_info: 테넌트별 거래처 마스터 정보

CREATE SEQUENCE IF NOT EXISTS public.tb_customer_info_customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.tb_customer_info (
    customer_id         bigint NOT NULL DEFAULT nextval('public.tb_customer_info_customer_id_seq'),
    tenant_id           bigint NOT NULL,
    customer_code       varchar(6) NOT NULL,         -- 거래처코드 (테넌트별 자동채번, 000001~)
    customer_name       varchar(200) NOT NULL,       -- 거래처명
    cust_name_abbr      varchar(100),                -- 거래처약어명
    president_name      varchar(100),                -- 대표자명
    business_no         varchar(10),                 -- 사업자번호 (숫자만 10자리, 하이픈 없음. 마스킹은 프론트에서 처리)
    jurid_no            varchar(13),                 -- 법인번호 (숫자만 13자리, 하이픈 없음. 마스킹은 프론트에서 처리)
    business_status_1   varchar(100),                -- 업태
    business_item_1     varchar(100),                -- 종목
    post_code           varchar(7),                  -- 우편번호
    address             varchar(200),                -- 주소
    telephone_no        varchar(50),                 -- 전화번호
    facsimile_no        varchar(50),                 -- 팩스번호
    cust_memo           varchar(3000) DEFAULT ''::character varying, -- 비고
    use_at              char(1) NOT NULL DEFAULT 'Y',
    created_by          bigint,
    created_at          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          bigint,
    updated_at          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tb_customer_info_pkey PRIMARY KEY (customer_id),
    CONSTRAINT tb_customer_info_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tb_tenant(tenant_id) ON DELETE CASCADE,
    CONSTRAINT uq_tb_customer_info_tenant_code UNIQUE (tenant_id, customer_code),
    CONSTRAINT tb_customer_info_use_at_check CHECK (use_at = ANY (ARRAY['Y'::bpchar, 'N'::bpchar]))
);

ALTER SEQUENCE public.tb_customer_info_customer_id_seq OWNED BY public.tb_customer_info.customer_id;

CREATE INDEX IF NOT EXISTS idx_tb_customer_info_tenant ON public.tb_customer_info USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tb_customer_info_use_at ON public.tb_customer_info USING btree (use_at);

COMMENT ON TABLE public.tb_customer_info IS '거래처 마스터 정보';
COMMENT ON COLUMN public.tb_customer_info.customer_code IS '거래처코드(테넌트별 자동채번)';
COMMENT ON COLUMN public.tb_customer_info.cust_name_abbr IS '거래처약어명';
COMMENT ON COLUMN public.tb_customer_info.president_name IS '대표자명';
COMMENT ON COLUMN public.tb_customer_info.business_no IS '사업자번호(숫자 10자리)';
COMMENT ON COLUMN public.tb_customer_info.jurid_no IS '법인번호(숫자 13자리)';
COMMENT ON COLUMN public.tb_customer_info.business_status_1 IS '업태';
COMMENT ON COLUMN public.tb_customer_info.business_item_1 IS '종목';

-- ---------------------------------------------------------------------
-- 기존 테넌트의 TENANT_ADMIN / TENANT_USER 권한에 "기준정보 관리" 메뉴
-- (거래처관리/품목 관리/설비관리 및 상위 그룹) READ/WRITE 권한을 일괄 부여.
-- 메뉴(tb_menu)는 이미 등록되어 있다는 전제(menu_url 기준)로 매핑한다.
-- 신규로 온보딩되는 테넌트는 "조직 관리 > 권한 관리" 화면에서 별도로 부여해야 한다.
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
  AND m.menu_url IN ('/basicinfo', '/basicinfo/customers', '/basicinfo/materials', '/basicinfo/equipment')
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;
