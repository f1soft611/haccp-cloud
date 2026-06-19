# Platform Admin Dashboard Top Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플랫폼 관리자 대시보드 상단을 좌측 자주 찾는 메뉴 + 우측 로그인 정보 카드 구조로 개편하고, 비밀번호 변경 페이지 라우팅을 추가한다.

**Architecture:** 기존 대시보드 데이터 섹션은 유지하고 상단 UI만 별도 컴포넌트로 분리한다. 상단의 quick menu는 권한별 기본 상수 기반으로 렌더링하고, 우측 카드는 사용자명/권한/비밀번호변경/로그아웃 액션을 담당한다. 비밀번호 변경은 신규 페이지(`/account/password`)로 분리해 향후 콘텐츠 확장을 수용한다.

**Tech Stack:** React, TypeScript, MUI, React Router, Zustand, Vitest, React Testing Library

---

### Task 1: Platform Admin 상단 리디자인 실패 테스트 작성

**Files:**

- Modify: `frontend/src/test/dashboard-page.test.tsx`
- Test: `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: 실패 테스트 추가 (타이틀 제거, ID 미노출, 비밀번호 변경 버튼, quick menu 노출)**

```tsx
it('renders redesigned platform admin top section without title and without userId exposure', async () => {
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
    screen.queryByText(APP_LABELS.dashboard.platformAdmin.title),
  ).not.toBeInTheDocument();

  expect(screen.getByText('자주 찾는 메뉴')).toBeInTheDocument();

  expect(
    screen.getByRole('button', { name: '비밀번호 변경' }),
  ).toBeInTheDocument();

  expect(screen.getByText('플랫폼관리자')).toBeInTheDocument();

  expect(screen.queryByText(/사용자 ID/i)).not.toBeInTheDocument();
  expect(screen.queryByText('platform_admin')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx`
Expected: FAIL (`platformAdmin.title`가 아직 렌더링되거나 `비밀번호 변경` 버튼 미존재)

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/test/dashboard-page.test.tsx
git commit -m "test: add failing cases for platform admin top redesign"
```

### Task 2: 신규 비밀번호 변경 라우트 실패 테스트 작성

**Files:**

- Modify: `frontend/src/test/app-shell.test.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: `/account/password` 접근/보호 라우트 실패 테스트 추가**

```tsx
it('allows authenticated user to open /account/password', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
  });

  renderAppRoutesAt('/account/password');

  expect(
    await screen.findByRole('heading', { name: '비밀번호 변경' }),
  ).toBeInTheDocument();
});

