# Authority and Role-Menu Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 권한 등록과 권한별 메뉴 매핑을 통합 화면으로 제공하고, 로그인 사용자의 메뉴 구성을 권한 매핑 기반으로 동작시킨다.

**Architecture:** 백엔드는 `tb_authorityinfo` + `tb_role_menu_permission`를 중심으로 플랫폼 권한 CRUD 및 권한별 메뉴 일괄 저장 API를 제공한다. 프론트는 기존 분리 화면(`PlatformRoleManagementPage`, `PlatformRoleMenuManagementPage`)을 통합 페이지로 전환하고, `AppLayout`에서 사용자 권한코드 기준 접근 가능 메뉴를 조회해 `WorkMenuBar`와 경로 보정을 동기화한다.

**Tech Stack:** Spring Boot, MyBatis, PostgreSQL, React, TypeScript, React Query, Zustand, MUI, Vitest, Testing Library, MSW

---

### Task 1: 백엔드 권한 마스터 CRUD와 보호 정책 기반 추가

**Files:**

- Create: `backend/src/main/java/egovframework/let/uss/auth/service/AuthorityInfoVO.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/EgovAuthManageService.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/EgovAuthManageServiceImpl.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml`
- Test: `backend/src/test/java/egovframework/let/uss/auth/service/AuthorityInfoPolicyTest.java`

- [ ] **Step 1: Write the failing test**

`AuthorityInfoPolicyTest`를 추가해 `PLATFORM_ADMIN` 비활성화 금지 규칙을 먼저 실패로 정의한다.

```java
package egovframework.let.uss.auth.service;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class AuthorityInfoPolicyTest {

    @Test
    void preventPlatformAdminDeactivation() {
        AuthorityInfoVO target = new AuthorityInfoVO();
        target.setAuthorityCode("PLATFORM_ADMIN");
        target.setUseAt("N");

        assertThrows(IllegalArgumentException.class, () -> {
            AuthorityInfoVO.validateUpdatePolicy(target);
        });
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml -Dtest=AuthorityInfoPolicyTest test`
Expected: FAIL because `AuthorityInfoVO` and `validateUpdatePolicy` are not defined yet.

- [ ] **Step 3: Write minimal implementation**

`AuthorityInfoVO`를 만들고 정책 검증 정적 메서드를 추가한다.

```java
public class AuthorityInfoVO {
    private String authorityCode;
    private String authorityNm;
    private Integer authorityLevel;
    private String tenantScoped;
    private String useAt;

    public static void validateUpdatePolicy(AuthorityInfoVO target) {
        if ("PLATFORM_ADMIN".equals(target.getAuthorityCode())
            && "N".equalsIgnoreCase(target.getUseAt())) {
            throw new IllegalArgumentException("PLATFORM_ADMIN cannot be deactivated");
        }
    }
}
```

`AuthManageDAO`, `EgovAuthManageService`, `EgovAuthManageServiceImpl`, Mapper XML(PostgreSQL/MSSQL)에 아래 쿼리를 추가한다.

```xml
<select id="selectAuthorityList" resultType="egovframework.let.uss.auth.service.AuthorityInfoVO">
  SELECT authority_code AS authorityCode,
         authority_nm AS authorityNm,
         authority_level AS authorityLevel,
         tenant_scoped AS tenantScoped,
         use_at AS useAt
  FROM tb_authorityinfo
  ORDER BY authority_level, authority_code
</select>

<insert id="insertAuthority" parameterType="egovframework.let.uss.auth.service.AuthorityInfoVO">
  INSERT INTO tb_authorityinfo(authority_code, authority_nm, authority_level, tenant_scoped, use_at)
  VALUES (#{authorityCode}, #{authorityNm}, #{authorityLevel}, #{tenantScoped}, #{useAt})
</insert>

<update id="updateAuthorityUseAt" parameterType="egovframework.let.uss.auth.service.AuthorityInfoVO">
  UPDATE tb_authorityinfo
  SET use_at = #{useAt}, upd_dt = now(), upd_id = #{lastUpdusrId}
  WHERE authority_code = #{authorityCode}
</update>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn -f backend/pom.xml -Dtest=AuthorityInfoPolicyTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/egovframework/let/uss/auth/service/AuthorityInfoVO.java backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java backend/src/main/java/egovframework/let/uss/auth/service/EgovAuthManageService.java backend/src/main/java/egovframework/let/uss/auth/service/impl/EgovAuthManageServiceImpl.java backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml backend/src/test/java/egovframework/let/uss/auth/service/AuthorityInfoPolicyTest.java
git commit -m "feat: add authority master service and protection policy"
```

