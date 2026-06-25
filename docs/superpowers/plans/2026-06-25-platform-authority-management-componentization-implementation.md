# Platform Authority Management Componentization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 권한 관리 화면을 플랜 관리와 같은 폴더 구조로 분리하고, 권한 목록/등록/수정/메뉴 매핑을 안정적으로 동작하게 정리한다.

**Architecture:** `PlatformAuthorityManagementPage`는 데이터와 상태를 담당하는 컨테이너로 축소하고, 검색바/그리드/권한 폼/메뉴 매핑 다이얼로그를 `components/` 하위로 분리한다. 기능 매핑은 제거하고 메뉴 매핑만 유지한다. 메뉴 필터링은 기존처럼 서버가 `roleCode` 기반으로 처리하는 흐름을 유지한다.

**Tech Stack:** React 19, TypeScript, MUI, TanStack Query, Vitest, Testing Library

---

## File Structure Lock-In

### Create

- `frontend/src/pages/platform-admin/authorities/components/PlatformAuthoritySearchBar.tsx`
- `frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityGrid.tsx`
- `frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityFormDialog.tsx`
- `frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityMenuMappingDialog.tsx`
- `frontend/src/test/platform-authority-management-page.test.tsx`

### Modify

- `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`
- `frontend/src/services/platform/platformRoleMenuService.ts` (if response normalization needs alignment)
- `frontend/src/shared/components/layout/AppLayout.tsx` (only if menu metadata filtering needs a small fix)

### Reuse (No contract changes)

- `frontend/src/services/platform/platformRoleService.ts`
- `frontend/src/services/platform/platformMenuService.ts`
- `frontend/src/services/platform/platformTenantManagementService.ts`
- `backend/src/main/java/egovframework/let/platforms/roles/controller/PlatformRoleApiController.java`
- `backend/src/main/java/egovframework/let/platforms/roles/service/impl/PlatformRoleServiceImpl.java`

---

### Task 1: 권한 관리 회귀 테스트 추가 (RED)

**Files:**

- Create: `frontend/src/test/platform-authority-management-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('renders authority grid and opens menu mapping dialog', async () => {
  renderWithProviders(<PlatformAuthorityManagementPage />);

  expect(
    await screen.findByRole('columnheader', { name: '권한 코드' }),
  ).toBeInTheDocument();

  fireEvent.click(await screen.findByRole('button', { name: '메뉴 매핑' }));

  expect(await screen.findByText(/권한별 메뉴 매핑/)).toBeInTheDocument();
});
```

Test setup should mock:

- `listPlatformRolesPaged`
- `listPlatformMenus`
- `listPlatformTenants`
- `getPlatformRoleMenuMapping`
- `savePlatformRoleMenuMapping`
- `listRoleMenuCandidatesByTenant`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/platform-authority-management-page.test.tsx`

Expected: FAIL because the authority page is still monolithic and the component split is not in place.

- [ ] **Step 3: Commit test scaffold**

```bash
git add frontend/src/test/platform-authority-management-page.test.tsx
git commit -m "test: add red tests for authority management refactor"
```

---

### Task 2: 검색바/그리드/폼/메뉴 매핑 컴포넌트 분리 (GREEN-1)

**Files:**

- Create: `frontend/src/pages/platform-admin/authorities/components/PlatformAuthoritySearchBar.tsx`
- Create: `frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityGrid.tsx`
- Create: `frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityFormDialog.tsx`
- Create: `frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityMenuMappingDialog.tsx`
- Modify: `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`

- [ ] **Step 1: Implement `PlatformAuthoritySearchBar`**

```tsx
export type AuthoritySearchValue = {
  searchField: 'code' | 'name' | 'description';
  searchKeyword: string;
  filterActive: 'all' | 'Y' | 'N';
  tenantCode: string;
};

