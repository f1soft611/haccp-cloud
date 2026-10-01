BEGIN;

CREATE TABLE IF NOT EXISTS tb_tenant (
    tenant_id BIGSERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    tenant_nm VARCHAR(200) NOT NULL,
    admin_email VARCHAR(100) UNIQUE NOT NULL,
    logo_image TEXT,
    onboarding_status VARCHAR(50) DEFAULT 'EMAIL_QUEUED' NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT
);

CREATE TABLE IF NOT EXISTS tb_tenant_domain (
    tenant_domain_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    domain_host VARCHAR(255) NOT NULL,
    is_primary CHAR(1) DEFAULT 'N' NOT NULL CHECK (is_primary IN ('Y', 'N')),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (domain_host),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_tenant_database (
    tenant_database_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    db_key VARCHAR(100) UNIQUE NOT NULL,
    db_name VARCHAR(100) NOT NULL,
    jdbc_url VARCHAR(500) NOT NULL,
    jdbc_username VARCHAR(100) NOT NULL,
    jdbc_password_secret_ref VARCHAR(255) NOT NULL,
    driver_class_name VARCHAR(200) DEFAULT 'org.postgresql.Driver' NOT NULL,
    schema_name VARCHAR(100) DEFAULT 'public' NOT NULL,
    pool_min_idle INTEGER DEFAULT 1 NOT NULL,
    pool_max_size INTEGER DEFAULT 5 NOT NULL,
    schema_version VARCHAR(50),
    provisioning_status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    last_health_checked_at TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_plan (
    plan_id BIGSERIAL PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    plan_nm VARCHAR(100) NOT NULL,
    plan_desc VARCHAR(500),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_plan_feature (
    plan_feature_id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    feature_code VARCHAR(100) NOT NULL,
    feature_nm VARCHAR(100) NOT NULL,
    feature_type VARCHAR(50),
    enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    limit_value INTEGER,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (plan_id, feature_code),
    FOREIGN KEY (plan_id) REFERENCES tb_plan(plan_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_plan_menu (
    plan_menu_id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    menu_code VARCHAR(50) NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (plan_id, menu_code),
    FOREIGN KEY (plan_id) REFERENCES tb_plan(plan_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_tenant_subscription (
    tenant_subscription_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    subscription_status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES tb_plan(plan_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tb_tenant_auth_token (
    tenant_auth_token_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    login_account_id BIGINT,
    tenant_code VARCHAR(50) NOT NULL,
    auth_token VARCHAR(255) UNIQUE NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_platform_menu (
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
    FOREIGN KEY (parent_menu_id) REFERENCES tb_platform_menu(menu_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_platform_role (
    role_id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_nm VARCHAR(100) NOT NULL,
    is_system_role CHAR(1) DEFAULT 'Y' NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_platform_permission (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_code VARCHAR(50) UNIQUE NOT NULL,
    permission_nm VARCHAR(100) NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_platform_login_account (
    login_id BIGSERIAL PRIMARY KEY,
    login_code VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_platform_user (
    user_id BIGSERIAL PRIMARY KEY,
    login_id BIGINT NOT NULL,
    user_nm VARCHAR(100) NOT NULL,
    email_addr VARCHAR(100),
    mobile_no VARCHAR(20),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (login_id) REFERENCES tb_platform_login_account(login_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_platform_login_account_role (
    login_account_role_id BIGSERIAL PRIMARY KEY,
    login_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (login_id, role_id),
    FOREIGN KEY (login_id) REFERENCES tb_platform_login_account(login_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES tb_platform_role(role_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_platform_role_menu_permission (
    role_menu_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    menu_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, menu_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES tb_platform_role(role_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES tb_platform_menu(menu_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES tb_platform_permission(permission_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_platform_login_history (
    login_history_id BIGSERIAL PRIMARY KEY,
    login_id BIGINT,
    role_id BIGINT,
    user_id BIGINT,
    login_code VARCHAR(50) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    user_nm VARCHAR(100) NOT NULL,
    login_dt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    login_ip VARCHAR(64),
    login_type VARCHAR(20),
    user_agent TEXT,
    login_result CHAR(1) NOT NULL CHECK (login_result IN ('Y', 'N')),
    fail_reason VARCHAR(500),
    logout_dt TIMESTAMP,
    session_time INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (login_id) REFERENCES tb_platform_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES tb_platform_role(role_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES tb_platform_user(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tb_schedulerconfig (
    scheduler_id BIGSERIAL PRIMARY KEY,
    scheduler_nm VARCHAR(100) NOT NULL,
    scheduler_desc VARCHAR(500),
    is_running CHAR(1) DEFAULT 'N' NOT NULL,
    cron_expression VARCHAR(100),
    next_run_time TIMESTAMP,
    last_run_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_domain_tenant_id ON tb_tenant_domain(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_database_tenant_id ON tb_tenant_database(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_database_db_key ON tb_tenant_database(db_key);
CREATE INDEX IF NOT EXISTS idx_tenant_subscription_tenant_id ON tb_tenant_subscription(tenant_id);

COMMIT;