# Platform Admin Extensible Role Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PLATFORM_ADMIN 대시보드를 관리형 KPI/섹션으로 전환하고, 역할별 설정 객체로 대시보드 확장이 가능한 구조를 구현한다.

**Architecture:** `DashboardPage`를 역할별 설정 레지스트리 기반 오케스트레이터로 축소하고, PLATFORM_ADMIN 전용 뷰/서비스/API 계약을 별도로 분리한다. TENANT_ADMIN, USER는 기존 렌더링을 유지해 회귀를 방지한다. 데이터는 플랫폼 관리자 전용 API 4종을 사용하고 섹션 단위 독립 로딩/오류 처리를 적용한다.

**Tech Stack:** React 19, TypeScript, TanStack Query 5, React Router 7, Zustand 5, MUI 7, MSW, Vitest, Testing Library

---

## File Structure Map

- Create: `frontend/src/pages/dashboard/roleDashboardConfig.ts` (역할별 KPI/섹션 설정 레지스트리)
- Create: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboard.tsx` (플랫폼 관리자 전용 대시보드 뷰)
- Create: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx` (KPI/3섹션 패널 컴포넌트)
- Modify: `frontend/src/pages/DashboardPage.tsx` (역할별 오케스트레이션)
- Modify: `frontend/src/services/dashboardService.ts` (플랫폼 관리자 API 계약 4종)
- Modify: `frontend/src/mocks/handlers.ts` (플랫폼 관리자 API 목 엔드포인트 4종)
- Modify: `frontend/src/shared/ui/labels.ts` (플랫폼 관리자 KPI/섹션 라벨)
- Create: `frontend/src/test/dashboard-service.test.ts` (서비스 계약 테스트)
- Modify: `frontend/src/test/dashboard-page.test.tsx` (역할별 렌더링/회귀 테스트)

---

### Task 1: 플랫폼 관리자 API 계약을 테스트로 고정

**Files:**

- Create: `frontend/src/test/dashboard-service.test.ts`
- Modify: `frontend/src/services/dashboardService.ts`
- Test: `frontend/src/test/dashboard-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/apiClient';
import {
  getDashboardMetrics,
  getPlatformAdminDashboardKpis,
  listPlatformAdminTenantCodeIssuance,
  listPlatformAdminTenants,
  listPlatformAdminCcpDocuments,
} from '../services/dashboardService';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('dashboardService', () => {
  it('calls platform admin KPI endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        activeTenants: 12,
        newTenantsLast7Days: 3,
        ccpDocCompletionRate: 87,
        tenantsWithoutCcpDocs: 2,
      },
    });

    const result = await getPlatformAdminDashboardKpis();

    expect(apiClient.get).toHaveBeenCalledWith(
      '/platform-admin/dashboard/kpis',
    );
    expect(result.activeTenants).toBe(12);
  });

  it('keeps tenant dashboard metrics contract for backward compatibility', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { totalDocuments: 10, draftTemplates: 2, updatedToday: 4 },
    });

    const result = await getDashboardMetrics('TENANT-A');

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard', {
      headers: { 'x-tenant-code': 'TENANT-A' },
    });
    expect(result.draftTemplates).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/dashboard-service.test.ts`
Expected: FAIL because 플랫폼 관리자 API 함수들이 아직 없다.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/services/dashboardService.ts
export type PlatformAdminDashboardKpis = {
  activeTenants: number;
  newTenantsLast7Days: number;
  ccpDocCompletionRate: number;
  tenantsWithoutCcpDocs: number;
};

