# 01. DB 스키마 상세 정리

## 1. 운영 DB 구조

실제 PostgreSQL 서버에서 확인된 DB 목록:

- `haccp_cloud_central` : 중앙 플랫폼 메타DB
- `tenant_2133453253` : 운영 테넌트 DB 예시
- `tenant_4587230498` : 추가 테넌트 DB 예시
- `haccp_cloud` : 기타 운영 DB

> 연결 정보는 `backend/src/main/resources/application-dev.properties`와 `application-prod.properties`에서 확인되며, 실제 접속은 `218.155.74.34:5433` 기준입니다.

---

## 2. 중앙 DB 핵심 테이블

### 2-1. tb_tenant

| 컬럼                         | 타입      | 설명                                     |
| ---------------------------- | --------- | ---------------------------------------- |
| tenant_id                    | bigint    | 테넌트 PK                                |
| tenant_code                  | varchar   | 테넌트 식별 코드 (예: TENANT_2133453253) |
| tenant_nm                    | varchar   | 테넌트명                                 |
| admin_email                  | varchar   | 관리자 이메일                            |
| business_registration_number | varchar   | 사업자등록번호                           |
| corporate_number             | varchar   | 법인번호                                 |
| business_type                | varchar   | 업종                                     |
| business_category            | varchar   | 업태                                     |
| registration_date            | date      | 등록일                                   |
| logo_image                   | text      | 로고 이미지                              |
| onboarding_status            | varchar   | 온보딩 상태                              |
| use_at                       | char      | 사용 여부 (Y/N)                          |
| created_at                   | timestamp | 생성 일시                                |
| updated_at                   | timestamp | 수정 일시                                |
| created_by                   | bigint    | 생성자                                   |

역할:

- 테넌트 기본 정보 관리
- 플랫폼 다중 테넌트 식별의 기준

### 2-2. tb_tenant_database

| 컬럼                     | 타입      | 설명                              |
| ------------------------ | --------- | --------------------------------- |
| tenant_database_id       | bigint    | PK                                |
| tenant_id                | bigint    | 테넌트 FK                         |
| db_key                   | varchar   | DB 라우팅 키                      |
| db_name                  | varchar   | 실제 DB명 (예: tenant_2133453253) |
| jdbc_url                 | text      | DB 연결 URL                       |
| jdbc_username            | varchar   | DB 사용자                         |
| jdbc_password_secret_ref | varchar   | 비밀번호 참조값                   |
| driver_class_name        | varchar   | 드라이버명                        |
| schema_name              | varchar   | 스키마명                          |
| pool_min_idle            | int       | 최소 idle pool                    |
| pool_max_size            | int       | 최대 pool 크기                    |
| provisioning_status      | varchar   | PENDING / ACTIVE / FAILED         |
| use_at                   | char      | 활성 여부                         |
| created_at               | timestamp | 생성 일시                         |
| updated_at               | timestamp | 수정 일시                         |

역할:

- tenant별 실제 DB와 연결 정보를 중앙에서 보관
- `TenantRoutingDataSource`가 DB를 결정할 때 사용

### 2-3. tb_tenant_domain

| 컬럼             | 타입      | 설명             |
| ---------------- | --------- | ---------------- |
| tenant_domain_id | bigint    | PK               |
| tenant_id        | bigint    | 테넌트 FK        |
| email_domain     | varchar   | 도메인명         |
| is_primary       | char      | 대표 도메인 여부 |
| use_at           | char      | 사용 여부        |
| created_at       | timestamp | 생성 일시        |
| updated_at       | timestamp | 수정 일시        |

역할:

- 도메인 기반 테넌트 매핑
- Host 또는 X-Forwarded-Host로 현재 테넌트 식별

### 2-4. tb_login_account

| 컬럼                | 타입      | 설명               |
| ------------------- | --------- | ------------------ |
| login_id            | bigint    | 로그인 계정 PK     |
| tenant_id           | bigint    | 소속 테넌트        |
| login_code          | varchar   | 로그인 코드/아이디 |
| password_hash       | varchar   | 암호화 비밀번호    |
| profile_image       | text      | 프로필 이미지      |
| stamp_image         | text      | 도장 이미지        |
| login_attempt_count | int       | 실패 횟수          |
| locked_at           | timestamp | 잠금 시점          |
| password_changed_at | timestamp | 비밀번호 변경 시점 |
| use_at              | char      | 사용 여부          |
| created_at          | timestamp | 생성 일시          |
| updated_at          | timestamp | 수정 일시          |