### Task 2: 플랫폼 권한 통합 API와 권한별 메뉴 일괄 저장 API 추가

**Files:**

- Create: `backend/src/main/java/egovframework/let/uss/auth/web/PlatformAuthorityApiController.java`
- Create: `backend/src/main/java/egovframework/let/uss/auth/service/PlatformRoleMenuSaveRequestVO.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml`
- Test: `backend/src/test/java/egovframework/let/uss/auth/service/PlatformRoleMenuSaveRequestVOTest.java`

- [ ] **Step 1: Write the failing test**

권한별 메뉴 저장 payload 정규화 테스트를 먼저 작성한다.

```java
package egovframework.let.uss.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import java.util.Arrays;
import org.junit.jupiter.api.Test;

class PlatformRoleMenuSaveRequestVOTest {

    @Test
    void normalizeMenuIdsUppercaseAndDistinct() {
        PlatformRoleMenuSaveRequestVO req = new PlatformRoleMenuSaveRequestVO();
        req.setRoleCode("tenant_admin");
        req.setMenuIds(Arrays.asList("menu_a", "menu_a", "menu_b"));

        req.normalize();

        assertEquals("TENANT_ADMIN", req.getRoleCode());
        assertEquals(Arrays.asList("MENU_A", "MENU_B"), req.getMenuIds());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml -Dtest=PlatformRoleMenuSaveRequestVOTest test`
Expected: FAIL because request VO does not exist.

- [ ] **Step 3: Write minimal implementation**

`PlatformAuthorityApiController`에 통합 API를 추가한다.

```java
@RestController
@RequestMapping("/api/platform-admin")
public class PlatformAuthorityApiController {

    @GetMapping("/roles")
    public List<AuthorityInfoVO> listRoles() throws Exception {
        return authManageService.selectAuthorityList();
    }

    @PostMapping("/roles")
    public AuthorityInfoVO createRole(@RequestBody AuthorityInfoVO payload) throws Exception {
        payload.setAuthorityCode(payload.getAuthorityCode().toUpperCase());
        payload.setUseAt("Y");
        authManageService.insertAuthority(payload);
        return payload;
    }

    @PatchMapping("/roles/{code}")
    public AuthorityInfoVO updateRoleStatus(@PathVariable String code, @RequestBody AuthorityInfoVO payload) throws Exception {
        payload.setAuthorityCode(code.toUpperCase());
        AuthorityInfoVO.validateUpdatePolicy(payload);
        authManageService.updateAuthorityUseAt(payload);
        return payload;
    }

    @GetMapping("/role-menus")
    public Map<String, Object> getRoleMenus(@RequestParam String roleCode) throws Exception {
        List<RoleMenuPermissionVO> list = authManageService.selectRoleMenuPermissionList(toCondition(roleCode));
        return Map.of("roleCode", roleCode.toUpperCase(), "menuIds", list.stream().map(RoleMenuPermissionVO::getMenuId).distinct().toList());
    }

    @PutMapping("/role-menus/{roleCode}")
    public Map<String, Object> saveRoleMenus(@PathVariable String roleCode, @RequestBody PlatformRoleMenuSaveRequestVO payload) throws Exception {
        payload.setRoleCode(roleCode);
        payload.normalize();
        authManageService.replaceRoleMenuPermissions(payload.getRoleCode(), payload.getMenuIds());
        return Map.of("roleCode", payload.getRoleCode(), "menuIds", payload.getMenuIds());
    }
}
```

DAO/Mapper에 `deleteRoleMenuPermissionsByAuthority`를 추가해 일괄 교체를 지원한다.

