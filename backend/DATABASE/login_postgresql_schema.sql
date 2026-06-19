CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- reset order (child -> parent)
DROP TABLE IF EXISTS tb_login_history CASCADE;
DROP TABLE IF EXISTS tb_role_menu_permission CASCADE;
DROP TABLE IF EXISTS tb_permission_type CASCADE;
DROP TABLE IF EXISTS tb_menu_info CASCADE;
DROP TABLE IF EXISTS tb_logininfo CASCADE;
DROP TABLE IF EXISTS tb_userinfo CASCADE;
DROP TABLE IF EXISTS tb_departmentinfo CASCADE;
DROP TABLE IF EXISTS tb_authorityinfo CASCADE;
DROP TABLE IF EXISTS tb_factoryinfo CASCADE;

-- tenant(master) table
CREATE TABLE tb_factoryinfo (
  factory_code VARCHAR(20) PRIMARY KEY,
  factory_nm VARCHAR(100) NOT NULL,
  tenant_code VARCHAR(50) NOT NULL UNIQUE,
  admin_email VARCHAR(200),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ix_tb_factoryinfo_use_at
  ON tb_factoryinfo(use_at);

-- authority(master) table
CREATE TABLE tb_authorityinfo (
  authority_code VARCHAR(50) PRIMARY KEY,
  authority_nm VARCHAR(100) NOT NULL,
  authority_dc VARCHAR(500),
  authority_level SMALLINT NOT NULL,
  tenant_scoped CHAR(1) NOT NULL DEFAULT 'Y' CHECK (tenant_scoped IN ('Y', 'N')),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ck_tb_authorityinfo_code CHECK (
    authority_code IN ('PLATFORM_ADMIN', 'TENANT_ADMIN', 'TENANT_USER')
  )
);

-- tenant department table
CREATE TABLE tb_departmentinfo (
  department_id VARCHAR(30) PRIMARY KEY,
  factory_code VARCHAR(20) NOT NULL,
  department_code VARCHAR(30) NOT NULL,
  department_nm VARCHAR(100) NOT NULL,
  department_dc VARCHAR(200),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_tb_departmentinfo_factory
    FOREIGN KEY (factory_code) REFERENCES tb_factoryinfo(factory_code)
);

CREATE UNIQUE INDEX ux_tb_departmentinfo_factory_department_code
  ON tb_departmentinfo(factory_code, department_code);

CREATE UNIQUE INDEX ux_tb_departmentinfo_department_id_factory_code
  ON tb_departmentinfo(department_id, factory_code);

CREATE INDEX ix_tb_departmentinfo_factory_code
  ON tb_departmentinfo(factory_code);

-- tenant employee table
CREATE TABLE tb_userinfo (
  user_id VARCHAR(50) PRIMARY KEY,
  esntl_id VARCHAR(50) NOT NULL UNIQUE,
  factory_code VARCHAR(20) NOT NULL,
  department_id VARCHAR(30) NOT NULL,
  user_nm VARCHAR(100) NOT NULL,
  email_adres VARCHAR(200),
  mobile_no VARCHAR(30),
  position_nm VARCHAR(100),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_tb_userinfo_factory
    FOREIGN KEY (factory_code) REFERENCES tb_factoryinfo(factory_code),
  CONSTRAINT fk_tb_userinfo_department
    FOREIGN KEY (department_id, factory_code)
    REFERENCES tb_departmentinfo(department_id, factory_code)
);

CREATE UNIQUE INDEX ux_tb_userinfo_user_id_factory_code
  ON tb_userinfo(user_id, factory_code);

CREATE INDEX ix_tb_userinfo_factory_code
  ON tb_userinfo(factory_code);

CREATE INDEX ix_tb_userinfo_department_id
  ON tb_userinfo(department_id);

-- login account table
CREATE TABLE tb_logininfo (
  login_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  factory_code VARCHAR(20) NOT NULL,
  authority_code VARCHAR(50) NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  password_algo VARCHAR(30) NOT NULL DEFAULT 'SHA256_BASE64',
  login_fail_count INTEGER NOT NULL DEFAULT 0,
  locked_at TIMESTAMP WITHOUT TIME ZONE,
  last_login_at TIMESTAMP WITHOUT TIME ZONE,
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_tb_logininfo_user
    FOREIGN KEY (user_id, factory_code)
    REFERENCES tb_userinfo(user_id, factory_code),
  CONSTRAINT fk_tb_logininfo_factory
    FOREIGN KEY (factory_code) REFERENCES tb_factoryinfo(factory_code),
  CONSTRAINT fk_tb_logininfo_authority
    FOREIGN KEY (authority_code) REFERENCES tb_authorityinfo(authority_code)
);

CREATE INDEX ix_tb_logininfo_authn
  ON tb_logininfo(login_id, factory_code, use_at);

CREATE INDEX ix_tb_logininfo_user_id
  ON tb_logininfo(user_id);

CREATE INDEX ix_tb_logininfo_authority_code
  ON tb_logininfo(authority_code);

-- login history table
CREATE TABLE tb_login_history (
  login_history_id BIGSERIAL PRIMARY KEY,
  factory_code VARCHAR(20) NOT NULL,
  login_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50),
  user_name VARCHAR(100),
  login_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  login_ip VARCHAR(64),
  login_type VARCHAR(20),
  user_agent TEXT,
  login_result CHAR(1) NOT NULL CHECK (login_result IN ('Y', 'N')),
  fail_reason VARCHAR(500),
  logout_dt TIMESTAMP WITHOUT TIME ZONE,
  session_time INTEGER,
  CONSTRAINT fk_tb_login_history_factory
    FOREIGN KEY (factory_code) REFERENCES tb_factoryinfo(factory_code),
  CONSTRAINT fk_tb_login_history_login
    FOREIGN KEY (login_id) REFERENCES tb_logininfo(login_id)
);