역할:

- 실제 로그인 인증의 기준
- 사용자 식별과 비밀번호 검증 수행

### 2-5. tb_user

| 컬럼          | 타입      | 설명           |
| ------------- | --------- | -------------- |
| user_id       | bigint    | 사용자 PK      |
| tenant_id     | bigint    | 소속 테넌트    |
| login_id      | bigint    | 로그인 계정 FK |
| user_nm       | varchar   | 사용자명       |
| email_addr    | varchar   | 이메일         |
| department_id | bigint    | 부서 FK        |
| mobile_no     | varchar   | 휴대폰 번호    |
| use_at        | char      | 사용 여부      |
| created_at    | timestamp | 생성 일시      |
| updated_at    | timestamp | 수정 일시      |

역할:

- 사용자 프로필정보
- 로그인 계정과 사용자 실명/부서 연결

### 2-6. tb_department

| 컬럼                 | 타입      | 설명        |
| -------------------- | --------- | ----------- |
| department_id        | bigint    | 부서 PK     |
| tenant_id            | bigint    | 소속 테넌트 |
| department_nm        | varchar   | 부서명      |
| parent_department_id | bigint    | 상위 부서   |
| sort_order           | int       | 정렬 순서   |
| use_at               | char      | 사용 여부   |
| created_at           | timestamp | 생성 일시   |
| updated_at           | timestamp | 수정 일시   |

역할:

- 부서 계층 구조 관리
- 전자결재 및 사용자 조직 구조의 기준

### 2-7. tb_menu / tb_role / tb_permission / tb_role_menu_permission

#### tb_menu

| 컬럼           | 타입      | 설명        |
| -------------- | --------- | ----------- |
| menu_id        | bigint    | 메뉴 PK     |
| parent_menu_id | bigint    | 상위 메뉴   |
| menu_code      | varchar   | 메뉴 코드   |
| menu_nm        | varchar   | 메뉴 이름   |
| menu_dc        | varchar   | 메뉴 설명   |
| menu_url       | varchar   | 접근 URL    |
| icon_nm        | varchar   | 아이콘 이름 |
| menu_order     | int       | 표시 순서   |
| use_at         | char      | 사용 여부   |
| created_at     | timestamp | 생성 일시   |
| updated_at     | timestamp | 수정 일시   |

#### tb_role

| 컬럼           | 타입      | 설명             |
| -------------- | --------- | ---------------- |
| role_id        | bigint    | 역할 PK          |
| tenant_id      | bigint    | 소속 테넌트      |
| role_code      | varchar   | 역할 코드        |
| role_nm        | varchar   | 역할명           |
| use_at         | char      | 사용 여부        |
| is_system_role | char      | 시스템 역할 여부 |
| created_at     | timestamp | 생성 일시        |
| updated_at     | timestamp | 수정 일시        |

#### tb_permission

| 컬럼            | 타입      | 설명        |
| --------------- | --------- | ----------- |
| permission_id   | bigint    | 권한 PK     |
| tenant_id       | bigint    | 소속 테넌트 |
| permission_code | varchar   | 권한 코드   |
| permission_nm   | varchar   | 권한명      |
| use_at          | char      | 사용 여부   |
| created_at      | timestamp | 생성 일시   |
| updated_at      | timestamp | 수정 일시   |

#### tb_role_menu_permission

| 컬럼                    | 타입      | 설명      |
| ----------------------- | --------- | --------- |
| role_menu_permission_id | bigint    | PK        |
| role_id                 | bigint    | 역할 FK   |
| menu_id                 | bigint    | 메뉴 FK   |
| permission_id           | bigint    | 권한 FK   |
| created_at              | timestamp | 생성 일시 |

역할:

- 화면 접근 제어
- 권한 기반 기능 제한

### 2-8. tb_plan / tb_plan_menu / tb_tenant_subscription

#### tb_plan

