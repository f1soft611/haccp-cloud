# Grid Common Server Paging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메뉴 관리, 권한 관리, 로그인 이력 화면에 로그인 이력과 동일한 서버 페이징 패턴을 적용하고 공통 페이징 UI/상태를 재사용한다.

**Architecture:** 백엔드는 메뉴/권한에 페이징 전용 API를 추가하고 PaginationInfo로 firstIndex/recordCountPerPage를 계산한다. 프론트는 신규 paged API를 사용하도록 서비스와 페이지를 전환하고, useGridPagination + GridPaginationBar로 상태/표현을 공통화한다.

**Tech Stack:** Java Spring MVC, MyBatis (PostgreSQL/MSSQL), React, TypeScript, TanStack Query, MUI, Vitest, Testing Library

---

## File Structure Map

- Backend API layer
  - Modify: `backend/src/main/java/egovframework/let/uss/auth/web/PlatformMenuApiController.java`
  - Modify: `backend/src/main/java/egovframework/let/uss/auth/web/PlatformAuthorityApiController.java`
  - Responsibility: paged endpoint 추가, 요청 검증, PaginationInfo 계산, ResultVO 응답 구성

- Backend service and DAO
  - Modify: `backend/src/main/java/egovframework/let/uss/auth/service/EgovAuthManageService.java`
  - Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/EgovAuthManageServiceImpl.java`
  - Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java`
  - Responsibility: 메뉴/권한 paged 목록 + count 메서드 제공

- Backend model and SQL mapper
  - Modify: `backend/src/main/java/egovframework/let/uss/auth/service/MenuInfoVO.java`
  - Modify: `backend/src/main/java/egovframework/let/uss/auth/service/AuthorityInfoVO.java`
  - Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml`
  - Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml`
  - Responsibility: 페이징 필드 추가 및 DB별 paged list/count 쿼리 구현

- Frontend shared pagination
  - Create: `frontend/src/shared/hooks/useGridPagination.ts`
  - Create: `frontend/src/shared/components/data/GridPaginationBar.tsx`
  - Test: `frontend/src/test/use-grid-pagination.test.ts`
  - Responsibility: pageIndex/pageSize/resetPage 공통 상태, 하단 페이징 바 공통 UI

- Frontend services
  - Modify: `frontend/src/services/platform/platformMenuService.ts`
  - Modify: `frontend/src/services/platform/platformRoleService.ts`
  - Modify: `frontend/src/services/auth/loginHistoryService.ts`
  - Responsibility: paged API 응답 타입 정규화 및 API 호출 함수 제공

- Frontend pages
  - Modify: `frontend/src/pages/admin/LoginHistoryPage.tsx`
  - Modify: `frontend/src/pages/platform-admin/menus/PlatformMenuManagementPage.tsx`
  - Modify: `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`
  - Responsibility: 공통 훅 + 공통 페이징 바 적용, 서버 검색/페이징 파라미터 연결

- Frontend integration tests
  - Modify: `frontend/src/test/login-history-page.test.tsx`
  - Modify: `frontend/src/test/platform-menu-management-page.test.tsx`
  - Modify: `frontend/src/test/platform-authority-management-page.test.tsx`
  - Responsibility: 조회/페이지 이동/pageSize 변경 시 API 파라미터 반영 검증

### Task 1: Backend Menu Paging API

**Files:**

- Modify: `backend/src/main/java/egovframework/let/uss/auth/web/PlatformMenuApiController.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/MenuInfoVO.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/EgovAuthManageService.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/EgovAuthManageServiceImpl.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml`
- Test: `backend/src/test/java/egovframework/let/uss/auth/web/PlatformMenuApiControllerPagingTest.java`

- [ ] **Step 1: Write the failing test**

```java
@Test
void listMenusPaged_rejectsInvalidPageSize() throws Exception {
    mockMvc.perform(get("/api/platform-admin/menus/paged")
            .param("pageIndex", "1")
            .param("pageSize", "15"))
        .andExpect(status().isBadRequest());
}

@Test
void listMenusPaged_returnsPagedResponse() throws Exception {
    when(authManageService.selectMenuPagedList(any(MenuInfoVO.class)))
        .thenReturn(List.of(new MenuInfoVO()));
    when(authManageService.selectMenuPagedCount(any(MenuInfoVO.class)))
        .thenReturn(23);

    mockMvc.perform(get("/api/platform-admin/menus/paged")
            .param("pageIndex", "2")
            .param("pageSize", "10")
            .param("searchField", "menuNm")
            .param("searchKeyword", "관리")
            .param("useAt", "Y"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.result.totalCount").value(23))
        .andExpect(jsonPath("$.result.paginationInfo.currentPageNo").value(2));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend ; mvn -Dtest=PlatformMenuApiControllerPagingTest test`
