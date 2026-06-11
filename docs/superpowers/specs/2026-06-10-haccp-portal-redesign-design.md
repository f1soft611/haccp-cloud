# HACCP Portal Redesign Design (Government24 Tone)

## 1. Goal

정부24의 전체 톤과 정보 구조를 참고하되, HACCP 관리시스템 도메인에서 필요한 기능만 남겨 헤더부터 푸터까지 전면 재배치한다.

## 2. Confirmed Decisions

- KPI: 혼합 KPI (CCP/문서 상태/운영 지표 혼합)
- Header IA: 상단 글로벌바 + 2단 업무 메뉴
- Color: 공공 톤 기반 + HACCP 강조색 (청록/오렌지)
- Scope: 라우팅, 인증, 상태관리 계약은 유지하고 UI 구조와 배치 중심으로 변경

## 3. Architecture

### 3.1 Layout skeleton

레이아웃 진입점은 `frontend/src/shared/layout/AppLayout.tsx`를 유지하되 내부 구성은 다음으로 재조립한다.

- TopGovBar: 시스템 타이틀, 테넌트/사용자 정보, 글로벌 검색, 사용자 액션
- WorkMenuBar: 권한 기반 업무 메뉴(대시보드, 문서, 문서이력, 사용자, 부서, 업체등록)
- Main portal body: 대시보드 허브 및 업무 카드 섹션
- PortalFooter: 정책/문의/버전 안내

### 3.2 Contracts to keep

다음 계약은 변경하지 않는다.

- Routes: `/login`, `/dashboard`, `/onboarding`, `/users`, `/departments`, `/documents`, `/document-history`
- Auth guard: `ProtectedRoute` 인증 경계 로직
- Auth store API: `authStore`의 role/isAuthenticated/tenantCode 계약
- Query keys: 기존 React Query key 구조

## 4. Component Design

### 4.1 New shared layout components

- `frontend/src/shared/layout/TopGovBar.tsx`
- `frontend/src/shared/layout/WorkMenuBar.tsx`
- `frontend/src/shared/layout/PageShell.tsx`
- `frontend/src/shared/layout/PortalFooter.tsx`

`AppLayout`는 위 컴포넌트를 조합하고 `Outlet` 위치를 유지한다.

### 4.2 Dashboard re-layout

`frontend/src/pages/DashboardPage.tsx`를 다음 블록 구조로 교체한다.

- KPI summary 4 cards
  - CCP 점검 완료율
  - 미점검 건수
  - 임시저장 문서 수
  - 금일 조치 필요 건수
- Quick action cards (문서/사용자/부서 중심)
- Recent history feed
- Alerts and required actions panel

정부24 원본의 생활민원/복지/대국민 정보 카드 성격은 제거한다.

## 5. Visual System

### 5.1 Theme

`frontend/src/app/theme.ts`에서 토큰을 재정의한다.

- Primary blue: 공공 포털 톤 기반
- HACCP accent teal: 핵심 상태 강조
- Warning orange: 조치 필요 상태 강조
- Neutral grayscale: 정보 카드/테이블 배경

### 5.2 Typography and spacing

- 기존 MUI 체계를 유지하되 제목-본문 위계를 명확히 조정
- 카드/섹션 간 간격을 규격화하여 페이지 밀도를 통일
- 모바일에서 2단 메뉴는 가로 스크롤 또는 접힘 처리

## 6. Data Flow and State Boundaries

- 데이터 호출 위치는 기존 페이지/service 유지
- 신규 레이아웃 컴포넌트는 표시 전용(프리젠테이션)으로 제한
- KPI는 기존 데이터에서 계산 가능한 값만 사용
- 백엔드 API 스펙 추가/변경은 본 작업 범위에서 제외

## 7. Error and Empty UX

- 401: 로그인 유도 메시지와 함께 재인증 흐름으로 이동
- 403: 권한 안내 및 접근 가능한 메뉴 링크 제공
- Network error: 페이지 상단 경고 배너 + 재시도 버튼
- Loading: 카드 단위 skeleton
- Empty state: 업무 유도 CTA 제공(문서 생성, 사용자 추가 등)

## 8. Testing Strategy

### 8.1 Unit and component test update

- `frontend/src/test/app-shell.test.tsx`를 구조 변경에 맞게 수정
- `frontend/src/test/dashboard-page.test.tsx`를 새 블록 구조 기준으로 수정
- 텍스트 하드코딩 매칭을 줄이고 role/testid 기반 검증으로 전환

### 8.2 Regression targets

- 인증 전후 라우팅 동작
- 권한별 메뉴 노출
- 대시보드 KPI/알림 섹션 렌더링
- 모바일 뷰에서 메뉴 접근 가능성

## 9. Delivery Scope

### Included

- 헤더부터 푸터까지 전체 UI 구조 재배치
- 대시보드 정보 구조 재설계
- 공공 톤 + HACCP 강조색 테마 재정의
- 관련 테스트 보강/수정

### Excluded

- 신규 백엔드 엔드포인트
- 문서 편집기 신규 구축
- 권한 모델 확장(새 역할 추가)

## 10. Risk and Mitigation

- Risk: 레이아웃 개편으로 기존 텍스트 기반 테스트 파손
  - Mitigation: role/testid 중심으로 테스트 리라이팅
- Risk: 모바일 2단 메뉴 사용성 저하
  - Mitigation: 브레이크포인트별 접힘/스크롤 UX 설계
- Risk: 정부24 톤이 과도하게 B2C 느낌으로 흐를 가능성
  - Mitigation: 콘텐츠/레이블을 HACCP 업무 언어로 엄격히 제한