| 컬럼       | 타입      | 설명      |
| ---------- | --------- | --------- |
| plan_id    | bigint    | 플랜 PK   |
| plan_code  | varchar   | 플랜 코드 |
| plan_nm    | varchar   | 플랜명    |
| plan_desc  | varchar   | 플랜 설명 |
| use_at     | char      | 사용 여부 |
| created_at | timestamp | 생성 일시 |
| updated_at | timestamp | 수정 일시 |

#### tb_plan_menu

| 컬럼         | 타입      | 설명      |
| ------------ | --------- | --------- |
| plan_menu_id | bigint    | PK        |
| plan_id      | bigint    | 플랜 FK   |
| menu_code    | varchar   | 메뉴 코드 |
| use_at       | char      | 사용 여부 |
| created_at   | timestamp | 생성 일시 |
| updated_at   | timestamp | 수정 일시 |

#### tb_tenant_subscription

| 컬럼                   | 타입      | 설명           |
| ---------------------- | --------- | -------------- |
| tenant_subscription_id | bigint    | PK             |
| tenant_id              | bigint    | 테넌트 FK      |
| plan_id                | bigint    | 플랜 FK        |
| subscription_status    | varchar   | 구독 상태      |
| starts_at              | timestamp | 시작일         |
| ends_at                | timestamp | 종료일         |
| auto_renew             | char      | 자동 갱신 여부 |
| created_by             | bigint    | 생성자         |
| created_at             | timestamp | 생성 일시      |
| updated_at             | timestamp | 수정 일시      |

역할:

- 테넌트별 플랜 및 구독 상태 관리
- 메뉴 권한과 연결되어 운영 제어

---

## 3. 테넌트 DB 핵심 테이블

### 3-1. tb_electronic_approval_main

| 컬럼                      | 타입      | 설명           |
| ------------------------- | --------- | -------------- |
| electronic_approval_id    | bigint    | 전자결재 PK    |
| tenant_id                 | bigint    | 테넌트 ID      |
| drafting_work_category_id | bigint    | 문서 분류 FK   |
| plant_code                | varchar   | 공장/설비 코드 |
| eabus_no                  | varchar   | 결재 번호      |
| ea_exe_id                 | varchar   | 결재 실행 ID   |
| reg_date                  | varchar   | 등록일         |
| login_id                  | bigint    | 작성자 ID      |
| status_type               | varchar   | 결재 상태 코드 |
| department_id             | bigint    | 부서 ID        |
| level_name                | varchar   | 결재 단계명    |
| ea_title                  | varchar   | 제목           |
| twf_time                  | varchar   | 처리 시간      |
| txt_cnt                   | text      | 본문 내용      |
| txt_json                  | jsonb     | JSON 본문      |
| after_cnt                 | text      | 변경 후 본문   |
| after_txt_json            | jsonb     | 변경 후 JSON   |
| cata_type_code            | varchar   | 분류 코드      |
| end_status                | varchar   | 종료 상태      |
| delete_status             | varchar   | 삭제 상태      |
| created_by                | bigint    | 생성자         |
| created_at                | timestamp | 생성 일시      |
| updated_by                | bigint    | 수정자         |
| updated_at                | timestamp | 수정 일시      |

### 3-2. tb_electronic_approval_line_info

| 컬럼                        | 타입      | 설명             |
| --------------------------- | --------- | ---------------- |
| electronic_approval_line_id | bigint    | 라인 PK          |
| tenant_id                   | bigint    | 테넌트 ID        |
| electronic_approval_id      | bigint    | 문서 PK          |
| exe_seq                     | int       | 실행순서         |
| login_id                    | bigint    | 결재자 로그인 ID |
| department_id               | bigint    | 결재자 부서      |
| level_name                  | varchar   | 결재 단계명      |
| app_status                  | varchar   | 승인 상태        |
| arrival_at                  | timestamp | 도착 시간        |
| exe_at                      | timestamp | 처리 시간        |
| open_at                     | timestamp | 열람 시간        |
| approval_type               | varchar   | 결재 유형        |
| order_seq                   | int       | 순서             |
| eabus_no                    | varchar   | 결재 번호        |
| ea_exe_id                   | varchar   | 결재 실행 ID     |
| created_by                  | bigint    | 생성자           |
| created_at                  | timestamp | 생성 일시        |

### 3-3. tb_document_attachment