Expected: FAIL with missing endpoint or missing service/DAO methods.

- [ ] **Step 3: Write minimal implementation**

```java
@GetMapping("/paged")
public ResultVO listMenusPaged(
        @RequestParam(defaultValue = "1") int pageIndex,
        @RequestParam(defaultValue = "10") int pageSize,
        @RequestParam(required = false) String searchField,
        @RequestParam(required = false) String searchKeyword,
        @RequestParam(required = false, defaultValue = "all") String useAt) throws Exception {
    validatePage(pageIndex, pageSize);

    MenuInfoVO condition = new MenuInfoVO();
    condition.setPageIndex(pageIndex);
    condition.setPageSize(pageSize);
    condition.applySearch(searchField, searchKeyword, useAt);

    PaginationInfo paginationInfo = new PaginationInfo();
    paginationInfo.setCurrentPageNo(condition.getPageIndex());
    paginationInfo.setRecordCountPerPage(condition.getPageSize());
    paginationInfo.setPageSize(condition.getPageSize());
    condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
    condition.setLastIndex(paginationInfo.getLastRecordIndex());
    condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

    List<MenuInfoVO> menuList = authManageService.selectMenuPagedList(condition);
    int totalCount = authManageService.selectMenuPagedCount(condition);
    paginationInfo.setTotalRecordCount(totalCount);

    Map<String, Object> result = new HashMap<>();
    result.put("menuList", menuList);
    result.put("totalCount", totalCount);
    result.put("paginationInfo", paginationInfo);

    ResultVO response = new ResultVO();
    response.setResult(result);
    response.setResultCode(ResponseCode.SUCCESS.getCode());
    response.setResultMessage(ResponseCode.SUCCESS.getMessage());
    return response;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend ; mvn -Dtest=PlatformMenuApiControllerPagingTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/egovframework/let/uss/auth/web/PlatformMenuApiController.java \
  backend/src/main/java/egovframework/let/uss/auth/service/MenuInfoVO.java \
  backend/src/main/java/egovframework/let/uss/auth/service/EgovAuthManageService.java \
  backend/src/main/java/egovframework/let/uss/auth/service/impl/EgovAuthManageServiceImpl.java \
  backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java \
  backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml \
  backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml \
  backend/src/test/java/egovframework/let/uss/auth/web/PlatformMenuApiControllerPagingTest.java
git commit -m "feat(backend): add paged menu list api"
```

### Task 2: Backend Authority Paging API

**Files:**

- Modify: `backend/src/main/java/egovframework/let/uss/auth/web/PlatformAuthorityApiController.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/AuthorityInfoVO.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/EgovAuthManageService.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/EgovAuthManageServiceImpl.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml`
- Test: `backend/src/test/java/egovframework/let/uss/auth/web/PlatformAuthorityApiControllerPagingTest.java`

- [ ] **Step 1: Write the failing test**

```java
@Test
void listRolesPaged_rejectsPageIndexLessThanOne() throws Exception {
    mockMvc.perform(get("/api/platform-admin/roles/paged")
            .param("pageIndex", "0")
            .param("pageSize", "10"))
        .andExpect(status().isBadRequest());
}

@Test
void listRolesPaged_returnsPagedResponse() throws Exception {
    when(authManageService.selectAuthorityPagedList(any(AuthorityInfoVO.class)))
        .thenReturn(List.of(new AuthorityInfoVO()));
    when(authManageService.selectAuthorityPagedCount(any(AuthorityInfoVO.class)))
        .thenReturn(7);

    mockMvc.perform(get("/api/platform-admin/roles/paged")
            .param("pageIndex", "1")
            .param("pageSize", "20")
            .param("searchField", "name")
            .param("searchKeyword", "관리자"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.result.totalCount").value(7));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend ; mvn -Dtest=PlatformAuthorityApiControllerPagingTest test`
Expected: FAIL with missing endpoint or missing service/DAO methods.

- [ ] **Step 3: Write minimal implementation**

