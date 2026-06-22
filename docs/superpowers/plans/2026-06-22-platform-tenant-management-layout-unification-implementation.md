# 플랫폼 업체 관리 레이아웃 통일 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플랫폼 관리의 업체 관리를 신규 경로 `/platform/tenants`로 분리하고, 그리드 기반 운영 화면 + 신규 온보딩 이동 UX를 기존 관리 화면 패턴으로 통일한다.

**Architecture:** 라우트/메뉴/페이지를 분리하고 업체 관리 전용 서비스 계층을 추가한다. 페이지는 `PageHeader + 검색 Paper + AdminGrid + GridPaginationBar` 패턴을 따르며, 데이터는 전용 서비스를 통해 조회하고 향후 전용 API로 내부 교체 가능하게 만든다.

**Tech Stack:** React, TypeScript, MUI, TanStack Query, React Router, Vitest, Testing Library

---

### Task 1: 업체 관리 전용 서비스 계층 추가

**Files:**

- Create: `frontend/src/services/platform/platformTenantManagementService.ts`
- Test: `frontend/src/test/platform-tenant-management-service.test.ts`

- [ ] **Step 1: 실패하는 서비스 테스트 작성**

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  listPlatformTenants,
  type PlatformTenantManagementItem,
} from '../services/platform/platformTenantManagementService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('platformTenantManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps dashboard tenant payload into platform tenant rows', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        summary: { total: 1, active: 1, inactive: 0 },
        items: [
          {
            tenantCode: 'TENANT-A',
            companyName: '테스트푸드',
            adminName: '홍길동',
            adminEmail: 'admin@test.com',
            status: 'ACTIVE',
            createdAt: '2026-06-21T10:30:00.000Z',
          },
        ],
      },
    });

    const result = await listPlatformTenants({
      pageIndex: 0,
      pageSize: 10,
      searchField: 'companyName',
      searchKeyword: '',
      status: 'all',
    });

    const first: PlatformTenantManagementItem = result.items[0];
    expect(first.tenantCode).toBe('TENANT-A');
    expect(first.companyName).toBe('테스트푸드');
    expect(result.total).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `cd frontend; npx vitest run src/test/platform-tenant-management-service.test.ts`
Expected: FAIL with `Cannot find module '../services/platform/platformTenantManagementService'`

- [ ] **Step 3: 최소 구현 코드 작성**

```ts
import { apiClient } from '../api/apiClient';

export type PlatformTenantStatus = 'ACTIVE' | 'INACTIVE';

export type PlatformTenantManagementItem = {
  tenantCode: string;
  companyName: string;
  adminName: string;
  adminEmail: string;
  status: PlatformTenantStatus;
  createdAt: string;
};

export type ListPlatformTenantsParams = {
  pageIndex: number;
  pageSize: number;
  searchField: 'tenantCode' | 'companyName' | 'adminName';
  searchKeyword: string;
  status: 'all' | 'ACTIVE' | 'INACTIVE';
};

export type ListPlatformTenantsResult = {
  items: PlatformTenantManagementItem[];
  total: number;
  active: number;
  inactive: number;
};

type DashboardTenantEnvelope = {
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
  items: PlatformTenantManagementItem[];
};

export async function listPlatformTenants(
  _params: ListPlatformTenantsParams,
): Promise<ListPlatformTenantsResult> {
  const { data } = await apiClient.get<DashboardTenantEnvelope>(
    '/platform-admin/dashboard/tenants',
  );

  return {
    items: data.items ?? [],
    total: data.summary?.total ?? 0,
    active: data.summary?.active ?? 0,
    inactive: data.summary?.inactive ?? 0,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd frontend; npx vitest run src/test/platform-tenant-management-service.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/services/platform/platformTenantManagementService.ts frontend/src/test/platform-tenant-management-service.test.ts
git commit -m "feat: add platform tenant management service"
```

