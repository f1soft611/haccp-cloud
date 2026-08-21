# 멀티 DB 전환 실행 체크리스트

작성일: 2026-08-18  
상태: 구현 전 체크리스트 / 프론트+백엔드 동시 반영 기준

---

## 1. 목표

현재 단일 DB + `tenant_id` 기반 모델을, 다음 구조로 전환한다.

- 중앙 DB: 플랫폼 관리/라우팅/플랜/온보딩/관리자 인증
- tenant DB: 업체별 운영/사용자/메뉴/문서/결재/로그인

이 문서는 실제 개발 작업을 시작하기 전에 필요한 구현 범위와 우선순위를 정리한 실행 체크리스트이다.

---

## 2. 전제 조건

다음 조건을 사전에 합의해야 실제 구현이 안정적으로 진행된다.

- [ ] 중앙 DB와 tenant DB의 책임 분리를 최종 확정한다.
- [ ] 플랫폼 관리자와 업체 사용자의 인증 경로를 분리한다.
- [ ] tenant를 식별하는 기준을 `Host` 또는 `X-Forwarded-Host`로 통일한다.
- [ ] tenant DB는 1개 DB = 1개 업체 가정으로 운영한다.
- [ ] tenant DB 내부 테이블에서 `tenant_id` 제거를 기본 원칙으로 한다.
- [ ] 중앙 DB에는 `tenant registry`, `domain`, `plan`, `provisioning`, `platform auth`만 남긴다.
- [ ] 롤백 기준과 네트워크/DB 오류 대응 정책을 정의한다.

---

## 3. 구현 원칙

### 3.1 중앙 DB 원칙

중앙 DB는 다음 데이터만 관리한다.

- 테넌트 마스터 정보
- 도메인/호스트 라우팅 정보
- DB 연결 정보
- 플랜/구독/기능 제한
- 온보딩 상태/토큰
- 플랫폼 관리자 인증 정보
- 공통 스케줄러 설정

### 3.2 tenant DB 원칙

tenant DB는 다음 데이터만 관리한다.

- 업체 사용자 로그인
- 사용자/조직/부서
- 권한, 메뉴, 역할
- 문서 분류/기안 템플릿
- 전자결재 본문/결재선/이력
- tenant 내부 로그인 이력

### 3.3 공통 규칙

- [ ] 플랫폼 관리자 API와 tenant 사용자 API는 라우팅 계층에서 분기한다.
- [ ] `JOIN tb_tenant`를 tenant DB 쿼리에서 제거한다.
- [ ] `tenantCode -> tenant_id` 서브쿼리를 제거한다.
- [ ] 중앙 DB 라우팅 로직은 `Host` 기반 우선 적용을 기본으로 한다.
- [ ] 로그/통계 생성은 중앙 DB에서 비동기 집계만 허용한다.

---

## 4. 구현 우선순위

### Phase 1: 데이터 경계 확립

- [ ] 중앙/tenant DB 구조를 실제 DDL로 분리한다.
- [ ] 중앙 DB 테이블 정의를 기준으로 registry/route/provisioning 테이블을 만든다.
- [ ] tenant DB 테이블 정의를 기준으로 운영 테이블을 만든다.
- [ ] tenant DB 기준의 `tenant_id` 제거 범위를 확정한다.

### Phase 2: 백엔드 라우팅 인프라

- [ ] `DataSource`를 중앙 DB + routing DataSource 구조로 분리한다.
- [ ] `TenantContextFilter`에서 `Host` / `X-Forwarded-Host` 기반 tenant 해석을 구현한다.
- [ ] `TenantContextHolder` 또는 유사 컨텍스트 객체에 `tenantId`, `dbKey`, `tenantCode`를 저장한다.
- [ ] `TenantDatabaseRegistryService`를 추가해 central DB에서 데이터소스 메타를 조회한다.
- [ ] tenant request마다 DB 키를 받아 routing DataSource가 `lookup`하도록 만든다.

### Phase 3: 인증 분리

- [ ] 플랫폼 관리자 로그인은 중앙 DB에서 처리한다.
- [ ] 업체 사용자 로그인은 tenant DB에서 처리한다.
- [ ] `SecurityConfig`에서 인증 체인과 필터 우선순위를 정리한다.
- [ ] JWT claim에 tenant 식별자/DB 키를 포함할지 여부를 결정한다.
- [ ] 로그인 실패/권한 오류/없는 tenant 처리 정책을 정의한다.

### Phase 4: tenant runtime mapper 재작성

- [ ] `tb_tenant` 조인 제거
- [ ] `tenantCode` 기반 서브쿼리 제거
- [ ] 사용자/부서/권한/메뉴 매퍼를 tenant DB 기준으로 재설계
- [ ] 문서/결재/기안 매퍼를 tenant DB 기준으로 재설계
- [ ] 대시보드/조회 로직에서 중앙 DB 의존성을 제거

### Phase 5: 프로비저닝 및 온보딩

