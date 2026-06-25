# Platform Plan Management Componentization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플랜 관리 화면을 검색조건 + 그리드 + 작업 모달 구조로 분리하고, 메뉴 매핑 저장과 기능 매핑(저장 비활성) UX를 안정적으로 제공한다.

**Architecture:** `PlatformPlanManagementPage`는 컨테이너로 축소하고, 검색바/그리드/모달을 프레젠테이션 컴포넌트로 분리한다. 메뉴 매핑은 기존 `planAccessService` 저장 API를 재사용하고, 기능 매핑은 조회/로컬 편집까지만 제공하며 저장 버튼을 비활성화한다.

**Tech Stack:** React 19, TypeScript, MUI, TanStack Query, Vitest, Testing Library

---

## File Structure Lock-In

### Create

- `frontend/src/pages/platform-admin/plans/components/PlatformPlanSearchBar.tsx`
- `frontend/src/pages/platform-admin/plans/components/PlatformPlanGrid.tsx`
- `frontend/src/pages/platform-admin/plans/components/PlanMenuMappingDialog.tsx`
- `frontend/src/pages/platform-admin/plans/components/PlanFeatureMappingDialog.tsx`
- `frontend/src/test/platform-plan-management-page.test.tsx`

### Modify

- `frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx`

### Reuse (No contract changes)

- `frontend/src/services/plan/planAccessService.ts`
- `frontend/src/services/platform/platformMenuService.ts`

---

### Task 1: 플랜 페이지 회귀 테스트 추가 (RED)

**Files:**

- Create: `frontend/src/test/platform-plan-management-page.test.tsx`

- [ ] **Step 1: Write the failing test**

다음 사용자 동작을 하나의 페이지 테스트로 작성한다.

```tsx
it('renders grid rows and opens mapping dialogs from action buttons', async () => {
  renderWithProviders(<PlatformPlanManagementPage />);

  expect(
    await screen.findByRole('columnheader', { name: '플랜 코드' }),
  ).toBeInTheDocument();
  expect(await screen.findByText('Basic')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '메뉴 매핑' }));
  expect(await screen.findByText(/메뉴 매핑/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '기능 매핑' }));
  expect(
    await screen.findByText(/기능 매핑 저장 API 준비 중/),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
});
```

테스트 준비 항목:

- `listPlanSummaries`, `getPlanMenuCodes`, `getPlanFeatures`, `listPlatformMenus` 모킹
- 조회 조건 입력 후 조회 버튼 클릭 흐름 테스트 1개 추가

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/platform-plan-management-page.test.tsx`

Expected: FAIL because action-button-based dialogs and split components are not implemented yet.

- [ ] **Step 3: Commit test scaffold**

```bash
git add frontend/src/test/platform-plan-management-page.test.tsx
git commit -m "test: add red tests for plan management componentization"
```

---

### Task 2: 검색바/그리드 컴포넌트 분리 + 컨테이너 연결 (GREEN-1)

**Files:**

- Create: `frontend/src/pages/platform-admin/plans/components/PlatformPlanSearchBar.tsx`
- Create: `frontend/src/pages/platform-admin/plans/components/PlatformPlanGrid.tsx`
- Modify: `frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx`
- Test: `frontend/src/test/platform-plan-management-page.test.tsx`

- [ ] **Step 1: Implement `PlatformPlanSearchBar` minimal UI**

```tsx
export type PlanSearchBarValue = {
  searchField: 'code' | 'name';
  searchKeyword: string;
  filterActive: 'all' | 'Y' | 'N';
};

export function PlatformPlanSearchBar(props: {
  value: PlanSearchBarValue;
  disabled?: boolean;
  onChange: (next: PlanSearchBarValue) => void;
  onSearch: () => void;
}) {
  // TextField + Select + 조회 버튼
}
```

- [ ] **Step 2: Implement `PlatformPlanGrid` with action column**

```tsx
export function PlatformPlanGrid(props: {
  rows: PlanSummary[];
  loading?: boolean;
  onMenuMapping: (plan: PlanSummary) => void;
  onFeatureMapping: (plan: PlanSummary) => void;
}) {
  // AdminGrid + 컬럼(플랜 코드/플랜명/상태/메뉴 수/기능 수/작업)
  // 작업 버튼: 메뉴 매핑, 기능 매핑
}
```

- [ ] **Step 3: Wire container state + client filtering**

컨테이너에서 상태를 정리한다.

```tsx
const [searchField, setSearchField] = useState<'code' | 'name'>('name');
const [searchKeyword, setSearchKeyword] = useState('');
const [filterActive, setFilterActive] = useState<'all' | 'Y' | 'N'>('all');
const [appliedFilters, setAppliedFilters] = useState({
  searchField: 'name' as 'code' | 'name',
  searchKeyword: '',
  filterActive: 'all' as 'all' | 'Y' | 'N',
});
```

필터 적용은 `useMemo`로 처리한다.

- [ ] **Step 4: Run targeted test**

Run: `npm run test -- src/test/platform-plan-management-page.test.tsx`

Expected: 일부 케이스 PASS, 모달 관련 케이스는 FAIL(아직 미구현).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/platform-admin/plans/components/PlatformPlanSearchBar.tsx frontend/src/pages/platform-admin/plans/components/PlatformPlanGrid.tsx frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx frontend/src/test/platform-plan-management-page.test.tsx
git commit -m "refactor: split plan search bar and grid components"
```

---

