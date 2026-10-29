-- =============================================================================
-- HACCP Cloud PostgreSQL Schema Creation Script (Active Tables Only)
-- =============================================================================
-- Database: haccp_cloud
-- Version: 1.1 (2026-06-24)
-- Description: 12 core tables only - role-only auth + tenant domain mapping
-- =============================================================================

BEGIN;

-- Tenant/Multi-tenancy Foundation
CREATE TABLE IF NOT EXISTS tb_tenant (
    tenant_id BIGSERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    tenant_no VARCHAR(6) UNIQUE, -- 랜덤 6자리 업체번호 컬럼 추가 (테넌트 DB 부트스트랩 INSERT 때문에 NULL 허용)
    tenant_nm VARCHAR(200) NOT NULL,
    admin_email VARCHAR(100) UNIQUE NOT NULL,
    business_registration_number VARCHAR(12),
    corporate_number VARCHAR(14),
    business_type VARCHAR(200),
    business_category VARCHAR(200),
    registration_date DATE,
    logo_image TEXT,
    onboarding_status VARCHAR(50) DEFAULT 'EMAIL_QUEUED' NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_tenant_business_registration_number_active
    ON tb_tenant (business_registration_number)
    WHERE business_registration_number IS NOT NULL AND use_at = 'Y';

CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_tenant_corporate_number_active
    ON tb_tenant (corporate_number)
    WHERE corporate_number IS NOT NULL AND use_at = 'Y';

-- Tenant Onboarding Authentication Tokens, Tenant Domain Mapping, and Tenant
-- Database Registry stay in the central platform database by design.

-- Department/Organization
CREATE TABLE IF NOT EXISTS tb_department (
    department_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    department_nm VARCHAR(100) NOT NULL,
    parent_department_id BIGINT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_department_id) REFERENCES tb_department(department_id) ON DELETE SET NULL
);