CREATE INDEX ix_tb_login_history_factory_login_dt
  ON tb_login_history(factory_code, login_dt DESC);

CREATE INDEX ix_tb_login_history_login_id
  ON tb_login_history(login_id);

CREATE INDEX ix_tb_login_history_result
  ON tb_login_history(login_result);

-- platform bootstrap tables
CREATE TABLE IF NOT EXISTS tb_permission_type (
  permission_id VARCHAR(50) PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS tb_menu_info (
  menu_id VARCHAR(50) PRIMARY KEY,
  menu_nm VARCHAR(100) NOT NULL,
  menu_dc VARCHAR(200),
  parent_menu_id VARCHAR(50),
  menu_ordr INTEGER NOT NULL DEFAULT 0,
  menu_url VARCHAR(200),
  icon_nm VARCHAR(100),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  crt_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  crt_id VARCHAR(50),
  upd_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  upd_id VARCHAR(50),
  CONSTRAINT fk_tb_menu_parent FOREIGN KEY (parent_menu_id) REFERENCES tb_menu_info(menu_id)
);

CREATE TABLE IF NOT EXISTS tb_role_menu_permission (
  rmp_id BIGSERIAL PRIMARY KEY,
  authority_code VARCHAR(50) NOT NULL,
  menu_id VARCHAR(50) NOT NULL,
  permission_id VARCHAR(50) NOT NULL,
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  crt_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  crt_id VARCHAR(50),
  upd_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  upd_id VARCHAR(50),
  CONSTRAINT fk_tb_rmp_authority FOREIGN KEY (authority_code) REFERENCES tb_authorityinfo(authority_code),
  CONSTRAINT fk_tb_rmp_menu FOREIGN KEY (menu_id) REFERENCES tb_menu_info(menu_id),
  CONSTRAINT fk_tb_rmp_permission FOREIGN KEY (permission_id) REFERENCES tb_permission_type(permission_id),
  CONSTRAINT uq_tb_rmp UNIQUE (authority_code, menu_id, permission_id)
);

INSERT INTO tb_authorityinfo (authority_code, authority_nm, authority_level, tenant_scoped)
VALUES
  ('PLATFORM_ADMIN', 'Platform administrator', 1, 'N'),
  ('TENANT_ADMIN', 'Tenant administrator', 50, 'Y'),
  ('TENANT_USER', 'Tenant user', 100, 'Y')
ON CONFLICT (authority_code) DO NOTHING;

INSERT INTO tb_permission_type (permission_id, permission_nm, permission_dc, permission_level, sort_ordr, crt_id, upd_id)
VALUES
  ('PERM_READ', '조회', '메뉴 조회 권한', 'read', 10, 'SYSTEM', 'SYSTEM'),
  ('PERM_WRITE', '등록/수정', '메뉴 등록/수정 권한', 'write', 20, 'SYSTEM', 'SYSTEM')
ON CONFLICT (permission_id) DO NOTHING;

INSERT INTO tb_menu_info (menu_id, menu_nm, menu_dc, parent_menu_id, menu_ordr, menu_url, icon_nm, crt_id, upd_id)
VALUES
  ('MENU_DASHBOARD', '대시보드', '플랫폼 운영 대시보드', NULL, 0, '/dashboard', 'dashboard', 'SYSTEM', 'SYSTEM'),
  ('MENU_PLATFORM_ROOT', '플랫폼 관리', '플랫폼 초기설정 루트', NULL, 1, '/platform', 'settings', 'SYSTEM', 'SYSTEM'),
  ('MENU_FACTORY', '업체 관리', '업체 등록 및 코드 부여', 'MENU_PLATFORM_ROOT', 10, '/onboarding', 'factory', 'SYSTEM', 'SYSTEM'),
  ('MENU_MENU', '메뉴 관리', '플랫폼 메뉴 관리', 'MENU_PLATFORM_ROOT', 20, '/platform/menus', 'menu', 'SYSTEM', 'SYSTEM'),
  ('MENU_PERMISSION', '권한 관리', '권한 마스터 관리', 'MENU_PLATFORM_ROOT', 30, '/platform/roles', 'shield', 'SYSTEM', 'SYSTEM')
ON CONFLICT (menu_id) DO NOTHING;

INSERT INTO tb_role_menu_permission (authority_code, menu_id, permission_id, crt_id, upd_id)
VALUES
  ('PLATFORM_ADMIN', 'MENU_DASHBOARD', 'PERM_WRITE', 'SYSTEM', 'SYSTEM'),
  ('PLATFORM_ADMIN', 'MENU_PLATFORM_ROOT', 'PERM_WRITE', 'SYSTEM', 'SYSTEM'),
  ('PLATFORM_ADMIN', 'MENU_FACTORY', 'PERM_WRITE', 'SYSTEM', 'SYSTEM'),
  ('PLATFORM_ADMIN', 'MENU_MENU', 'PERM_WRITE', 'SYSTEM', 'SYSTEM'),
  ('PLATFORM_ADMIN', 'MENU_PERMISSION', 'PERM_WRITE', 'SYSTEM', 'SYSTEM')
ON CONFLICT (authority_code, menu_id, permission_id) DO NOTHING;

INSERT INTO tb_factoryinfo (factory_code, factory_nm, tenant_code, admin_email)
VALUES
  ('PLATFORM', 'Platform HQ', 'PLATFORM', 'platform-admin@platform.local');

INSERT INTO tb_departmentinfo (department_id, factory_code, department_code, department_nm, department_dc)
VALUES
  ('DEPT_PLATFORM_ADMIN', 'PLATFORM', 'PLATFORM_ADMIN', 'Platform Admin Team', 'Platform operations');

INSERT INTO tb_userinfo (
  user_id,
  esntl_id,
  factory_code,
  department_id,
  user_nm,
  email_adres,
  position_nm
)
VALUES
  (
    'EMP_PLATFORM_ADMIN',
    'ESNTL_PLATFORM_ADMIN_0001',
    'PLATFORM',
    'DEPT_PLATFORM_ADMIN',
    'Platform Admin',
    'platform-admin@platform.local',
    'Platform Administrator'
  );

INSERT INTO tb_logininfo (
  login_id,
  user_id,
  factory_code,
  authority_code,
  password_hash
)
VALUES
  (
    'platform_admin',
    'EMP_PLATFORM_ADMIN',
    'PLATFORM',
    'PLATFORM_ADMIN',
    encode(digest(convert_to('platform_admin' || 'Passw0rd!', 'UTF8'), 'sha256'), 'base64')
  );

COMMIT;
