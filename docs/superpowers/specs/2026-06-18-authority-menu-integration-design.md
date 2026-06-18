# Authority and Role-Menu Integration Design

## 1. Goal

메뉴 등록 이후 운영 흐름을 정리하기 위해, 권한 등록과 권한별 메뉴 매핑을 한 화면에서 통합 관리한다.
동시에 런타임 메뉴 구성을 정적 role 분기에서 권한 매핑 기반으로 전환해, 실제 로그인 사용자가 가진 권한에 따라 메뉴가 구성되도록 만든다.

## 2. Confirmed Decisions

- 기본 권한은 3종으로 고정한다.
  - PLATFORM_ADMIN
  - TENANT_ADMIN
  - TENANT_USER
- 권한-메뉴 정책은 혼합 전략을 채택한다.
  - 1차: 전역 기본 매핑 적용
  - 2차: 테넌트별 오버라이드 확장
- 1차 구현 범위는 전역 기본 매핑까지로 제한한다.
- PLATFORM_ADMIN은 초기 데이터에서 반드시 생성되어야 한다.
- PLATFORM_ADMIN 기본 매핑에는 아래 핵심 메뉴를 사전 세팅한다.
  - 메뉴 관리
  - 권한 관리(통합 화면)

## 3. Information Architecture

### 3.1 Integrated Admin Screen

플랫폼 관리자 영역에서 기존 분리 화면(권한 관리, 권한별 메뉴 관리)을 통합한다.

- 상단: 권한 목록 조회, 권한 등록, 활성 상태 변경
- 하단: 선택 권한의 메뉴 매핑 편집 및 저장

### 3.2 Runtime Menu Composition

- 사용자 권한 코드 기준으로 권한-메뉴 매핑을 조회한다.
- 매핑된 menuId 집합과 메뉴 마스터를 조인해 Work 메뉴를 구성한다.
- 비어 있는 결과는 안전 경로(대시보드)로 폴백한다.

### 3.3 Guard Consistency

- 메뉴 노출은 매핑 기반으로 전환한다.
- 라우트 접근 제어는 기존 ProtectedRoute allowedRoles 정책을 유지한다.
- UI 숨김과 URL 직접 접근 방어를 분리해 이중 안전장치를 유지한다.

## 4. Component and State Design

### 4.1 UI Composition

- 권한 목록 테이블
  - code, name, description, active 상태
- 권한 등록 폼
  - code, name, description, active
- 메뉴 매핑 편집 패널
  - 메뉴 목록 체크 편집
  - 저장/초기화 액션

### 4.2 Local State Model

- selectedAuthorityCode: 현재 선택된 권한 코드
- draftMenuIds: 선택 권한에 대해 편집 중인 menuId 목록
- dirty: 저장 필요 여부
- saveStatus: 저장 성공/실패 알림 상태

## 5. Data Flow

### 5.1 Initial Load

페이지 진입 시 권한 목록과 메뉴 목록을 병렬 조회한다.

기본 선택 권한 우선순위:

1. PLATFORM_ADMIN
2. 목록 첫 권한

### 5.2 Mapping Load and Edit

- 권한 선택 변경 시 해당 권한 매핑을 조회한다.
- 조회 결과를 draftMenuIds 초기값으로 설정한다.
- 체크 변경은 로컬 상태에 즉시 반영하고, 저장 버튼으로 서버 반영한다.

### 5.3 Save and Refresh

- 저장 payload: roleCode + menuIds
- 저장 성공: 매핑 캐시 무효화 및 재조회
- 저장 실패: draft 유지, 경고 메시지 표시

### 5.4 Runtime Application

로그인 이후 메뉴 구성 시점에 사용자 권한 코드로 매핑을 조회하고, 결과 menuId 집합으로 표시 가능한 메뉴만 렌더링한다.

## 6. Seed and Policy Rules

### 6.1 Authority Seed Rules

DB 초기 데이터에 아래 권한을 생성한다.

- PLATFORM_ADMIN (tenant_scoped = N)
- TENANT_ADMIN (tenant_scoped = Y)
- TENANT_USER (tenant_scoped = Y)

### 6.2 PLATFORM_ADMIN Protection

- PLATFORM_ADMIN 삭제 금지
- PLATFORM_ADMIN 비활성화 금지
- PLATFORM_ADMIN 핵심 운영 메뉴(메뉴 관리, 권한 관리) 매핑 해제 금지

프론트에서 사전 안내를 제공하되, 최종 정책 강제는 서버에서 수행한다.

## 7. Error and Fallback Behavior

- 매핑 API 실패 시 경고 메시지와 재시도 동선을 제공한다.
- 메뉴 마스터에 없는 menuId가 저장 요청에 포함되면 서버에서 거절한다.
- 저장 중 중복 요청은 버튼 비활성화로 방지한다.
- 권한 전환 중 이전 요청 지연 응답은 최신 선택 권한 컨텍스트와 일치할 때만 반영한다.

## 8. Testing Strategy

### 8.1 Service and Unit

- 권한/메뉴/매핑 API 응답 파싱 검증
- menu master + mapping 조인 로직 검증
- PLATFORM_ADMIN 보호 정책 검증

### 8.2 UI Tests

- 통합 화면 렌더링(권한 목록, 등록 폼, 매핑 편집)
- 권한 전환 시 매핑 재조회
- 저장 성공 시 성공 알림 및 재조회
- 저장 실패 시 draft 유지
- PLATFORM_ADMIN 핵심 메뉴 해제 시도 차단 UX

### 8.3 Route Regression

- 동적 메뉴 노출 적용 후에도 ProtectedRoute 권한 차단이 유지되는지 확인
- 비허용 URL 직접 접근 차단 회귀 검증

## 9. Scope

### Included

- 권한 등록 + 권한별 메뉴 매핑 통합 화면
- 기본 3권한 데이터 및 PLATFORM_ADMIN 핵심 메뉴 사전 세팅 정책
- 로그인 사용자 기준 동적 메뉴 구성 전환
- 관련 테스트 보강

### Excluded

- 테넌트별 메뉴 오버라이드 UI/정책(2차)
- 권한 체계 자체 개편(RBAC 모델 확장)
- 페이지별 세부 권한(읽기/쓰기/승인) 퍼미션 단계 도입

## 10. Risks and Mitigations

- Risk: 동적 메뉴와 정적 라우트 가드 간 불일치 가능성
  - Mitigation: 라우트 가드 유지 + UI 필터/가드 회귀 테스트 동시 수행
- Risk: PLATFORM_ADMIN 보호 규칙이 클라이언트에서만 적용되는 누락
  - Mitigation: 서버 단 강제 검증 및 명시적 에러 코드 정의
- Risk: 초기 시드 미적용 시 운영 진입 차질
  - Mitigation: 마이그레이션 단계에서 idempotent seed 스크립트로 보장
