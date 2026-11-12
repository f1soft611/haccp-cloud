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
    status_type VARCHAR(30) NOT NULL,
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
    end_status VARCHAR(30) NOT NULL,
    status_type_name VARCHAR(20) NOT NULL,
    report_date VARCHAR(8) NOT NULL,
    settle_plan_date VARCHAR(8) NOT NULL,
    weight_type_code VARCHAR(6) NOT NULL,
    weight_status VARCHAR(30) NOT NULL,
    twf_date VARCHAR(8) NOT NULL,
    after_twf_date VARCHAR(8) NOT NULL,
    payamt NUMERIC(19,4),
    first_parent_eabus_no VARCHAR(3),
    first_parent_ea_exe_id VARCHAR(12),
    first_parent_seqno INTEGER,
    parent_eabus_no VARCHAR(3),
    parent_ea_exe_id VARCHAR(12),
    parent_seqno INTEGER,
    ea_locked_status VARCHAR(30),
    delete_status VARCHAR(30) NOT NULL,
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
    arrival_at TIMESTAMP,
    exe_at TIMESTAMP,
    option_name VARCHAR(20) NOT NULL,
    open_at TIMESTAMP,
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
    not_open_status VARCHAR(30),
    main_view_status VARCHAR(30),
    exe_seq INTEGER NOT NULL,
    approval_type VARCHAR(30) NOT NULL,
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
    approval_type VARCHAR(30) NOT NULL,
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

-- 주기 기준일은 report_date 하나로 통일
CREATE INDEX IF NOT EXISTS idx_electronic_approval_main_work_report_date
    ON tb_electronic_approval_main(drafting_work_category_id, report_date);

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

CREATE TABLE IF NOT EXISTS tb_electronic_approval_sub (
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
    REFERENCES tb_drafting_work_category(drafting_work_category_id)
    ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_sub_main
    FOREIGN KEY (electronic_approval_id)
    REFERENCES tb_electronic_approval_main(electronic_approval_id)
    ON DELETE CASCADE,
    CONSTRAINT fk_electronic_approval_sub_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tb_tenant(tenant_id)
    ON DELETE CASCADE
    );

COMMENT ON COLUMN tb_electronic_approval_sub.drafting_work_category_id IS '결재양식id';
COMMENT ON COLUMN tb_electronic_approval_sub.equipment_id IS '설비id';
COMMENT ON COLUMN tb_electronic_approval_sub.material_type IS '품목유형(공통코드 MATERIAL_TYPE item_code)';
COMMENT ON COLUMN tb_electronic_approval_sub.certification_user_id IS '증명서소유_사원정보';
COMMENT ON COLUMN tb_electronic_approval_sub.inspected_date IS '검사일(검교정,유효성평가,자가 품질평가,보건증등록 등)';
COMMENT ON COLUMN tb_electronic_approval_sub.expiration_date IS '만료일(검교정예정,유효성평가만료,자가품질검사만료,보건증만료 등)';
COMMENT ON COLUMN tb_electronic_approval_sub.created_by IS '등록자';
COMMENT ON COLUMN tb_electronic_approval_sub.created_at IS '등록일시';
COMMENT ON COLUMN tb_electronic_approval_sub.updated_by IS '변경자';
COMMENT ON COLUMN tb_electronic_approval_sub.updated_at IS '변경일시';

-- 만료일 관리 업무: 업무 + 대상(설비, 품목유형, 증명서 소유자)별 최신 문서 (삭제, 임시저장 제외)
-- 기존 -> 대상별 최신 문서 컬럼만 / 변경 -> 업무 안내 기준으로 계산한 안내 시작일 도달 여부(notice_reached) 추가
CREATE OR REPLACE VIEW v_expiration_target_latest AS
SELECT DISTINCT ON (m.tenant_id, m.drafting_work_category_id,
                    s.equipment_id, COALESCE(s.material_type, ''), s.certification_user_id)
       m.tenant_id,
       m.drafting_work_category_id,
       m.electronic_approval_id,
       COALESCE(m.status_type, '') AS status_type,
       CAST(COALESCE(m.updated_at, m.created_at) AS timestamp) AS status_at,
       s.equipment_id,
       COALESCE(s.material_type, '') AS material_type,
       s.certification_user_id,
       s.inspected_date,
       s.expiration_date,
       COALESCE(e.equip_nm, u.user_nm, '') AS target_name,
       CASE
         WHEN COALESCE(s.expiration_date, '') !~ '^[0-9]{8}$' THEN TRUE
         ELSE CURRENT_DATE >= TO_DATE(s.expiration_date, 'YYYYMMDD')
                - CASE COALESCE(w.expiration_notice_status, 'NONE')
                    WHEN 'DAY' THEN make_interval(days => COALESCE(w.expiration_notice_count, 0))
                    WHEN 'MONTH' THEN make_interval(months => COALESCE(w.expiration_notice_count, 0))
                    WHEN 'YEAR' THEN make_interval(years => COALESCE(w.expiration_notice_count, 0))
                    ELSE INTERVAL '0 day'
                  END
       END AS notice_reached
FROM tb_electronic_approval_sub s
JOIN tb_electronic_approval_main m
  ON m.tenant_id = s.tenant_id
 AND m.electronic_approval_id = s.electronic_approval_id
LEFT JOIN tb_drafting_work_category w
  ON w.tenant_id = m.tenant_id
 AND w.drafting_work_category_id = m.drafting_work_category_id
LEFT JOIN tb_equipment_info e
  ON e.tenant_id = s.tenant_id
 AND e.equipment_id = s.equipment_id
LEFT JOIN tb_user u
  ON u.tenant_id = s.tenant_id
 AND u.user_id = s.certification_user_id
WHERE COALESCE(m.delete_status, 'N') != 'Y'
  AND COALESCE(m.status_type, '') != 'pre_apply'
ORDER BY m.tenant_id, m.drafting_work_category_id,
         s.equipment_id, COALESCE(s.material_type, ''), s.certification_user_id,
         s.inspected_date DESC, m.electronic_approval_id DESC;


COMMIT;