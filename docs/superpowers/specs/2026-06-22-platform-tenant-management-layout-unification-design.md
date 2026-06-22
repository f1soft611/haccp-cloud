# 플랫폼 업체 관리 레이아웃 통일 설계

## 1. 목표

- 플랫폼 관리 메뉴에서 업체 관리 화면을 플랫폼 관리 공통 패턴으로 통일한다.
- 업체 관리는 그리드 중심의 운영 화면으로 분리하고, 신규 온보딩은 기존 온보딩 화면으로 이동해 진행한다.
- 기존 온보딩 화면(`/platform/onboarding`)은 유지하고, 업체 관리 메인 진입은 신규 경로(`/platform/tenants`)로 변경한다.

## 2. 범위

### 포함

- 신규 페이지: `/platform/tenants`
- 플랫폼 관리 메뉴의 업체 관리 링크를 `/platform/tenants`로 변경
- 업체 관리 페이지 상단 CTA `신규 온보딩`에서 `/platform/onboarding` 이동
- 플랫폼 관리 공통 UI 패턴 적용
  - `PageHeader`
  - 검색/필터 `Paper`
  - `AdminGrid`
  - `GridPaginationBar`
- 권한 보호: `PLATFORM_ADMIN`만 접근
- 화면/라우트/메뉴 관련 테스트 추가

### 제외

- 업체 상세/수정/삭제 기능
- 신규 백엔드 API 추가
- 온보딩 Wizard 로직 자체 변경

## 3. 정보 구조 및 라우팅

- 신규 라우트: `/platform/tenants`
- 기존 유지: `/platform/onboarding`
- 사용자 메뉴 구성
  - `업체 관리` -> `/platform/tenants`
  - `업체등록`(온보딩) -> `/platform/onboarding` 유지
- 라우트 가드
  - `/platform/tenants`: `ProtectedRoute allowedRoles=['PLATFORM_ADMIN']`
  - `/platform/onboarding`: 기존과 동일하게 `PLATFORM_ADMIN` 유지

## 4. 화면 설계

## 4.1 페이지 헤더

- 그룹 라벨: `플랫폼 관리`
- 타이틀: `업체 관리`
- 설명: `업체 운영 현황을 조회하고 신규 온보딩으로 연결합니다.`

## 4.2 검색/필터 영역

- 검색 조건 드롭다운: `업체코드`, `업체명`, `관리자명`
- 검색어 입력
- 상태 필터: `전체`, `활성`, `비활성`
- 버튼: `조회`
- 우측 주요 CTA: `신규 온보딩`

## 4.3 그리드 영역

- 컬럼(초기 확정)
  - 업체코드
  - 업체명
  - 관리자명
  - 관리자이메일
  - 상태
  - 생성일
- 상태 표기: 기존 플랫폼 관리 화면과 동일한 `Chip` 톤 사용
- 빈 상태: `조회 결과가 없습니다.`
- 로딩 상태: 스켈레톤 행 5개
- 오류 상태: `Alert` + 재시도

## 4.4 반응형

- 데스크톱: 검색영역 가로 배치, CTA 우측 정렬
- 모바일: 검색영역 세로 스택, CTA 전체 너비 또는 하단 배치
- 테이블은 기존 `AdminGrid` 반응형 규칙을 따른다.

## 5. 데이터 설계

## 5.1 1차 데이터 소스

- 초기 구현은 기존 플랫폼 대시보드 업체 목록 데이터와 호환되는 조회 모델을 사용한다.
- 단, 화면 컴포넌트는 대시보드 서비스에 직접 의존하지 않고 업체 관리 전용 서비스 계층을 통해 호출한다.

## 5.2 전용 서비스 계층(확장형 대비)

- 신규 서비스 파일에서 목록 조회 API를 단일 인터페이스로 노출
- 반환 모델은 아래 필드를 보장
  - `tenantCode`
  - `companyName`
  - `adminName`
  - `adminEmail`
  - `status`
  - `createdAt`
- 향후 전용 API(`/platform-admin/tenants`)가 생기면 서비스 내부만 교체하고 페이지 코드는 유지한다.

## 5.3 페이지 상태

- 로컬 상태
  - `searchField`
  - `searchKeyword`
  - `statusFilter`
  - `pageIndex`
  - `pageSize`
- 서버 상태
  - `react-query`로 목록/로딩/오류 관리
- 쿼리 키
  - 페이지네이션과 필터를 포함해 캐시 분리

## 6. 사용자 흐름

1. 플랫폼 관리자 진입
2. 플랫폼 관리 > 업체 관리 이동 (`/platform/tenants`)
3. 업체 목록 조회/검색/필터
4. `신규 온보딩` 클릭
5. 기존 온보딩 화면(`/platform/onboarding`)으로 이동하여 업체 등록 진행

## 7. 오류 처리 및 UX 규칙

- 목록 조회 실패 시 상단 경고 Alert 노출
- Alert 내 `재시도` 버튼으로 동일 쿼리 재호출
- 검색 결과 없음은 오류가 아닌 빈 상태 메시지로 표현
- 신규 온보딩 이동 버튼은 목록 로딩/오류 상태와 무관하게 항상 활성화

## 8. 테스트 설계

## 8.1 라우팅/권한

- `PLATFORM_ADMIN`이 `/platform/tenants` 접근 시 페이지 렌더링
- `TENANT_ADMIN`이 `/platform/tenants` 접근 시 허용 경로로 리다이렉트

## 8.2 페이지 렌더링

- 헤더/필터/컬럼 렌더링 확인
- 로딩 스켈레톤 노출 확인
- 빈 상태 문구 확인
- 오류 Alert + 재시도 버튼 확인

## 8.3 행동

- `신규 온보딩` 클릭 시 `/platform/onboarding` 이동 확인
- 필터/검색 적용 시 조회 파라미터 반영 확인

## 8.4 메뉴 연동

- 워크 메뉴 `업체 관리`가 `/platform/tenants`로 연결되는지 검증
- `업체등록` 메뉴 또는 온보딩 직접 링크가 계속 `/platform/onboarding`으로 동작하는지 검증

## 9. 변경 파일 계획

### 수정

- `frontend/src/app/router/AppRoutes.tsx`
- `frontend/src/shared/components/layout/workMenuConfig.ts`
- `frontend/src/shared/constants/labels.ts` (필요 시 페이지 타이틀/설명 문구 보강)

### 추가

- `frontend/src/pages/platform-admin/tenants/PlatformTenantManagementPage.tsx`
- `frontend/src/services/platform/platformTenantManagementService.ts` (조회 모델/매퍼)
- `frontend/src/test/platform-tenant-management-page.test.tsx`
- `frontend/src/test/app-shell.test.tsx` (라우트/메뉴 기대값 보강)

## 10. 수용 기준

- 플랫폼 관리 메뉴에서 `업체 관리` 클릭 시 `/platform/tenants`로 이동한다.
- 업체 관리 페이지에 합의한 컬럼의 그리드가 표시된다.
- `신규 온보딩` 클릭 시 기존 `/platform/onboarding`으로 이동한다.
- 페이지 레이아웃이 플랫폼 관리의 기존 관리 페이지 패턴과 시각적으로 일관된다.
- 권한/라우팅/렌더링/행동 테스트가 통과한다.