```java
@GetMapping("/roles/paged")
public ResultVO listRolesPaged(
        @RequestParam(defaultValue = "1") int pageIndex,
        @RequestParam(defaultValue = "10") int pageSize,
        @RequestParam(required = false) String searchField,
        @RequestParam(required = false) String searchKeyword,
        @RequestParam(required = false, defaultValue = "all") String useAt) throws Exception {
    validatePage(pageIndex, pageSize);

    AuthorityInfoVO condition = new AuthorityInfoVO();
    condition.setPageIndex(pageIndex);
    condition.setPageSize(pageSize);
    condition.applySearch(searchField, searchKeyword, useAt);

    PaginationInfo paginationInfo = new PaginationInfo();
    paginationInfo.setCurrentPageNo(condition.getPageIndex());
    paginationInfo.setRecordCountPerPage(condition.getPageSize());
    paginationInfo.setPageSize(condition.getPageSize());
    condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
    condition.setLastIndex(paginationInfo.getLastRecordIndex());
    condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

    List<AuthorityInfoVO> roleList = authManageService.selectAuthorityPagedList(condition);
    int totalCount = authManageService.selectAuthorityPagedCount(condition);
    paginationInfo.setTotalRecordCount(totalCount);

    Map<String, Object> result = new HashMap<>();
    result.put("roleList", roleList);
    result.put("totalCount", totalCount);
    result.put("paginationInfo", paginationInfo);

    ResultVO response = new ResultVO();
    response.setResult(result);
    response.setResultCode(ResponseCode.SUCCESS.getCode());
    response.setResultMessage(ResponseCode.SUCCESS.getMessage());
    return response;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend ; mvn -Dtest=PlatformAuthorityApiControllerPagingTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/egovframework/let/uss/auth/web/PlatformAuthorityApiController.java \
  backend/src/main/java/egovframework/let/uss/auth/service/AuthorityInfoVO.java \
  backend/src/main/java/egovframework/let/uss/auth/service/EgovAuthManageService.java \
  backend/src/main/java/egovframework/let/uss/auth/service/impl/EgovAuthManageServiceImpl.java \
  backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java \
  backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml \
  backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml \
  backend/src/test/java/egovframework/let/uss/auth/web/PlatformAuthorityApiControllerPagingTest.java
git commit -m "feat(backend): add paged authority list api"
```

### Task 3: Frontend Shared Pagination Hook

**Files:**

- Create: `frontend/src/shared/hooks/useGridPagination.ts`
- Test: `frontend/src/test/use-grid-pagination.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGridPagination } from '../shared/hooks/useGridPagination';

describe('useGridPagination', () => {
  it('resets to first page when page size changes', () => {
    const { result } = renderHook(() => useGridPagination());

    act(() => {
      result.current.setPageIndex(3);
      result.current.setPageSize(20);
    });

    expect(result.current.pageIndex).toBe(1);
    expect(result.current.pageSize).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/use-grid-pagination.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import { useState } from 'react';

export const GRID_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function useGridPagination(initialPageSize = 10) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPageSize = (nextPageSize: number) => {
    setPageSizeState(nextPageSize);
    setPageIndex(1);
  };

  const resetPage = () => setPageIndex(1);

  return {
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    resetPage,
    pageSizeOptions: GRID_PAGE_SIZE_OPTIONS,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/use-grid-pagination.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/hooks/useGridPagination.ts frontend/src/test/use-grid-pagination.test.ts
git commit -m "feat(frontend): add shared grid pagination hook"
```

### Task 4: Frontend Shared Pagination Component

**Files:**

- Create: `frontend/src/shared/components/data/GridPaginationBar.tsx`
- Test: `frontend/src/test/grid-pagination-bar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('renders total count and fires handlers', () => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();

  render(
    <GridPaginationBar
      pageIndex={1}
      pageSize={10}
      totalCount={42}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />,
  );

  expect(screen.getByText('총 42건')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/grid-pagination-bar.test.tsx`
Expected: FAIL with component not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import {
  Box,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from '@mui/material';

type Props = {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
};

export function GridPaginationBar({
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mt: 1 }}
    >
      <Typography variant="body2">총 {totalCount}건</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Select
          size="small"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <MenuItem key={size} value={size}>
              {size}개
            </MenuItem>
          ))}
        </Select>
        <Pagination
          page={pageIndex}
          count={totalPages}
          onChange={(_, page) => onPageChange(page)}
          shape="rounded"
          color="primary"
        />
      </Box>
    </Stack>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/grid-pagination-bar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/components/data/GridPaginationBar.tsx frontend/src/test/grid-pagination-bar.test.tsx