### Task 2: 업체 관리 페이지 컴포넌트 추가

**Files:**

- Create: `frontend/src/pages/platform-admin/tenants/PlatformTenantManagementPage.tsx`
- Test: `frontend/src/test/platform-tenant-management-page.test.tsx`

- [ ] **Step 1: 실패하는 페이지 렌더링 테스트 작성**

```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { appTheme } from '../app/theme';
import { PlatformTenantManagementPage } from '../pages/platform-admin/tenants/PlatformTenantManagementPage';

describe('PlatformTenantManagementPage', () => {
  it('renders page header, grid columns and onboarding CTA', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <ThemeProvider theme={appTheme}>
            <PlatformTenantManagementPage />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('업체 관리')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '신규 온보딩' }),
    ).toBeInTheDocument();
    expect(screen.getByText('업체코드')).toBeInTheDocument();
    expect(screen.getByText('업체명')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `cd frontend; npx vitest run src/test/platform-tenant-management-page.test.tsx`
Expected: FAIL with `Cannot find module '../pages/platform-admin/tenants/PlatformTenantManagementPage'`

- [ ] **Step 3: 최소 페이지 구현 작성**

```tsx
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Select,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminGrid } from '../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../shared/components/data/GridPaginationBar';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useGridPagination } from '../../../shared/hooks/useGridPagination';
import { listPlatformTenants } from '../../../services/platform/platformTenantManagementService';
import { APP_LABELS } from '../../../shared/constants/labels';

