-- =============================================================================
-- HACCP Cloud PostgreSQL - Electronic approval schema cleanup
-- =============================================================================
-- Assumptions:
--   1) tenant_id is the business scope key for the current schema.
--   2) eabus_no + ea_exe_id is the external business key used by the approval flow.
--   3) Legacy date fields stay as varchar(8) for compatibility with existing APIs.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tb_electronic_approval_main (
    electronic_approval_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    drafting_work_category_id BIGINT,
    plant_code VARCHAR(3) NOT NULL,
    eabus_no VARCHAR(3) NOT NULL,
    ea_exe_id VARCHAR(12) NOT NULL,
    reg_date VARCHAR(8) NOT NULL,
    login_id BIGINT,
    status_type VARCHAR(10) NOT NULL,
    department_id BIGINT,
    level_name VARCHAR(20) NOT NULL,
    ea_title VARCHAR(200) NOT NULL,
    twf_time VARCHAR(4) NOT NULL,
    customer_code VARCHAR(10),
    item_code VARCHAR(20),
    txt_cnt TEXT NOT NULL,
    txt_json JSONB,
    after_cnt TEXT,
    after_txt_json JSONB,
    after_twf_time VARCHAR(4) NOT NULL,
    cata_type_code VARCHAR(6) NOT NULL,
    end_status VARCHAR(10) NOT NULL,
    status_type_name VARCHAR(20) NOT NULL,
    report_date VARCHAR(8) NOT NULL,
    settle_plan_date VARCHAR(8) NOT NULL,
    weight_type_code VARCHAR(6) NOT NULL,
    weight_status VARCHAR(10) NOT NULL,
    twf_date VARCHAR(8) NOT NULL,
    after_twf_date VARCHAR(8) NOT NULL,
    payamt NUMERIC(19,4),
    first_parent_eabus_no VARCHAR(3),
    first_parent_ea_exe_id VARCHAR(12),
    first_parent_seqno INTEGER,
    parent_eabus_no VARCHAR(3),
    parent_ea_exe_id VARCHAR(12),
    parent_seqno INTEGER,
    ea_locked_status VARCHAR(10),
    delete_status VARCHAR(10) NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_electronic_approval_main_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_main_work
        FOREIGN KEY (drafting_work_category_id)
        REFERENCES tb_drafting_work_category(drafting_work_category_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_electronic_approval_main_login
        FOREIGN KEY (login_id)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_electronic_approval_main_department
        FOREIGN KEY (department_id)
        REFERENCES tb_department(department_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_electronic_approval_main_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_electronic_approval_main_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_electronic_approval_main_business_key
        UNIQUE (tenant_id, eabus_no, ea_exe_id)
);

CREATE TABLE IF NOT EXISTS tb_electronic_approval_line_info (
    electronic_approval_line_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    electronic_approval_id BIGINT NOT NULL,
    exe_seq INTEGER NOT NULL,
    login_id BIGINT,
    department_id BIGINT,
    level_name VARCHAR(20) NOT NULL,
    app_status VARCHAR(30) NOT NULL,
    arbdec_status VARCHAR(30) NOT NULL,
    repdec_status VARCHAR(30) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    muldec_status VARCHAR(30) NOT NULL,
    arrival_at TIMESTAMP NOT NULL,
    exe_at TIMESTAMP NOT NULL,
    option_name VARCHAR(20) NOT NULL,
    open_at TIMESTAMP NOT NULL,
    approval_type VARCHAR(30) NOT NULL,
    last_owner_status VARCHAR(30) NOT NULL,
    order_seq INTEGER NOT NULL,
    last_cnfrmer_status VARCHAR(30) NOT NULL,
    role_name VARCHAR(50),
    sms_send_at1 TIMESTAMP,
    sms_send_at2 TIMESTAMP,
    ok_type VARCHAR(30),
    decide_status VARCHAR(30),
    decide_amt NUMERIC(19,4),
    referencer_view_status VARCHAR(30),
    conn_official_status VARCHAR(30),
    eabus_no VARCHAR(3) NOT NULL,
    ea_exe_id VARCHAR(12) NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_electronic_approval_line_info_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_line_info_main
        FOREIGN KEY (electronic_approval_id)
        REFERENCES tb_electronic_approval_main(electronic_approval_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_line_info_login
        FOREIGN KEY (login_id)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_electronic_approval_line_info_department
        FOREIGN KEY (department_id)
        REFERENCES tb_department(department_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_electronic_approval_line_info_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_electronic_approval_line_info_seq
        UNIQUE (tenant_id, electronic_approval_id, exe_seq)
);

CREATE TABLE IF NOT EXISTS tb_electronic_approval_history_main (
    electronic_approval_history_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    electronic_approval_line_id BIGINT NOT NULL,
    parent_history_id BIGINT,
    answer_seq INTEGER NOT NULL,
    answer_type_name VARCHAR(20) NOT NULL,
    answer_at TIMESTAMP NOT NULL,
    answer_cnt VARCHAR(4000) NOT NULL,
    not_open_status VARCHAR(10),
    main_view_status VARCHAR(10),
    exe_seq INTEGER NOT NULL,
    approval_type VARCHAR(10) NOT NULL,
    eabus_no VARCHAR(3) NOT NULL,
    ea_exe_id VARCHAR(12) NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_electronic_approval_history_main_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_history_main_line
        FOREIGN KEY (electronic_approval_line_id)
        REFERENCES tb_electronic_approval_line_info(electronic_approval_line_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_history_main_parent
        FOREIGN KEY (parent_history_id)
        REFERENCES tb_electronic_approval_history_main(electronic_approval_history_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_history_main_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_electronic_approval_history_main_seq
        UNIQUE (tenant_id, electronic_approval_line_id, answer_seq, exe_seq)
);

CREATE TABLE IF NOT EXISTS tb_electronic_approval_open_info (
    electronic_approval_open_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    electronic_approval_history_id BIGINT NOT NULL,
    login_id BIGINT,
    open_at TIMESTAMP NOT NULL,
    answer_seq INTEGER NOT NULL,
    exe_seq INTEGER NOT NULL,
    approval_type VARCHAR(10) NOT NULL,
    eabus_no VARCHAR(3) NOT NULL,
    ea_exe_id VARCHAR(12) NOT NULL,

    CONSTRAINT fk_electronic_approval_open_info_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_open_info_history
        FOREIGN KEY (electronic_approval_history_id)
        REFERENCES tb_electronic_approval_history_main(electronic_approval_history_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_open_info_login
        FOREIGN KEY (login_id)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_electronic_approval_open_info_user
        UNIQUE (tenant_id, electronic_approval_history_id, login_id)
);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_factory
    ON tb_electronic_approval_main(tenant_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_work_id
    ON tb_electronic_approval_main(drafting_work_category_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_business_key
    ON tb_electronic_approval_main(tenant_id, eabus_no, ea_exe_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_login_id
    ON tb_electronic_approval_main(login_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_department_id
    ON tb_electronic_approval_main(department_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_status_type
    ON tb_electronic_approval_main(status_type);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_end_status
    ON tb_electronic_approval_main(end_status);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_delete_status
    ON tb_electronic_approval_main(delete_status);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_reg_date
    ON tb_electronic_approval_main(reg_date);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_created_at
    ON tb_electronic_approval_main(created_at);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_line_info_main_id
    ON tb_electronic_approval_line_info(electronic_approval_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_line_info_login_id
    ON tb_electronic_approval_line_info(login_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_line_info_department_id
    ON tb_electronic_approval_line_info(department_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_line_info_app_status
    ON tb_electronic_approval_line_info(app_status);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_line_info_order_seq
    ON tb_electronic_approval_line_info(order_seq);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_line_info_approval_type
    ON tb_electronic_approval_line_info(approval_type);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_history_main_line_id
    ON tb_electronic_approval_history_main(electronic_approval_line_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_history_main_business_key
    ON tb_electronic_approval_history_main(tenant_id, eabus_no, ea_exe_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_history_main_answer_seq
    ON tb_electronic_approval_history_main(answer_seq);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_history_main_exe_seq
    ON tb_electronic_approval_history_main(exe_seq);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_history_main_parent_id
    ON tb_electronic_approval_history_main(parent_history_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_open_info_history_id
    ON tb_electronic_approval_open_info(electronic_approval_history_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_open_info_login_id
    ON tb_electronic_approval_open_info(login_id);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_open_info_open_at
    ON tb_electronic_approval_open_info(open_at);

CREATE INDEX IF NOT EXISTS idx_electronic_approval_open_info_business_key
    ON tb_electronic_approval_open_info(tenant_id, eabus_no, ea_exe_id);

COMMIT;