BEGIN;

CREATE TABLE IF NOT EXISTS tb_department (
    department_id BIGSERIAL PRIMARY KEY,
    department_nm VARCHAR(100) NOT NULL,
    parent_department_id BIGINT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_department_id) REFERENCES tb_department(department_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_login_account (
    login_id BIGSERIAL PRIMARY KEY,
    login_code VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_image TEXT,
    stamp_image TEXT,
    login_attempt_count INT DEFAULT 0,
    locked_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_user (
    user_id BIGSERIAL PRIMARY KEY,
    login_id BIGINT,
    user_nm VARCHAR(100) NOT NULL,
    email_addr VARCHAR(100),
    department_id BIGINT,
    mobile_no VARCHAR(20),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email_addr),
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES tb_department(department_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_role (
    role_id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL,
    role_nm VARCHAR(100) NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    is_system_role CHAR(1) DEFAULT 'N' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_code)
);

CREATE TABLE IF NOT EXISTS tb_permission (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_code VARCHAR(50) NOT NULL,
    permission_nm VARCHAR(100) NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (permission_code)
);

CREATE TABLE IF NOT EXISTS tb_menu (
    menu_id BIGSERIAL PRIMARY KEY,
    parent_menu_id BIGINT,
    menu_code VARCHAR(50) UNIQUE NOT NULL,
    menu_nm VARCHAR(100) NOT NULL,
    menu_dc VARCHAR(500),
    menu_url VARCHAR(500),
    icon_nm VARCHAR(100),
    menu_order INT,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_menu_id) REFERENCES tb_menu(menu_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_login_account_role (
    login_account_role_id BIGSERIAL PRIMARY KEY,
    login_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (login_id, role_id),
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS tb_login_history (
    login_history_id BIGSERIAL PRIMARY KEY,
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
    FOREIGN KEY (login_account_id) REFERENCES tb_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES tb_user(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_drafting_work_category_group (
    drafting_work_category_group_id BIGSERIAL PRIMARY KEY,
    group_code VARCHAR(50) NOT NULL UNIQUE,
    group_nm VARCHAR(200) NOT NULL,
    group_dc VARCHAR(500),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES tb_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES tb_login_account(login_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_drafting_work_category (
    drafting_work_category_id BIGSERIAL PRIMARY KEY,
    drafting_work_category_group_id BIGINT,
    work_code VARCHAR(50) NOT NULL UNIQUE,
    work_nm VARCHAR(200) NOT NULL,
    work_dc VARCHAR(500),
    reg_term VARCHAR(20),
    sort_order INTEGER DEFAULT 0 NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drafting_work_category_group_id)
        REFERENCES tb_drafting_work_category_group(drafting_work_category_group_id)
        ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES tb_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES tb_login_account(login_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_drafting_work_category_authority (
    drafting_work_category_authority_id BIGSERIAL PRIMARY KEY,
    drafting_work_category_id BIGINT NOT NULL,
    login_id BIGINT NOT NULL,
    authority_type VARCHAR(30) NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (drafting_work_category_id, login_id, authority_type),
    FOREIGN KEY (drafting_work_category_id)
        REFERENCES tb_drafting_work_category(drafting_work_category_id)
        ON DELETE CASCADE,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_electronic_approval_main (
    electronic_approval_id BIGSERIAL PRIMARY KEY,
    drafting_work_category_id BIGINT NOT NULL,
    login_id BIGINT NOT NULL,
    department_id BIGINT,
    approval_title VARCHAR(500),
    status_type VARCHAR(30) NOT NULL,
    end_status VARCHAR(30),
    weight_status VARCHAR(30),
    ea_locked_status VARCHAR(30),
    delete_status VARCHAR(30),
    work_document_id BIGINT,
    reg_date VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drafting_work_category_id)
        REFERENCES tb_drafting_work_category(drafting_work_category_id)
        ON DELETE RESTRICT,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES tb_department(department_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_electronic_approval_line_info (
    electronic_approval_line_id BIGSERIAL PRIMARY KEY,
    electronic_approval_id BIGINT NOT NULL,
    login_id BIGINT NOT NULL,
    department_id BIGINT,
    approval_type VARCHAR(30),
    app_status VARCHAR(30),
    arbdec_status VARCHAR(30),
    repdec_status VARCHAR(30),
    muldec_status VARCHAR(30),
    last_owner_status VARCHAR(30),
    arrival_at TIMESTAMP,
    exe_at TIMESTAMP,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (electronic_approval_id)
        REFERENCES tb_electronic_approval_main(electronic_approval_id)
        ON DELETE CASCADE,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES tb_department(department_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_electronic_approval_history_main (
    electronic_approval_history_id BIGSERIAL PRIMARY KEY,
    electronic_approval_line_id BIGINT NOT NULL,
    parent_electronic_approval_history_id BIGINT,
    login_id BIGINT NOT NULL,
    history_type VARCHAR(30) NOT NULL,
    history_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (electronic_approval_line_id)
        REFERENCES tb_electronic_approval_line_info(electronic_approval_line_id)
        ON DELETE CASCADE,
    FOREIGN KEY (parent_electronic_approval_history_id)
        REFERENCES tb_electronic_approval_history_main(electronic_approval_history_id)
        ON DELETE SET NULL,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tb_electronic_approval_open_info (
    electronic_approval_open_id BIGSERIAL PRIMARY KEY,
    electronic_approval_history_id BIGINT NOT NULL,
    login_id BIGINT NOT NULL,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (electronic_approval_history_id)
        REFERENCES tb_electronic_approval_history_main(electronic_approval_history_id)
        ON DELETE CASCADE,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_electronic_approval_history_like (
    electronic_approval_history_like_id BIGSERIAL PRIMARY KEY,
    electronic_approval_history_id BIGINT NOT NULL,
    login_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (electronic_approval_history_id, login_id),
    FOREIGN KEY (electronic_approval_history_id)
        REFERENCES tb_electronic_approval_history_main(electronic_approval_history_id)
        ON DELETE CASCADE,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_login_id ON tb_user(login_id);
CREATE INDEX IF NOT EXISTS idx_user_department_id ON tb_user(department_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_permission_role_id ON tb_role_menu_permission(role_id);
CREATE INDEX IF NOT EXISTS idx_ea_main_login_id ON tb_electronic_approval_main(login_id);
CREATE INDEX IF NOT EXISTS idx_ea_main_status_type ON tb_electronic_approval_main(status_type);
CREATE INDEX IF NOT EXISTS idx_ea_line_info_login_id ON tb_electronic_approval_line_info(login_id);
CREATE INDEX IF NOT EXISTS idx_ea_history_line_id ON tb_electronic_approval_history_main(electronic_approval_line_id);

COMMIT;