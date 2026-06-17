# Role-Based Navigation Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 권한 기반 2단 네비게이션을 유지하면서 상단 메뉴를 미니멀 세그먼트 UI로 리프레시하고, 권한 필터/접근성/반응형 동작을 테스트로 고정한다.

**Architecture:** 기존 `WorkMenuBar` 중심 구조를 유지하고, 메뉴 데이터 소스는 `workMenuConfig.ts`를 단일 진실원으로 사용한다. 시각 변경은 컴포넌트 `sx`와 `theme` 토큰으로 한정해 페이지별 회귀를 줄이고, 권한/라우트 일관성은 `AppLayout`의 경로 보정 로직과 기존 `ProtectedRoute`를 결합해 보장한다.

**Tech Stack:** React, TypeScript, MUI, React Router, Zustand, Vitest, Testing Library

---

### Task 1: 권한 필터와 경로 보정 동작을 테스트로 먼저 고정

**Files:**

- Modify: `frontend/src/test/app-shell.test.tsx`
- Create: `frontend/src/test/work-menu-bar.test.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`
- Test: `frontend/src/test/work-menu-bar.test.tsx`

- [ ] **Step 1: Write the failing test**

`work-menu-bar.test.tsx`를 추가해 역할별 그룹/메뉴 노출과 빈 그룹 숨김 규칙을 먼저 실패로 정의한다.

```tsx
it('shows only PLATFORM_ADMIN groups and hides unauthorized menu links', async () => {
  renderLayoutWithRole('PLATFORM_ADMIN', '/dashboard');

  expect(
    screen.getByRole('button', { name: APP_LABELS.menu.systemGroup }),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: APP_LABELS.menu.systemGroup }),
  );

  expect(
    await screen.findByRole('link', {
      name: APP_LABELS.menu.platformMenuManagement,
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: APP_LABELS.menu.users }),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/work-menu-bar.test.tsx`
Expected: FAIL because the new role-focused test file is not implemented yet.

- [ ] **Step 3: Write minimal implementation**

`app-shell.test.tsx`에 "권한 변경/직접 진입 시 접근 가능한 첫 메뉴로 보정" 검증을 추가한다.

```tsx
it('redirects unauthorized in-layout path to first accessible menu for role', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'user01',
    role: 'USER',
    onboardingRequired: false,
    onboardingStatus: 'COMPLETED',
  });

  renderAppRoutesAt('/platform/menus');

  expect(await screen.findByTestId('dashboard-user-hub')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/work-menu-bar.test.tsx src/test/app-shell.test.tsx`
Expected: PASS with new baseline behavior captured.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/test/work-menu-bar.test.tsx frontend/src/test/app-shell.test.tsx
git commit -m "test: lock role-based menu visibility behavior"
```

### Task 2: WorkMenuBar를 세그먼트 기반 미니멀 네비로 리프레시

**Files:**

- Modify: `frontend/src/shared/components/layout/WorkMenuBar.tsx`
- Modify: `frontend/src/app/theme.ts`
- Test: `frontend/src/test/work-menu-bar.test.tsx`

- [ ] **Step 1: Write the failing test**

세그먼트 네비 컨테이너와 접근성 속성(선택 상태)을 검증하는 테스트를 추가한다.

```tsx
expect(screen.getByTestId('work-menu-bar')).toHaveAttribute(
  'data-nav-variant',
  'segmented',
);
expect(
  screen.getByRole('button', { name: APP_LABELS.menu.systemGroup }),
).toHaveAttribute('aria-pressed', 'false');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/work-menu-bar.test.tsx`
Expected: FAIL because segmented variant marker and aria-pressed state are not wired.

- [ ] **Step 3: Write minimal implementation**

`WorkMenuBar.tsx`에서 상단 그룹 버튼을 세그먼트 스타일로 바꾸고 상태 표현을 단순화한다. `theme.ts`에 네비 토큰을 추가해 색/경계/그림자를 통일한다.

```tsx
<Button
  key={group.key}
  onClick={() => handleGroupClick(group.key)}
  aria-pressed={isSelected}
  sx={{
    minHeight: 44,
    borderRadius: 1.5,
    px: 2,
    color: isSelected ? 'primary.main' : 'text.secondary',
    bgcolor: isSelected ? 'rgba(31,79,143,0.10)' : 'transparent',
    border: '1px solid',
    borderColor: isSelected ? 'rgba(31,79,143,0.32)' : 'transparent',
    '&:hover': {
      bgcolor: 'rgba(31,79,143,0.08)',
    },
  }}
