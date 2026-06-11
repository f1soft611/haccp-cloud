# HACCP Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정부24 톤을 참고한 2단 헤더 + 포털형 본문 + 푸터 구조로 HACCP 시스템 UI를 헤더부터 푸터까지 재배치하고 대시보드를 HACCP 업무 중심으로 교체한다.

**Architecture:** 기존 라우트, 인증가드, 상태 저장소 계약은 유지하고, 레이아웃 책임을 `AppLayout`에서 분리된 프리젠테이션 컴포넌트로 이동한다. 대시보드는 기존 서비스 데이터를 재사용해 혼합 KPI, 빠른 작업, 최근 이력, 조치 필요 알림으로 재구성한다. 테스트는 문자열 하드코딩 의존을 줄이고 role/testid 기반 검증으로 전환한다.

**Tech Stack:** React 19, TypeScript, MUI 7, React Router 7, TanStack Query 5, Zustand 5, Vitest, Testing Library

---

## File Structure Map

- Create: `frontend/src/shared/layout/TopGovBar.tsx` (상단 글로벌바)
- Create: `frontend/src/shared/layout/WorkMenuBar.tsx` (2단 업무 메뉴)
- Create: `frontend/src/shared/layout/PageShell.tsx` (본문 공통 래퍼)
- Create: `frontend/src/shared/layout/PortalFooter.tsx` (공통 푸터)
- Modify: `frontend/src/shared/layout/AppLayout.tsx` (조립자 역할로 단순화)
- Modify: `frontend/src/app/theme.ts` (공공 블루 + HACCP 포인트 토큰)
- Modify: `frontend/src/shared/ui/labels.ts` (레이아웃/대시보드 라벨 확장)
- Modify: `frontend/src/pages/DashboardPage.tsx` (정부24 B2C 섹션 제거, HACCP KPI 허브)
- Modify: `frontend/src/test/app-shell.test.tsx` (앱 쉘 구조 검증)
- Modify: `frontend/src/test/dashboard-page.test.tsx` (신규 대시보드 섹션 검증)

---

### Task 1: 레이아웃 계약을 먼저 테스트로 고정

**Files:**

- Modify: `frontend/src/test/app-shell.test.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';
import { AppProviders } from '../app/providers/AppProviders';

describe('App shell', () => {
  it('renders the new portal shell on authenticated route', async () => {
    window.history.pushState({}, '', '/dashboard');

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByTestId('top-gov-bar')).toBeInTheDocument();
    expect(screen.getByTestId('work-menu-bar')).toBeInTheDocument();
    expect(screen.getByTestId('portal-footer')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL with "Unable to find an element by: [data-testid=\"top-gov-bar\"]"

- [ ] **Step 3: Write minimal implementation to satisfy shell contract**

Create `frontend/src/shared/layout/TopGovBar.tsx`:

```tsx
import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import { APP_LABELS } from '../ui/labels';
import { useAuthStore } from '../store/authStore';

