# Platform Authority Description Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플랫폼 권한 관리 화면에서 설명 수정값이 저장 후 재조회에도 유지되도록 하고, 권한 목록 그리드 헤더를 설명으로 바로잡는다.

**Architecture:** 프론트 UI 모델은 기존 `description` 필드를 유지하고, 서비스 계층에서 백엔드의 `authorityDc` 필드를 흡수한다. 백엔드는 `tb_authorityinfo.authority_dc`를 정식 필드로 추가해 VO, MyBatis 조회/등록/수정 SQL, 스키마를 같은 이름으로 연결한다.

**Tech Stack:** React, TypeScript, Vitest, Spring Boot, Lombok, MyBatis XML, Maven, PostgreSQL schema SQL

---

### Task 1: 권한 페이지 회귀 테스트와 헤더 라벨 고정

**Files:**

- Modify: `frontend/src/test/platform-authority-management-page.test.tsx`
- Modify: `frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx`

- [ ] **Step 1: Write the failing test**

권한 수정 테스트에 설명 입력 변경과 헤더 검증을 추가한다.

```tsx
expect(screen.getByRole('columnheader', { name: '설명' })).toBeInTheDocument();

fireEvent.change(within(editDialog).getByRole('textbox', { name: /설명/ }), {
  target: { value: '플랫폼 운영 총괄 권한' },
});

await waitFor(() => {
  expect(updatePlatformRoleMock.mock.calls[0]?.[0]).toEqual(
    expect.objectContaining({
      code: 'PLATFORM_ADMIN',
      name: '플랫폼 총괄 관리자',
      description: '플랫폼 운영 총괄 권한',
      active: true,
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/platform-authority-management-page.test.tsx`

Expected: FAIL because the current grid header renders `내용` instead of `설명`.

- [ ] **Step 3: Write minimal implementation**

권한 목록 헤더를 현재 화면 의미에 맞게 고정 텍스트로 바꾼다.

```tsx
<TableHead>
  <TableRow>
    <TableCell>권한 코드</TableCell>
    <TableCell>권한명</TableCell>
    <TableCell>설명</TableCell>
    <TableCell width="100" align="center">
      {APP_LABELS.table.status}
    </TableCell>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/platform-authority-management-page.test.tsx`

Expected: PASS with the updated payload assertion and `설명` column header assertion both green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/test/platform-authority-management-page.test.tsx frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx
git commit -m "test: lock authority description header behavior"
```

### Task 2: 프론트 서비스 정규화에 authorityDc 응답 지원 추가

**Files:**

- Create: `frontend/src/test/platform-role-service.test.ts`
- Modify: `frontend/src/services/platform/platformRoleService.ts`

- [ ] **Step 1: Write the failing test**

`authorityDc`만 내려오는 응답도 프론트의 `description`으로 정규화되는지 테스트를 추가한다.

```ts
import { describe, expect, it, vi } from 'vitest';
import {
  listPlatformRoles,
  updatePlatformRole,
} from '../services/platform/platformRoleService';

const getMock = vi.fn();
const putMock = vi.fn();

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: getMock,
    post: vi.fn(),
    patch: vi.fn(),
    put: putMock,
  },
}));