>
  {group.label}
</Button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/work-menu-bar.test.tsx`
Expected: PASS with segmented visual/state semantics present.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/components/layout/WorkMenuBar.tsx frontend/src/app/theme.ts frontend/src/test/work-menu-bar.test.tsx
git commit -m "feat: refresh work menu as segmented navigation"
```

### Task 3: 권한 경로 보정, 오버레이 단순화, 반응형/접근성 마무리

**Files:**

- Modify: `frontend/src/shared/components/layout/AppLayout.tsx`
- Modify: `frontend/src/shared/components/layout/WorkMenuBar.tsx`
- Modify: `frontend/src/test/app-shell.test.tsx`
- Modify: `frontend/src/test/work-menu-bar.test.tsx`

- [ ] **Step 1: Write the failing test**

`AppLayout` 경로 보정과 모바일 1열 메뉴, 키보드 포커스 이동을 검증하는 테스트를 추가한다.

```tsx
it('keeps keyboard navigation on group buttons with visible focus semantics', async () => {
  renderLayoutWithRole('TENANT_ADMIN', '/dashboard');

  await userEvent.tab();
  expect(
    screen.getByRole('button', { name: APP_LABELS.menu.dashboard }),
  ).toHaveFocus();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/work-menu-bar.test.tsx src/test/app-shell.test.tsx`
Expected: FAIL before focus semantics and path correction are implemented.

- [ ] **Step 3: Write minimal implementation**

`AppLayout.tsx`에서 현재 경로가 역할 허용 메뉴 집합에 없으면 첫 접근 가능 경로로 `replace` 이동한다. `WorkMenuBar.tsx` 오버레이의 딤/블러를 약화하고 모바일 1열 그리드를 확정한다.

```tsx
const allowedPaths = menuGroups.flatMap((group) =>
  group.items
    .filter((item) => item.roles.includes(role))
    .map((item) => item.path),
);

useEffect(() => {
  if (allowedPaths.length === 0) {
    return;
  }

  const isAllowed = allowedPaths.some((path) =>
    location.pathname.startsWith(path),
  );
  if (!isAllowed) {
    navigate(allowedPaths[0], { replace: true });
  }
}, [allowedPaths, location.pathname, navigate]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/work-menu-bar.test.tsx src/test/app-shell.test.tsx`
Expected: PASS with route correction, keyboard behavior, and responsive menu layout.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/components/layout/AppLayout.tsx frontend/src/shared/components/layout/WorkMenuBar.tsx frontend/src/test/app-shell.test.tsx frontend/src/test/work-menu-bar.test.tsx
git commit -m "feat: enforce role-safe menu routing and accessibility polish"
```

### Task 4: 페이지 헤더 위계 정리와 전체 검증

**Files:**

- Modify: `frontend/src/shared/components/layout/PageHeader.tsx`
- Modify: `frontend/src/test/page-header.test.tsx`
- Test: `frontend/src/test/page-header.test.tsx`

- [ ] **Step 1: Write the failing test**

헤더의 보조 경로 텍스트 대비와 제목 위계가 유지되는지 검증한다.

```tsx
render(
  <PageHeader
    groupLabel="시스템 관리"
    title="메뉴 관리"
    description="시스템 메뉴를 등록하고 정렬 순서를 관리합니다."
  />,
);

expect(screen.getByRole('heading', { name: '메뉴 관리' })).toBeInTheDocument();
expect(screen.getByText('시스템 관리')).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/page-header.test.tsx`
Expected: FAIL if new hierarchy assertions are not yet reflected.

- [ ] **Step 3: Write minimal implementation**

`PageHeader.tsx`에서 좌측 강조선 강도를 낮추고 breadcrumb-caption 대비와 간격을 조정한다.

```tsx
<Box sx={{ pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
  <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
    <Typography variant="caption" color="text.secondary">
      {groupLabel}
    </Typography>
    <Typography variant="caption" color="text.disabled">
      /
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {title}
    </Typography>
  </Stack>
  <Typography component="h1" variant="h5" fontWeight={700}>
    {title}
  </Typography>
</Box>
```

- [ ] **Step 4: Run full verification**

Run: `npm run lint`
Expected: PASS with no new lint errors.

Run: `npm run test`
Expected: PASS with all updated layout and route tests.

Run: `npm run build`
Expected: PASS with production bundle generated.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/components/layout/PageHeader.tsx frontend/src/test/page-header.test.tsx
git commit -m "style: polish page header hierarchy for refreshed navigation"
```