-- Login Account
CREATE TABLE IF NOT EXISTS tb_login_account (
    login_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    login_code VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image TEXT,
    stamp_image TEXT,
    login_attempt_count INT DEFAULT 0,
    locked_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (tenant_id, login_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);

-- User
CREATE TABLE IF NOT EXISTS tb_user (
    user_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    login_id BIGINT,
    user_nm VARCHAR(100) NOT NULL,
    email_addr VARCHAR(100),
    department_id BIGINT,
    mobile_no VARCHAR(20),
    join_date VARCHAR(10),    -- 입사일 (YYYY-MM-DD)
    retire_date VARCHAR(10),  -- 퇴사일 (YYYY-MM-DD)
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (tenant_id, email_addr),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES tb_department(department_id) ON DELETE SET NULL
);

-- Role
CREATE TABLE IF NOT EXISTS tb_role (
    role_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    role_nm VARCHAR(100) NOT NULL,
    role_dc VARCHAR(500),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    is_system_role CHAR(1) DEFAULT 'N' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (tenant_id, role_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);

-- Login Account - Role Mapping
CREATE TABLE IF NOT EXISTS tb_login_account_role (
    login_account_role_id BIGSERIAL PRIMARY KEY,
    login_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (login_id, role_id),
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE CASCADE
);

-- Menu
CREATE TABLE IF NOT EXISTS tb_menu (
    menu_id BIGSERIAL PRIMARY KEY,
    parent_menu_id BIGINT,
    menu_code VARCHAR(50) NOT NULL,
    menu_nm VARCHAR(100) NOT NULL,
    menu_dc VARCHAR(500),
    menu_url VARCHAR(500),
    icon_nm VARCHAR(100),
    menu_order INT,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (menu_code),
    FOREIGN KEY (parent_menu_id) REFERENCES tb_menu(menu_id) ON DELETE CASCADE
);

-- Permission
CREATE TABLE IF NOT EXISTS tb_permission (
    permission_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    permission_nm VARCHAR(100) NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (tenant_id, permission_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);

-- Role - Menu - Permission Mapping
CREATE TABLE IF NOT EXISTS tb_role_menu_permission (
    role_menu_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    menu_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (role_id, menu_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES tb_menu(menu_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES tb_permission(permission_id) ON DELETE CASCADE
);

-- Login History
CREATE TABLE IF NOT EXISTS tb_login_history (
    login_history_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    login_account_id BIGINT,
    role_id BIGINT,
    user_id BIGINT,
    login_code VARCHAR(50) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    user_code VARCHAR(50),
    user_nm VARCHAR(100) NOT NULL,
    login_dt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    login_ip VARCHAR(64),
    login_type VARCHAR(20),
    user_agent TEXT,
    login_result CHAR(1) NOT NULL CHECK (login_result IN ('Y', 'N')),
    fail_reason VARCHAR(500),
    logout_dt TIMESTAMP,
    session_time INT,
    gov_interface_yn CHAR(1),
    gov_interface_dt TIMESTAMP,
    gov_recptn_rslt_cd VARCHAR(10),
    gov_recptn_rslt VARCHAR(100),
    gov_recptn_rslt_dtl VARCHAR(500),
    gov_fail_reason VARCHAR(500),
    gov_request_json TEXT,
    gov_response_json TEXT,
    
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (login_account_id) REFERENCES tb_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES tb_user(user_id) ON DELETE SET NULL
);

-- Scheduler Config (legacy-compatible schema expected by the app)
CREATE TABLE IF NOT EXISTS tb_schedulerconfig (
    scheduler_id BIGSERIAL PRIMARY KEY,
    scheduler_name VARCHAR(100) NOT NULL,
    scheduler_description VARCHAR(500),
    cron_expression VARCHAR(100),
    job_class_name VARCHAR(255),
    is_enabled CHAR(1) DEFAULT 'N' NOT NULL,
    reg_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reg_user_id VARCHAR(50),
    upd_dt TIMESTAMP,
    upd_user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_scheduler_history (
    history_id BIGSERIAL PRIMARY KEY,
    scheduler_id BIGINT NOT NULL,
    scheduler_name VARCHAR(100) NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    error_message TEXT,
    error_stack_trace TEXT,
    execution_time_ms BIGINT,
    retry_count INT NOT NULL DEFAULT 0,
    reg_dt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scheduler_id) REFERENCES tb_schedulerconfig(scheduler_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduler_history_scheduler_id ON tb_scheduler_history(scheduler_id);
CREATE INDEX IF NOT EXISTS idx_scheduler_history_status ON tb_scheduler_history(status);
CREATE INDEX IF NOT EXISTS idx_scheduler_history_reg_dt ON tb_scheduler_history(reg_dt DESC);

CREATE TABLE IF NOT EXISTS tb_common_code_group (
                                                    common_code_group_id BIGSERIAL PRIMARY KEY,
                                                    tenant_id BIGINT NOT NULL,
                                                    group_code VARCHAR(50) NOT NULL,
    group_nm VARCHAR(200) NOT NULL,
    group_dc VARCHAR(500),
    parent_group_id BIGINT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT chk_common_code_group_use_at CHECK (use_at IN ('Y', 'N')),
    CONSTRAINT uk_common_code_group_tenant_code UNIQUE (tenant_id, group_code),
    CONSTRAINT fk_common_code_group_tenant FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_common_code_group_parent FOREIGN KEY (parent_group_id) REFERENCES tb_common_code_group(common_code_group_id) ON DELETE RESTRICT
    );

CREATE TABLE IF NOT EXISTS tb_common_code_item (
                                                   common_code_item_id BIGSERIAL PRIMARY KEY,
                                                   tenant_id BIGINT NOT NULL,
                                                   group_id BIGINT NOT NULL,
                                                   item_code VARCHAR(50) NOT NULL,
    item_nm VARCHAR(200) NOT NULL,
    item_dc VARCHAR(500),
    parent_item_id BIGINT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT chk_common_code_item_use_at CHECK (use_at IN ('Y', 'N')),
    CONSTRAINT uk_common_code_item_group_code UNIQUE (group_id, item_code),
    CONSTRAINT fk_common_code_item_tenant FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_common_code_item_group FOREIGN KEY (group_id) REFERENCES tb_common_code_group(common_code_group_id) ON DELETE RESTRICT,
    CONSTRAINT fk_common_code_item_parent FOREIGN KEY (parent_item_id) REFERENCES tb_common_code_item(common_code_item_id) ON DELETE RESTRICT
    );

CREATE INDEX IF NOT EXISTS ix_common_code_group_tenant_parent ON tb_common_code_group(tenant_id, parent_group_id, sort_order);
CREATE INDEX IF NOT EXISTS ix_common_code_item_group_parent ON tb_common_code_item(group_id, parent_item_id, sort_order);

-- 기준정보 관리 > 품목 관리
CREATE TABLE IF NOT EXISTS tb_material_info (
                                                material_id           BIGSERIAL NOT NULL,
                                                tenant_id             BIGINT NOT NULL,
                                                material_code         VARCHAR(20) NOT NULL,        -- 품목코드 (테넌트별 자동채번)
    material_name         VARCHAR(200) NOT NULL,       -- 품목명
    material_eng_name     VARCHAR(200),
    material_model_name   VARCHAR(200),
    material_spec         VARCHAR(100),                -- 규격
    material_weight       BIGINT,                      -- 중량
    unit                  VARCHAR(6),                  -- 단위
    material_type_code    VARCHAR(14) NOT NULL,        -- 품목계정코드
    customer_code         VARCHAR(10),                 -- 제조사
    safe_invoice          DOUBLE PRECISION,
    accounting_code       VARCHAR(7),
    warehouse_code        VARCHAR(10),
    drawing               VARCHAR(10),
    etc                   VARCHAR(100),                -- 비고
    part_no               VARCHAR(30),
    manufactory           VARCHAR(100),
    deleted_at            TIMESTAMP,
    mat_cata_type         VARCHAR(10) NOT NULL DEFAULT '',
    location              VARCHAR(1000),
    material_spec2        VARCHAR(100),
    item_type             VARCHAR(10),                 -- 품목계정 (제품/상품/원재료/부재료/소모품)
    search_item_name      VARCHAR(200),
    material_quality      VARCHAR(6),
    item_barcode          VARCHAR(20),
    material_no           VARCHAR(20),
    delete_status         VARCHAR(10) NOT NULL DEFAULT 'N',  -- 삭제여부(Y=삭제됨, N=정상)
    created_by            VARCHAR(10),
    created_at            TIMESTAMP,
    updated_by            VARCHAR(10),
    updated_at            TIMESTAMP,
    material_kind         VARCHAR(50),                 -- 품목유형 (공통코드 MATERIAL_TYPE)
    store_method          VARCHAR(50),                 -- 보관방법 (공통코드 STORE_METHOD)
    expiryed_status       VARCHAR(10) NOT NULL DEFAULT 'NONE',  -- 소비기한기준 (공통코드 EXPIRY_STATUS: NONE/DAY/MONTH/YEAR)
    expiryed_count        INT4,                        -- 소비기한계산숫자
    kfda_report_no        VARCHAR(20),                 -- 품목보고번호
    CONSTRAINT tb_material_info_pkey PRIMARY KEY (material_id),
    CONSTRAINT uq_material_id_tenant_id UNIQUE (material_id, tenant_id),
    CONSTRAINT uq_tb_material_info_tenant_material_code UNIQUE (tenant_id, material_code),
    CONSTRAINT fk_tb_material_info_tenant FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id),
    CONSTRAINT ck_tb_material_info_expiryed_status CHECK (expiryed_status IN ('NONE', 'DAY', 'MONTH', 'YEAR')),
    CONSTRAINT ck_tb_material_info_expiryed_count CHECK (expiryed_count IS NULL OR expiryed_count > 0)
    );

CREATE INDEX IF NOT EXISTS ix_tb_material_info_tenant_id ON tb_material_info(tenant_id);
CREATE INDEX IF NOT EXISTS ix_tb_material_info_material_name ON tb_material_info(material_name);

-- 기준정보 관리 > 거래처관리
CREATE TABLE IF NOT EXISTS tb_customer_info (
                                                customer_id         BIGSERIAL NOT NULL,
                                                tenant_id           BIGINT NOT NULL,
                                                customer_code       VARCHAR(6) NOT NULL,         -- 거래처코드 (테넌트별 자동채번, 000001~)
    customer_name       VARCHAR(200) NOT NULL,       -- 거래처명
    cust_name_abbr      VARCHAR(100),                -- 거래처약어명
    president_name      VARCHAR(100),                -- 대표자명
    business_no         VARCHAR(10),                 -- 사업자번호 (숫자 10자리)
    jurid_no            VARCHAR(13),                 -- 법인번호 (숫자 13자리)
    business_status_1   VARCHAR(100),                -- 업태
    business_item_1     VARCHAR(100),                -- 종목
    post_code           VARCHAR(7),                  -- 우편번호
    address             VARCHAR(200),                -- 주소
    telephone_no        VARCHAR(50),                 -- 전화번호
    facsimile_no        VARCHAR(50),                 -- 팩스번호
    cust_memo           VARCHAR(3000) DEFAULT '',    -- 비고
    use_at              CHAR(1) NOT NULL DEFAULT 'Y',
    created_by          BIGINT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          BIGINT,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tb_customer_info_pkey PRIMARY KEY (customer_id),
    CONSTRAINT uq_customer_id_tenant_id UNIQUE (customer_id, tenant_id),
    CONSTRAINT uq_tb_customer_info_tenant_code UNIQUE (tenant_id, customer_code),
    CONSTRAINT tb_customer_info_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    CONSTRAINT tb_customer_info_use_at_check CHECK (use_at IN ('Y', 'N'))
    );

CREATE INDEX IF NOT EXISTS idx_tb_customer_info_tenant ON tb_customer_info(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tb_customer_info_use_at ON tb_customer_info(use_at);

-- 기준정보 관리 > 설비관리
CREATE TABLE IF NOT EXISTS tb_equipment_info (
                                                 equipment_id         BIGSERIAL NOT NULL,
                                                 tenant_id            BIGINT NOT NULL,
                                                 equip_sys_cd         VARCHAR(6) NOT NULL,         -- 관리코드 (테넌트별 자동채번)
    equip_cd             VARCHAR(20) NOT NULL,        -- 설비코드 (사용자 직접입력)
    equip_nm             VARCHAR(99),                 -- 설비명
    equip_kind           VARCHAR(6),                  -- 설비종류
    pur_date             VARCHAR(12),                 -- 구입일 (YYYY-MM-DD)
    pur_amount           NUMERIC(19, 4),
    pur_cust             VARCHAR(100),                -- 구입처
    mak_cust             VARCHAR(99),                 -- 제조사
    manager1_code        CHAR(10),
    manager2_code        CHAR(10),
    location             VARCHAR(1000),               -- 설치장소
    disuse_status        VARCHAR(10),
    disuse_date          CHAR(8),
    disuse_reg_charge    VARCHAR(10),
    equip_status         VARCHAR(10),
    equip_spec           VARCHAR(99),                 -- 설비규격
    vc_kind              VARCHAR(50),                 -- 검교정구분(공통코드 VC_KIND)
    vc_cycle             INT4,                        -- 검교정주기(개월)
    bigo                 VARCHAR(1000),               -- 비고
    use_status           VARCHAR(10),
    use_at               CHAR(1) NOT NULL DEFAULT 'Y',
    created_by           VARCHAR(10),
    created_at           TIMESTAMP,
    updated_by           CHAR(10),
    updated_at           TIMESTAMP,
    CONSTRAINT tb_equipment_info_pkey PRIMARY KEY (equipment_id),
    CONSTRAINT uq_equipment_id_tenant_id UNIQUE (equipment_id, tenant_id),
    CONSTRAINT ck_tb_equipment_info_vc_cycle CHECK (vc_cycle IS NULL OR vc_cycle > 0),
    CONSTRAINT fk_tb_equipment_info_tenant FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id)
    );

CREATE INDEX IF NOT EXISTS ix_tb_equipment_info_tenant_id ON tb_equipment_info(tenant_id);

-- 작업관리 > 작업지시 (품목·거래처·설비 다음에 생성: FK 참조)
CREATE TABLE IF NOT EXISTS tb_workdirect (
                                             workdirect_id     BIGSERIAL PRIMARY KEY,                 -- 작업지시ID
                                             tenant_id         BIGINT NOT NULL,                       -- 사업장(테넌트)ID
                                             workdt_no         VARCHAR(12) NOT NULL,                  -- 작업지시번호(yyyyMMdd+순번4자리)
    workdt_date       DATE,                                  -- 작업등록일
    prod_plan_date    DATE,                                  -- 생산계획일
    material_id       BIGINT NOT NULL,                       -- 품목ID(tb_material_info)
    customer_id       BIGINT,                                -- 거래처ID(tb_customer_info)
    expiration_date   DATE,                                  -- 소비기한
    prod_dept_id      BIGINT,                                -- 생산부서
    prodplan_qty      NUMERIC(10,5),                         -- 생산량(직접입력)
    mix_qty_kg        DOUBLE PRECISION,                      -- 배합량(생산량 기준 자동계산, 수정가능)
    mix_workdt_status VARCHAR(20),                           -- 작업지시구분(포장계획/배합계획)
    mix_batch_cnt     NUMERIC(10,5),                         -- 배치수량
    batch_seq         INTEGER,                               -- 배치순번
    prod_memo         VARCHAR(255),                          -- 비고
    mix_qty_stdunit   NUMERIC(10,5),                         -- 표준배합량(적정량)
    limit_mix_qty     NUMERIC(10,5),                         -- 배합한도량(총한도)
    prodqty_boxcan    NUMERIC(10,5),                         -- 생산량(BOX/CAN)
    mix_equip_id      BIGINT,                                -- 배합설비ID(tb_equipment_info)
    packing_equip_id  BIGINT,                                -- 포장설비ID(tb_equipment_info)
    finish_status     VARCHAR(20),                           -- 생산완료구분
    system_lot_no     VARCHAR(20),                           -- LOT번호
    work_proc_status  VARCHAR(20),                           -- 작업취소구분
    use_at            CHAR(1) NOT NULL DEFAULT 'Y',          -- 사용(삭제)여부
    created_by        VARCHAR(10),                           -- 등록자
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 등록일시
    updated_by        VARCHAR(10),                           -- 수정자
    updated_at        TIMESTAMP,                             -- 수정일시
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant (tenant_id),
    FOREIGN KEY (material_id, tenant_id) REFERENCES tb_material_info (material_id, tenant_id),
    FOREIGN KEY (customer_id, tenant_id) REFERENCES tb_customer_info (customer_id, tenant_id),
    FOREIGN KEY (mix_equip_id, tenant_id) REFERENCES tb_equipment_info (equipment_id, tenant_id),
    FOREIGN KEY (packing_equip_id, tenant_id) REFERENCES tb_equipment_info (equipment_id, tenant_id)
    );

CREATE UNIQUE INDEX IF NOT EXISTS uq_workdirect_id_tenant_id ON tb_workdirect(workdirect_id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_workdirect_tenant_workdt_no ON tb_workdirect(tenant_id, workdt_no);
CREATE INDEX IF NOT EXISTS ix_tb_workdirect_tenant_plan_date ON tb_workdirect(tenant_id, prod_plan_date);
CREATE INDEX IF NOT EXISTS ix_tb_workdirect_material_id ON tb_workdirect(material_id);
CREATE INDEX IF NOT EXISTS ix_tb_workdirect_customer_id ON tb_workdirect(customer_id);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tenant_department ON tb_department(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parent_department ON tb_department(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_department_sort_order ON tb_department(tenant_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_tenant_login_account ON tb_login_account(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_code ON tb_login_account(login_code);

CREATE INDEX IF NOT EXISTS idx_tenant_user ON tb_user(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_department ON tb_user(department_id);
CREATE INDEX IF NOT EXISTS idx_user_login_id ON tb_user(login_id);

CREATE INDEX IF NOT EXISTS idx_tenant_role ON tb_role(tenant_id);

CREATE INDEX IF NOT EXISTS idx_menu_parent ON tb_menu(parent_menu_id);

CREATE INDEX IF NOT EXISTS idx_tenant_permission ON tb_permission(tenant_id);

CREATE INDEX IF NOT EXISTS idx_role_menu_permission_role ON tb_role_menu_permission(role_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_permission_menu ON tb_role_menu_permission(menu_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_permission_permission ON tb_role_menu_permission(permission_id);

CREATE INDEX IF NOT EXISTS idx_tenant_login_history ON tb_login_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_history_dt ON tb_login_history(login_dt DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_result ON tb_login_history(login_result);
CREATE INDEX IF NOT EXISTS idx_login_history_account ON tb_login_history(login_account_id);

-- 스키마 마이그레이션 이력 (플랫폼 관리 > DB 마이그레이션)
CREATE TABLE IF NOT EXISTS tb_schema_migration (
                                                   migration_id  VARCHAR(200) PRIMARY KEY,
    success_at    CHAR(1)      NOT NULL,
    error_message TEXT,
    applied_by    VARCHAR(100),
    applied_at    TIMESTAMP    NOT NULL DEFAULT NOW()
    );

COMMIT;

-- =============================================================================
-- Verification Queries
-- =============================================================================
-- Run these queries to verify schema creation:
--
-- SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
-- SELECT constraint_name, table_name FROM information_schema.table_constraints 
--   WHERE table_schema='public' AND constraint_type='FOREIGN KEY' ORDER BY table_name;
-- =============================================================================