```xml
<delete id="deleteRoleMenuPermissionsByAuthority" parameterType="string">
  DELETE FROM tb_role_menu_permission
  WHERE authority_code = #{value}
</delete>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn -f backend/pom.xml -Dtest=PlatformRoleMenuSaveRequestVOTest test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/egovframework/let/uss/auth/web/PlatformAuthorityApiController.java backend/src/main/java/egovframework/let/uss/auth/service/PlatformRoleMenuSaveRequestVO.java backend/src/main/java/egovframework/let/uss/auth/service/impl/AuthManageDAO.java backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml backend/src/test/java/egovframework/let/uss/auth/service/PlatformRoleMenuSaveRequestVOTest.java
git commit -m "feat: add platform authority and role-menu integration APIs"
```

### Task 3: 프론트 권한 통합 화면 구현 및 라우트 정리

**Files:**

- Create: `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`
- Create: `frontend/src/test/platform-authority-management-page.test.tsx`
- Modify: `frontend/src/app/router/AppRoutes.tsx`
- Modify: `frontend/src/shared/components/layout/workMenuConfig.ts`
- Modify: `frontend/src/shared/constants/labels.ts`
- Modify: `frontend/src/services/platform/platformRoleService.ts`
- Modify: `frontend/src/services/platform/platformRoleMenuService.ts`

- [ ] **Step 1: Write the failing test**

통합 페이지 렌더링과 역할 선택/저장 흐름 테스트를 먼저 추가한다.

```tsx
it('renders authority form and role menu editor in one page', async () => {
  renderWithRouter('/platform/roles');

  expect(
    await screen.findByTestId('platform-authority-management-page'),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('권한 코드')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/platform-authority-management-page.test.tsx`
Expected: FAIL because unified page and route are not created.

- [ ] **Step 3: Write minimal implementation**

새 페이지에서 권한 등록 + 권한별 메뉴 편집을 한 화면에 배치한다.

```tsx
export function PlatformAuthorityManagementPage() {
  const [selectedRoleCode, setSelectedRoleCode] = useState('');
  const [draftMenuIds, setDraftMenuIds] = useState<string[] | null>(null);

  const rolesQuery = useQuery({
    queryKey: ['platform-admin', 'roles'],
    queryFn: listPlatformRoles,
  });
  const menusQuery = useQuery({
    queryKey: ['platform-admin', 'menus'],
    queryFn: listPlatformMenus,
  });

  const effectiveRoleCode =
    selectedRoleCode ||
    rolesQuery.data?.find((r) => r.code === 'PLATFORM_ADMIN')?.code ||
    rolesQuery.data?.[0]?.code ||
    '';

  const mappingQuery = useQuery({
    queryKey: ['platform-admin', 'role-menus', effectiveRoleCode],
    queryFn: () => getPlatformRoleMenuMapping(effectiveRoleCode),
    enabled: effectiveRoleCode.length > 0,
  });

  return (
    <Stack spacing={2} data-testid="platform-authority-management-page">
      {/* 권한 등록 폼 + 권한 목록 + 메뉴 매핑 편집 */}
    </Stack>
  );
}
```

`AppRoutes`에서 `/platform/roles`는 통합 페이지로 연결하고 `/platform/role-menus`는 `/platform/roles`로 리다이렉트한다.

```tsx
<Route path="/platform/roles" element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}><PlatformAuthorityManagementPage /></ProtectedRoute>} />
<Route path="/platform/role-menus" element={<Navigate to="/platform/roles" replace />} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/platform-authority-management-page.test.tsx src/test/work-menu-bar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx frontend/src/test/platform-authority-management-page.test.tsx frontend/src/app/router/AppRoutes.tsx frontend/src/shared/components/layout/workMenuConfig.ts frontend/src/shared/constants/labels.ts frontend/src/services/platform/platformRoleService.ts frontend/src/services/platform/platformRoleMenuService.ts
git commit -m "feat: unify authority registration and role-menu management page"
```

### Task 4: 런타임 메뉴를 권한 매핑 기반으로 전환

**Files:**

- Create: `frontend/src/services/platform/platformUserMenuService.ts`
- Create: `frontend/src/shared/auth/authorityCode.ts`
- Modify: `frontend/src/shared/components/layout/AppLayout.tsx`
- Modify: `frontend/src/shared/components/layout/workMenuConfig.ts`
- Modify: `frontend/src/shared/store/authStore.ts`
- Modify: `frontend/src/services/auth/authService.ts`
- Modify: `frontend/src/test/work-menu-bar.test.tsx`
- Modify: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