git commit -m "feat(frontend): add shared grid pagination bar"
```

### Task 5: Frontend Service Layer Paging Contracts

**Files:**

- Modify: `frontend/src/services/platform/platformMenuService.ts`
- Modify: `frontend/src/services/platform/platformRoleService.ts`
- Modify: `frontend/src/services/auth/loginHistoryService.ts`
- Test: `frontend/src/test/login-history-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('calls menu paged endpoint with page params', async () => {
  apiClient.get = vi.fn().mockResolvedValue({
    data: { result: { menuList: [], totalCount: 0 } },
  });

  await listPlatformMenusPaged({ pageIndex: 2, pageSize: 20 });

  expect(apiClient.get).toHaveBeenCalledWith('/platform-admin/menus/paged', {
    params: { pageIndex: 2, pageSize: 20 },
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/login-history-service.test.ts`
Expected: FAIL with function not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
export type PagedResponse<T> = {
  items: T[];
  totalCount: number;
};

export async function listPlatformMenusPaged(params: {
  pageIndex: number;
  pageSize: number;
  searchField?: 'menuNm' | 'menuDc' | 'menuUrl';
  searchKeyword?: string;
  useAt?: 'Y' | 'N' | 'all';
}): Promise<PagedResponse<PlatformMenuItem>> {
  const { data } = await apiClient.get('/platform-admin/menus/paged', {
    params,
  });
  return {
    items: data.result?.menuList ?? [],
    totalCount: data.result?.totalCount ?? 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/login-history-service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/platform/platformMenuService.ts \
  frontend/src/services/platform/platformRoleService.ts \
  frontend/src/services/auth/loginHistoryService.ts \
  frontend/src/test/login-history-service.test.ts
git commit -m "feat(frontend): add paged service contracts for grids"
```

### Task 6: Login History Page Shared Pagination UI Adoption

**Files:**

- Modify: `frontend/src/pages/admin/LoginHistoryPage.tsx`
- Modify: `frontend/src/test/login-history-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('renders shared total count label', async () => {
  render(
    <AppProviders>
      <LoginHistoryPage />
    </AppProviders>,
  );

  expect(await screen.findByText(/총 \d+건/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/login-history-page.test.tsx`
Expected: FAIL with missing total count label.

- [ ] **Step 3: Write minimal implementation**

```tsx
const pagination = useGridPagination(10);

const query = useQuery({
  queryKey: [
    'login-history',
    pagination.pageIndex,
    pagination.pageSize,
    appliedFilters,
  ],
  queryFn: () =>
    getLoginHistoryList({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      ...buildFilters(appliedFilters),
    }),
});

<GridPaginationBar
  pageIndex={pagination.pageIndex}
  pageSize={pagination.pageSize}
  totalCount={query.data?.totalCount ?? 0}
  onPageChange={pagination.setPageIndex}
  onPageSizeChange={pagination.setPageSize}
/>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/login-history-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/LoginHistoryPage.tsx frontend/src/test/login-history-page.test.tsx
git commit -m "refactor(frontend): use shared grid pagination on login history"
```

### Task 7: Platform Menu Page Server Paging Transition

**Files:**

- Modify: `frontend/src/pages/platform-admin/menus/PlatformMenuManagementPage.tsx`
- Modify: `frontend/src/test/platform-menu-management-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('requests paged menu list with applied filters', async () => {
  renderPage();

  fireEvent.change(screen.getByLabelText('검색어'), {
    target: { value: '관리' },
  });
  fireEvent.click(screen.getByRole('button', { name: '조회' }));

  await waitFor(() => {
    expect(listPlatformMenusPagedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 1,
        pageSize: 10,
        searchKeyword: '관리',
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/platform-menu-management-page.test.tsx`
Expected: FAIL with missing 조회 버튼 or paged call.

- [ ] **Step 3: Write minimal implementation**

```tsx
const pagination = useGridPagination(10);
const [appliedFilters, setAppliedFilters] = useState({
  searchField: 'menuNm',
  searchKeyword: '',
  useAt: 'all' as const,
});

const menusQuery = useQuery({
  queryKey: [
    'platform-admin',
    'menus',
    pagination.pageIndex,
    pagination.pageSize,
    appliedFilters,
  ],
  queryFn: () =>
    listPlatformMenusPaged({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      searchField: appliedFilters.searchField,
      searchKeyword: appliedFilters.searchKeyword || undefined,
      useAt: appliedFilters.useAt,
    }),
});

const handleSearch = () => {
  setAppliedFilters({
    searchField,
    searchKeyword: searchKeyword.trim(),
    useAt: filterActive as 'Y' | 'N' | 'all',
  });
  pagination.resetPage();
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/platform-menu-management-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/platform-admin/menus/PlatformMenuManagementPage.tsx frontend/src/test/platform-menu-management-page.test.tsx
git commit -m "feat(frontend): switch menu management to server paging"
```

### Task 8: Platform Authority Page Server Paging Transition

**Files:**

- Modify: `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`
- Modify: `frontend/src/test/platform-authority-management-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('requests paged role list on page size change', async () => {
  renderPage();

  fireEvent.mouseDown(screen.getByRole('combobox', { name: /페이지 크기/i }));
  fireEvent.click(await screen.findByRole('option', { name: '20개' }));

  await waitFor(() => {
    expect(listPlatformRolesPagedMock).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20, pageIndex: 1 }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/platform-authority-management-page.test.tsx`
Expected: FAIL with missing paged service call.

- [ ] **Step 3: Write minimal implementation**

```tsx
const pagination = useGridPagination(10);
const [appliedFilters, setAppliedFilters] = useState({
  searchField: 'name',
  searchKeyword: '',
  useAt: 'all' as const,
});

const rolesQuery = useQuery({
  queryKey: [
    'platform-admin',
    'roles',
    pagination.pageIndex,
    pagination.pageSize,
    appliedFilters,
  ],
  queryFn: () =>
    listPlatformRolesPaged({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      searchField: appliedFilters.searchField,
      searchKeyword: appliedFilters.searchKeyword || undefined,
      useAt: appliedFilters.useAt,
    }),
  retry: false,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/platform-authority-management-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx frontend/src/test/platform-authority-management-page.test.tsx
git commit -m "feat(frontend): switch authority management to server paging"
```

### Task 9: Final Regression Verification

**Files:**

- Verify: `frontend/src/pages/admin/LoginHistoryPage.tsx`
- Verify: `frontend/src/pages/platform-admin/menus/PlatformMenuManagementPage.tsx`
- Verify: `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`
- Verify: `backend/src/main/java/egovframework/let/uss/auth/web/PlatformMenuApiController.java`
- Verify: `backend/src/main/java/egovframework/let/uss/auth/web/PlatformAuthorityApiController.java`

- [ ] **Step 1: Run backend paging tests**

Run: `cd backend ; mvn -Dtest=PlatformMenuApiControllerPagingTest,PlatformAuthorityApiControllerPagingTest test`
Expected: PASS.

- [ ] **Step 2: Run frontend targeted tests**

Run: `cd frontend ; npm run test -- src/test/use-grid-pagination.test.ts src/test/grid-pagination-bar.test.tsx src/test/login-history-page.test.tsx src/test/platform-menu-management-page.test.tsx src/test/platform-authority-management-page.test.tsx`
Expected: PASS.

- [ ] **Step 3: Run frontend quality gates**

Run: `cd frontend ; npm run lint ; npm run build`
Expected: lint no new errors, build success.

- [ ] **Step 4: Run backend build validation**

Run: `cd backend ; mvn test`
Expected: PASS.

- [ ] **Step 5: Commit final integration**

```bash
git add backend frontend
git commit -m "feat: unify admin grids with server paging and shared pagination"
```

## Plan Self-Review

- Spec coverage check
  - 메뉴/권한 서버 페이징 API 추가: Task 1, Task 2
  - PaginationInfo 기반 계산: Task 1, Task 2
  - 프론트 공통 훅/공통 컴포넌트: Task 3, Task 4
  - 로그인 이력 공통화: Task 6
  - 메뉴/권한 서버 페이징 전환: Task 7, Task 8
  - 10/20/50 페이지 크기: Task 3, Task 4, Task 7, Task 8
  - 회귀 검증: Task 9

- Placeholder scan
  - TBD/TODO/implement later 문구 없음.
  - 각 코드 변경 단계에 코드 블록 포함.

- Type consistency check
  - 공통 상태 이름 pageIndex/pageSize/resetPage로 통일.
  - 백엔드 응답 필드 result.\*List/totalCount/paginationInfo로 통일.