export type TenantCodeIssuanceSummary = {
  totalIssued: number;
  issuedThisMonth: number;
  issuedThisWeek: number;
  recentIssues: Array<{
    tenantCode: string;
    companyName: string;
    issuedAt: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
};

export type PlatformAdminTenantList = {
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
  items: Array<{
    tenantCode: string;
    companyName: string;
    adminName: string;
    adminEmail: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
  }>;
};

export type PlatformAdminCcpDocuments = {
  overall: {
    completionRate: number;
    completedTenants: number;
    totalTenants: number;
  };
  items: Array<{
    tenantCode: string;
    companyName: string;
    generatedCount: number;
    requiredCount: number;
    completionRate: number;
    updatedAt: string;
  }>;
};

export async function getPlatformAdminDashboardKpis(): Promise<PlatformAdminDashboardKpis> {
  const { data } = await apiClient.get<PlatformAdminDashboardKpis>(
    '/platform-admin/dashboard/kpis',
  );
  return data;
}

export async function listPlatformAdminTenantCodeIssuance(): Promise<TenantCodeIssuanceSummary> {
  const { data } = await apiClient.get<TenantCodeIssuanceSummary>(
    '/platform-admin/dashboard/tenant-code-issuance',
  );
  return data;
}

export async function listPlatformAdminTenants(): Promise<PlatformAdminTenantList> {
  const { data } = await apiClient.get<PlatformAdminTenantList>(
    '/platform-admin/dashboard/tenants',
  );
  return data;
}

export async function listPlatformAdminCcpDocuments(): Promise<PlatformAdminCcpDocuments> {
  const { data } = await apiClient.get<PlatformAdminCcpDocuments>(
    '/platform-admin/dashboard/ccp-documents',
  );
  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/dashboard-service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/dashboardService.ts frontend/src/test/dashboard-service.test.ts
git commit -m "feat: add platform admin dashboard service contracts"
```

---

### Task 2: 역할별 대시보드 레지스트리 구조 도입

**Files:**

- Create: `frontend/src/pages/dashboard/roleDashboardConfig.ts`
- Create: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboard.tsx`
- Create: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx`
- Modify: `frontend/src/shared/ui/labels.ts`
- Modify: `frontend/src/test/dashboard-page.test.tsx`
- Test: `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('shows platform admin management KPIs and sections', async () => {
  useAuthStore.setState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'platform_admin',
    role: 'PLATFORM_ADMIN',
  });

  render(
    <AppProviders>
      <DashboardPage />
    </AppProviders>,
  );

  expect(
    await screen.findByRole('heading', {
      name: APP_LABELS.dashboard.platformAdmin.sections.tenantCodeIssuance,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: APP_LABELS.dashboard.platformAdmin.sections.tenantList,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: APP_LABELS.dashboard.platformAdmin.sections.ccpDocuments,
    }),
  ).toBeInTheDocument();
});