describe('platformRoleService', () => {
  it('maps authorityDc from role list responses into description', async () => {
    getMock.mockResolvedValue({
      data: [
        {
          authorityCode: 'QA_MANAGER',
          authorityNm: '품질 관리자',
          authorityDc: '품질 승인 권한',
          useAt: 'Y',
        },
      ],
    });

    const roles = await listPlatformRoles();

    expect(roles).toEqual([
      expect.objectContaining({
        code: 'QA_MANAGER',
        name: '품질 관리자',
        description: '품질 승인 권한',
        active: true,
      }),
    ]);
  });

  it('sends authorityDc together with description on update', async () => {
    putMock.mockResolvedValue({
      data: {
        authorityCode: 'QA_MANAGER',
        authorityNm: '품질 관리자',
        authorityDc: '품질 승인 권한',
        useAt: 'Y',
      },
    });

    await updatePlatformRole({
      code: 'QA_MANAGER',
      name: '품질 관리자',
      description: '품질 승인 권한',
      active: true,
    });

    expect(putMock).toHaveBeenCalledWith(
      '/platform-admin/roles/QA_MANAGER',
      expect.objectContaining({
        description: '품질 승인 권한',
        authorityDc: '품질 승인 권한',
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/platform-role-service.test.ts`

Expected: FAIL because `platformRoleService` does not yet read `authorityDc` or send it on update.

- [ ] **Step 3: Write minimal implementation**

API 타입과 정규화, 등록/수정 payload에 `authorityDc`를 추가한다.

```ts
type PlatformRoleApiItem = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  authorityDc?: string;
  active?: boolean;
  authorityCode?: string;
  authorityNm?: string;
  useAt?: 'Y' | 'N';
};

function normalizePlatformRoleItem(item: PlatformRoleApiItem): PlatformRoleItem {
  const code = item.code ?? item.authorityCode ?? '';
  return {
    id: item.id ?? code,
    code,
    name: item.name ?? item.authorityNm ?? code,
    description: item.description ?? item.authorityDc ?? '',
    active: item.active ?? item.useAt !== 'N',
    updatedBy: item.updatedBy ?? item.lastUpdusrId ?? '',
    updatedAt: item.updatedAt ?? item.lastUpdtPnttm ?? '',
  };
}

{
  code: payload.code,
  name: payload.name,
  description: payload.description,
  authorityDc: payload.description,
  active: payload.active,
  authorityCode: payload.code,
  authorityNm: payload.name,
  useAt: payload.active ? 'Y' : 'N',
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/platform-role-service.test.ts`

Expected: PASS with `authorityDc` normalized into `description` and update payload containing both keys.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/test/platform-role-service.test.ts frontend/src/services/platform/platformRoleService.ts
git commit -m "feat: normalize authority descriptions in platform role service"
```

### Task 3: 백엔드 권한 설명 필드와 SQL 저장 경로 추가

**Files:**

- Create: `backend/src/test/java/egovframework/let/uss/auth/service/AuthorityInfoDescriptionFieldTest.java`
- Modify: `backend/src/main/java/egovframework/let/uss/auth/service/AuthorityInfoVO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml`
- Modify: `backend/DATABASE/login_postgresql_schema.sql`

- [ ] **Step 1: Write the failing test**

설명 필드가 VO에 정식 프로퍼티로 존재해야 컴파일되는 단위 테스트를 추가한다.

```java
package egovframework.let.uss.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AuthorityInfoDescriptionFieldTest {

    @DisplayName("권한 설명 필드를 보관할 수 있다")
    @Test
    void storeAuthorityDescription() {
        AuthorityInfoVO target = new AuthorityInfoVO();
        target.setAuthorityDc("품질 승인 권한");

        assertEquals("품질 승인 권한", target.getAuthorityDc());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -Dtest=AuthorityInfoDescriptionFieldTest test`

Expected: FAIL during compile or test because `AuthorityInfoVO` does not yet define `authorityDc`.

- [ ] **Step 3: Write minimal implementation**

VO, PostgreSQL/MSSQL 매퍼, 로컬 스키마에 설명 컬럼을 추가한다.

```java
@Schema(description = "권한 설명")
private String authorityDc = "";
```

```xml
<select id="selectAuthorityList" resultType="egovframework.let.uss.auth.service.AuthorityInfoVO">
    SELECT
        authority_code AS authorityCode,
        authority_nm AS authorityNm,
        authority_dc AS authorityDc,
        authority_level AS authorityLevel,
        tenant_scoped AS tenantScoped,
        use_at AS useAt,
        created_at AS frstRegistPnttm,
        'SYSTEM' AS frstRegisterId,
        updated_at AS lastUpdtPnttm,
        'SYSTEM' AS lastUpdusrId
    FROM tb_authorityinfo
</select>

<insert id="insertAuthority" parameterType="egovframework.let.uss.auth.service.AuthorityInfoVO">
    INSERT INTO tb_authorityinfo (
        authority_code,
        authority_nm,
        authority_dc,
        authority_level,
        tenant_scoped,
        use_at,
        created_at,
        updated_at
    ) VALUES (
        #{authorityCode},
        #{authorityNm},
        #{authorityDc},
        #{authorityLevel},
        #{tenantScoped},
        #{useAt},
        now(),
        now()
    )
</insert>

<update id="updateAuthority" parameterType="egovframework.let.uss.auth.service.AuthorityInfoVO">
    UPDATE tb_authorityinfo
    SET authority_nm = #{authorityNm},
        authority_dc = #{authorityDc},
        use_at = #{useAt},
        updated_at = now()
    WHERE authority_code = #{authorityCode}
</update>
```

```sql
CREATE TABLE tb_authorityinfo (
  authority_code VARCHAR(50) PRIMARY KEY,
  authority_nm VARCHAR(100) NOT NULL,
  authority_dc VARCHAR(500),
  authority_level INTEGER NOT NULL,
  tenant_scoped CHAR(1) NOT NULL DEFAULT 'Y',
  use_at CHAR(1) NOT NULL DEFAULT 'Y',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn -Dtest=AuthorityInfoDescriptionFieldTest test`

Expected: PASS with the new `authorityDc` property available.

- [ ] **Step 5: Run backend compile verification**

Run: `mvn -DskipTests compile`

Expected: BUILD SUCCESS with the updated VO and XML mappers.

- [ ] **Step 6: Commit**

```bash
git add backend/src/test/java/egovframework/let/uss/auth/service/AuthorityInfoDescriptionFieldTest.java backend/src/main/java/egovframework/let/uss/auth/service/AuthorityInfoVO.java backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_postgresql.xml backend/src/main/resources/egovframework/mapper/let/uss/auth/EgovAuthManageMapper_SQL_mssql.xml backend/DATABASE/login_postgresql_schema.sql
git commit -m "feat: persist platform authority descriptions"
```

### Task 4: 통합 검증으로 설명 round-trip 보장

**Files:**

- Modify: `frontend/src/test/platform-authority-management-page.test.tsx`
- Modify: `frontend/src/test/platform-role-service.test.ts`

- [ ] **Step 1: Add final assertions for round-trip behavior**

프론트 페이지 테스트와 서비스 테스트가 각각 UI payload, 응답 정규화, 헤더 라벨을 모두 잡도록 마지막 assertion을 정리한다.

```tsx
expect(await screen.findByText('플랫폼 관리자')).toBeInTheDocument();
expect(screen.getByRole('columnheader', { name: '설명' })).toBeInTheDocument();
```

```ts
expect(roles[0]?.description).toBe('품질 승인 권한');
expect(putMock).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run focused frontend tests**

Run: `npm run test -- src/test/platform-authority-management-page.test.tsx src/test/platform-role-service.test.ts`

Expected: PASS for both tests.

- [ ] **Step 3: Run frontend production verification**

Run: `npm run build`

Expected: build completes successfully without new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/test/platform-authority-management-page.test.tsx frontend/src/test/platform-role-service.test.ts frontend/src/services/platform/platformRoleService.ts frontend/src/pages/platform-admin/authorities/PlatformAuthorityManagementPage.tsx
git commit -m "test: verify authority description round trip"
```

### Task 5: 운영 반영 메모와 최종 검토

**Files:**

- Modify: `docs/superpowers/specs/2026-06-19-platform-authority-description-design.md`

- [ ] **Step 1: Add rollout note for schema dependency**

스펙 문서에 운영 반영 시 `tb_authorityinfo.authority_dc` 마이그레이션이 선행되어야 한다는 메모를 보강한다.

```md
## 운영 반영 메모

- 애플리케이션 배포 전 `tb_authorityinfo.authority_dc` 컬럼 추가가 선행되어야 한다.
- PostgreSQL과 MSSQL 모두 동일한 설명 컬럼을 맞춰야 프론트 round-trip 이 보장된다.
```

- [ ] **Step 2: Verify docs update**

Run: `git diff -- docs/superpowers/specs/2026-06-19-platform-authority-description-design.md`

Expected: diff shows only the rollout note addition.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-06-19-platform-authority-description-design.md
git commit -m "docs: add rollout note for authority description schema"
```