### Task 3: 메뉴 매핑 모달 분리 및 저장 연동 (GREEN-2)

**Files:**

- Create: `frontend/src/pages/platform-admin/plans/components/PlanMenuMappingDialog.tsx`
- Modify: `frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx`
- Test: `frontend/src/test/platform-plan-management-page.test.tsx`

- [ ] **Step 1: Add failing assertions for save path**

```tsx
fireEvent.click(screen.getByRole('button', { name: '메뉴 매핑' }));
fireEvent.click(await screen.findByRole('checkbox', { name: /Dashboard/ }));
fireEvent.click(screen.getByRole('button', { name: '저장' }));

await waitFor(() => {
  expect(savePlanMenuCodesMock).toHaveBeenCalledWith(
    expect.objectContaining({ planCode: 'A' }),
  );
});
```

- [ ] **Step 2: Implement `PlanMenuMappingDialog`**

```tsx
export function PlanMenuMappingDialog(props: {
  open: boolean;
  plan: PlanSummary | null;
  menus: PlatformMenuItem[];
  selectedMenuCodes: string[];
  loading?: boolean;
  saving?: boolean;
  error?: boolean;
  onToggle: (menuCode: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  // FormDialog + AdminGrid + Checkbox + 저장/취소
}
```

- [ ] **Step 3: Connect query + mutation in container**

- `selectedPlan` 기준으로 `getPlanMenuCodes` query 활성화
- `savePlanMenuCodes` 성공 시 아래 키 invalidate
  - `['platform-admin', 'plan-menus', selectedPlan.planCode]`
  - `['platform-admin', 'plan-summaries']`

- [ ] **Step 4: Run targeted test**

Run: `npm run test -- src/test/platform-plan-management-page.test.tsx`

Expected: 메뉴 매핑 열기/토글/저장 케이스 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/platform-admin/plans/components/PlanMenuMappingDialog.tsx frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx frontend/src/test/platform-plan-management-page.test.tsx
git commit -m "feat: add plan menu mapping dialog with save integration"
```

---

### Task 4: 기능 매핑 모달 분리 + 저장 비활성 UX (GREEN-3)

**Files:**

- Create: `frontend/src/pages/platform-admin/plans/components/PlanFeatureMappingDialog.tsx`
- Modify: `frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx`
- Test: `frontend/src/test/platform-plan-management-page.test.tsx`

- [ ] **Step 1: Add failing test for disabled save UX**

```tsx
fireEvent.click(screen.getByRole('button', { name: '기능 매핑' }));
expect(
  await screen.findByText(/기능 매핑 저장 API 준비 중/),
).toBeInTheDocument();
expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
```

- [ ] **Step 2: Implement `PlanFeatureMappingDialog`**

```tsx
export function PlanFeatureMappingDialog(props: {
  open: boolean;
  plan: PlanSummary | null;
  draftFeatures: Record<string, boolean>;
  loading?: boolean;
  error?: boolean;
  onToggle: (featureCode: string) => void;
  onClose: () => void;
}) {
  // 체크박스 목록 + 저장 disabled + 안내 문구
}
```

- [ ] **Step 3: Container wiring**

- `selectedPlan` 기준 `getPlanFeatures` 조회
- 모달 오픈 시 `draftFeatures` 초기화
- 토글은 로컬 상태만 업데이트, 저장 mutation 없음

- [ ] **Step 4: Run targeted and full frontend tests**

Run: `npm run test -- src/test/platform-plan-management-page.test.tsx`

Expected: PASS.

Run: `npm run test`

Expected: Existing tests remain PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/platform-admin/plans/components/PlanFeatureMappingDialog.tsx frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx frontend/src/test/platform-plan-management-page.test.tsx
git commit -m "feat: add plan feature mapping dialog with disabled-save UX"
```

---

### Task 5: 정리 및 문서/품질 게이트

**Files:**

- Modify: `frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx`
- Modify: `frontend/src/pages/platform-admin/plans/components/*.tsx`
- Modify: `frontend/src/test/platform-plan-management-page.test.tsx`

- [ ] **Step 1: Refactor for clarity (no behavior change)**

- 컨테이너 헬퍼 함수 정리
- 중복 타입을 컴포넌트 props type으로 정리
- 접근성 라벨 누락 여부 확인

- [ ] **Step 2: Run lint and build**

Run: `npm run lint`

Expected: PASS with no new lint errors in changed files.

Run: `npm run build`

Expected: PASS and production build artifacts generated.

- [ ] **Step 3: Final regression run**

Run: `npm run test -- src/test/platform-plan-management-page.test.tsx src/test/platform-authority-management-page.test.tsx`

Expected: PASS and no regression in authority page tests.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/platform-admin/plans/PlatformPlanManagementPage.tsx frontend/src/pages/platform-admin/plans/components frontend/src/test/platform-plan-management-page.test.tsx
git commit -m "chore: finalize plan management componentized page"
```

---

## Spec Coverage Checklist

- 상단 검색조건 + 그리드 구조: Task 2
- 작업 버튼(메뉴 매핑/기능 매핑): Task 2, Task 3, Task 4
- 메뉴 매핑 저장 연동: Task 3
- 기능 매핑 편집 + 저장 비활성: Task 4
- 플랜 화면 1차 분리 및 확장 기반: Task 2~5

## Placeholder/Consistency Check

- No TBD/TODO placeholders in actionable steps.
- Query keys and state names are consistent with the approved design spec.
- No backend contract change introduced.
