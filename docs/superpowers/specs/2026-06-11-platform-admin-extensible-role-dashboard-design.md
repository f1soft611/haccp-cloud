# Platform Admin Extensible Role Dashboard Design

## 1. Goal

플랫폼관리자 대시보드를 HACCP 실무 중심 화면에서 관리 중심 화면으로 전환하고,
역할별 대시보드를 독립적으로 확장할 수 있는 레지스트리 기반 구조를 도입한다.

이번 범위에서는 PLATFORM_ADMIN 전용으로
- KPI 4개(활성 업체 수, 신규 업체(7일), CCP 문서 생성 완료율, 문서 미생성 업체 수)
- 본문 3섹션(업체 코드 발급 현황, 업체 목록, CCP 문서 생성 현황)
을 실제 API 계약으로 제공한다.

## 2. Confirmed Decisions

- 플랫폼관리자 화면만 변경하고 TENANT_ADMIN, USER 대시보드는 기존 동작을 유지한다.
- 관리형 KPI 4개와 본문 3섹션은 고정 구성으로 제공한다.
- 데이터는 임시 계산값이 아닌 실제 API 계약 기준으로 제공한다.
- 프론트 선반영 + 백엔드 API 확장 동시 진행(접근안 1)으로 구현한다.
- 역할별 확장성을 위해 대시보드 분기 로직을 구성 객체 기반으로 전환한다.

## 3. Information Architecture

### 3.1 Role-Oriented Dashboard Registry

- 대시보드 구성 단위를 역할별 설정 객체(RoleDashboardConfig)로 분리한다.
- 설정 객체에는 KPI 정의, 섹션 정의, 섹션별 데이터 소스, 액션 링크 정책을 포함한다.
- DashboardPage는 현재 role에 해당하는 설정 객체를 선택해 렌더링만 수행한다.

### 3.2 PLATFORM_ADMIN Experience

- 상단 KPI 행: 4개 관리 지표
- 본문 섹션: 업체 코드 발급 현황, 업체 목록, CCP 문서 생성 현황
- 기존 실무형 섹션(할 일, HACCP 문서 포털 섹션, 최근 변경 이력 중심 구성)은 플랫폼관리자 화면에서 노출하지 않는다.

### 3.3 TENANT_ADMIN and USER Experience

- 기존 대시보드 렌더링 구조와 링크 정책을 유지한다.
- 플랫폼관리자 전용 관리 섹션은 노출하지 않는다.

## 4. Routing and Access Rules

- 라우트 계약은 기존 경로를 유지한다.
  - /dashboard
  - /onboarding
  - /users
  - /departments
  - /documents
  - /document-history
- UI 노출은 역할 설정 객체로 제어하되, 권한 차단은 ProtectedRoute의 allowedRoles를 유지한다.
- 플랫폼관리자 전용 링크(온보딩 등)는 PLATFORM_ADMIN 설정에서만 노출한다.

## 5. Backend-Ready Data Contract

### 5.1 Platform Admin KPI Contract

- GET /platform-admin/dashboard/kpis
  - activeTenants: number
  - newTenantsLast7Days: number
  - ccpDocCompletionRate: number
  - tenantsWithoutCcpDocs: number

### 5.2 Tenant Code Issuance Status Contract

- GET /platform-admin/dashboard/tenant-code-issuance
  - totalIssued: number
  - issuedThisMonth: number
  - issuedThisWeek: number
  - recentIssues: Array<{
    tenantCode: string;
    companyName: string;
    issuedAt: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>

### 5.3 Tenant List Contract

- GET /platform-admin/dashboard/tenants
  - summary: {
    total: number;
    active: number;
    inactive: number;
  }
  - items: Array<{
    tenantCode: string;
    companyName: string;
    adminName: string;
    adminEmail: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
  }>

### 5.4 CCP Document Generation Status Contract

- GET /platform-admin/dashboard/ccp-documents
  - overall: {
    completionRate: number;
    completedTenants: number;
    totalTenants: number;
  }
  - items: Array<{
    tenantCode: string;
    companyName: string;
    generatedCount: number;
    requiredCount: number;
    completionRate: number;
    updatedAt: string;
  }>

### 5.5 API Failure Isolation Rule

- 4개 API는 섹션 단위로 독립 로딩/에러 처리한다.
- 특정 API 실패가 전체 대시보드 실패로 전파되지 않도록 한다.
- 각 섹션은 자체 재시도 액션을 제공한다.

## 6. Component-Level Changes

- frontend/src/pages/DashboardPage.tsx
  - 역할별 레지스트리 기반 렌더링 오케스트레이터로 재구성
  - PLATFORM_ADMIN 전용 관리형 KPI/섹션 렌더링 분기 추가
- frontend/src/services/dashboardService.ts
  - 플랫폼관리자 전용 API 함수/타입 4종 추가
- frontend/src/shared/ui/labels.ts
  - 플랫폼관리자 관리형 KPI/섹션 라벨 추가
- frontend/src/test/dashboard-page.test.tsx
  - PLATFORM_ADMIN 관리형 렌더링 검증 케이스 추가
  - TENANT_ADMIN/USER 회귀 방지 케이스 유지/보강
- frontend/src/test/dashboard-service.test.ts
  - 플랫폼관리자 대시보드 API 계약 매핑 테스트 추가

## 7. Error and Fallback Behavior

- 플랫폼관리자 API 일부 실패
  - 실패한 섹션에만 경고와 재시도 버튼 노출
- role 미확인/비정상 값
  - 안전 기본값으로 기존 USER 중심 화면 렌더링
- 빈 데이터
  - 섹션별 empty state 문구와 다음 액션 CTA 노출

## 8. Testing Strategy

### 8.1 Unit and Component Tests

- PLATFORM_ADMIN
  - 관리형 KPI 4개 노출 검증
  - 3개 본문 섹션 노출 검증
  - 실무형 섹션 비노출 검증
- TENANT_ADMIN, USER
  - 기존 허브/링크/텍스트 회귀 검증
  - 플랫폼관리자 전용 섹션 비노출 검증
- 섹션 독립 에러
  - 예: 업체 목록 API 실패 시 해당 섹션만 경고 표시 검증

### 8.2 Service Contract Tests

- 플랫폼관리자 API 함수 4종의 경로, 응답 타입 매핑 검증
- query key 분리로 기존 캐시 충돌 없음 검증

### 8.3 Verification Commands

- frontend 기준
  - npm run lint
  - npm run test
  - npm run build

## 9. Scope

### Included

- 플랫폼관리자 대시보드 관리형 전환
- KPI 4개 + 본문 3섹션 고정 구성
- 실제 API 계약 4종 연동
- 역할별 대시보드 확장성을 위한 레지스트리 구조 반영
- 관련 테스트 갱신

### Excluded

- TENANT_ADMIN, USER 대시보드 UX 전면 개편
- 신규 권한(Role) 추가
- 백엔드 도메인 정책 자체 변경

## 10. Risks and Mitigations

- Risk: 역할별 분기 복잡도 증가
  - Mitigation: 역할별 설정 객체로 분리하고 DashboardPage를 오케스트레이터로 축소
- Risk: 플랫폼 관리자 전용 API 배포 타이밍 불일치
  - Mitigation: 섹션 독립 실패 처리 + 단계별 배포 플래그 고려
- Risk: 기존 역할 화면 회귀
  - Mitigation: PLATFORM_ADMIN/TENANT_ADMIN/USER 분리 테스트로 회귀 차단
- Risk: UI 노출과 권한 차단 불일치
  - Mitigation: ProtectedRoute allowedRoles 정책 유지 및 라우트 테스트 병행