| 컬럼               | 타입      | 설명                  |
| ------------------ | --------- | --------------------- |
| attachment_id      | bigint    | 첨부파일 PK           |
| tenant_id          | bigint    | 테넌트 ID             |
| approval_id        | bigint    | 결재 문서 FK          |
| object_key         | varchar   | 저장 object key       |
| original_file_name | varchar   | 원본 파일명           |
| file_ext           | varchar   | 확장자                |
| content_type       | varchar   | MIME 타입             |
| file_size          | bigint    | 파일 크기             |
| checksum_sha256    | varchar   | 파일 해시             |
| storage_provider   | varchar   | 저장소 제공자 (MINIO) |
| bucket_name        | varchar   | 저장 버킷명           |
| upload_status      | varchar   | 업로드 상태           |
| previewable_yn     | char      | 미리보기 가능 여부    |
| deleted_yn         | char      | 삭제 여부             |
| created_by         | bigint    | 생성자                |
| created_at         | timestamp | 생성 일시             |
| updated_by         | bigint    | 수정자                |
| updated_at         | timestamp | 수정 일시             |

### 3-4. tb_drafting_work_category / tb_drafting_work_category_group / tb_drafting_work_category_authority

#### tb_drafting_work_category

| 컬럼                            | 타입      | 설명        |
| ------------------------------- | --------- | ----------- |
| drafting_work_category_id       | bigint    | PK          |
| tenant_id                       | bigint    | 테넌트 ID   |
| drafting_work_category_group_id | bigint    | 그룹 FK     |
| cata_type_code                  | varchar   | 분류 코드   |
| code_name                       | varchar   | 코드명      |
| view_seq                        | int       | 표시 순서   |
| reviewer_id                     | bigint    | 검토자      |
| approver_id                     | bigint    | 승인자      |
| user_type                       | varchar   | 사용자 타입 |
| use_at                          | char      | 사용 여부   |
| delete_status                   | varchar   | 삭제 상태   |
| drafting_work_template_json     | jsonb     | 템플릿 JSON |
| drafting_work_template_html     | text      | 템플릿 HTML |
| created_by                      | bigint    | 생성자      |
| created_at                      | timestamp | 생성 일시   |
| updated_by                      | bigint    | 수정자      |
| updated_at                      | timestamp | 수정 일시   |

#### tb_drafting_work_category_group

| 컬럼                            | 타입      | 설명      |
| ------------------------------- | --------- | --------- |
| drafting_work_category_group_id | bigint    | PK        |
| tenant_id                       | bigint    | 테넌트 ID |
| cata_code                       | varchar   | 그룹 코드 |
| cata_name                       | varchar   | 그룹명    |
| view_seq                        | int       | 표시 순서 |
| use_at                          | char      | 사용 여부 |
| delete_status                   | varchar   | 삭제 상태 |
| created_by                      | bigint    | 생성자    |
| created_at                      | timestamp | 생성 일시 |
| updated_by                      | bigint    | 수정자    |
| updated_at                      | timestamp | 수정 일시 |

#### tb_drafting_work_category_authority

| 컬럼                                | 타입      | 설명        |
| ----------------------------------- | --------- | ----------- |
| drafting_work_category_authority_id | bigint    | PK          |
| tenant_id                           | bigint    | 테넌트 ID   |
| drafting_work_category_id           | bigint    | 카테고리 FK |
| cata_type_code                      | varchar   | 코드        |
| employee_no                         | varchar   | 사용자 사번 |
| use_at                              | char      | 사용 여부   |
| delete_status                       | varchar   | 삭제 상태   |
| created_by                          | bigint    | 생성자      |
| created_at                          | timestamp | 생성 일시   |
| updated_by                          | bigint    | 수정자      |
| updated_at                          | timestamp | 수정 일시   |

---

## 4. 연관관계 요약

- `tb_tenant` → `tb_tenant_database` : 테넌트별 실제 DB 연결
- `tb_tenant` → `tb_tenant_domain` : 도메인 기반 routing
- `tb_tenant` → `tb_login_account` → `tb_user` : 사용자 식별 및 프로필
- `tb_menu` + `tb_role` + `tb_permission` + `tb_role_menu_permission` : 권한 구조
- `tb_plan` + `tb_tenant_subscription` : 플랜/구독
- `tb_electronic_approval_main` → `tb_electronic_approval_line_info` : 결재 흐름
- `tb_document_attachment` : 전자결재 문서 첨부 관리
