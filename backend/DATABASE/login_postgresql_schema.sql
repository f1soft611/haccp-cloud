CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS haccp_departments (
  group_id VARCHAR(20) PRIMARY KEY,
  group_code VARCHAR(30) NOT NULL,
  group_nm VARCHAR(60) NOT NULL,
  group_dc VARCHAR(200),
  use_at CHAR(1) DEFAULT 'Y',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_haccp_departments_group_code
  ON haccp_departments(group_code);

CREATE TABLE IF NOT EXISTS haccp_users (
  emplyr_id VARCHAR(50) PRIMARY KEY,
  esntl_id VARCHAR(50) NOT NULL UNIQUE,
  user_nm VARCHAR(100) NOT NULL,
  password VARCHAR(200) NOT NULL,
  ihidnum VARCHAR(200),
  email_adres VARCHAR(200),
  orgnzt_id VARCHAR(50),
  group_id VARCHAR(20) NOT NULL,
  use_at CHAR(1) DEFAULT 'Y',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  CONSTRAINT fk_haccp_users_group
    FOREIGN KEY (group_id) REFERENCES haccp_departments(group_id)
);

CREATE INDEX IF NOT EXISTS ix_haccp_users_group_id
  ON haccp_users(group_id);

CREATE INDEX IF NOT EXISTS ix_haccp_users_login
  ON haccp_users(emplyr_id, password);

CREATE TABLE IF NOT EXISTS haccp_login_history (
  login_history_id BIGSERIAL PRIMARY KEY,
  factory_code VARCHAR(20) NOT NULL DEFAULT '000001',
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100),
  login_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  login_ip VARCHAR(64),
  login_type VARCHAR(20),
  user_agent TEXT,
  login_result CHAR(1) NOT NULL CHECK (login_result IN ('Y', 'N')),
  fail_reason VARCHAR(500),
  logout_dt TIMESTAMP WITHOUT TIME ZONE,
  session_time INTEGER,
  gov_interface_yn CHAR(1) DEFAULT 'N' CHECK (gov_interface_yn IN ('Y', 'N')),
  gov_interface_dt TIMESTAMP WITHOUT TIME ZONE,
  gov_recptn_rslt_cd VARCHAR(20),
  gov_recptn_rslt VARCHAR(500),
  gov_recptn_rslt_dtl TEXT,
  gov_fail_reason TEXT,
  gov_request_json TEXT,
  gov_response_json TEXT
);

CREATE INDEX IF NOT EXISTS ix_login_history_factory_login_dt
  ON haccp_login_history(factory_code, login_dt DESC);

CREATE INDEX IF NOT EXISTS ix_login_history_user_id
  ON haccp_login_history(user_id);

CREATE INDEX IF NOT EXISTS ix_login_history_user_name
  ON haccp_login_history(user_name);

CREATE INDEX IF NOT EXISTS ix_login_history_result
  ON haccp_login_history(login_result);

CREATE INDEX IF NOT EXISTS ix_login_history_gov_pending
  ON haccp_login_history(gov_interface_yn, login_dt DESC);

CREATE OR REPLACE VIEW mes_login_history AS
SELECT *
FROM haccp_login_history;

CREATE TABLE IF NOT EXISTS SCHEDULER_CONFIG (
  SCHEDULER_ID       BIGSERIAL PRIMARY KEY,
  SCHEDULER_NAME     VARCHAR(100) NOT NULL,
  SCHEDULER_DESCRIPTION VARCHAR(500),
  CRON_EXPRESSION    VARCHAR(100) NOT NULL,
  JOB_CLASS_NAME     VARCHAR(200) NOT NULL,
  IS_ENABLED         CHAR(1) DEFAULT 'Y' CHECK (IS_ENABLED IN ('Y', 'N')),
  REG_DT             TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  REG_USER_ID        VARCHAR(50),
  UPD_DT             TIMESTAMP WITHOUT TIME ZONE,
  UPD_USER_ID        VARCHAR(50)
);

INSERT INTO haccp_departments (group_id, group_code, group_nm, group_dc)
VALUES ('GRP_ADMIN', 'ADMIN', 'ROLE_ADMIN', '플랫폼 관리자 그룹')
ON CONFLICT (group_id) DO UPDATE
SET group_code = EXCLUDED.group_code,
    group_nm = EXCLUDED.group_nm,
    group_dc = EXCLUDED.group_dc,
    updated_at = now();

INSERT INTO haccp_users (
  emplyr_id,
  esntl_id,
  user_nm,
  password,
  email_adres,
  orgnzt_id,
  group_id
)
VALUES (
  'platform_admin',
  'PLATFORM_ADMIN_0001',
  '플랫폼관리자',
  encode(digest(convert_to('platform_admin' || 'Passw0rd!', 'UTF8'), 'sha256'), 'base64'),
  'platform-admin@haccp.local',
  'ORG_PLATFORM',
  'GRP_ADMIN'
)
ON CONFLICT (emplyr_id) DO UPDATE
SET esntl_id = EXCLUDED.esntl_id,
    user_nm = EXCLUDED.user_nm,
    password = EXCLUDED.password,
    email_adres = EXCLUDED.email_adres,
    orgnzt_id = EXCLUDED.orgnzt_id,
    group_id = EXCLUDED.group_id,
    updated_at = now();
