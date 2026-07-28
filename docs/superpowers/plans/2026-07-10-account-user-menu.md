# Account User Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared authenticated-user menu in the top bar, remove the old dashboard login info panels, and introduce a dedicated my-page screen for profile details and file uploads.

**Architecture:** Put the sign-in state affordance into one shared top-bar component that reads from the existing auth store, handles logout, and navigates to account routes. Keep the new my-page screen under `pages/account/` so the account area stays isolated from dashboard code, and keep dashboard changes limited to removing now-obsolete login-info cards.

**Tech Stack:** React, TypeScript, MUI, React Router, Zustand, Vitest, Testing Library

---

### Task 1: Add shared authenticated-user menu

**Files:**

- Create: `frontend/src/shared/components/account/UserAccountMenu.tsx`
- Modify: `frontend/src/shared/components/layout/TopGovBar.tsx`
- Modify: `frontend/src/shared/constants/labels.ts`
- Test: `frontend/src/test/top-gov-bar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('opens the account menu for authenticated users and shows account actions', async () => {
  act(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      displayName: '김기형',
      role: 'TENANT_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });
  });

  render(
    <MemoryRouter initialEntries={['/documents']}>
      <Routes>
        <Route
          path="/documents"
          element={
            <>
              <TopGovBar />
              <div>documents-page</div>
            </>
          }
        />
        <Route path="/account/my-page" element={<div>my-page</div>} />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: /사용자 메뉴/ }));

  expect(
    await screen.findByRole('menuitem', { name: '내 정보 관리' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: '보안 설정' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: '로그아웃' }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/test/top-gov-bar.test.tsx`
Expected: FAIL because the authenticated user menu does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
export function UserAccountMenu() {
  // render a user icon button, a MUI Menu, and navigate/logout handlers
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/test/top-gov-bar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/components/account/UserAccountMenu.tsx frontend/src/shared/components/layout/TopGovBar.tsx frontend/src/shared/constants/labels.ts frontend/src/test/top-gov-bar.test.tsx
git commit -m "feat: add shared account user menu"
```

### Task 2: Add my-page route and screen

**Files:**

- Create: `frontend/src/pages/account/MyPage.tsx`
- Modify: `frontend/src/app/router/AppRoutes.tsx`
- Modify: `frontend/src/pages/account/AccountPasswordPage.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('allows authenticated user to open /account/my-page', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
  });

  renderAppRoutesAt('/account/my-page');

  expect(
    await screen.findByRole('heading', { name: '내 정보 관리' }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL because the route and screen do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
export function MyPage() {
  // show profile summary, upload controls, and read-only info cards
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/test/app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/account/MyPage.tsx frontend/src/app/router/AppRoutes.tsx frontend/src/pages/account/AccountPasswordPage.tsx frontend/src/test/app-shell.test.tsx
git commit -m "feat: add account my page"
```

### Task 3: Remove dashboard login info panels

**Files:**

- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboardTopSection.tsx`
- Modify: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboard.tsx`
- Modify: `frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx`
- Test: `frontend/src/test/dashboard-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
expect(
  screen.queryByRole('heading', {
    name: APP_LABELS.dashboard.blocks.loginPanel,
  }),
).not.toBeInTheDocument();
expect(
  screen.queryByText(APP_LABELS.dashboard.platformAdmin.topbar.loginInfoLabel),
).not.toBeInTheDocument();
expect(
  screen.queryByRole('button', { name: APP_LABELS.action.changePassword }),
).not.toBeInTheDocument();
expect(
  screen.queryByRole('button', { name: APP_LABELS.action.logout }),
).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/test/dashboard-page.test.tsx`
Expected: FAIL because the legacy login info panels still render.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// remove the tenant-admin login panel from DashboardPage
// remove the platform-admin login info card and its action buttons from the top section
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/test/dashboard-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboardTopSection.tsx frontend/src/pages/dashboard/platformAdmin/PlatformAdminDashboard.tsx frontend/src/pages/dashboard/platformAdmin/PlatformAdminPanels.tsx frontend/src/test/dashboard-page.test.tsx
git commit -m "feat: remove dashboard login info panels"
```
