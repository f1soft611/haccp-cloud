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
    tenant_nm VARCHAR(200) NOT NULL,
    admin_email VARCHAR(100) UNIQUE NOT NULL,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT
);

-- Tenant Domain Mapping (for domain-based login routing)
CREATE TABLE IF NOT EXISTS tb_tenant_domain (
    tenant_domain_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    email_domain VARCHAR(255) NOT NULL,
    is_primary CHAR(1) DEFAULT 'N' NOT NULL CHECK (is_primary IN ('Y', 'N')),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (email_domain),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);

-- Department/Organization
CREATE TABLE IF NOT EXISTS tb_department (
    department_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    department_nm VARCHAR(100) NOT NULL,
    parent_department_id BIGINT,
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
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
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
    tenant_id BIGINT NOT NULL,
    parent_menu_id BIGINT,
    menu_code VARCHAR(50),
    menu_nm VARCHAR(100) NOT NULL,
    menu_url VARCHAR(500),
    menu_order INT,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
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

-- Scheduler Config
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

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tenant_domain_tenant ON tb_tenant_domain(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domain_use_at ON tb_tenant_domain(use_at);

CREATE INDEX IF NOT EXISTS idx_tenant_department ON tb_department(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parent_department ON tb_department(parent_department_id);

CREATE INDEX IF NOT EXISTS idx_tenant_login_account ON tb_login_account(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_code ON tb_login_account(login_code);

CREATE INDEX IF NOT EXISTS idx_tenant_user ON tb_user(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_department ON tb_user(department_id);
CREATE INDEX IF NOT EXISTS idx_user_login_id ON tb_user(login_id);

CREATE INDEX IF NOT EXISTS idx_tenant_role ON tb_role(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_menu ON tb_menu(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_parent ON tb_menu(parent_menu_id);

CREATE INDEX IF NOT EXISTS idx_tenant_permission ON tb_permission(tenant_id);

CREATE INDEX IF NOT EXISTS idx_role_menu_permission_role ON tb_role_menu_permission(role_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_permission_menu ON tb_role_menu_permission(menu_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_permission_permission ON tb_role_menu_permission(permission_id);

CREATE INDEX IF NOT EXISTS idx_tenant_login_history ON tb_login_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_history_dt ON tb_login_history(login_dt DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_result ON tb_login_history(login_result);
CREATE INDEX IF NOT EXISTS idx_login_history_account ON tb_login_history(login_account_id);

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