로그인 권한별 동적 메뉴 필터와 폴백 경로 테스트를 먼저 추가한다.

```tsx
it('filters work menus by accessible menu ids resolved from authority code', async () => {
  server.use(
    http.get('/api/admin/user-menus/:authorityCode', () =>
      HttpResponse.json({ result: { menuList: [{ menuUrl: '/dashboard' }] } }),
    ),
  );

  renderAppRoutesAt('/platform/menus', { role: 'TENANT_ADMIN' });

  expect(await screen.findByTestId('dashboard-admin-hub')).toBeInTheDocument();
  expect(screen.queryByText('메뉴 관리')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/work-menu-bar.test.tsx src/test/app-shell.test.tsx`
Expected: FAIL because runtime menu uses static role filtering only.

- [ ] **Step 3: Write minimal implementation**

`authorityCode.ts`에 프론트 role을 백엔드 authorityCode로 매핑한다.

```ts
import type { UserRole } from '../store/authStore';

export function toAuthorityCode(role: UserRole): string {
  if (role === 'PLATFORM_ADMIN') return 'PLATFORM_ADMIN';
  if (role === 'TENANT_ADMIN') return 'TENANT_ADMIN';
  return 'TENANT_USER';
}
```

`platformUserMenuService.ts`를 추가한다.

```ts
export async function listAccessibleMenus(
  authorityCode: string,
): Promise<string[]> {
  const { data } = await apiClient.get<{
    result?: { menuList?: { menuUrl: string }[] };
    menuList?: { menuUrl: string }[];
  }>(`/admin/user-menus/${authorityCode}`);

  const menuList = data.result?.menuList ?? data.menuList ?? [];
  return menuList.map((item) => item.menuUrl);
}
```

`AppLayout.tsx`에서 React Query로 접근 가능 메뉴를 조회해 `getWorkMenuGroups` 결과를 경로 집합으로 필터링한다.

```tsx
const authorityCode = toAuthorityCode(role);
const accessibleMenusQuery = useQuery({
  queryKey: ['user-accessible-menus', authorityCode],
  queryFn: () => listAccessibleMenus(authorityCode),
});

const menuGroups = useMemo(() => {
  const base = getWorkMenuGroups(role);
  const allowed = new Set(accessibleMenusQuery.data ?? []);
  return base
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => allowed.size === 0 || allowed.has(item.path),
      ),
    }))
    .filter((group) => group.items.length > 0);
}, [role, accessibleMenusQuery.data]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/work-menu-bar.test.tsx src/test/app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/platform/platformUserMenuService.ts frontend/src/shared/auth/authorityCode.ts frontend/src/shared/components/layout/AppLayout.tsx frontend/src/shared/components/layout/workMenuConfig.ts frontend/src/shared/store/authStore.ts frontend/src/services/auth/authService.ts frontend/src/test/work-menu-bar.test.tsx frontend/src/test/app-shell.test.tsx
git commit -m "feat: build runtime menus from authority-based accessible menu API"
```

### Task 5: MSW/시드 데이터 및 회귀 검증 정리

**Files:**

- Modify: `frontend/src/mocks/handlers.ts`
- Modify: `backend/DATABASE/login_postgresql_schema.sql`
- Modify: `frontend/src/test/platform-menu-management-page.test.tsx`
- Modify: `frontend/src/test/auth-service.test.ts`

- [ ] **Step 1: Write the failing test**

`auth-service.test.ts`에 role-to-authority 매핑 기대치를 추가한다.

```ts
it('maps USER role to TENANT_USER authority in runtime menu flow', () => {
  expect(toAuthorityCode('USER')).toBe('TENANT_USER');
});
```

`platform-menu-management-page.test.tsx`에 PLATFORM_ADMIN 필수 메뉴가 기본 할당된 상태를 검증한다.

```tsx
expect(await screen.findByText('권한 관리')).toBeInTheDocument();
expect(await screen.findByText('메뉴 관리')).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/auth-service.test.ts src/test/platform-menu-management-page.test.tsx`
Expected: FAIL before mock/schema alignment.

