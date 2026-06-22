# tb_tenant 기반 스키마 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HACCP Cloud의 로그인/권한/테넌트 스키마를 `tb_tenant` 중심 구조로 재정의하고, 공용 마스터와 테넌트 종속 데이터를 분리한 PostgreSQL 초기화 스크립트를 만든다.

**Architecture:** `tb_tenant`, `tb_authority`, `tb_menu`, `tb_permission` 같은 공용 마스터를 대리키 PK + 비즈니스 코드 UNIQUE 구조로 만들고, `tb_department`, `tb_user`, `tb_login_account`, `tb_login_history`는 `tenant_id`를 FK로 참조하는 테넌트 종속 모델로 만든다. 권한-메뉴 매핑은 `tb_role_menu_permission`에서 숫자 FK만 사용하며, 초기 데이터는 seed insert로 다시 구성한다.

**Tech Stack:** PostgreSQL, SQL DDL, seed data, constraint/index design

---

### Task 1: tb_tenant 중심 DDL로 로그인/권한 스키마 재작성

**Files:**

- Modify: `backend/DATABASE/login_postgresql_schema.sql`

- [ ] **Step 1: 기존 `factory` 중심 테이블을 `tenant` 중심으로 치환한다**

```sql
CREATE TABLE tb_tenant (
  tenant_id BIGSERIAL PRIMARY KEY,
  tenant_code VARCHAR(50) NOT NULL UNIQUE,
  tenant_nm VARCHAR(100) NOT NULL,
  admin_email VARCHAR(200),
  corporate_number VARCHAR(50),
  business_type VARCHAR(100),
  business_category VARCHAR(100),
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: 공용 권한/메뉴/퍼미션 마스터를 대리키 구조로 재정의한다**

```sql
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
```

- [ ] **Step 3: 테넌트 종속 테이블에 `tenant_id` FK를 적용한다**

```sql
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
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id),
  CONSTRAINT uq_tb_department_tenant_code UNIQUE (tenant_id, department_code)
);
```

- [ ] **Step 4: 로그인 계정과 이력, 권한 매핑을 숫자 FK 기준으로 연결한다**

```sql
CREATE TABLE tb_login_account (
  login_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  authority_id BIGINT NOT NULL,
  login_code VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  password_algo VARCHAR(30) NOT NULL DEFAULT 'SHA256_BASE64',
  login_fail_count INTEGER NOT NULL DEFAULT 0,
  locked_at TIMESTAMP WITHOUT TIME ZONE,
  last_login_at TIMESTAMP WITHOUT TIME ZONE,
  use_at CHAR(1) NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y', 'N')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);
```

- [ ] **Step 5: seed 데이터와 인덱스를 새 이름/새 FK 기준으로 정리한다**

```sql
INSERT INTO tb_tenant (tenant_code, tenant_nm, admin_email)
VALUES ('PLATFORM', 'Platform HQ', 'platform-admin@platform.local');
```

- [ ] **Step 6: 파일 상단의 drop order와 하단의 bootstrap insert가 새 테이블명과 일치하는지 확인한다**

Run: inspect `backend/DATABASE/login_postgresql_schema.sql`
Expected: `tb_tenant` 기준으로 drop/create/insert 순서가 일관됨

### Task 2: 스키마 변경 결과의 정합성 점검

**Files:**

- Modify: `backend/DATABASE/login_postgresql_schema.sql`

- [ ] **Step 1: FK 참조가 모두 새 PK를 가리키는지 검토한다**

```sql
CONSTRAINT fk_tb_login_account_tenant FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id)
CONSTRAINT fk_tb_role_menu_permission_authority FOREIGN KEY (authority_id) REFERENCES tb_authority(authority_id)
```

- [ ] **Step 2: 중복 코드 방지를 위한 UNIQUE 제약을 검토한다**

```sql
UNIQUE (tenant_code)
UNIQUE (authority_code)
UNIQUE (menu_code)
UNIQUE (permission_code)
UNIQUE (tenant_id, department_code)
```

- [ ] **Step 3: 초기 seed 데이터가 플랫폼 관리자, 권한, 메뉴, 권한 매핑까지 복구하는지 확인한다**

Run: inspect seed inserts in `backend/DATABASE/login_postgresql_schema.sql`
Expected: 플랫폼 관리자 계정과 메뉴/권한 매핑이 새 키 구조로 다시 생성됨

- [ ] **Step 4: 변경 범위를 정리해 후속 백엔드 코드 수정 대상 목록을 확정한다**

Run: review references to `factory_code` and `authority_code` in backend source
Expected: 다음 작업에서 DTO, JWT, DAO, mapper 수정 범위가 확정됨