it('hides legacy haccp operations blocks for PLATFORM_ADMIN', async () => {
  useAuthStore.setState({
    role: 'PLATFORM_ADMIN',
    userId: 'platform_admin',
  });

  render(
    <AppProviders>
      <DashboardPage />
    </AppProviders>,
  );

  await screen.findByTestId('platform-admin-dashboard');

  expect(
    screen.queryByRole('heading', {
      name: APP_LABELS.dashboard.blocks.todos,
    }),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx`
Expected: FAIL because 플랫폼 관리자 전용 섹션 라벨/컴포넌트가 아직 없다.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/pages/dashboard/roleDashboardConfig.ts
import type { UserRole } from '../../shared/store/authStore';

export type DashboardViewType = 'legacy' | 'platformAdmin';

export type RoleDashboardConfig = {
  role: UserRole;
  view: DashboardViewType;
};

export const ROLE_DASHBOARD_CONFIGS: Record<UserRole, RoleDashboardConfig> = {
  PLATFORM_ADMIN: { role: 'PLATFORM_ADMIN', view: 'platformAdmin' },
  TENANT_ADMIN: { role: 'TENANT_ADMIN', view: 'legacy' },
  USER: { role: 'USER', view: 'legacy' },
};
```

```tsx
// frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboard.tsx
export function PlatformAdminDashboard() {
  return (
    <Stack spacing={2} data-testid="platform-admin-dashboard">
      <PlatformAdminKpiRow />
      <PlatformAdminManagementSections />
    </Stack>
  );
}
```

```tsx
// frontend/src/pages/DashboardPage.tsx (routing point)
const currentRole = role ?? 'USER';
const roleConfig =
  ROLE_DASHBOARD_CONFIGS[currentRole] ?? ROLE_DASHBOARD_CONFIGS.USER;

if (roleConfig.view === 'platformAdmin') {
  return <PlatformAdminDashboard />;
}

return <LegacyDashboardPageContent />;
```

```ts
// frontend/src/shared/ui/labels.ts (new labels)
dashboard: {
  platformAdmin: {
    kpi: {
      activeTenants: '활성 업체 수',
      newTenantsLast7Days: '신규 업체(7일)',
      ccpDocCompletionRate: 'CCP 문서 생성 완료율',
      tenantsWithoutCcpDocs: '문서 미생성 업체 수',
    },
    sections: {
      tenantCodeIssuance: '업체 코드 발급 현황',
      tenantList: '업체 목록',
      ccpDocuments: 'CCP 문서 생성 현황',
    },
  },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx`
Expected: PASS (기존 USER/TENANT_ADMIN 케이스 포함).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/dashboard/roleDashboardConfig.ts frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboard.tsx frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx frontend/src/shared/ui/labels.ts frontend/src/test/dashboard-page.test.tsx
git commit -m "feat: add extensible role dashboard registry and platform admin view"
```

---

### Task 3: 플랫폼 관리자 API 연동 + 섹션 독립 오류 처리

**Files:**

- Modify: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx`
- Modify: `frontend/src/services/dashboardService.ts`
- Modify: `frontend/src/mocks/handlers.ts`
- Modify: `frontend/src/test/dashboard-page.test.tsx`
- Test: `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('shows independent section warning when tenant list API fails', async () => {
  server.use(
    http.get('/api/platform-admin/dashboard/tenants', () =>
      HttpResponse.json({ message: 'error' }, { status: 500 }),
    ),
  );

  useAuthStore.setState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'platform_admin',
    role: 'PLATFORM_ADMIN',
  });

  render(
    <AppProviders>
      <DashboardPage />
    </AppProviders>,
  );

  expect(
    await screen.findByText('업체 목록 데이터를 불러오지 못했습니다.'),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: APP_LABELS.dashboard.platformAdmin.sections.ccpDocuments,
    }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx`
Expected: FAIL because 섹션 독립 에러 처리가 아직 없다.

- [ ] **Step 3: Write minimal implementation**

```tsx
// frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx
const kpiQuery = useQuery({
  queryKey: ['platform-dashboard-kpis'],
  queryFn: getPlatformAdminDashboardKpis,
});
const issuanceQuery = useQuery({
  queryKey: ['platform-dashboard-tenant-code-issuance'],
  queryFn: listPlatformAdminTenantCodeIssuance,
});
const tenantsQuery = useQuery({
  queryKey: ['platform-dashboard-tenants'],
  queryFn: listPlatformAdminTenants,
});
const ccpDocsQuery = useQuery({
  queryKey: ['platform-dashboard-ccp-documents'],
  queryFn: listPlatformAdminCcpDocuments,
});

{
  tenantsQuery.isError ? (
    <Alert severity="warning">업체 목록 데이터를 불러오지 못했습니다.</Alert>
  ) : (
    <TenantListTable items={tenantsQuery.data?.items ?? []} />
  );
}
```

```ts
// frontend/src/mocks/handlers.ts (new endpoints)
http.get('/api/platform-admin/dashboard/kpis', () =>
  HttpResponse.json({
    activeTenants: 2,
    newTenantsLast7Days: 1,
    ccpDocCompletionRate: 78,
    tenantsWithoutCcpDocs: 1,
  }),
),
http.get('/api/platform-admin/dashboard/tenant-code-issuance', () =>
  HttpResponse.json({
    totalIssued: 18,
    issuedThisMonth: 4,
    issuedThisWeek: 2,
    recentIssues: [
      {
        tenantCode: 'TENANT-B',
        companyName: '베타HACCP',
        issuedAt: '2026-06-10T09:30:00.000Z',
        status: 'ACTIVE',
      },
    ],
  }),
),
http.get('/api/platform-admin/dashboard/tenants', () =>
  HttpResponse.json({
    summary: { total: 2, active: 2, inactive: 0 },
    items: [
      {
        tenantCode: 'TENANT-A',
        companyName: '알파푸드',
        adminName: '관리자A',
        adminEmail: 'admin.a@alpha.com',
        status: 'ACTIVE',
        createdAt: '2026-06-10T09:00:00.000Z',
      },
    ],
  }),
),
http.get('/api/platform-admin/dashboard/ccp-documents', () =>
  HttpResponse.json({
    overall: { completionRate: 78, completedTenants: 1, totalTenants: 2 },
    items: [
      {
        tenantCode: 'TENANT-A',
        companyName: '알파푸드',
        generatedCount: 7,
        requiredCount: 8,
        completionRate: 88,
        updatedAt: '2026-06-10T16:35:00.000Z',
      },
    ],
  }),
),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx frontend/src/services/dashboardService.ts frontend/src/mocks/handlers.ts frontend/src/test/dashboard-page.test.tsx
git commit -m "feat: wire platform admin dashboard APIs with isolated error handling"
```

---

### Task 4: 통합 검증 및 회귀 확인

**Files:**

- Modify: `frontend/src/test/dashboard-page.test.tsx`
- Modify: `frontend/src/test/app-shell.test.tsx` (필요 시 역할 노출 회귀 보강)
- Test: `frontend/src/test/dashboard-page.test.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Add final regression assertions**

```tsx
it('keeps tenant admin legacy dashboard blocks', async () => {
  useAuthStore.setState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
  });

  render(
    <AppProviders>
      <DashboardPage />
    </AppProviders>,
  );

  expect(await screen.findByTestId('dashboard-admin-hub')).toBeInTheDocument();
  expect(
    screen.queryByTestId('platform-admin-dashboard'),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests**

Run: `cd frontend ; npm run test -- src/test/dashboard-service.test.ts src/test/dashboard-page.test.tsx src/test/app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 3: Run full verification**

Run: `cd frontend ; npm run lint ; npm run test ; npm run build`
Expected: lint/test/build 성공.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/test/dashboard-service.test.ts frontend/src/test/dashboard-page.test.tsx frontend/src/test/app-shell.test.tsx frontend/src/pages/DashboardPage.tsx frontend/src/pages/dashboard/roleDashboardConfig.ts frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboard.tsx frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx frontend/src/services/dashboardService.ts frontend/src/mocks/handlers.ts frontend/src/shared/ui/labels.ts
git commit -m "test: finalize role-based dashboard regression coverage"
```