export function PlatformTenantManagementPage() {
  const navigate = useNavigate();
  const { pageIndex, pageSize, setPageIndex, setPageSize, resetPage } =
    useGridPagination();

  const [searchField, setSearchField] = useState<
    'tenantCode' | 'companyName' | 'adminName'
  >('companyName');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'ACTIVE' | 'INACTIVE'
  >('all');
  const [applied, setApplied] = useState({
    searchField: 'companyName' as 'tenantCode' | 'companyName' | 'adminName',
    searchKeyword: '',
    status: 'all' as 'all' | 'ACTIVE' | 'INACTIVE',
  });

  const query = useQuery({
    queryKey: [
      'platform-admin',
      'tenant-management',
      pageIndex,
      pageSize,
      applied.searchField,
      applied.searchKeyword,
      applied.status,
    ],
    queryFn: () =>
      listPlatformTenants({
        pageIndex,
        pageSize,
        searchField: applied.searchField,
        searchKeyword: applied.searchKeyword,
        status: applied.status,
      }),
    retry: false,
  });

  const rows = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  return (
    <Stack spacing={2} data-testid="platform-tenant-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.systemGroup}
        title={APP_LABELS.menu.platformFactoryManagement}
        description="업체 운영 현황을 조회하고 신규 온보딩으로 연결합니다."
      />

      {query.isError ? (
        <Alert severity="warning">업체 목록을 불러오지 못했습니다.</Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems="flex-end"
        >
          <Select
            value={searchField}
            size="small"
            onChange={(event) =>
              setSearchField(
                event.target.value as
                  | 'tenantCode'
                  | 'companyName'
                  | 'adminName',
              )
            }
          >
            <MenuItem value="tenantCode">업체코드</MenuItem>
            <MenuItem value="companyName">업체명</MenuItem>
            <MenuItem value="adminName">관리자명</MenuItem>
          </Select>
          <TextField
            size="small"
            label="검색어"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
          <Select
            value={statusFilter}
            size="small"
            onChange={(event) =>
              setStatusFilter(
                event.target.value as 'all' | 'ACTIVE' | 'INACTIVE',
              )
            }
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="ACTIVE">활성</MenuItem>
            <MenuItem value="INACTIVE">비활성</MenuItem>
          </Select>
          <Button
            variant="contained"
            onClick={() => {
              resetPage();
              setApplied({
                searchField,
                searchKeyword: searchKeyword.trim(),
                status: statusFilter,
              });
            }}
          >
            조회
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            onClick={() => navigate('/platform/onboarding')}
          >
            신규 온보딩
          </Button>
        </Stack>
      </Paper>

      <AdminGrid ariaLabel="업체 목록">
        <TableHead>
          <TableRow>
            <TableCell>업체코드</TableCell>
            <TableCell>업체명</TableCell>
            <TableCell>관리자명</TableCell>
            <TableCell>관리자이메일</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>생성일</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                조회 결과가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.tenantCode}>
                <TableCell>{row.tenantCode}</TableCell>
                <TableCell>{row.companyName}</TableCell>
                <TableCell>{row.adminName}</TableCell>
                <TableCell>{row.adminEmail}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.status === 'ACTIVE' ? '활성' : '비활성'}
                    color={row.status === 'ACTIVE' ? 'success' : 'default'}
                    variant={row.status === 'ACTIVE' ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>{row.createdAt?.slice(0, 10) ?? '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminGrid>

      <GridPaginationBar
        page={pageIndex}
        pageSize={pageSize}
        totalCount={query.data?.total ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />
    </Stack>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd frontend; npx vitest run src/test/platform-tenant-management-page.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/pages/platform-admin/tenants/PlatformTenantManagementPage.tsx frontend/src/test/platform-tenant-management-page.test.tsx
git commit -m "feat: add platform tenant management page"
```

### Task 3: 라우팅/메뉴 연결 및 보호 규칙 반영

**Files:**

- Modify: `frontend/src/app/router/AppRoutes.tsx`
- Modify: `frontend/src/shared/components/layout/workMenuConfig.ts`
- Modify: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: 실패하는 라우트/메뉴 테스트 추가**

```tsx
it('allows PLATFORM_ADMIN to access platform tenant management route', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: '000001',
    userId: 'platform_admin',
    role: 'PLATFORM_ADMIN',
  });

  renderAppRoutesAt('/platform/tenants');

  expect(
    await screen.findByTestId('platform-tenant-management-page'),
  ).toBeInTheDocument();
});

it('work menu 업체 관리 points to /platform/tenants', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: '000001',
    userId: 'platform_admin',
    role: 'PLATFORM_ADMIN',
  });

  renderAppRoutesAt('/dashboard');

  fireEvent.click(
    await screen.findByRole('button', { name: APP_LABELS.menu.systemGroup }),
  );

  expect(
    await screen.findByRole('link', {
      name: APP_LABELS.menu.platformFactoryManagement,
    }),
  ).toHaveAttribute('href', expect.stringContaining('/platform/tenants'));
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `cd frontend; npx vitest run src/test/app-shell.test.tsx -t "platform tenant management"`
Expected: FAIL with missing route/menu mapping

- [ ] **Step 3: 최소 라우팅/메뉴 구현**

`frontend/src/app/router/AppRoutes.tsx` 변경 코드:

```tsx
import { PlatformTenantManagementPage } from '../../pages/platform-admin/tenants/PlatformTenantManagementPage';

<Route
  path="/platform/tenants"
  element={
    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
      <PlatformTenantManagementPage />
    </ProtectedRoute>
  }
/>;
```

`frontend/src/shared/components/layout/workMenuConfig.ts` 변경 코드:

```ts
{
  label: APP_LABELS.menu.platformFactoryManagement,
  description: '업체 코드 발급과 플랫폼 관리 대상을 운영합니다.',
  path: '/platform/tenants',
  roles: ['PLATFORM_ADMIN'],
  icon: 'Business',
},
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd frontend; npx vitest run src/test/app-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/app/router/AppRoutes.tsx frontend/src/shared/components/layout/workMenuConfig.ts frontend/src/test/app-shell.test.tsx
git commit -m "feat: wire platform tenant management route and menu"
```

### Task 4: 페이지 UX 보강(로딩/오류/빈상태/온보딩 이동) 검증

**Files:**

- Modify: `frontend/src/test/platform-tenant-management-page.test.tsx`
- Modify: `frontend/src/pages/platform-admin/tenants/PlatformTenantManagementPage.tsx`

- [ ] **Step 1: 실패하는 UX 테스트 추가**

```tsx
it('navigates to onboarding when CTA is clicked', async () => {
  const user = userEvent.setup();

  renderWithRouter('/platform/tenants');

  await user.click(await screen.findByRole('button', { name: '신규 온보딩' }));

  expect(mockNavigate).toHaveBeenCalledWith('/platform/onboarding');
});

it('shows empty state when no tenant rows', async () => {
  mockListPlatformTenantsResolved({
    items: [],
    total: 0,
    active: 0,
    inactive: 0,
  });

  renderWithRouter('/platform/tenants');

  expect(await screen.findByText('조회 결과가 없습니다.')).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `cd frontend; npx vitest run src/test/platform-tenant-management-page.test.tsx`
Expected: FAIL with missing behavior assertions

- [ ] **Step 3: 최소 보강 구현**

```tsx
{query.isPending ? (
  Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={`tenant-skeleton-${index}`} data-testid={`tenant-grid-skeleton-row-${index}`}>
      <TableCell colSpan={6}>...</TableCell>
    </TableRow>
  ))
) : rows.length === 0 ? (
  <TableRow>
    <TableCell colSpan={6} align="center">조회 결과가 없습니다.</TableCell>
  </TableRow>
) : (
  ...
)}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd frontend; npx vitest run src/test/platform-tenant-management-page.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/pages/platform-admin/tenants/PlatformTenantManagementPage.tsx frontend/src/test/platform-tenant-management-page.test.tsx
git commit -m "test: cover tenant management page ux states"
```

### Task 5: 통합 검증 및 정리

**Files:**

- Modify: `frontend/src/shared/constants/labels.ts` (필요 시 문구만)

- [ ] **Step 1: 문구 누락 검증 테스트 작성/보강**

```ts
it('contains platform tenant management menu labels', () => {
  expect(APP_LABELS.menu.platformFactoryManagement).toBe('업체 관리');
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd frontend; npx vitest run src/test/ui-labels.test.ts`
Expected: FAIL only if label mismatch exists

- [ ] **Step 3: 최소 문구 수정(필요한 경우만)**

```ts
pageTitle: {
  ...,
  platformTenantManagement: '업체 관리',
}
```

- [ ] **Step 4: 전체 검증 실행**

Run: `cd frontend; npm run lint; npm run test; npm run build`
Expected: lint/test/build all succeed

- [ ] **Step 5: 최종 커밋**

```bash
git add frontend/src/shared/constants/labels.ts frontend/src/test/ui-labels.test.ts
git commit -m "chore: finalize tenant management labels and verification"
```

## Spec Coverage Self-Review

- 라우팅 요구(`/platform/tenants` 추가, `/platform/onboarding` 유지): Task 3에서 구현/검증
- 메뉴 통일(업체 관리 링크 변경): Task 3에서 구현/검증
- 그리드/필터/CTA UX: Task 2, Task 4에서 구현/검증
- 확장형 서비스 계층 분리: Task 1에서 구현
- 권한 보호/리다이렉트: Task 3 테스트에서 검증

## Placeholder Scan

- `TBD`, `TODO`, `추후` 같은 미정 문구 없음
- 모든 코드 변경 스텝에 코드 블록 포함
- 모든 검증 스텝에 실행 명령/기대 결과 포함

## Type/Signature Consistency

- 목록 데이터 타입은 `PlatformTenantManagementItem`로 일관
- 상태 타입은 `'all' | 'ACTIVE' | 'INACTIVE'`로 일관
- 신규 페이지 테스트 식별자는 `platform-tenant-management-page`로 일관
