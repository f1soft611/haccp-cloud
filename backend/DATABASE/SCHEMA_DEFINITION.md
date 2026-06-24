# HACCP Cloud 데이터베이스 스키마

**최종 업데이트**: 2026-06-23  
**상태**: 현행(Active)  
**DB 엔진**: PostgreSQL 12+, MySQL 8+

---

## 목차

- [1. 개요](#1-개요)
- [2. 핵심 엔티티](#2-핵심-엔티티)
- [3. 권한/메뉴](#3-권한메뉴)
- [4. 로그/설정](#4-로그설정)
- [5. 관계도](#5-관계도)

---

## 1. 개요

### 테이블 구성 (12개)

| 계층           | 테이블                                         | 용도                      |
| -------------- | ---------------------------------------------- | ------------------------- |
| **다중테넌트** | tb_tenant                                      | 업체/테넌트 기본정보      |
| **조직**       | tb_department                                  | 부서                      |
| **인증**       | tb_login_account, tb_user                      | 로그인 계정, 사용자 정보  |
| **권한**       | tb_authority, tb_role                          | 권한, 역할                |
| **매핑**       | tb_login_account_role, tb_role_menu_permission | 계정-역할, 역할-메뉴 매핑 |
| **메뉴**       | tb_menu, tb_permission                         | 메뉴, 권한 작업           |
| **기록**       | tb_login_history                               | 로그인 이력               |
| **설정**       | tb_schedulerconfig                             | 스케줄러 설정             |

---

## 2. 핵심 엔티티

### 2.1 tb_tenant (테넌트/업체)

```sql
CREATE TABLE tb_tenant (
    tenant_id BIGSERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) UNIQUE NOT NULL COMMENT '테넌트 코드',
    tenant_nm VARCHAR(200) NOT NULL COMMENT '테넌트명',
    admin_email VARCHAR(100) UNIQUE NOT NULL COMMENT '관리자 이메일',
    use_at CHAR(1) DEFAULT 'Y' NOT NULL COMMENT '사용 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,

    UNIQUE INDEX uk_tenant_code (tenant_code),
    UNIQUE INDEX uk_admin_email (admin_email),
    INDEX idx_use_at (use_at)
);
```

**설명:**

- 모든 데이터는 tenant_id를 기준으로 분리 (멀티테넌트 격리)
- admin_email: 도메인 부분으로 테넌트 자동 식별 가능

---

### 2.2 tb_department (부서)

```sql
CREATE TABLE tb_department (
    department_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    department_nm VARCHAR(100) NOT NULL COMMENT '부서명',
    parent_department_id BIGINT COMMENT '상위 부서',
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_department_id) REFERENCES tb_department(department_id) ON DELETE SET NULL,
    INDEX idx_tenant_department (tenant_id),
    INDEX idx_parent_department (parent_department_id)
);
```

---

### 2.3 tb_login_account (로그인 계정)

```sql
CREATE TABLE tb_login_account (
    login_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    login_code VARCHAR(100) NOT NULL COMMENT '로그인 ID',
    password_hash VARCHAR(255) NOT NULL COMMENT 'BCrypt 해시',
    login_attempt_count INT DEFAULT 0 COMMENT '로그인 실패 횟수',
    locked_at TIMESTAMP COMMENT '계정 잠금 시간',
    password_changed_at TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_login_code (tenant_id, login_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    INDEX idx_login_code (login_code)
);
```

**핵심:**

- (tenant_id, login_code) 복합 유니크: 테넌트별로 login_code 중복 불가
- password_hash: BCrypt로 인코딩된 비밀번호만 저장

---

### 2.4 tb_user (사용자)

```sql
CREATE TABLE tb_user (
    user_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    login_id BIGINT COMMENT '로그인 계정 ID',
    user_nm VARCHAR(100) NOT NULL COMMENT '사용자명',
    email_addr VARCHAR(100) COMMENT '이메일',
    department_id BIGINT COMMENT '부서 ID',
    mobile_no VARCHAR(20),
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_email (tenant_id, email_addr),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES tb_department(department_id) ON DELETE SET NULL,
    INDEX idx_tenant_user (tenant_id)
);
```

**설명:**

- login_id: 선택사항 (모든 사용자가 로그인할 필요는 없음)
- email_addr: 테넌트 내에서만 유일

---

## 3. 권한/메뉴

### 3.1 tb_authority (권한)

```sql
CREATE TABLE tb_authority (
    authority_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    authority_code VARCHAR(50) NOT NULL COMMENT '권한 코드 (ADMIN, USER 등)',
    authority_nm VARCHAR(100) NOT NULL COMMENT '권한명',
    authority_dc VARCHAR(500) COMMENT '권한 설명',
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_authority_code (tenant_id, authority_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    INDEX idx_authority_code (authority_code)
);
```

---

### 3.2 tb_role (역할)

```sql
CREATE TABLE tb_role (
    role_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    role_code VARCHAR(50) NOT NULL COMMENT '역할 코드',
    role_nm VARCHAR(100) NOT NULL COMMENT '역할명',
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_role_code (tenant_id, role_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);
```

---

### 3.3 tb_login_account_role (계정-역할 매핑)

```sql
CREATE TABLE tb_login_account_role (
    login_account_role_id BIGSERIAL PRIMARY KEY,
    login_id BIGINT NOT NULL COMMENT '로그인 계정 ID',
    role_id BIGINT NOT NULL COMMENT '역할 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_login_role (login_id, role_id),
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE CASCADE
);
```

---

### 3.4 tb_menu (메뉴)

```sql
CREATE TABLE tb_menu (
    menu_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    parent_menu_id BIGINT COMMENT '상위 메뉴 ID',
    menu_code VARCHAR(50) COMMENT '메뉴 코드',
    menu_nm VARCHAR(100) NOT NULL COMMENT '메뉴명',
    menu_url VARCHAR(500) COMMENT '메뉴 URL',
    menu_order INT COMMENT '메뉴 순서',
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_menu_id) REFERENCES tb_menu(menu_id) ON DELETE CASCADE,
    INDEX idx_tenant_menu (tenant_id, parent_menu_id)
);
```

---

### 3.5 tb_permission (권한 작업)

```sql
CREATE TABLE tb_permission (
    permission_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    permission_code VARCHAR(50) NOT NULL COMMENT '권한 코드 (VIEW, CREATE, UPDATE, DELETE)',
    permission_nm VARCHAR(100) NOT NULL COMMENT '권한명',
    use_at CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_permission_code (tenant_id, permission_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);
```

---

### 3.6 tb_role_menu_permission (역할-메뉴 권한 매핑)

```sql
CREATE TABLE tb_role_menu_permission (
    role_menu_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL COMMENT '역할 ID',
    menu_id BIGINT NOT NULL COMMENT '메뉴 ID',
    permission_id BIGINT NOT NULL COMMENT '권한 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_role_menu_permission (role_id, menu_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES tb_menu(menu_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES tb_permission(permission_id) ON DELETE CASCADE
);
```

---

## 4. 로그/설정

### 4.1 tb_login_history (로그인 이력)

```sql
CREATE TABLE tb_login_history (
    login_history_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    login_account_id BIGINT COMMENT '로그인 계정 ID',
    authority_id BIGINT COMMENT '권한 ID',
    user_id BIGINT COMMENT '사용자 ID',
    login_code VARCHAR(50) NOT NULL COMMENT '로그인 코드',
    authority_code VARCHAR(50) NOT NULL COMMENT '권한 코드',
    user_code VARCHAR(50) COMMENT '사용자 코드',
    user_nm VARCHAR(100) NOT NULL COMMENT '사용자명',
    login_dt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '로그인 시간',
    login_ip VARCHAR(64) COMMENT '로그인 IP',
    login_type VARCHAR(20) COMMENT '로그인 타입',
    user_agent TEXT COMMENT 'User Agent',
    login_result CHAR(1) NOT NULL CHECK (login_result IN ('Y', 'N')) COMMENT '로그인 결과',
    fail_reason VARCHAR(500) COMMENT '실패 사유',
    logout_dt TIMESTAMP COMMENT '로그아웃 시간',
    session_time INT COMMENT '세션 지속시간 (분)',

    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (login_account_id) REFERENCES tb_login_account(login_id) ON DELETE SET NULL,
    FOREIGN KEY (authority_id) REFERENCES tb_authority(authority_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES tb_user(user_id) ON DELETE SET NULL,
    INDEX idx_tenant_login_dt (tenant_id, login_dt DESC),
    INDEX idx_login_result (login_result)
);
```

---

### 4.2 tb_schedulerconfig (스케줄러 설정)

```sql
CREATE TABLE tb_schedulerconfig (
    scheduler_id BIGSERIAL PRIMARY KEY,
    scheduler_nm VARCHAR(100) NOT NULL COMMENT '스케줄러명',
    scheduler_desc VARCHAR(500) COMMENT '설명',
    is_running CHAR(1) DEFAULT 'N' NOT NULL COMMENT '실행 여부',
    cron_expression VARCHAR(100) COMMENT 'Cron 표현식',
    next_run_time TIMESTAMP COMMENT '다음 실행시간',
    last_run_time TIMESTAMP COMMENT '마지막 실행시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_is_running (is_running)
);
```

---

## 5. 관계도

```
tb_tenant (업체)
├── tb_department (부서)
│   └── tb_user (사용자)
│       └── tb_login_account (로그인 계정)
│           ├── tb_login_account_role
│           │   └── tb_role (역할)
│           │       └── tb_role_menu_permission
│           │           ├── tb_menu (메뉴)
│           │           └── tb_permission (권한)
│           └── tb_login_history (로그인 이력)
├── tb_authority (권한)
└── tb_schedulerconfig (스케줄러 설정)
```

---

## 6. 주요 제약사항

### 멀티테넌트 격리

- 모든 운영 테이블에 `tenant_id` 필드 필수
- 모든 쿼리에 `WHERE tenant_id = #{tenantId}` 조건 필수
- 테넌트 간 데이터 교차 참조 불가 (FK로 방지)

### 로그인 계정

- (tenant_id, login_code) 복합 유니크로 테넌트 내 유일성 보장
- 비밀번호는 BCrypt로만 저장 (평문 저장 금지)
- 계정 잠금은 login_attempt_count >= 5 시 자동 적용

### 메뉴/권한

- 역할-메뉴-권한을 3개 엔티티로 분리하여 유연성 제공
- 역할별 메뉴별 권한 세밀 제어 가능

---

## 7. 인덱스 전략

**성능 최적화를 위한 인덱스:**

- `tb_tenant.uk_tenant_code`, `uk_admin_email`: 유니크 검색
- `tb_login_account.uk_tenant_login_code`: 로그인 조건 검색
- `tb_login_history.idx_tenant_login_dt`: 로그인 이력 시간순 조회
- `tb_menu.idx_tenant_menu`: 메뉴 계층 조회

---

## 8. 데이터 마이그레이션 체크리스트

✓ 실사용 테이블만 유지 (12개)  
✓ 레거시 테이블 제거 완료 (8개: tb_factoryinfo, tb_departmentinfo, tb_userinfo, tb_authorityinfo, tb_logininfo, tb_menu_info, tb_permission_type, tb_loginhistory)  
✓ 모든 FK 무결성 검증 완료  
✓ 테넌트별 데이터 격리 확인 완료

---

**문서 버전**: 1.0  
**DB 호환성**: PostgreSQL 12+, MySQL 8+  
**마지막 검증**: 2026-06-23