- [ ] **Step 3: Write minimal implementation**

MSW 핸들러를 `/api/admin/user-menus/:authorityCode` 응답까지 확장하고, 기본 권한 3종 및 PLATFORM_ADMIN 핵심 메뉴 매핑을 고정한다.

```ts
http.get('/api/admin/user-menus/:authorityCode', ({ params }) => {
  const authorityCode = String(params.authorityCode).toUpperCase();
  const menuIds = roleMenuMappings[authorityCode] ?? [];
  const menuList = platformMenus.filter((menu) =>
    menuIds.includes(menu.menuId),
  );
  return HttpResponse.json({ result: { menuList } });
});
```

`login_postgresql_schema.sql`에서 권한/핵심 메뉴 시드를 idempotent하게 유지한다.

```sql
INSERT INTO tb_authorityinfo (authority_code, authority_nm, authority_level, tenant_scoped)
VALUES
  ('PLATFORM_ADMIN', 'Platform administrator', 1, 'N'),
  ('TENANT_ADMIN', 'Tenant administrator', 50, 'Y'),
  ('TENANT_USER', 'Tenant user', 100, 'Y')
ON CONFLICT (authority_code) DO NOTHING;

INSERT INTO tb_role_menu_permission (authority_code, menu_id, permission_id, crt_id, upd_id)
VALUES
  ('PLATFORM_ADMIN', 'MENU_MENU', 'PERM_WRITE', 'SYSTEM', 'SYSTEM'),
  ('PLATFORM_ADMIN', 'MENU_PERMISSION', 'PERM_WRITE', 'SYSTEM', 'SYSTEM')
ON CONFLICT (authority_code, menu_id, permission_id) DO NOTHING;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/auth-service.test.ts src/test/platform-menu-management-page.test.tsx`
Expected: PASS.

Run: `npm run lint ; npm run test ; npm run build`
Expected: lint success(known mockServiceWorker 경고 외 신규 경고 없음), test PASS, build success.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/mocks/handlers.ts backend/DATABASE/login_postgresql_schema.sql frontend/src/test/platform-menu-management-page.test.tsx frontend/src/test/auth-service.test.ts
git commit -m "test: align mock and seed data with authority-menu integration"
```

### Task 6: 최종 통합 검증과 문서 동기화

**Files:**

- Modify: `frontend/README.md`
- Modify: `docs/superpowers/specs/2026-06-18-authority-menu-integration-design.md`
- Modify: `docs/superpowers/plans/2026-06-18-authority-menu-integration-implementation.md`

- [ ] **Step 1: Write the failing test**

문서 기준 검증으로 대체: 구현 완료 후 실행할 체크리스트를 먼저 작성해 누락을 실패 조건으로 본다.

```md
- [ ] /platform/roles 통합 화면에서 권한 등록 + 메뉴 매핑 동작 확인
- [ ] PLATFORM_ADMIN 비활성화 차단 확인
- [ ] TENANT_ADMIN/TENANT_USER 메뉴 노출이 매핑 기준으로 변경 확인
```

- [ ] **Step 2: Run test to verify it fails**

Run: `git grep -n "TODO_AUTHORITY_MENU_INTEGRATION"`
Expected: FAIL (no marker) until docs checklist is added and resolved.

- [ ] **Step 3: Write minimal implementation**

README와 설계/계획 문서에 최종 API 경로와 운영 정책을 반영한다.

```md
- Unified authority page: /platform/roles
- Runtime menu source: GET /api/admin/user-menus/{authorityCode}
- Seed baseline: PLATFORM_ADMIN, TENANT_ADMIN, TENANT_USER + mandatory admin menus
```

- [ ] **Step 4: Run test to verify it passes**

Run: `git status --short`
Expected: only intended documentation updates remain, then clean after commit.

- [ ] **Step 5: Commit**

```bash
git add frontend/README.md docs/superpowers/specs/2026-06-18-authority-menu-integration-design.md docs/superpowers/plans/2026-06-18-authority-menu-integration-implementation.md
git commit -m "docs: document unified authority management and runtime menu policy"
```
