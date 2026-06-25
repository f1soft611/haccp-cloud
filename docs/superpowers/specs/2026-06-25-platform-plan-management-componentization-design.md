# 2026-06-25 Platform Plan Management Componentization Design

## 1. Goal

플랫폼 플랜 관리 화면을 권한 관리 화면 패턴에 맞춰 재구성한다.

핵심 목표:

- 상단 검색조건 + 그리드 중심 UI로 전환
- 그리드 작업 버튼으로 메뉴 매핑/기능 매핑 진입
- 기존 단일 대형 페이지를 컴포넌트 분리 구조로 재편
- 이번 1차 범위는 플랜 화면만 적용하고, 다른 페이지는 동일 패턴으로 확장 가능한 기반을 마련

## 2. Scope and Decisions

### 2.1 Confirmed Decisions

- 기준 UI 패턴은 권한 관리 화면을 따른다.
  - 참고: `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`
- 이번 작업 범위는 플랜 화면 1차 분리로 제한한다.
- 기능 매핑은 편집 UI를 제공하되 저장은 비활성 처리한다.
- 기능 저장 API 연동은 다음 단계로 이월한다.

### 2.2 Included

- 플랜 목록 검색조건 바
- 플랜 목록 그리드
- 그리드 작업 버튼
  - 메뉴 매핑
  - 기능 매핑
- 메뉴 매핑 저장 연동(기존 API 재사용)
- 기능 매핑 편집 UI + 저장 비활성 안내

### 2.3 Excluded

- 권한/역할/역할메뉴 화면 동시 리팩터링
- 기능 매핑 저장 API 신규 개발
- 백엔드 계약 변경

## 3. Target Architecture

페이지 컨테이너는 상태/쿼리/오케스트레이션만 담당하고, 렌더링과 상호작용은 하위 컴포넌트로 분리한다.

### 3.1 Container Page

- `frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx`
- 책임:
  - 검색 상태와 적용 필터 상태 관리
  - 선택 플랜/모달 열림 상태 관리
  - React Query 조회/저장 및 invalidate
  - 알림(성공/실패) 처리

### 3.2 New Presentational Components

- `frontend/src/pages/platform-admin/plans/components/PlatformPlanSearchBar.tsx`
  - 검색 필드/검색어/상태/조회 버튼 렌더링
- `frontend/src/pages/platform-admin/plans/components/PlatformPlanGrid.tsx`
  - AdminGrid 기반 플랜 목록 렌더링
  - 작업 버튼 클릭 이벤트 전달
- `frontend/src/pages/platform-admin/plans/components/PlanMenuMappingDialog.tsx`
  - 메뉴 후보 체크/저장 UI
- `frontend/src/pages/platform-admin/plans/components/PlanFeatureMappingDialog.tsx`
  - 기능 ON/OFF 편집 UI
  - 저장 버튼 비활성 + API 미연동 안내

## 4. Data Flow and State Model

### 4.1 Search and Filter State

- `searchField`: `code | name`
- `searchKeyword`: string
- `filterActive`: `all | Y | N`
- `appliedFilters`: 조회 버튼 클릭 시 반영되는 확정 필터

입력 중 상태와 실제 목록 반영 조건을 분리해 UX를 안정화한다.

### 4.2 Selection and Dialog State

- `selectedPlan`: 현재 작업 대상 플랜
- `menuMappingOpen`: 메뉴 매핑 모달 상태
- `featureMappingOpen`: 기능 매핑 모달 상태
- `draftMenuCodes`: 메뉴 매핑 임시 편집 상태
- `draftFeatures`: 기능 매핑 임시 편집 상태(저장 비활성)

### 4.3 Query Strategy

- 플랜 목록: `['platform-admin', 'plan-summaries']`
- 플랜 메뉴 매핑: `['platform-admin', 'plan-menus', planCode]`
- 플랜 기능 목록: `['platform-admin', 'plan-features', planCode]`
- 플랫폼 메뉴 목록: `['platform-admin', 'menus']`

### 4.4 Save and Invalidation

메뉴 매핑 저장 성공 시:

1. `['platform-admin', 'plan-menus', planCode]` invalidate
2. `['platform-admin', 'plan-summaries']` invalidate (menuCount 반영)

기능 매핑은 저장 API 미연동 상태를 유지하므로 invalidate 로직을 추가하지 않는다.

## 5. UI/Interaction Design

### 5.1 Search Area

- 검색 조건(코드/이름)
- 검색어
- 상태(전체/활성/비활성)
- 조회 버튼

### 5.2 Grid Area

컬럼 구성:

- 플랜 코드
- 플랜명
- 상태
- 메뉴 수
- 기능 수
- 작업

작업 버튼:

- 메뉴 매핑 버튼: 해당 플랜 메뉴 모달 오픈
- 기능 매핑 버튼: 해당 플랜 기능 모달 오픈

### 5.3 Menu Mapping Dialog

- 메뉴 목록 체크박스
- 저장 버튼 활성
- 로딩/에러/빈 상태 표시
- 저장 성공/실패 피드백

### 5.4 Feature Mapping Dialog

- 기능 목록 체크박스(로컬 편집 가능)
- 저장 버튼 항상 비활성
- 안내 문구:
  - "기능 매핑 저장 API 준비 중입니다. 현재는 시뮬레이션 편집만 가능합니다."

## 6. Error Handling

- 목록 조회 실패: 상단 Alert 표시, 그리드 빈 상태 처리
- 메뉴 매핑 조회 실패: 모달 내부 Alert
- 메뉴 저장 실패: 경고 메시지, draft 유지
- 기능 조회 실패: 기능 모달 내부 Alert

## 7. Testing Strategy

### 7.1 Component Tests

- SearchBar: 입력/조회 이벤트 전달 검증
- Grid: 작업 버튼 클릭 시 대상 플랜 이벤트 전달 검증
- Feature dialog: 토글 가능 + 저장 버튼 비활성 검증

### 7.2 Page Integration Tests

- 조회 조건 적용 후 목록 필터 결과 검증
- 메뉴 매핑 저장 성공 시 invalidate 및 성공 피드백 검증
- 기능 매핑 모달에서 편집 가능하지만 저장 불가 상태 검증

### 7.3 Regression

- 라우트 유지 확인: `frontend/src/app/router/AppRoutes.tsx`의 `/platform/plans`
- 기존 메뉴 저장 API 경로/계약 유지 확인

## 8. Implementation Sequence (1st Stage)

1. 플랜 페이지에서 검색/그리드/모달 상태 정리
2. SearchBar, Grid 컴포넌트 분리
3. 메뉴 매핑 모달 분리 및 기존 저장 로직 연결
4. 기능 매핑 모달 분리(저장 비활성 UX 포함)
5. 테스트 보강 및 회귀 확인

## 9. Next Expansion Plan

다음 단계에서 동일 패턴을 아래 화면에 순차 적용한다.

1. `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`
2. `frontend/src/pages/platform-admin/roles/PlatformRoleManagementPage.tsx`
3. `frontend/src/pages/platform-admin/menus/PlatformRoleMenuManagementPage.tsx`

원칙:

- Container: 상태/쿼리/사이드이펙트만
- Presentational component: 렌더링/콜백 전달만
- Dialog: 도메인별 독립 구성