export function PlatformAuthoritySearchBar(props: {
  value: AuthoritySearchValue;
  tenants: string[];
  disabled?: boolean;
  onChange: (next: AuthoritySearchValue) => void;
  onSearch: () => void;
}) {
  // Paper + Stack + Select + TextField + 조회 버튼
}
```

- [ ] **Step 2: Implement `PlatformAuthorityGrid`**

```tsx
export function PlatformAuthorityGrid(props: {
  rows: PlatformRoleItem[];
  loading?: boolean;
  onMenuMapping: (role: PlatformRoleItem) => void;
  onEdit: (role: PlatformRoleItem) => void;
  onToggleActive: (role: PlatformRoleItem) => void;
}) {
  // AdminGrid + 권한 코드/권한명/설명/상태/작업 열
  // 작업 버튼: 메뉴 매핑, 수정, 활성/비활성
}
```

- [ ] **Step 3: Implement `PlatformAuthorityFormDialog`**

```tsx
export function PlatformAuthorityFormDialog(props: {
  open: boolean;
  mode: 'create' | 'edit';
  value: {
    code: string;
    name: string;
    description: string;
    useAt: 'Y' | 'N';
  };
  saving?: boolean;
  onChange: (next: typeof props.value) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  // FormDialog + 권한 코드/명/설명/사용여부 입력
}
```

- [ ] **Step 4: Implement `PlatformAuthorityMenuMappingDialog`**

```tsx
export function PlatformAuthorityMenuMappingDialog(props: {
  open: boolean;
  role: PlatformRoleItem | null;
  menus: PlatformMenuItem[];
  selectedMenuIds: string[];
  loading?: boolean;
  saving?: boolean;
  error?: boolean;
  onToggle: (menuId: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  // FormDialog + AdminGrid + Checkbox + 저장/취소
}
```

- [ ] **Step 5: Move authority state and data fetching into the container**

The container should keep only these responsibilities:

```tsx
const [searchValue, setSearchValue] = useState({
  searchField: 'name' as 'code' | 'name' | 'description',
  searchKeyword: '',
  filterActive: 'all' as 'all' | 'Y' | 'N',
  tenantCode: 'PLATFORM',
});
const [appliedFilters, setAppliedFilters] = useState(searchValue);
const [selectedRole, setSelectedRole] = useState<PlatformRoleItem | null>(null);
const [menuMappingOpen, setMenuMappingOpen] = useState(false);
const [draftMenuIds, setDraftMenuIds] = useState<string[] | null>(null);
```

Use `useMemo` for `selectedMenuIds` so the hook dependencies stay stable:

```tsx
const selectedMenuIds = useMemo(
  () => draftMenuIds ?? mappingQuery.data?.menuIds ?? [],
  [draftMenuIds, mappingQuery.data?.menuIds],
);
```

- [ ] **Step 6: Run targeted test**

Run: `npm run test -- src/test/platform-authority-management-page.test.tsx`

Expected: page renders, grid buttons open menu mapping dialog, and compile warnings from stale local state are gone.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/platform-admin/authorities/components/PlatformAuthoritySearchBar.tsx frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityGrid.tsx frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityFormDialog.tsx frontend/src/pages/platform-admin/authorities/components/PlatformAuthorityMenuMappingDialog.tsx frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx frontend/src/test/platform-authority-management-page.test.tsx
git commit -m "refactor: split authority management into plan-style components"
```

---

### Task 3: 권한/메뉴 필터링과 라우트 연결 검증 (GREEN-2)

**Files:**

- Modify: `frontend/src/services/platform/platformRoleMenuService.ts`
- Modify: `frontend/src/shared/components/layout/AppLayout.tsx`
- Modify: `frontend/src/services/auth/authService.ts` only if `roleCode` needs to be preserved in the client session later
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Verify the client uses server-returned accessible menus**

Keep the existing `GET /api/platform-admin/user-menus/me` flow and ensure it continues to use the authenticated user's `roleCode` on the backend.

If response normalization is needed, keep the response shape aligned with:

```ts
type PlatformRoleMenuMapping = {
  roleCode: string;
  menuIds: string[];
};
```

- [ ] **Step 2: Add or update the app-shell test**

Assert that the shell renders only the menu paths returned by `listAccessibleMenus()` and that `/platform/roles` still resolves correctly.

- [ ] **Step 3: Run targeted test**

Run: `npm run test -- src/test/app-shell.test.tsx`

Expected: app shell continues to render the filtered navigation, and authority page routes remain reachable for platform admins.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/platform/platformRoleMenuService.ts frontend/src/shared/components/layout/AppLayout.tsx frontend/src/services/auth/authService.ts frontend/src/test/app-shell.test.tsx
git commit -m "fix: keep authority menus aligned with role based navigation"
```

---

## Self-Review Checklist

- Search bar, grid, and dialogs are split into focused files.
- Feature mapping is not reintroduced.
- `selectedMenuIds` is wrapped in `useMemo`.
- Menu filtering remains backend-driven through `roleCode`.
- Test coverage exists for opening the authority menu dialog and app shell navigation.
