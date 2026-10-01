# 멀티 DB 전환 업무별 DB 경계 확정안

작성일: 2026-08-12  
상태: 확정 초안 (팀 검토 후 즉시 실행 기준으로 사용)

## 1. 문서 목적

현재 단일 DB + tenant_id 구분 구조를, 중앙 DB(플랫폼 제어) + tenant DB(업체 운영) 구조로 전환할 때 적용할 업무 기준 경계를 정리한다.

본 문서는 다음을 기준으로 한다.

- 중앙 DB는 플랫폼 운영과 제어에 필요한 데이터만 보관한다.
- tenant DB는 업체 단위 운영 데이터만 보관한다.
- tenant DB는 1개 DB = 1개 업체 구조를 전제로 하므로, 가능한 경우 tenant_id를 제거한다.
- 도메인/호스트 해석과 DB 라우팅 정보는 중앙 DB에서 관리한다.
- 플랫폼 관리자 인증과 일반 업체 사용자 인증을 분리한다.

---

## 2. 핵심 원칙

1. 중앙 DB는 플랫폼 수준의 책임 정보만 관리한다.
2. tenant DB는 업체 내부의 실제 업무 데이터만 관리한다.
3. tenant DB는 업체별 격리 환경이므로, 가능하면 업무 테이블에서 tenant_id를 제거한다.
4. 도메인 해석, DB 매핑, 테넌트 레지스트리는 중앙 DB에서만 관리한다.
5. 플랫폼 관리자 인증은 중앙 DB, 일반 업체 사용자 인증은 tenant DB에서 처리한다.

---

## 3. 한눈에 보는 경계 요약

| 구분        | 중앙 DB                           | tenant DB                         | 비고                         |
| ----------- | --------------------------------- | --------------------------------- | ---------------------------- |
| 플랫폼 관리 | O                                 | X                                 | 테넌트/플랜/권한/온보딩 제어 |
| 업체 운영   | X                                 | O                                 | 사용자/조직/문서/결재/메뉴   |
| 라우팅/해석 | O                                 | X                                 | host/domain → tenant DB 결정 |
| 인증        | 플랫폼 관리자: O / 업체 사용자: X | 업체 사용자: O / 플랫폼 관리자: X | 계정 경계 분리               |
| 데이터 격리 | 플랫폼 전체 공통                  | 업체 단위 격리                    | 1개 DB = 1개 업체            |

---

## 4. 업무별 DB 경계 확정

### 4.1 플랫폼 제어 영역 (중앙 DB 전용)

| 업무 영역               | 중앙 DB                                                                                                                                                                            | tenant DB                            | 확정 이유                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| 테넌트 등록/기본정보    | tb_tenant                                                                                                                                                                          | 없음                                 | 플랫폼이 전체 업체를 관리하는 마스터 정보이므로 중앙 고정 |
| 도메인 라우팅           | tb_tenant_domain                                                                                                                                                                   | 없음                                 | 도메인별 대상 DB 결정은 중앙 레지스트리 책임              |
| DB 연결 레지스트리      | tb_tenant_database                                                                                                                                                                 | 없음                                 | 요청 라우팅을 위한 연결 정보이므로 중앙 관리              |
| 온보딩 인증/토큰        | tb_tenant_auth_token                                                                                                                                                               | 없음                                 | 메일 인증/온보딩 상태 추적은 중앙 제어 영역               |
| 플랜/구독/기능 제한     | tb_plan, tb_plan_feature, tb_plan_menu, tb_tenant_subscription                                                                                                                     | 없음                                 | 과금 및 정책은 플랫폼 단일 규칙으로 운영                  |
| 플랫폼 관리자 인증/인가 | tb_platform_login_account, tb_platform_user, tb_platform_role, tb_platform_permission, tb_platform_login_account_role, tb_platform_role_menu_permission, tb_platform_login_history | 없음                                 | 플랫폼 운영 계정은 tenant와 분리 필요                     |
| 스케줄러 설정           | tb_schedulerconfig                                                                                                                                                                 | 필요 시 tenant 내부 작업 테이블 별도 | 플랫폼 공통 스케줄은 중앙에서 제어                        |