it('redirects unauthenticated user from /account/password to /login', async () => {
  resetAuthStore();
  renderAppRoutesAt('/account/password');

  expect(
    await screen.findByRole('heading', { name: APP_LABELS.pageTitle.login }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL (`/account/password` 라우트 미정의)

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/test/app-shell.test.tsx
git commit -m "test: add failing route tests for account password page"
```

### Task 3: Platform Admin 상단 컴포넌트 분리 및 UI 반영

**Files:**

- Create: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboardTopSection.tsx`
- Modify: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx`
- Modify: `frontend/src/shared/constants/labels.ts`
- Test: `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: 최소 구현 코드 작성 (상단 분리 + quick menu + 로그인 카드)**

```tsx
// frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboardTopSection.tsx
import { Button, Grid, Paper, Stack, Typography } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import type { UserRole } from '../../../shared/store/authStore';
import { APP_LABELS, getRoleLabel } from '../../../shared/constants/labels';

type QuickMenuItem = { label: string; to: string; enabled: boolean };

const QUICK_MENUS: Record<UserRole, QuickMenuItem[]> = {
  PLATFORM_ADMIN: [
    { label: APP_LABELS.menu.dashboard, to: '/platform', enabled: true },
    {
      label: APP_LABELS.menu.platformMenuManagement,
      to: '/platform/menus',
      enabled: true,
    },
    {
      label: APP_LABELS.menu.platformRoleManagement,
      to: '/platform/roles',
      enabled: true,
    },
    {
      label: APP_LABELS.menu.loginHistory,
      to: '/platform/login-history',
      enabled: true,
    },
  ],
  TENANT_ADMIN: [
    { label: APP_LABELS.menu.dashboard, to: '/dashboard', enabled: true },
    { label: APP_LABELS.menu.users, to: '/users', enabled: true },
    { label: APP_LABELS.menu.departments, to: '/departments', enabled: true },
    { label: APP_LABELS.menu.documents, to: '/documents', enabled: true },
  ],
  USER: [
    { label: APP_LABELS.menu.dashboard, to: '/dashboard', enabled: true },
    { label: APP_LABELS.menu.documents, to: '/documents', enabled: true },
    { label: APP_LABELS.menu.history, to: '/document-history', enabled: true },
  ],
};

export function PlatformAdminDashboardTopSection({
  loginRole,
  displayName,
  onLogout,
}: {
  loginRole: UserRole;
  displayName?: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const visibleName = (displayName ?? '').trim() || APP_LABELS.field.user;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {APP_LABELS.dashboard.platformAdmin.topbar.quickMenuLabel}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {QUICK_MENUS[loginRole]
              .filter((item) => item.enabled)
              .map((item) => (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  size="small"
                  variant="outlined"
                >
                  {item.label}
                </Button>
              ))}
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="caption" color="text.secondary">
            {APP_LABELS.dashboard.platformAdmin.topbar.loginInfoLabel}
          </Typography>
          <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
            {visibleName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {getRoleLabel(loginRole)}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              onClick={() => navigate('/account/password')}
            >
              {APP_LABELS.action.changePassword}
            </Button>
            <Button size="small" variant="outlined" onClick={onLogout}>
              {APP_LABELS.action.logout}
            </Button>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
```

- [ ] **Step 2: `PlatformAdminPanels` 헤더 영역 교체 (타이틀 제거 포함)**

```tsx
// frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx (핵심 변경)
import { PlatformAdminDashboardTopSection } from './PlatformAdminDashboardTopSection';

export function PlatformAdminPanels({
  // ...existing props
  loginRole,
  onLogout,
}: PlatformAdminPanelsProps) {
  return (
    <Stack spacing={2.5}>
      <PlatformAdminDashboardTopSection
        loginRole={loginRole}
        displayName={undefined}
        onLogout={onLogout}
      />
      {/* 기존 KPI/섹션 영역 유지 */}
    </Stack>
  );
}
```

- [ ] **Step 3: 라벨 상수 추가**

```ts
// frontend/src/shared/constants/labels.ts (발췌)
field: {
  // ...existing
  user: '사용자',
},
action: {
  // ...existing
  changePassword: '비밀번호 변경',
},
dashboard: {
  platformAdmin: {
    topbar: {
      quickMenuLabel: '자주 찾는 메뉴',
      loginInfoLabel: '로그인 정보',
    },
  },
},
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboardTopSection.tsx frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx frontend/src/shared/constants/labels.ts frontend/src/test/dashboard-page.test.tsx
git commit -m "feat: redesign platform admin dashboard top section"
```

### Task 4: 비밀번호 변경 페이지 및 라우트 추가

**Files:**

- Create: `frontend/src/pages/account/AccountPasswordPage.tsx`
- Modify: `frontend/src/app/router/AppRoutes.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: 비밀번호 변경 페이지 최소 구현 작성**

```tsx
// frontend/src/pages/account/AccountPasswordPage.tsx
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_LABELS } from '../../shared/constants/labels';

export function AccountPasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <Paper sx={{ p: 3, maxWidth: 720 }} data-testid="account-password-page">
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          비밀번호 변경
        </Typography>
        <Alert severity="info">
          비밀번호 변경 API는 후속 작업에서 연결됩니다.
        </Alert>
        <TextField
          type="password"
          label="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <TextField
          type="password"
          label="새 비밀번호"
          value={nextPassword}
          onChange={(e) => setNextPassword(e.target.value)}
        />
        <TextField
          type="password"
          label="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled>
            {APP_LABELS.action.save}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            취소
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 2: 라우트 등록**

```tsx
// frontend/src/app/router/AppRoutes.tsx (핵심 변경)
import { AccountPasswordPage } from '../../pages/account/AccountPasswordPage';

// ...inside protected route block
<Route path="/account/password" element={<AccountPasswordPage />} />;
```

- [ ] **Step 3: 라우트 테스트 통과 확인**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/pages/account/AccountPasswordPage.tsx frontend/src/app/router/AppRoutes.tsx frontend/src/test/app-shell.test.tsx
git commit -m "feat: add account password route and page"
```

### Task 5: 통합 검증 및 문서 정리

**Files:**

- Modify: `docs/superpowers/specs/2026-06-19-platform-admin-dashboard-top-redesign-design.md` (필요 시 구현 메모만)
- Test: `frontend/src/test/dashboard-page.test.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: 핵심 회귀 테스트 실행**

Run: `cd frontend ; npm run test -- src/test/dashboard-page.test.tsx src/test/app-shell.test.tsx`
Expected: PASS

- [ ] **Step 2: 프론트 전체 검증 실행**

Run: `cd frontend ; npm run lint ; npm run test ; npm run build`
Expected: lint/test/build 성공 (기존 알려진 non-blocking warning 제외)

- [ ] **Step 3: 최종 커밋**

```bash
git add frontend docs/superpowers/specs/2026-06-19-platform-admin-dashboard-top-redesign-design.md
git commit -m "feat: complete platform admin dashboard top redesign"
```

## Self-Review Checklist

- [x] Spec coverage: 타이틀 제거, 좌측 권한별 메뉴, 우측 사용자명/권한, 비밀번호 변경 페이지 이동, 검색란 제거를 모두 Task 1~4에서 다룸
- [x] Placeholder scan: TBD/TODO/유사작업 참조 없음
- [x] Type consistency: `changePassword`, `quickMenuLabel`, `/account/password` 경로 명칭을 전체 태스크에서 일관되게 사용