- [ ] tenant 등록 시 central DB에 tenant/도메인/DB 연결 정보 저장
- [ ] tenant DB 생성
- [ ] tenant schema 실행
- [ ] 기본 권한/메뉴/관리자 계정 seed 생성
- [ ] onboarding 상태를 `ready`로 전환

### Phase 6: 프론트엔드 전환

- [ ] 로그인 화면을 platform/tenant 경로로 분기
- [ ] tenant 도메인 기반 초기화 로직 적용
- [ ] API 호출 클라이언트를 central/tenant로 분리
- [ ] route guard 및 auth store를 멀티 경로 대응 구조로 변경
- [ ] page access 권한 정책을 tenant 범위로 정리

### Phase 7: 검증 및 안정화

- [ ] 백엔드 통합 테스트
- [ ] 프론트 auth flow 테스트
- [ ] tenant DB 연결 실패/기본값 fallback 테스트
- [ ] 롤백 시나리오 검증

---

## 5. 백엔드 구현 체크리스트

### 5.1 중앙 DB DDL

- [ ] `tb_tenant` 생성
- [ ] `tb_tenant_domain` 생성
- [ ] `tb_tenant_database` 생성
- [ ] `tb_tenant_auth_token` 생성
- [ ] `tb_plan`, `tb_plan_feature`, `tb_plan_menu` 생성
- [ ] `tb_tenant_subscription` 생성
- [ ] 플랫폼 관리자 인증 테이블 정리
- [ ] 플랫폼용 로그인 이력 테이블 정리
- [ ] 스케줄러 플랫폼 설정 테이블 정리

### 5.2 tenant DB DDL

- [ ] `tb_login_account` 생성
- [ ] `tb_login_history` 생성
- [ ] `tb_user` 생성
- [ ] `tb_department` 생성
- [ ] `tb_role` 생성
- [ ] `tb_permission` 생성
- [ ] `tb_menu` 생성
- [ ] `tb_login_account_role` 생성
- [ ] `tb_role_menu_permission` 생성
- [ ] 문서 분류/기안 템플릿 테이블 생성
- [ ] 전자결재 본문/결재선/이력 테이블 생성

### 5.3 Java/Spring 구성

- [ ] `EgovConfigAppDatasource` 수정
- [ ] `EgovConfigAppMapper` 수정
- [ ] routing DataSource 클래스 추가
- [ ] central registry service 추가
- [ ] tenant context filter 수정
- [ ] tenant context holder 또는 context 객체 수정
- [ ] `SecurityConfig`에서 인증 체인 재구성
- [ ] `EgovLoginServiceImpl` 수정
- [ ] onboarding/tenant provisioning service 수정

### 5.4 Mapper 재작성

- [ ] `EgovLoginUsr_SQL_postgresql.xml` 수정
- [ ] `PlatformUserMapper_SQL_postgresql.xml` 수정
- [ ] `DepartmentMapper_SQL_postgresql.xml` 수정
- [ ] `AuthorityMapper_SQL_postgresql.xml` 수정
- [ ] `DashboardMapper_SQL_postgresql.xml` 수정
- [ ] `HaccpBaseCategoryMapper_SQL_postgresql.xml` 수정
- [ ] `HaccpBaseWorkMapper_SQL_postgresql.xml` 수정
- [ ] `HaccpWorkMapper_SQL_postgresql.xml` 수정
- [ ] `HaccpPortalDocumentMapper_SQL_postgresql.xml` 수정

### 5.5 비동기 집계 및 예외 정책

- [ ] tenant 로그인 이력 원본 저장 정책 확인
- [ ] 집계용 중앙 테이블 설계 여부 결정
- [ ] 전체 통계 조회는 중앙 집계 테이블 기반으로 전환
- [ ] `tenant_id` 예외 유지가 필요한 테이블을 문서로 기록

---

## 6. 프론트엔드 구현 체크리스트

### 6.1 인증/라우팅 분리

- [ ] 플랫폼 관리자 로그인과 업체 사용자 로그인 분기 로직 구현
- [ ] 로그인 성공 후 서버 응답에 따라 `platform` 또는 `tenant` 경로를 선택
- [ ] `authStore` 또는 유사 상태 저장소에 `userType`, `tenantCode`, `tenantId`, `dbKey` 저장
- [ ] `ProtectedRoute` 또는 route guard에서 접근 권한 분기 구현
- [ ] 관리자 페이지와 업체 사용자 페이지를 별도 경로 그룹으로 분리

### 6.2 API 클라이언트 모델

- [ ] 중앙 API 클라이언트와 tenant API 클라이언트를 분리
- [ ] tenant 요청 시 `Host` 기반 또는 tenant context 기반 헤더/파라미터 처리
- [ ] central API는 플랫폼 계정 전용 엔드포인트만 사용
- [ ] tenant API는 업체 정보/권한/문서/결재 전용 엔드포인트만 사용
- [ ] 공통 `fetch`/`axios` 인스턴스에서 base URL과 인증 헤더 분기 처리

### 6.3 화면별 영향 범위

#### 플랫폼 관리자 화면