### 4.2 업체 운영 영역 (tenant DB 전용)

| 업무 영역                 | 중앙 DB | tenant DB                                                                                                                                                                 | 확정 이유                                                 |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 업체 사용자 인증          | 없음    | tb_login_account, tb_login_history                                                                                                                                        | 업체별 계정 격리 및 보안 경계 강화를 위해 tenant DB 고정  |
| 업체 사용자/조직          | 없음    | tb_user, tb_department                                                                                                                                                    | 조직/사용자는 업체 내부 데이터                            |
| 업체 권한/메뉴            | 없음    | tb_role, tb_permission, tb_menu, tb_login_account_role, tb_role_menu_permission                                                                                           | 인가 조회 단순화와 tenant 자율 운영을 위해 tenant DB 고정 |
| 문서 분류/기안 템플릿     | 없음    | tb_drafting_work_category_group, tb_drafting_work_category, tb_drafting_work_category_authority                                                                           | 문서 체계는 업체별로 달라짐                               |
| 전자결재 본문/결재선/이력 | 없음    | tb_electronic_approval_main, tb_electronic_approval_line_info, tb_electronic_approval_history_main, tb_electronic_approval_open_info, tb_electronic_approval_history_like | 핵심 업무 데이터이므로 tenant DB 고정                     |

### 4.3 영역 판단 기준

다음 기준으로 DB 배치를 결정한다.

- 플랫폼 전체에 공통으로 적용되는가?
- 테넌트 간 공유가 필요한가?
- 업체별 데이터 격리가 필요한가?
- 제어/감사/라우팅 정보인가?

위 기준에 따라 다음이 정리된다.

- 공통 제어 정보: 중앙 DB
- 업체 운영 정보: tenant DB
- 로그/집계/통계 사본: 중앙 DB에 비동기 적재 가능

---

## 5. 예외 및 운영 정책

### 5.1 로그인 이력

- 원본 저장: tenant DB의 tb_login_history
- 중앙 집계 필요 시: 별도 집계 테이블(예: tb_platform_login_history_agg)로 비동기 적재
- 정책: 원본은 tenant DB에 두고, 중앙은 조회/통계 목적의 사본만 허용한다.

### 5.2 메뉴/권한 표준값

- 중앙 DB는 표준 템플릿만 관리한다.
- tenant DB에는 온보딩 시 seed로 복제한다.
- 정책: 런타임 조회는 tenant DB를 기준으로 한다.

### 5.3 tenant_id 컬럼 처리

- tenant DB 내부 테이블에서는 tenant_id 제거를 기본 원칙으로 한다.
- 다만, 외부 연동 및 이관 추적이 필요한 특정 테이블은 예외적으로 유지할 수 있다.
- 예외를 둔 테이블은 명확히 문서화하고, 중앙/tenant 경계 위반 여부를 검토한다.

---

## 6. 백엔드 구현 기준

1. tenant DB 매퍼에서 tb_tenant 조인을 제거한다.
2. tenantCode → tenant_id 서브쿼리 의존성을 제거한다.
3. 중앙 DB 매퍼는 tenant registry, plan, onboarding, platform auth 전용으로 분리한다.
4. 플랫폼 관리자 API와 tenant 사용자 API는 라우팅 계층에서 명확히 분기한다.
5. DB 선택 로직은 host/domain 기반 해석과 중앙 registry 기반 라우팅을 우선 적용한다.

---

## 7. 실행 우선순위

1. 중앙 DB 레지스트리(tb_tenant_database) 반영
2. 호스트 기반 tenant 해석 필터 반영
3. 로그인 경로 분리(플랫폼 관리자 / 업체 사용자)
4. 사용자/권한/메뉴 매퍼를 tenant DB 기준으로 정리
5. 문서/결재 매퍼를 tenant DB 기준으로 정리
6. 로그/집계/통계 경로를 중앙 관점으로 정리

---

## 8. 확정 문장

본 문서는 멀티 DB 전환 시 중앙 DB와 tenant DB의 업무 경계를 정의하는 기준 문서로 사용한다.  
DDL 작성, 매퍼 수정, 서비스 분리, 온보딩 프로비저닝 구현은 본 경계 정의를 벗어나지 않는다.
