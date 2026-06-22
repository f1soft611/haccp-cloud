CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- reset order (child -> parent)
DROP TABLE IF EXISTS tb_login_history CASCADE;
DROP TABLE IF EXISTS tb_login_account CASCADE;
DROP TABLE IF EXISTS tb_role_menu_permission CASCADE;
DROP TABLE IF EXISTS tb_permission CASCADE;
DROP TABLE IF EXISTS tb_menu CASCADE;
DROP TABLE IF EXISTS tb_user CASCADE;
DROP TABLE IF EXISTS tb_department CASCADE;
DROP TABLE IF EXISTS tb_authority CASCADE;
DROP TABLE IF EXISTS tb_tenant CASCADE;

-- tenant(master) table
CREATE TABLE tb_tenant (
  tenant_id BIGSERIAL PRIMARY KEY,
  tenant_code VARCHAR(50) NOT NULL UNIQUE,
  tenant_nm VARCHAR(100) NOT NULL,
  admin_email VARCHAR(200),
  corporate_number VARCHAR(50),
  business_type VARCHAR(100),
  business_category VARCHAR(100),
  onboarding_status VARCHAR(50) NOT NULL DEFAULT 'EMAIL_QUEUED',
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ix_tb_tenant_use_at
  ON tb_tenant(use_at);

-- authority(master) table
CREATE TABLE tb_authority (
  authority_id BIGSERIAL PRIMARY KEY,
  authority_code VARCHAR(50) NOT NULL UNIQUE,
  authority_nm VARCHAR(100) NOT NULL,
  authority_dc VARCHAR(500),
  authority_level SMALLINT NOT NULL,
  tenant_scoped CHAR(1) NOT NULL DEFAULT 'Y' CHECK (tenant_scoped IN ('Y', 'N')),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ix_tb_authority_use_at
  ON tb_authority(use_at);

-- permission(master) table
CREATE TABLE tb_permission (
  permission_id BIGSERIAL PRIMARY KEY,
  permission_code VARCHAR(50) NOT NULL UNIQUE,
  permission_nm VARCHAR(100) NOT NULL,
  permission_dc VARCHAR(200),
  permission_level VARCHAR(20) NOT NULL,
  sort_ordr INTEGER NOT NULL DEFAULT 0,
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  crt_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  crt_id VARCHAR(50),
  upd_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  upd_id VARCHAR(50)
);

CREATE INDEX ix_tb_permission_use_at
  ON tb_permission(use_at);

-- menu(master) table
CREATE TABLE tb_menu (
  menu_id BIGSERIAL PRIMARY KEY,
  menu_code VARCHAR(50) NOT NULL UNIQUE,
  menu_nm VARCHAR(100) NOT NULL,
  menu_dc VARCHAR(200),
  parent_menu_id BIGINT,
  menu_ordr INTEGER NOT NULL DEFAULT 0,
  menu_url VARCHAR(200),
  icon_nm VARCHAR(100),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  crt_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  crt_id VARCHAR(50),
  upd_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  upd_id VARCHAR(50),
  CONSTRAINT fk_tb_menu_parent FOREIGN KEY (parent_menu_id) REFERENCES tb_menu(menu_id)
);

CREATE INDEX ix_tb_menu_use_at
  ON tb_menu(use_at);

CREATE INDEX ix_tb_menu_parent_menu_id
  ON tb_menu(parent_menu_id);

-- mapping table
CREATE TABLE tb_role_menu_permission (
  rmp_id BIGSERIAL PRIMARY KEY,
  authority_id BIGINT NOT NULL,
  menu_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  crt_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  crt_id VARCHAR(50),
  upd_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  upd_id VARCHAR(50),
  CONSTRAINT fk_tb_rmp_authority FOREIGN KEY (authority_id) REFERENCES tb_authority(authority_id),
  CONSTRAINT fk_tb_rmp_menu FOREIGN KEY (menu_id) REFERENCES tb_menu(menu_id),
  CONSTRAINT fk_tb_rmp_permission FOREIGN KEY (permission_id) REFERENCES tb_permission(permission_id),
  CONSTRAINT uq_tb_rmp UNIQUE (authority_id, menu_id, permission_id)
);

CREATE INDEX ix_tb_rmp_authority_id
  ON tb_role_menu_permission(authority_id);

CREATE INDEX ix_tb_rmp_menu_id
  ON tb_role_menu_permission(menu_id);

CREATE INDEX ix_tb_rmp_permission_id
  ON tb_role_menu_permission(permission_id);

-- tenant department table
CREATE TABLE tb_department (
  department_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  department_code VARCHAR(30) NOT NULL,
  department_nm VARCHAR(100) NOT NULL,
  department_dc VARCHAR(200),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_tb_department_tenant
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT uq_tb_department_tenant_code UNIQUE (tenant_id, department_code)
);

CREATE INDEX ix_tb_department_tenant_id
  ON tb_department(tenant_id);

CREATE INDEX ix_tb_department_use_at
  ON tb_department(use_at);

-- tenant user table
CREATE TABLE tb_user (
  user_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  department_id BIGINT NOT NULL,
  user_code VARCHAR(50) NOT NULL,
  user_nm VARCHAR(100) NOT NULL,
  email_adres VARCHAR(200),
  mobile_no VARCHAR(30),
  position_nm VARCHAR(100),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_tb_user_tenant
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT fk_tb_user_department
    FOREIGN KEY (department_id) REFERENCES tb_department(department_id),
  CONSTRAINT uq_tb_user_tenant_code UNIQUE (tenant_id, user_code)
);

CREATE INDEX ix_tb_user_tenant_id
  ON tb_user(tenant_id);

CREATE INDEX ix_tb_user_department_id
  ON tb_user(department_id);

CREATE INDEX ix_tb_user_use_at
  ON tb_user(use_at);

-- login account table
CREATE TABLE tb_login_account (
  login_account_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL UNIQUE,
  login_code VARCHAR(50) NOT NULL,
  authority_id BIGINT NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  password_algo VARCHAR(30) NOT NULL DEFAULT 'SHA256_BASE64',
  login_fail_count INTEGER NOT NULL DEFAULT 0,
  locked_at TIMESTAMP WITHOUT TIME ZONE,
  last_login_at TIMESTAMP WITHOUT TIME ZONE,
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_tb_login_account_tenant
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT fk_tb_login_account_user
    FOREIGN KEY (user_id) REFERENCES tb_user(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_tb_login_account_authority
    FOREIGN KEY (authority_id) REFERENCES tb_authority(authority_id),
  CONSTRAINT uq_tb_login_account_tenant_code UNIQUE (tenant_id, login_code)
);

CREATE INDEX ix_tb_login_account_tenant_id
  ON tb_login_account(tenant_id);

CREATE INDEX ix_tb_login_account_authority_id
  ON tb_login_account(authority_id);

CREATE INDEX ix_tb_login_account_use_at
  ON tb_login_account(use_at);

-- login history table
CREATE TABLE tb_login_history (
  login_history_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  login_account_id BIGINT,
  authority_id BIGINT,
  user_id BIGINT,
  login_code VARCHAR(50) NOT NULL,
  authority_code VARCHAR(50) NOT NULL,
  user_code VARCHAR(50),
  user_name VARCHAR(100) NOT NULL,
  login_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  login_ip VARCHAR(64),
  login_type VARCHAR(20),
  user_agent TEXT,
  login_result CHAR(1) NOT NULL CHECK (login_result IN ('Y', 'N')),
  fail_reason VARCHAR(500),
  logout_dt TIMESTAMP WITHOUT TIME ZONE,
  session_time INTEGER,
  CONSTRAINT fk_tb_login_history_tenant
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
  CONSTRAINT fk_tb_login_history_account
    FOREIGN KEY (login_account_id) REFERENCES tb_login_account(login_account_id) ON DELETE SET NULL,
  CONSTRAINT fk_tb_login_history_authority
    FOREIGN KEY (authority_id) REFERENCES tb_authority(authority_id) ON DELETE SET NULL,
  CONSTRAINT fk_tb_login_history_user
    FOREIGN KEY (user_id) REFERENCES tb_user(user_id) ON DELETE SET NULL
);

CREATE INDEX ix_tb_login_history_tenant_login_dt
  ON tb_login_history(tenant_id, login_dt DESC);

CREATE INDEX ix_tb_login_history_login_account_id
  ON tb_login_history(login_account_id);

CREATE INDEX ix_tb_login_history_result
  ON tb_login_history(login_result);

-- seed data
INSERT INTO tb_tenant (tenant_code, tenant_nm, admin_email)
VALUES
  ('PLATFORM', 'Platform HQ', 'platform-admin@platform.local');

INSERT INTO tb_authority (authority_code, authority_nm, authority_dc, authority_level, tenant_scoped)
VALUES
  ('PLATFORM_ADMIN', 'Platform administrator', 'Platform-wide administrator role', 1, 'N'),
  ('TENANT_ADMIN', 'Tenant administrator', 'Tenant administrator role', 50, 'Y'),
  ('TENANT_USER', 'Tenant user', 'Tenant user role', 100, 'Y');

INSERT INTO tb_permission (permission_code, permission_nm, permission_dc, permission_level, sort_ordr, crt_id, upd_id)
VALUES
  ('PERM_READ', '조회', 'Menu read permission', 'read', 10, 'SYSTEM', 'SYSTEM'),
  ('PERM_WRITE', '등록/수정', 'Menu write permission', 'write', 20, 'SYSTEM', 'SYSTEM');

INSERT INTO tb_menu (menu_code, menu_nm, menu_dc, parent_menu_id, menu_ordr, menu_url, icon_nm, crt_id, upd_id)
VALUES
  ('MENU_DASHBOARD', '대시보드', '플랫폼 운영 대시보드', NULL, 0, '/dashboard', 'dashboard', 'SYSTEM', 'SYSTEM'),
  ('MENU_PLATFORM_ROOT', '플랫폼 관리', '플랫폼 초기설정 루트', NULL, 1, '/platform', 'settings', 'SYSTEM', 'SYSTEM');

INSERT INTO tb_menu (menu_code, menu_nm, menu_dc, parent_menu_id, menu_ordr, menu_url, icon_nm, crt_id, upd_id)
SELECT
  'MENU_TENANT_MANAGEMENT',
  '테넌트 관리',
  '테넌트 등록 및 관리',
  parent.menu_id,
  10,
  '/platform/tenants',
  'factory',
  'SYSTEM',
  'SYSTEM'
FROM tb_menu parent
WHERE parent.menu_code = 'MENU_PLATFORM_ROOT';

INSERT INTO tb_menu (menu_code, menu_nm, menu_dc, parent_menu_id, menu_ordr, menu_url, icon_nm, crt_id, upd_id)
SELECT
  'MENU_MENU_MANAGEMENT',
  '메뉴 관리',
  '플랫폼 메뉴 관리',
  parent.menu_id,
  20,
  '/platform/menus',
  'menu',
  'SYSTEM',
  'SYSTEM'
FROM tb_menu parent
WHERE parent.menu_code = 'MENU_PLATFORM_ROOT';

INSERT INTO tb_menu (menu_code, menu_nm, menu_dc, parent_menu_id, menu_ordr, menu_url, icon_nm, crt_id, upd_id)
SELECT
  'MENU_AUTHORITY_MANAGEMENT',
  '권한 관리',
  '권한 마스터 관리',
  parent.menu_id,
  30,
  '/platform/roles',
  'shield',
  'SYSTEM',
  'SYSTEM'
FROM tb_menu parent
WHERE parent.menu_code = 'MENU_PLATFORM_ROOT';

INSERT INTO tb_role_menu_permission (authority_id, menu_id, permission_id, crt_id, upd_id)
SELECT a.authority_id, m.menu_id, p.permission_id, 'SYSTEM', 'SYSTEM'
FROM tb_authority a
JOIN tb_permission p ON p.permission_code = 'PERM_WRITE'
JOIN tb_menu m ON m.menu_code IN (
  'MENU_DASHBOARD',
  'MENU_PLATFORM_ROOT',
  'MENU_TENANT_MANAGEMENT',
  'MENU_MENU_MANAGEMENT',
  'MENU_AUTHORITY_MANAGEMENT'
)
WHERE a.authority_code = 'PLATFORM_ADMIN';

INSERT INTO tb_department (tenant_id, department_code, department_nm, department_dc)
SELECT tenant_id, 'DEPT_PLATFORM_ADMIN', 'Platform Admin Team', 'Platform operations'
FROM tb_tenant
WHERE tenant_code = 'PLATFORM';

INSERT INTO tb_user (
  tenant_id,
  department_id,
  user_code,
  user_nm,
  email_adres,
  position_nm
)
SELECT
  t.tenant_id,
  d.department_id,
  'EMP_PLATFORM_ADMIN',
  'Platform Admin',
  'platform-admin@platform.local',
  'Platform Administrator'
FROM tb_tenant t
JOIN tb_department d
  ON d.tenant_id = t.tenant_id
 AND d.department_code = 'DEPT_PLATFORM_ADMIN'
WHERE t.tenant_code = 'PLATFORM';

INSERT INTO tb_login_account (
  tenant_id,
  user_id,
  login_code,
  authority_id,
  password_hash
)
SELECT
  t.tenant_id,
  u.user_id,
  'platform_admin',
  a.authority_id,
  encode(digest(convert_to('platform_admin' || 'Passw0rd!', 'UTF8'), 'sha256'), 'base64')
FROM tb_tenant t
JOIN tb_user u
  ON u.tenant_id = t.tenant_id
 AND u.user_code = 'EMP_PLATFORM_ADMIN'
JOIN tb_authority a
  ON a.authority_code = 'PLATFORM_ADMIN'
WHERE t.tenant_code = 'PLATFORM';

COMMIT;