- [ ] 테넌트 관리 화면
- [ ] 플랜/구독 관리 화면
- [ ] 관리자 권한/메뉴 화면
- [ ] 온보딩/도메인 등록 화면
- [ ] 중앙 DB 기준 통계/모니터링 화면

#### 업체 사용자 화면

- [ ] 로그인 화면
- [ ] 첫 로그인 설정 화면
- [ ] 사용자/부서 관리 화면
- [ ] 메뉴/권한 화면
- [ ] 문서/기안/전자결재 화면
- [ ] 대시보드/업무 화면

### 6.4 UI/UX 반영

- [ ] 로그인 단계에서 플랫폼 관리자와 업체 사용자 영역을 분리 표시
- [ ] tenant 미배정/도메인 미등록 상태에 대한 명확한 에러 메시지 추가
- [ ] 신규 업체 온보딩 완료 후 로그인 경로 안내
- [ ] 관리자 권한 페이지와 사용자 페이지의 로딩/에러 상태 처리 통일

---

## 7. 테스트 전략

### 7.1 백엔드 테스트

- [ ] tenant registry 조회 테스트
- [ ] host resolution 테스트
- [ ] central login vs tenant login 분기 테스트
- [ ] mapper에서 `tb_tenant` 조인 제거 여부 검증
- [ ] tenant DB 연결 실패 fallback 테스트
- [ ] provisioning 성공/실패 시나리오 테스트

### 7.2 프론트엔드 테스트

- [ ] 플랫폼 관리자 로그인 시 중앙 API 호출 검증
- [ ] 업체 사용자 로그인 시 tenant API 호출 검증
- [ ] route guard 분기 검증
- [ ] unauthorized 접근 차단 검증
- [ ] onboarding/first-login 플로우 검증

### 7.3 통합 검증

- [ ] 중앙 DB 연결이 정상 동작하는지 검증
- [ ] tenant DB 라우팅이 host별로 올바르게 선택되는지 검증
- [ ] 플랫폼 관리자와 업체 사용자 계정이 서로 섞이지 않는지 확인
- [ ] 특정 tenant DB 장애 시 대응 정책 검증

---

## 8. 운영/롤백 정책

### 8.1 배포 순서

1. 중앙 DB registry 테이블 반영
2. host-based tenant resolver 구현
3. 로그인 분기 구현
4. tenant DB 구조 생성
5. mapper 전환
6. 프로비저닝/온보딩 연결
7. 프론트 라우팅/인증 전환
8. 통합 검증 및 운영 반영

### 8.2 롤백 기준

- [ ] 바로 전환 시점에 체크포인트를 남긴다.
- [ ] central registry 문제 발생 시 운영자는 이전 DB 연결으로 우회 가능해야 한다.
- [ ] tenant DB 생성 실패 시 onboarding은 자동 중단되어야 한다.
- [ ] 일부 mapper 전환이 실패하면 해당 기능만 폐쇄하고 나머지는 기존 DB 모드로 유지한다.

### 8.3 모니터링

- [ ] tenant resolution 실패 로그
- [ ] db key lookup 실패 로그
- [ ] DB 연결 풀 부족 경고
- [ ] 온보딩 실패 추적
- [ ] 사용자 인증 경로 분기 로그

---

## 9. 최종 완료 기준

다음 항목이 모두 완료되어야 멀티 DB 전환을 실제로 종료로 볼 수 있다.

- [ ] 중앙 DB와 tenant DB의 역할이 코드와 DDL에서 일치한다.
- [ ] 플랫폼 관리자와 일반 사용자 인증이 분리되어 있다.
- [ ] host/domain 기반 라우팅이 정상 동작한다.
- [ ] tenant DB 쿼리가 `tb_tenant` 의존성을 제거했다.
- [ ] frontend 인증/라우팅이 중앙/tenant 접근 흐름을 정확히 반영한다.
- [ ] 운영 배포 전 rollback 시나리오를 검증했다.
- [ ] team review에서 구현 범위와 리스크가 동의되었다.

---

## 10. 권장 작업 분배

### 백엔드 담당

- DataSource & routing layer
- tenant registry / DB resolution
- login 분리
- DDL 생성
- mapper 수정
- provisioning 및 migration

### 프론트엔드 담당

- 로그인/권한 분기
- 라우트 가드
- API client 구조 변경
- menu/auth 화면 분리
- 온보딩 및 사용자 상태 전환

### 공통 담당

- 요구사항 정합성 점검
- 배포 순서 결정
- 테스트 시나리오 작성
- rollback/오류 대응 문서화

---

## 11. 결론

본 문서는 “DB 경계 결정”을 넘어서서, 실제 구현 단계에서 누락되기 쉬운 항목까지 정리한 실행 체크리스트이다.

다음 단계부터는 각 체크 항목을 실제 코드 파일 단위로 세분화해 구현을 진행하면 된다.  
특히 프론트엔드와 백엔드가 서로 다른 layer에서 동시 영향이 발생하므로, 구현 진행 중에는 항목 단위로 완료 여부를 관리하는 것이 중요하다.
