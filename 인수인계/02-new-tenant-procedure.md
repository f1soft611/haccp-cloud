# 02. 신규 테넌트 생성 절차

## 1. 생성 흐름 개요

신규 테넌트 생성 절차는 `PlatformTenantServiceImpl.registerTenant()`에서 수행됩니다.

실제 처리 순서는 아래와 같습니다.

1. 요청 검증
2. 사업자번호/법인번호 중복 검증
3. `tb_tenant` 생성
4. `tb_tenant_database` 메타 데이터 생성
5. 실제 tenant DB 생성 및 스키마 적용
6. 플랜별 메뉴 코드 반영
7. 구독 정보 등록
8. 온보딩 이메일/인증 절차 진행

---

## 2. 코드상 처리 단계

### 2-1. 요청 검증

`PlatformTenantServiceImpl.registerTenant()` 내부에서 다음을 검증합니다.

- 필수 값 확인
- 사업자번호/법인번호 형식 확인
- 중복 테넌트 존재 여부 확인
- 플랫폼에 이미 활성된 사업자번호/법인번호 중복 방지

중복 검사 로직:

- `selectActiveTenantCountByCorporateNumber()`
- `selectActiveTenantCountByBusinessRegistrationNumber()`

중복이면 예외를 발생시키고 생성은 중단됩니다.

### 2-2. 테넌트 기본 정보 저장

다음 정보가 `tb_tenant`에 insert됩니다.

- `tenant_code`
- `tenant_nm`
- `admin_email`
- `business_registration_number`
- `corporate_number`
- `business_type`
- `business_category`
- `registration_date`

`tenant_code`는 보통 사업자번호를 기준으로 생성됩니다.

예시:

- 사업자번호 `1234567890` → `tenant_code = 1234567890`
- DB명은 `tenant_1234567890`로 생성

### 2-3. 테넌트 DB 메타 저장

다음 서비스 메서드가 동작합니다.

- `tenantInfoDAO.insertTenantDatabase(existingTenantId, tenantCode, tenantDbName, "public")`

이때 `tb_tenant_database`에 아래 값이 저장됩니다.

- `tenant_id`
- `db_key`
- `db_name`
- `jdbc_url`
- `jdbc_username`
- `jdbc_password_secret_ref`
- `provisioning_status`

### 2-4. 실제 tenant DB 생성

`TenantDatabaseProvisioningServiceImpl.provisionNewTenantDatabase()`가 실제 DB를 만듭니다.

처리 순서:

1. 메인 PostgreSQL 연결 (`postgres` DB 기준)
2. `CREATE DATABASE "tenant_xxx"` 실행
3. 해당 DB에 연결
4. `CREATE SCHEMA IF NOT EXISTS "public"` 또는 지정 schema 생성
5. 초기 스키마 스크립트 실행
6. 부트스트랩 SQL 실행
7. 선택적 마이그레이션 스크립트 실행

실행되는 대표 SQL 파일:

- `backend/DATABASE/create_postgresql_schema_active_tables.sql`
- `backend/DATABASE/bootstrap_postgresql_tenant.sql`
- 추가 마이그레이션 파일 예시:
  - `migrate_postgresql_add_document_attachment_tables.sql`
  - `migrate_postgresql_add_drafting_work_category_tables.sql`
  - `migrate_postgresql_add_electronic_approval_tables.sql`
  - `migrate_postgresql_add_electronic_approval_comment_likes.sql`

### 2-5. 플랜 메뉴 반영

플랜 기반 접근 제어가 있어, 신규 테넌트 생성 시 플랜에 연결된 메뉴를 tenant DB에 복제합니다.

처리:

- `resolvePlanMenuCodes(planCode)`
- `planAccessDAO.selectPlanMenuCodes(planCode)`
- `bootstrap_postgresql_tenant.sql` 내부에서 `tb_menu`, `tb_role`, `tb_permission` 생성/적재

이 단계가 끝나면 테넌트별 기본 메뉴/권한 구조가 생성됩니다.

### 2-6. 구독 정보 등록

`tenantInfoDAO.insertActiveTenantSubscriptionByPlanCode()`가 동작합니다.

저장 대상:

- `tb_tenant_subscription`

필수 값:

- `tenant_id`
- `plan_id`
- `subscription_status`
- `starts_at`
- `ends_at`
- `auto_renew`

### 2-7. 온보딩 과정

`TenantOnboardingServiceImpl`은 인증 메일 및 초기 관리자 계정 생성 흐름을 담당합니다.

처리 단계:

1. 테넌트 존재 여부 확인
2. 인증 토큰 생성
3. `tb_tenant_auth_token` 저장
4. 관리자 이메일 발송
5. 로그인 계정 부트스트랩 생성
6. 관리자 사용자 정보 생성/업데이트

핵심 메서드:

- `createAndSendVerificationEmail()`
- `dispatchVerificationEmail()`
- `ensureBootstrapLoginAccountWithCode()`

---

## 3. 신규 테넌트 생성 시 주의점

1. 실제 `tenant_db`는 DB를 생성한 뒤 SQL로 스키마를 채워 넣기 때문에, DB가 없으면 `provisionNewTenantDatabase()`가 반드시 수행되어야 함
2. `tb_tenant_database`의 `provisioning_status`가 `ACTIVE`가 아니라면 운영 중 기능에 문제가 생길 수 있음
3. 신규 테넌트 생성 시 플랜 메뉴 코드가 실제 `tb_menu`에 반영되어야만 화면 접근 가능
4. 도메인 확인이 필요한 요청은 `tb_tenant_domain` 정보가 선행되어야 함
5. 온보딩 완료 전 관리자 계정이 생성되지 않으면 이메일 인증 흐름이 실패할 수 있음

---

## 4. 운영 체크 포인트

신규 테넌트 생성 직후 아래 항목을 꼭 확인합니다.

- `tb_tenant`에 row 생성 여부
- `tb_tenant_database`에 `db_name`, `db_key`, `provisioning_status` 확인
- 실제 PostgreSQL에 tenant DB 존재 여부
- `tb_menu`/`tb_role`/`tb_permission` 초기값 반영 여부
- `tb_tenant_subscription` 상태 확인
- 온보딩 이메일 발송 여부

---

## 5. 실무 메모

이 프로젝트는 단순 테넌트 row 추가만으로 끝나지 않고, 실제로는 다음이 함께 일어납니다.

- 실제 PostgreSQL DB 생성
- 스키마 SQL 실행
- 플랜 기반 기본 메뉴 생성
- 도메인/DB 라우팅 등록
- 관리자 인증 메일 및 관리자 계정 생성

따라서 신규 테넌트 생성은 하나의 단일 API가 아니라, DB 프로비저닝 + 권한 세팅 + 온보딩 흐름이 묶인 작업이라는 점을 기억해야 합니다.
