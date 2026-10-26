-- =============================================================================
-- HACCP Cloud PostgreSQL - Add drafting work category tables
-- =============================================================================
-- Purpose:
--   1) Add tenant-scoped work category group table
--   2) Add tenant-scoped drafting work category table
--   3) Connect both tables to tb_tenant(tenant_id)
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tb_drafting_work_category_group (
    drafting_work_category_group_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    cata_code VARCHAR(50) NOT NULL, -- 변경 -> WF_TYPE 코드(HCP-CALIB 등)를 담도록 VARCHAR(50)
    cata_name VARCHAR(20) NOT NULL,
    view_seq INTEGER NOT NULL DEFAULT 0,
    use_at CHAR(1) NOT NULL DEFAULT 'Y',
    delete_status VARCHAR(10) NOT NULL DEFAULT 'N',
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_drafting_work_category_group_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_drafting_work_category_group_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_group_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_drafting_work_category_group_tenant_code
        UNIQUE (tenant_id, cata_code)
);

CREATE TABLE IF NOT EXISTS tb_drafting_work_category (
    drafting_work_category_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    drafting_work_category_group_id BIGINT,
    cata_type_code VARCHAR(3) NOT NULL,
    code_name VARCHAR(50),
    view_seq INTEGER DEFAULT 0,
    type_cnt TEXT,
    reviewer_id BIGINT,
    approver_id BIGINT,
    user_type VARCHAR(10) DEFAULT '0',
    haccp_cp_status VARCHAR(10),
    reg_term VARCHAR(6),
    drafting_work_template_json JSONB,
    drafting_work_template_html TEXT,
    duty_charge_code VARCHAR(10),
    cata_code VARCHAR(50),
    expiration_apply CHAR(1) NOT NULL DEFAULT 'N',
    approval_apply CHAR(1) NOT NULL DEFAULT 'Y',
    use_at CHAR(1) NOT NULL DEFAULT 'Y',
    delete_status VARCHAR(10) DEFAULT 'N',
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_drafting_work_category_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_drafting_work_category_group
        FOREIGN KEY (drafting_work_category_group_id)
        REFERENCES tb_drafting_work_category_group(drafting_work_category_group_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_approver
        FOREIGN KEY (approver_id)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_drafting_work_category_authority (
    drafting_work_category_authority_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    drafting_work_category_id BIGINT NOT NULL,
    cata_type_code VARCHAR(3) NOT NULL,
    employee_no VARCHAR(10) NOT NULL,
    use_at CHAR(1) NOT NULL DEFAULT 'Y',
    delete_status VARCHAR(10) NOT NULL DEFAULT 'N',
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_drafting_work_category_authority_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_drafting_work_category_authority_work_category
        FOREIGN KEY (drafting_work_category_id)
        REFERENCES tb_drafting_work_category(drafting_work_category_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_drafting_work_category_authority_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_authority_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_drafting_work_category_authority_mapping
        UNIQUE (tenant_id, drafting_work_category_id, employee_no)
);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_group_tenant
    ON tb_drafting_work_category_group(tenant_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_group_use_at
    ON tb_drafting_work_category_group(use_at);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_tenant
    ON tb_drafting_work_category(tenant_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_group_id
    ON tb_drafting_work_category(drafting_work_category_group_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_reviewer_id
    ON tb_drafting_work_category(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_approver_id
    ON tb_drafting_work_category(approver_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_cata_type
    ON tb_drafting_work_category(cata_type_code);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_use_at
    ON tb_drafting_work_category(use_at);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_authority_tenant
    ON tb_drafting_work_category_authority(tenant_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_authority_work_category
    ON tb_drafting_work_category_authority(drafting_work_category_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_authority_employee_no
    ON tb_drafting_work_category_authority(employee_no);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_authority_use_at
    ON tb_drafting_work_category_authority(use_at);

-- 공통코드 WF_TYPE 을 업무 분류로 등록한다. 테넌트 생성 시 copyCommonCodes 다음에 실행된다.
-- 기존 -> 플랜과 관계없이 등록
-- 변경 -> Basic(A) 플랜은 등록하지 않는다. plan_code 는 프로비저닝 시 바인딩된다.
INSERT INTO tb_drafting_work_category_group (tenant_id, cata_code, cata_name, view_seq, use_at)
SELECT i.tenant_id, i.item_code, LEFT(i.item_nm, 20), i.sort_order, 'Y'
FROM tb_common_code_item i
    JOIN tb_common_code_group g ON g.common_code_group_id = i.group_id
    JOIN tb_tenant t ON t.tenant_id = i.tenant_id
WHERE g.group_code = 'WF_TYPE'
  AND i.use_at = 'Y'
  AND :'plan_code' <> 'A'
ON CONFLICT (tenant_id, cata_code) DO NOTHING;

COMMIT;