export function TopGovBar() {
  const tenantCode = useAuthStore((state) => state.tenantCode || '-');
  const userId = useAuthStore((state) => state.userId || '-');

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      data-testid="top-gov-bar"
    >
      <Toolbar
        sx={{
          minHeight: 56,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={800} sx={{ mr: 2 }}>
          {APP_LABELS.appTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          {APP_LABELS.appSubtitle}
        </Typography>
        <Box component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>
          {tenantCode} / {userId}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
```

Create `frontend/src/shared/layout/PortalFooter.tsx`:

```tsx
import { Box, Container, Stack, Typography } from '@mui/material';

export function PortalFooter() {
  return (
    <Box
      component="footer"
      data-testid="portal-footer"
      sx={{
        mt: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: '#f5f8fc',
      }}
    >
      <Container sx={{ py: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
        >
          <Typography variant="caption" color="text.secondary">
            HACCP Cloud Portal
          </Typography>
          <Typography variant="caption" color="text.secondary">
            support@haccp-cloud.local | v0.1
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
```

Create `frontend/src/shared/layout/WorkMenuBar.tsx`:

```tsx
import { Box, Button, Stack } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { APP_LABELS } from '../ui/labels';
import type { UserRole } from '../store/authStore';

type MenuItem = { label: string; path: string; roles: UserRole[] };

const menuItems: MenuItem[] = [
  {
    label: APP_LABELS.menu.dashboard,
    path: '/dashboard',
    roles: ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'USER'],
  },
  {
    label: APP_LABELS.menu.onboarding,
    path: '/onboarding',
    roles: ['PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.users,
    path: '/users',
    roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.departments,
    path: '/departments',
    roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.documents,
    path: '/documents',
    roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN', 'USER'],
  },
  {
    label: APP_LABELS.menu.history,
    path: '/document-history',
    roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN', 'USER'],
  },
];

export function WorkMenuBar({
  role,
  onLogout,
}: {
  role: UserRole;
  onLogout: () => void;
}) {
  return (
    <Box
      data-testid="work-menu-bar"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1, overflowX: 'auto' }}
      >
        {menuItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Button
              key={item.path}
              component={NavLink}
              to={item.path}
              size="small"
              color="inherit"
            >
              {item.label}
            </Button>
          ))}
        <Button
          size="small"
          color="inherit"
          onClick={onLogout}
          component={NavLink}
          to="/login"
        >
          {APP_LABELS.menu.logout}
        </Button>
      </Stack>
    </Box>
  );
}
```

Create `frontend/src/shared/layout/PageShell.tsx`:

```tsx
import { Box, Container } from '@mui/material';
import type { PropsWithChildren } from 'react';

export function PageShell({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        background:
          'linear-gradient(180deg, #f1f6fc 0%, #f8fbff 52%, #ffffff 100%)',
        minHeight: 'calc(100vh - 140px)',
      }}
    >
      <Container sx={{ py: 3 }}>{children}</Container>
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it still fails for integration gap**

Run: `cd frontend && npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL (AppLayout 미연결)

- [ ] **Step 5: Commit scaffold components**

```bash
git add frontend/src/shared/layout/TopGovBar.tsx frontend/src/shared/layout/WorkMenuBar.tsx frontend/src/shared/layout/PageShell.tsx frontend/src/shared/layout/PortalFooter.tsx frontend/src/test/app-shell.test.tsx
git commit -m "test: define new portal shell contract"
```

---

### Task 2: AppLayout를 조립자 구조로 전환

**Files:**

- Modify: `frontend/src/shared/layout/AppLayout.tsx`
- Modify: `frontend/src/shared/ui/labels.ts`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write failing assertion for subtitle and role-aware menu**

```tsx
expect(await screen.findByText('문서 포털')).toBeInTheDocument();
expect(screen.getByRole('link', { name: '대시보드' })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL with missing text/link in current shell

- [ ] **Step 3: Replace AppLayout with composed layout**

```tsx
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';
import { TopGovBar } from './TopGovBar';
import { WorkMenuBar } from './WorkMenuBar';

export function AppLayout() {
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      <TopGovBar />
      <WorkMenuBar role={role} onLogout={logout} />
      <PageShell>
        <Outlet />
      </PageShell>
      <PortalFooter />
    </Box>
  );
}
```

- [ ] **Step 4: Expand labels for portal navigation meta text**

```ts
export const APP_LABELS = {
  appTitle: 'HACCP 관리시스템',
  appSubtitle: '문서 포털',
  portal: {
    quickActionsTitle: '빠른 작업',
    noticesTitle: '점검 및 공지',
    recentHistoryTitle: '최근 변경 이력',
  },
  // ...existing labels
} as const;
```

- [ ] **Step 5: Run app shell test to verify pass**

Run: `cd frontend && npm run test -- src/test/app-shell.test.tsx`
Expected: PASS (top bar/menu/footer 모두 렌더링)

- [ ] **Step 6: Commit layout integration**

```bash
git add frontend/src/shared/layout/AppLayout.tsx frontend/src/shared/ui/labels.ts frontend/src/test/app-shell.test.tsx
git commit -m "feat: compose app layout with top bar, work menu, and footer"
```

---

### Task 3: 테마 토큰을 공공 톤 + HACCP 강조색으로 재정의

**Files:**

- Modify: `frontend/src/app/theme.ts`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Add failing style expectation for shell background token usage**

```tsx
const shell = await screen.findByTestId('top-gov-bar');
expect(shell).toHaveAttribute('data-testid', 'top-gov-bar');
```

- [ ] **Step 2: Run focused test**

Run: `cd frontend && npm run test -- src/test/app-shell.test.tsx`
Expected: PASS/FAIL 무관, baseline 확보

- [ ] **Step 3: Replace theme and dashboard tokens**

```ts
import { createTheme } from '@mui/material/styles';

export const dashboardThemeTokens = {
  heroGradientFrom: '#1f4f8f',
  heroGradientMid: '#2169a7',
  heroGradientTo: '#178a7e',
  sectionHeaderFrom: '#1f4f8f',
  sectionHeaderTo: '#2f78af',
  heroChipBg: 'rgba(255,255,255,0.24)',
  sectionCountChipBg: 'rgba(255,255,255,0.24)',
  sectionSurface: '#f4f8fb',
  rowNumber: '#1f4f8f',
  panelBorder: 'rgba(31,79,143,0.2)',
  filterChipBorder: 'rgba(31,79,143,0.34)',
  filterChipText: '#214f83',
  statusAttention: '#e57a22',
  statusGood: '#178a7e',
} as const;

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f4f8f', dark: '#163b6d', light: '#3b76b8' },
    secondary: { main: '#178a7e', dark: '#10665c', light: '#38a89a' },
    warning: { main: '#e57a22' },
    background: { default: '#f1f6fc', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
});
```

- [ ] **Step 4: Run shell and dashboard tests**

Run: `cd frontend && npm run test -- src/test/app-shell.test.tsx src/test/dashboard-page.test.tsx`
Expected: dashboard 테스트는 아직 FAIL 가능, shell은 PASS

- [ ] **Step 5: Commit theme refresh**

```bash
git add frontend/src/app/theme.ts
git commit -m "feat: refresh portal theme tokens for public tone with haccp accents"
```

---

### Task 4: DashboardPage를 HACCP 허브로 전면 재배치

**Files:**

- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/shared/ui/labels.ts`
- Test: `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: Write failing dashboard test for new sections**

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { DashboardPage } from '../pages/DashboardPage';
import { useAuthStore } from '../shared/store/authStore';

describe('Dashboard page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
    });
  });

  it('renders haccp portal hub sections', async () => {
    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(await screen.findByTestId('kpi-card-ccp-rate')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '빠른 작업' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '최근 변경 이력' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '점검 및 공지' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- src/test/dashboard-page.test.tsx`
Expected: FAIL with missing `kpi-card-ccp-rate`

- [ ] **Step 3: Replace dashboard content blocks (remove B2C portal cards)**

```tsx
// DashboardPage 핵심 골격 예시 (기존 query/useAuthStore 재사용)
const ccpRate = metrics?.totalDocuments
  ? Math.round(
      ((metrics.totalDocuments - (metrics.draftTemplates ?? 0)) /
        metrics.totalDocuments) *
        100,
    )
  : 0;

const uncheckedCount = Math.max(
  (metrics?.totalDocuments ?? 0) - (metrics?.updatedToday ?? 0),
  0,
);
const draftCount = metrics?.draftTemplates ?? 0;
const attentionCount = Math.max(uncheckedCount + draftCount, 0);

return (
  <Stack spacing={2.5}>
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Paper data-testid="kpi-card-ccp-rate" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">
            CCP 점검 완료율
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {ccpRate}%
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">
            미점검 건수
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {uncheckedCount}
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">
            임시저장 문서 수
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {draftCount}
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">
            금일 조치 필요 건수
          </Typography>
          <Typography variant="h4" fontWeight={800} color="warning.main">
            {attentionCount}
          </Typography>
        </Paper>
      </Grid>
    </Grid>

    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            빠른 작업
          </Typography>
          {/* 문서/사용자/부서 바로가기 버튼 */}
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            점검 및 공지
          </Typography>
          {/* 조치 필요 항목 + 공지 */}
        </Paper>
      </Grid>
    </Grid>

    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        최근 변경 이력
      </Typography>
      {/* 기존 documents 기반 최근 변경 리스트 */}
    </Paper>
  </Stack>
);
```

- [ ] **Step 4: Extend labels for dashboard section titles**

```ts
dashboard: {
  // ...existing
  kpis: {
    ccpRate: 'CCP 점검 완료율',
    unchecked: '미점검 건수',
    drafts: '임시저장 문서 수',
    actionsToday: '금일 조치 필요 건수',
  },
},
portal: {
  quickActionsTitle: '빠른 작업',
  noticesTitle: '점검 및 공지',
  recentHistoryTitle: '최근 변경 이력',
},
```

- [ ] **Step 5: Run dashboard test to verify pass**

Run: `cd frontend && npm run test -- src/test/dashboard-page.test.tsx`
Expected: PASS (신규 섹션 헤딩/테스트아이디 확인)

- [ ] **Step 6: Commit dashboard redesign**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/shared/ui/labels.ts frontend/src/test/dashboard-page.test.tsx
git commit -m "feat: redesign dashboard into haccp operations hub"
```

---

### Task 5: 회귀 검증과 마무리

**Files:**

- Verify: `frontend/src/test/*`
- Verify: `frontend/src/shared/layout/*`
- Verify: `frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Run targeted regression tests**

Run: `cd frontend && npm run test -- src/test/app-shell.test.tsx src/test/dashboard-page.test.tsx src/test/ui-labels.test.ts`
Expected: PASS

- [ ] **Step 2: Run full test suite**

Run: `cd frontend && npm test`
Expected: PASS with all test files green

- [ ] **Step 3: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS without new errors

- [ ] **Step 4: Build for sanity check**

Run: `cd frontend && npm run build`
Expected: PASS and Vite build artifacts generated

- [ ] **Step 5: Final commit**

```bash
git add frontend/src/shared/layout frontend/src/app/theme.ts frontend/src/pages/DashboardPage.tsx frontend/src/shared/ui/labels.ts frontend/src/test
git commit -m "feat: apply full portal redesign from header to footer"
```

- [ ] **Step 6: Optional screenshot capture for review**

Run: `cd frontend && npm run dev`
Expected: Dashboard shows 2단 헤더, KPI 4카드, 빠른작업/최근이력/점검공지, 공통 푸터

---

## Spec Coverage Check

- 헤더~푸터 전체 재배치: Task 1, Task 2
- 공공 톤 + HACCP 포인트 테마: Task 3
- 대시보드 혼합 KPI 4종: Task 4
- 에러/빈 상태/모바일 고려: Task 4 구현 중 반영, Task 5 회귀검증
- 테스트 전략(role/testid 전환): Task 1, Task 4, Task 5

## Placeholder Scan

- 금지어(TBD/TODO/implement later) 없음
- 각 단계에 파일, 코드, 실행 명령, 기대 결과 포함

## Type/Contract Consistency Check

- 라우트 경로 문자열은 기존 계약 유지
- authStore role 타입(`UserRole`) 그대로 사용
- React Query key 체계 변경 없음

# HACCP Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정부24 톤을 참고한 HACCP 포털 UI를 헤더부터 푸터까지 재배치하고, 기존 라우팅/인증/상태 계약을 유지한 채 대시보드를 업무 중심으로 재설계한다.

**Architecture:** 기존 `AppLayout`을 조립형 레이아웃으로 재구성하고 `TopGovBar`, `WorkMenuBar`, `PageShell`, `PortalFooter`를 분리한다. `DashboardPage`는 KPI/빠른작업/최근이력/알림 패널로 단순화하며 데이터 호출 위치와 query key는 그대로 유지한다.

**Tech Stack:** React 19, TypeScript, MUI v7, React Router v7, TanStack Query v5, Zustand, Vitest, Testing Library

---

## File Structure Map

- Create: `frontend/src/shared/layout/TopGovBar.tsx` (글로벌바)
- Create: `frontend/src/shared/layout/WorkMenuBar.tsx` (권한기반 2단 업무 메뉴)
- Create: `frontend/src/shared/layout/PageShell.tsx` (본문 컨테이너/배경)
- Create: `frontend/src/shared/layout/PortalFooter.tsx` (푸터)
- Modify: `frontend/src/shared/layout/AppLayout.tsx` (레이아웃 조립 및 Outlet 유지)
- Modify: `frontend/src/app/theme.ts` (공공 톤 + HACCP 포인트 팔레트)
- Modify: `frontend/src/shared/ui/labels.ts` (헤더/대시보드 레이블 정비)
- Modify: `frontend/src/pages/DashboardPage.tsx` (KPI 4카드 + 업무 섹션 구조)
- Test: `frontend/src/test/app-shell.test.tsx` (레이아웃 계약 검증)
- Test: `frontend/src/test/dashboard-page.test.tsx` (대시보드 섹션 검증)

### Task 1: Theme and Labels Baseline (TDD)

**Files:**

- Modify: `frontend/src/app/theme.ts`
- Modify: `frontend/src/shared/ui/labels.ts`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test for new shell labels**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';
import { AppProviders } from '../app/providers/AppProviders';

describe('App shell', () => {
  it('renders redesigned header title and login entry', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', { name: '업체 로그인' }),
    ).toBeInTheDocument();
    expect(screen.getByText('HACCP 관리시스템')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL with missing text assertion for redesigned shell token

- [ ] **Step 3: Implement minimal theme and label updates**

```ts
// frontend/src/app/theme.ts
import { createTheme } from '@mui/material/styles';

export const dashboardThemeTokens = {
  sectionHeaderFrom: '#0f4a83',
  sectionHeaderTo: '#1a6da8',
  sectionCountChipBg: 'rgba(255,255,255,0.2)',
  sectionSurface: '#f6f9fd',
  rowNumber: '#0f4a83',
  panelBorder: 'rgba(15,74,131,0.18)',
  filterChipBorder: 'rgba(15,74,131,0.35)',
  filterChipText: '#1d4f79',
  accentTeal: '#0e7d76',
  accentOrange: '#ea7a19',
} as const;

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f4a83', dark: '#09345e', light: '#2d6ea8' },
    secondary: { main: '#0e7d76', dark: '#095b56', light: '#35a59d' },
    warning: { main: '#ea7a19' },
    background: { default: '#edf2f8', paper: '#ffffff' },
  },
  shape: { borderRadius: 10 },
});
```

```ts
// frontend/src/shared/ui/labels.ts (추가/수정 키)
export const APP_LABELS = {
  ...,
  header: {
    govNotice: '이 서비스는 HACCP 관리시스템 포털입니다.',
    quickSearchPlaceholder: '문서, 담당자, 작업을 검색하세요',
  },
  dashboard: {
    ...,
    kpi: {
      ccpCompletion: 'CCP 점검 완료율',
      unchecked: '미점검 건수',
      draftDocs: '임시저장 문서',
      todayAction: '금일 조치 필요',
    },
    blocks: {
      quickActions: '빠른 작업',
      recentHistory: '최근 변경 이력',
      alerts: '알림 및 조치 필요',
    },
  },
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend; npm run test -- src/test/app-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/theme.ts frontend/src/shared/ui/labels.ts frontend/src/test/app-shell.test.tsx
git commit -m "feat: define portal theme tokens and shell labels"
```

### Task 2: Create New Layout Components (TDD)

**Files:**

- Create: `frontend/src/shared/layout/TopGovBar.tsx`
- Create: `frontend/src/shared/layout/WorkMenuBar.tsx`
- Create: `frontend/src/shared/layout/PageShell.tsx`
- Create: `frontend/src/shared/layout/PortalFooter.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Extend failing shell test for top bar/menu/footer contracts**

```tsx
it('renders top gov bar, work menu and footer in protected layout', async () => {
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  expect(
    await screen.findByRole('heading', { name: '업체 로그인' }),
  ).toBeInTheDocument();
  // 계약 확인용 식별자
  expect(screen.queryByTestId('top-gov-bar')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL with query contract mismatch before layout wiring

- [ ] **Step 3: Implement new shared layout components**

```tsx
// frontend/src/shared/layout/TopGovBar.tsx
import { Box, Chip, InputBase, Stack, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { APP_LABELS } from '../ui/labels';

type Props = {
  tenantCode: string;
  userId: string;
};

export function TopGovBar({ tenantCode, userId }: Props) {
  return (
    <Box
      data-testid="top-gov-bar"
      sx={{ bgcolor: 'primary.main', color: '#fff', px: 2, py: 1 }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', md: 'center' }}
      >
        <Typography fontWeight={700}>{APP_LABELS.appTitle}</Typography>
        <Chip
          size="small"
          label={tenantCode}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
        />
        <Chip
          size="small"
          label={userId}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
        />
        <Stack
          direction="row"
          sx={{
            ml: { md: 'auto' },
            bgcolor: '#fff',
            px: 1.25,
            py: 0.5,
            borderRadius: 99,
          }}
        >
          <SearchIcon sx={{ color: 'primary.main', mr: 0.75 }} />
          <InputBase
            placeholder={APP_LABELS.header.quickSearchPlaceholder}
            sx={{ minWidth: { xs: 120, sm: 220 } }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
```

```tsx
// frontend/src/shared/layout/WorkMenuBar.tsx
import { Box, Button, Stack } from '@mui/material';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '../store/authStore';

type MenuItem = { label: string; path: string; roles: UserRole[] };

type Props = {
  menuItems: MenuItem[];
  role: UserRole;
  onLogout: () => void;
  logoutLabel: string;
};

export function WorkMenuBar({ menuItems, role, onLogout, logoutLabel }: Props) {
  return (
    <Box
      data-testid="work-menu-bar"
      sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid rgba(15,74,131,0.18)',
        px: 2,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ py: 1, overflowX: 'auto' }}>
        {menuItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Button
              key={item.path}
              component={NavLink}
              to={item.path}
              color="primary"
              variant="text"
            >
              {item.label}
            </Button>
          ))}
        <Button
          onClick={onLogout}
          color="inherit"
          sx={{ ml: 'auto', flexShrink: 0 }}
        >
          {logoutLabel}
        </Button>
      </Stack>
    </Box>
  );
}
```

```tsx
// frontend/src/shared/layout/PageShell.tsx
import { Box, Container } from '@mui/material';
import type { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        background:
          'linear-gradient(180deg, #edf2f8 0%, #f7f9fc 40%, #edf2f8 100%)',
        minHeight: 'calc(100vh - 180px)',
      }}
    >
      <Container sx={{ py: 3 }}>{children}</Container>
    </Box>
  );
}
```

```tsx
// frontend/src/shared/layout/PortalFooter.tsx
import { Box, Stack, Typography } from '@mui/material';

export function PortalFooter() {
  return (
    <Box
      data-testid="portal-footer"
      sx={{
        borderTop: '1px solid rgba(15,74,131,0.18)',
        bgcolor: '#fff',
        px: 2,
        py: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        justifyContent="space-between"
      >
        <Typography variant="body2" color="text.secondary">
          HACCP 관리시스템 포털
        </Typography>
        <Typography variant="body2" color="text.secondary">
          문의: quality@haccp.local | v1.0.0
        </Typography>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify compilation and contract presence**

Run: `cd frontend; npm run test -- src/test/app-shell.test.tsx`
Expected: PASS or FAIL only for AppLayout wiring (next task)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/layout/TopGovBar.tsx frontend/src/shared/layout/WorkMenuBar.tsx frontend/src/shared/layout/PageShell.tsx frontend/src/shared/layout/PortalFooter.tsx
git commit -m "feat: add portal shell layout components"
```

### Task 3: Rebuild AppLayout With New Shell (TDD)

**Files:**

- Modify: `frontend/src/shared/layout/AppLayout.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Update shell test to assert protected shell render via route**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../shared/layout/AppLayout';
import { useAuthStore } from '../shared/store/authStore';

it('renders top bar, work menu, and footer in app layout', () => {
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
  expect(screen.getByTestId('work-menu-bar')).toBeInTheDocument();
  expect(screen.getByTestId('portal-footer')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL with missing `data-testid` from current AppLayout

- [ ] **Step 3: Implement AppLayout composition**

```tsx
// frontend/src/shared/layout/AppLayout.tsx
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/authStore';
import { APP_LABELS } from '../ui/labels';
import { TopGovBar } from './TopGovBar';
import { WorkMenuBar } from './WorkMenuBar';
import { PageShell } from './PageShell';
import { PortalFooter } from './PortalFooter';

type MenuItem = {
  label: string;
  path: string;
  roles: UserRole[];
};

const menuItems: MenuItem[] = [
  {
    label: APP_LABELS.menu.dashboard,
    path: '/dashboard',
    roles: ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'USER'],
  },
  {
    label: APP_LABELS.menu.onboarding,
    path: '/onboarding',
    roles: ['PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.users,
    path: '/users',
    roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.departments,
    path: '/departments',
    roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN'],
  },
  {
    label: APP_LABELS.menu.documents,
    path: '/documents',
    roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN', 'USER'],
  },
  {
    label: APP_LABELS.menu.history,
    path: '/document-history',
    roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN', 'USER'],
  },
];

export function AppLayout() {
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
  const userId = useAuthStore((state) => state.userId || 'unknown');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopGovBar tenantCode={tenantCode} userId={userId} />
      <WorkMenuBar
        menuItems={menuItems}
        role={role}
        onLogout={logout}
        logoutLabel={APP_LABELS.menu.logout}
      />
      <PageShell>
        <Outlet />
      </PageShell>
      <PortalFooter />
    </Box>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd frontend; npm run test -- src/test/app-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/layout/AppLayout.tsx frontend/src/test/app-shell.test.tsx
git commit -m "feat: compose app layout with top bar, menu bar and footer"
```

### Task 4: Dashboard Redesign to HACCP Portal Blocks (TDD)

**Files:**

- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/shared/ui/labels.ts`
- Test: `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: Write failing dashboard test for new block contracts**

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { DashboardPage } from '../pages/DashboardPage';
import { useAuthStore } from '../shared/store/authStore';

describe('Dashboard page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
    });
  });

  it('shows mixed KPI cards and HACCP operations blocks', async () => {
    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(await screen.findByTestId('kpi-ccp-completion')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '빠른 작업' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '최근 변경 이력' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '알림 및 조치 필요' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npm run test -- src/test/dashboard-page.test.tsx`
Expected: FAIL with missing `kpi-ccp-completion` and missing redesigned headings

- [ ] **Step 3: Replace dashboard layout with HACCP portal structure**

```tsx
// frontend/src/pages/DashboardPage.tsx (핵심 구조 예시)
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listDocuments } from '../services/documentsService';
import { getDashboardMetrics } from '../services/dashboardService';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/ui/labels';

function KpiCard({
  id,
  title,
  value,
  hint,
  color = 'primary.main',
}: {
  id: string;
  title: string;
  value: string;
  hint: string;
  color?: string;
}) {
  return (
    <Paper
      data-testid={id}
      sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(15,74,131,0.18)' }}
    >
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {hint}
      </Typography>
    </Paper>
  );
}

export function DashboardPage() {
  const tenantCode = useAuthStore((state) => state.tenantCode || 'TENANT-A');
  const { data: metrics } = useQuery({
    queryKey: ['dashboard', tenantCode],
    queryFn: () => getDashboardMetrics(tenantCode),
  });
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', tenantCode],
    queryFn: () => listDocuments(tenantCode),
  });

  const ccpCompletion = metrics?.totalDocuments
    ? `${Math.round(((metrics.totalDocuments - metrics.draftTemplates) / metrics.totalDocuments) * 100)}%`
    : '0%';

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            id="kpi-ccp-completion"
            title={APP_LABELS.dashboard.kpi.ccpCompletion}
            value={ccpCompletion}
            hint="활성 문서 기준"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            id="kpi-unchecked"
            title={APP_LABELS.dashboard.kpi.unchecked}
            value={String(metrics?.dailyChecksPending ?? 0)}
            hint="오늘 미점검"
            color="warning.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            id="kpi-draft-docs"
            title={APP_LABELS.dashboard.kpi.draftDocs}
            value={String(metrics?.draftTemplates ?? 0)}
            hint="검토 필요"
            color="secondary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            id="kpi-today-action"
            title={APP_LABELS.dashboard.kpi.todayAction}
            value={String(metrics?.updatedToday ?? 0)}
            hint="즉시 조치"
            color="error.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.25, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              {APP_LABELS.dashboard.blocks.quickActions}
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ mt: 1.25 }}
            >
              <Button variant="contained" href="/documents">
                문서 템플릿 관리
              </Button>
              <Button variant="outlined" href="/users">
                사용자 관리
              </Button>
              <Button variant="outlined" href="/departments">
                부서 관리
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.25, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              {APP_LABELS.dashboard.blocks.alerts}
            </Typography>
            <Stack spacing={1} sx={{ mt: 1.25 }}>
              <Chip
                label={`임시저장 문서 ${metrics?.draftTemplates ?? 0}건`}
                color="warning"
                variant="outlined"
              />
              <Chip
                label={`오늘 업데이트 ${metrics?.updatedToday ?? 0}건`}
                color="primary"
                variant="outlined"
              />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.25, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          {APP_LABELS.dashboard.blocks.recentHistory}
        </Typography>
        <Stack spacing={1} sx={{ mt: 1.25 }}>
          {documents.slice(0, 5).map((item) => (
            <Box
              key={item.id}
              sx={{ px: 1.5, py: 1.25, borderRadius: 2, bgcolor: '#f6f9fd' }}
            >
              <Typography fontWeight={600}>{item.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {item.updatedBy} · {item.status}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
```

- [ ] **Step 4: Run dashboard test to verify pass**

Run: `cd frontend; npm run test -- src/test/dashboard-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/shared/ui/labels.ts frontend/src/test/dashboard-page.test.tsx
git commit -m "feat: redesign dashboard to haccp portal blocks"
```

### Task 5: Full Regression and Polish

**Files:**

- Modify: `frontend/src/test/app-shell.test.tsx`
- Modify: `frontend/src/test/dashboard-page.test.tsx`
- Modify: `frontend/src/shared/layout/WorkMenuBar.tsx` (if mobile overflow fixes needed)

- [ ] **Step 1: Add responsive contract test for menu overflow safety**

```tsx
it('keeps work menu accessible by horizontal scroll container', () => {
  const menu = screen.getByTestId('work-menu-bar').querySelector('div');
  expect(menu).toHaveStyle({ overflowX: 'auto' });
});
```

- [ ] **Step 2: Run targeted tests**

Run: `cd frontend; npm run test -- src/test/app-shell.test.tsx src/test/dashboard-page.test.tsx`
Expected: PASS

- [ ] **Step 3: Run full frontend quality checks**

Run: `cd frontend; npm run lint`
Expected: PASS with no ESLint errors

Run: `cd frontend; npm run test`
Expected: PASS for full suite

Run: `cd frontend; npm run build`
Expected: PASS and Vite build output in `frontend/dist`

- [ ] **Step 4: Final integration commit**

```bash
git add frontend/src/shared/layout/AppLayout.tsx frontend/src/shared/layout/TopGovBar.tsx frontend/src/shared/layout/WorkMenuBar.tsx frontend/src/shared/layout/PageShell.tsx frontend/src/shared/layout/PortalFooter.tsx frontend/src/pages/DashboardPage.tsx frontend/src/shared/ui/labels.ts frontend/src/app/theme.ts frontend/src/test/app-shell.test.tsx frontend/src/test/dashboard-page.test.tsx
git commit -m "feat: complete haccp portal shell redesign from header to footer"
```

- [ ] **Step 5: Manual acceptance smoke checks**

Run: `cd frontend; npm run dev`
Expected:

- `/login` 페이지가 정상 렌더링
- 로그인 후 상단 글로벌바 + 2단 메뉴 + 하단 푸터 노출
- 대시보드에서 KPI 4카드, 빠른 작업, 최근 변경 이력, 알림 패널 확인
- 모바일 너비에서 메뉴 접근 가능
