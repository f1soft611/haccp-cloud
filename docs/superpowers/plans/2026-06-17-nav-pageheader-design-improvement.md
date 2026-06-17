# Navigation Menu and Page Header Design Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the top navigation menu and page header presentation so the portal shows clearer hierarchy, stronger active state cues, and richer path context.

**Architecture:** Extend the existing layout layer instead of introducing a parallel navigation system. Add small, focused UI primitives for page headers, keep menu data centralized in the menu config, and preserve the current role-based route structure. Update page-level headers to consume the new presentation component and keep menu behavior intact.

**Tech Stack:** React, TypeScript, MUI, React Router, Vite, Vitest, Testing Library

---

### Task 1: Add menu icon metadata and header component

**Files:**

- Modify: `frontend/src/shared/components/layout/workMenuConfig.ts`
- Create: `frontend/src/shared/components/layout/PageHeader.tsx`
- Modify: `frontend/src/shared/components/layout/WorkMenuBar.tsx`

- [ ] **Step 1: Write the failing test**

Create or extend a layout test so the current menu bar does not yet expose icon-backed labels and the new page header is still missing. Verify the test expects a visible breadcrumb label and a stronger active tab indicator.

```tsx
expect(screen.getByText('시스템 관리')).toBeInTheDocument();
expect(screen.getByText('메뉴 관리')).toBeInTheDocument();
expect(screen.getByRole('heading', { name: '메뉴 관리' })).toBeInTheDocument();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL because the header component and updated navigation presentation are not implemented yet.

- [ ] **Step 3: Write the minimal implementation**

Add `icon` metadata to each menu item in `workMenuConfig.ts`, render a dynamic MUI icon map in `WorkMenuBar.tsx`, and create `PageHeader.tsx` with breadcrumb, accent bar, title, and optional description support.

```tsx
export type PageHeaderProps = {
  title: string;
  groupLabel?: string;
  description?: string;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/test/app-shell.test.tsx`
Expected: PASS with the new page header and updated menu bar rendering.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/components/layout/workMenuConfig.ts frontend/src/shared/components/layout/WorkMenuBar.tsx frontend/src/shared/components/layout/PageHeader.tsx frontend/src/test/app-shell.test.tsx
git commit -m "feat: improve layout navigation hierarchy"
```

### Task 2: Apply the page header to content pages

**Files:**

- Modify: `frontend/src/pages/platform-admin/menus/PlatformMenuManagementPage.tsx`
- Modify: `frontend/src/pages/platform-admin/menus/PlatformRoleMenuManagementPage.tsx`
- Modify: `frontend/src/pages/platform-admin/roles/PlatformRoleManagementPage.tsx`
- Modify: `frontend/src/pages/tenant-management/users/UsersPage.tsx`
- Modify: `frontend/src/pages/tenant-management/departments/DepartmentsPage.tsx`
- Modify: `frontend/src/pages/tenant-management/documents/DocumentsPage.tsx`
- Modify: `frontend/src/pages/tenant-management/documents/DocumentHistoryPage.tsx`

- [ ] **Step 1: Write the failing test**

Update the relevant page test to expect the new header structure, including the breadcrumb label and the page heading role.

```tsx
expect(screen.getByText('시스템 관리')).toBeInTheDocument();
expect(screen.getByRole('heading', { name: '메뉴 관리' })).toBeInTheDocument();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/test/app-shell.test.tsx src/test/dashboard-page.test.tsx`
Expected: FAIL until pages render the new header markup consistently.

- [ ] **Step 3: Write the minimal implementation**

Replace the first title `Typography` in each target page with the new `PageHeader` component and pass the correct group label and description for each page.

```tsx
<PageHeader
  groupLabel="시스템 관리"
  title={APP_LABELS.pageTitle.platformMenuManagement}
  description="메뉴 정보를 수정하고 저장하면 즉시 목록에 반영됩니다."
/>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/test/app-shell.test.tsx src/test/dashboard-page.test.tsx`
Expected: PASS with the revised page header presentation.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/platform-admin/menus/PlatformMenuManagementPage.tsx frontend/src/pages/platform-admin/menus/PlatformRoleMenuManagementPage.tsx frontend/src/pages/platform-admin/roles/PlatformRoleManagementPage.tsx frontend/src/pages/tenant-management/users/UsersPage.tsx frontend/src/pages/tenant-management/departments/DepartmentsPage.tsx frontend/src/pages/tenant-management/documents/DocumentsPage.tsx frontend/src/pages/tenant-management/documents/DocumentHistoryPage.tsx
git commit -m "feat: apply page headers to management pages"
```

### Task 3: Verify layout behavior and polish

**Files:**

- Modify: `frontend/src/test/app-shell.test.tsx`
- Modify: `frontend/src/test/dashboard-page.test.tsx`
- Modify: any page test updated by Task 2

- [ ] **Step 1: Run the targeted test suite**

Run: `npm run test -- src/test/app-shell.test.tsx src/test/dashboard-page.test.tsx`
Expected: PASS with no layout regressions.

- [ ] **Step 2: Run the broader frontend checks**

Run: `npm run lint`
Run: `npm run test`
Run: `npm run build`
Expected: All commands complete successfully.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/test/app-shell.test.tsx frontend/src/test/dashboard-page.test.tsx
git commit -m "test: cover updated layout presentation"
```
