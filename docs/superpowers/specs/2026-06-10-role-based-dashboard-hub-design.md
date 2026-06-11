# Role-Based Dashboard Hub Design

## 1. Goal

상단 업무 메뉴를 제거하고, 대시보드를 역할 기반 허브로 재구성한다.
일반 사용자(USER)는 할 일 중심 탐색으로 단순화하고, 관리자(PLATFORM_ADMIN, TENANT_ADMIN)는 대시보드 내 관리자 전용 관리 카드에서 사용자/부서/템플릿 성격의 관리를 수행한다.

## 2. Confirmed Decisions

- 상단 메뉴는 제거한다.
- 로그인 후 기본 진입 경로는 `/dashboard`를 유지한다.
- 관리자 전용 노출 대상은 `PLATFORM_ADMIN`, `TENANT_ADMIN`이다.
- 관리자 기능 노출 위치는 대시보드 내부 관리자 전용 카드/패널이다.

## 3. Information Architecture

### 3.1 Common

- 공통 레이아웃은 `TopGovBar` + 본문 + `PortalFooter` 구성으로 유지한다.
- `WorkMenuBar`는 렌더링하지 않는다.
- 페이지 간 이동 진입점은 대시보드 카드 액션으로 통합한다.

### 3.2 USER Experience

- 대시보드에서 업무 중심 카드만 노출한다.
- 주요 액션은 문서 작성/조회 및 문서 이력 확인으로 제한한다.
- 사용자/부서/온보딩 등 관리성 링크는 노출하지 않는다.

### 3.3 Admin Experience

- 기본 업무 카드 외에 관리자 전용 관리 카드 섹션을 추가한다.
- 관리자 카드에서 사용자, 부서, 템플릿(현재 라우트 기준 온보딩 포함) 관련 관리 링크를 제공한다.
- 관리자 카드 섹션은 역할 화이트리스트 조건으로만 렌더링한다.

## 4. Routing and Access Rules

- 라우팅 계약은 기존 경로를 유지한다.
  - `/dashboard`
  - `/onboarding`
  - `/users`
  - `/departments`
  - `/documents`
  - `/document-history`
- `ProtectedRoute` 인증 경계는 유지한다.
- UI 노출과 라우트 보호를 분리해, 링크가 감춰져도 권한 없는 직접 접근은 기존 정책대로 차단한다.

## 5. Component-Level Changes

- `frontend/src/shared/layout/AppLayout.tsx`
  - `WorkMenuBar` 제거
  - 메뉴 아이템 상수 제거
- `frontend/src/pages/DashboardPage.tsx`
  - 역할별 카드 섹션 분기 추가
  - USER 전용 할 일 카드 섹션 추가
  - 관리자 전용 관리 카드 섹션 추가
- `frontend/src/shared/ui/labels.ts`
  - 대시보드 카드 제목/설명/버튼 라벨 추가

## 6. Error and Fallback Behavior

- role 값이 비정상이거나 비어 있을 경우 USER 기본 카드 구성을 렌더링한다.
- 관리자 섹션은 `PLATFORM_ADMIN`, `TENANT_ADMIN` 외에는 항상 숨긴다.
- 빈 상태에서는 다음 행동을 유도하는 CTA를 노출한다.

## 7. Testing Strategy

- `frontend/src/test/app-shell.test.tsx`
  - 상단 메뉴 제거 반영 검증
- `frontend/src/test/dashboard-page.test.tsx`
  - USER: 할 일 카드 노출 + 관리자 카드 비노출 검증
  - Admin: 관리자 카드 및 관리 링크 노출 검증
- 기존 대시보드 핵심 텍스트/콘텐츠 회귀 검증을 유지한다.

## 8. Scope

### Included

- 상단 메뉴 제거
- 대시보드 역할 기반 허브 전환
- 관리자 전용 관리 카드 노출
- 관련 테스트 갱신

### Excluded

- 신규 라우트 추가
- 백엔드 API 변경
- 권한 모델 확장(새 역할 추가)

## 9. Risks and Mitigations

- Risk: 상단 메뉴 제거로 사용자 초기 탐색 혼란
  - Mitigation: USER 대시보드 카드 카피를 행동 중심으로 작성
- Risk: 관리자 링크 노출 누락
  - Mitigation: 관리자 역할 2종에 대한 테스트를 분리 작성
- Risk: 기존 셸 테스트 파손
  - Mitigation: 구조 기반 검증으로 테스트 갱신
