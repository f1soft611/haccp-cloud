# Role-Based Dashboard Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 상단 업무 메뉴를 제거하고 대시보드를 역할 기반 허브로 전환해 USER는 할 일 중심 탐색, 관리자(PLATFORM_ADMIN/TENANT_ADMIN)는 관리자 카드에서 관리 기능에 접근하게 만든다.

**Architecture:** `AppLayout`에서 `WorkMenuBar`를 제거해 전역 내비게이션을 단순화하고, `DashboardPage`에서 role 기반 섹션 분기 렌더링을 도입한다. 라우트 계약은 유지하고 접근 제어는 기존 인증/권한 경계를 재사용한다. 테스트는 셸 구조 변화와 역할별 카드 노출을 각각 분리 검증한다.

**Tech Stack:** React 19, TypeScript, MUI 7, React Router 7, Zustand 5, TanStack Query 5, Vitest, Testing Library

---

## File Structure Map

- Modify: `frontend/src/shared/layout/AppLayout.tsx` (상단 메뉴 제거)
- Modify: `frontend/src/pages/DashboardPage.tsx` (역할별 허브 카드 섹션 추가)
- Modify: `frontend/src/shared/ui/labels.ts` (허브 카드 라벨 추가)
- Modify: `frontend/src/test/app-shell.test.tsx` (work-menu 제거 검증)
- Modify: `frontend/src/test/dashboard-page.test.tsx` (USER/Admin 역할별 노출 검증)

---

### Task 1: App shell에서 상단 메뉴 제거를 테스트로 고정

**Files:**

- Modify: `frontend/src/test/app-shell.test.tsx`
- Modify: `frontend/src/shared/layout/AppLayout.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('renders top bar and footer without work menu in protected layout', () => {
  useAuthStore.setState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
  });

  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<div>dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByTestId('top-gov-bar')).toBeInTheDocument();
  expect(screen.queryByTestId('work-menu-bar')).not.toBeInTheDocument();
  expect(screen.getByTestId('portal-footer')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL because `work-menu-bar` is still rendered.

- [ ] **Step 3: Write minimal implementation**

```tsx
// frontend/src/shared/layout/AppLayout.tsx
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { TopGovBar } from './TopGovBar';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';

export function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopGovBar />
      <PageShell>
        <Outlet />
      </PageShell>
      <PortalFooter />
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/layout/AppLayout.tsx frontend/src/test/app-shell.test.tsx
git commit -m "refactor: remove top work menu from app shell"
```

---

### Task 2: USER/Admin 대시보드 허브 분기 도입

**Files:**

- Modify: `frontend/src/test/dashboard-page.test.tsx`
- Modify: `frontend/src/shared/ui/labels.ts`
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Test: `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('shows only user todo hub cards for USER role', async () => {
  useAuthStore.setState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'normal_user',
    role: 'USER',
  });

  render(
    <AppProviders>
      <DashboardPage />
    </AppProviders>,
  );

  expect(await screen.findByTestId('dashboard-user-hub')).toBeInTheDocument();
  expect(screen.queryByTestId('dashboard-admin-hub')).not.toBeInTheDocument();
});

it('shows admin management hub cards for TENANT_ADMIN role', async () => {
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
  expect(screen.getByRole('link', { name: '사용자 관리' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '부서 관리' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '업체 온보딩' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx`
Expected: FAIL because `dashboard-user-hub` and `dashboard-admin-hub` do not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
// frontend/src/shared/ui/labels.ts (additions)
dashboard: {
  // ...existing
  hub: {
    userTitle: '내 업무 바로가기',
    adminTitle: '관리자 전용 관리 메뉴',
    userLinks: {
      documents: '문서 템플릿',
      history: '문서 변경 이력',
    },
    adminLinks: {
      users: '사용자 관리',
      departments: '부서 관리',
      onboarding: '업체 온보딩',
    },
  },
}
```

```tsx
// frontend/src/pages/DashboardPage.tsx (excerpt)
import { Link as RouterLink } from 'react-router-dom';

const isAdminRole = role === 'PLATFORM_ADMIN' || role === 'TENANT_ADMIN';

<Paper data-testid="dashboard-user-hub" sx={{ p: 2.25, borderRadius: 3 }}>
  <Typography variant="h6" fontWeight={700}>
    {APP_LABELS.dashboard.hub.userTitle}
  </Typography>
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.25 }}>
    <Button component={RouterLink} to="/documents" variant="contained">
      {APP_LABELS.dashboard.hub.userLinks.documents}
    </Button>
    <Button component={RouterLink} to="/document-history" variant="outlined">
      {APP_LABELS.dashboard.hub.userLinks.history}
    </Button>
  </Stack>
</Paper>;

{
  isAdminRole ? (
    <Paper data-testid="dashboard-admin-hub" sx={{ p: 2.25, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight={700}>
        {APP_LABELS.dashboard.hub.adminTitle}
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ mt: 1.25 }}
      >
        <Button component={RouterLink} to="/users" variant="outlined">
          {APP_LABELS.dashboard.hub.adminLinks.users}
        </Button>
        <Button component={RouterLink} to="/departments" variant="outlined">
          {APP_LABELS.dashboard.hub.adminLinks.departments}
        </Button>
        <Button component={RouterLink} to="/onboarding" variant="outlined">
          {APP_LABELS.dashboard.hub.adminLinks.onboarding}
        </Button>
      </Stack>
    </Paper>
  ) : null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/shared/ui/labels.ts frontend/src/test/dashboard-page.test.tsx
git commit -m "feat: add role-based dashboard hub sections"
```

---

### Task 3: 통합 회귀 검증 및 마무리

**Files:**

- Modify: 없음 (검증 중심)
- Test: `frontend/src/test/app-shell.test.tsx`, `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: Run focused regression tests**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx src/test/dashboard-page.test.tsx`
Expected: PASS.

- [ ] **Step 2: Run project verification**

Run: `cd frontend ; npm run lint ; npm run test ; npm run build`
Expected: lint/test/build all succeed (known non-blocking warning in `public/mockServiceWorker.js` may remain).

- [ ] **Step 3: Commit verification artifacts**

```bash
git add -A
git commit -m "test: verify role-based dashboard hub rollout"
```

---

## Plan Self-Review

- Spec coverage: 상단 메뉴 제거, USER 허브 단순화, 관리자 카드 분리 노출, 테스트 갱신을 Task 1~3에서 모두 다룸.
- Placeholder scan: `TBD`, `TODO`, 추상 표현 없이 파일/명령/코드 예시를 명시함.
- Type consistency: role 판정(`PLATFORM_ADMIN`/`TENANT_ADMIN`)과 라벨 키(`dashboard.hub.*`)를 모든 단계에서 일관되게 사용함.
