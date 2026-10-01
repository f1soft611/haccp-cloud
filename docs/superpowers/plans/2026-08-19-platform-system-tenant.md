# Platform System Tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canonicalize the platform administrator tenant identity to `PLATFORM` while accepting legacy `000001` at application boundaries.

**Architecture:** Add small normalization helpers at the backend login boundary and frontend auth/platform-service boundary. Customer tenant codes remain unchanged; only platform-admin identity and legacy aliases are normalized.

**Tech Stack:** Spring MVC/Java, PostgreSQL, React/TypeScript, Vitest, Maven.

---

### Task 1: Backend canonical platform identity

**Files:**

- Create: `backend/src/main/java/egovframework/let/platform_admin/tenants/context/PlatformTenantCodes.java`
- Modify: `backend/src/main/java/egovframework/let/uat/uia/service/impl/EgovLoginServiceImpl.java`
- Modify: `backend/src/main/java/egovframework/let/uat/uia/web/EgovLoginApiController.java`
- Test: `backend/src/test/java/egovframework/let/uat/uia/service/impl/EgovLoginServiceImplTest.java`

- [ ] Add tests proving `000001` is normalized to `PLATFORM` and platform-admin login result/context use `PLATFORM`.
- [ ] Run the focused backend login tests and confirm the new assertions fail.
- [ ] Add `PlatformTenantCodes.normalize(String)` and `isPlatform(String)` with `PLATFORM` and `000001` compatibility.
- [ ] Normalize platform-admin request/result tenant code before session/JWT/history data is produced.
- [ ] Run the focused backend login tests again.

### Task 2: Frontend auth and platform API normalization

**Files:**

- Create: `frontend/src/shared/tenant/platformTenant.ts`
- Modify: `frontend/src/services/auth/authService.ts`
- Modify: `frontend/src/shared/store/authStore.ts`
- Modify: `frontend/src/services/platform-admin/platformRoleMenuService.ts`
- Test: `frontend/src/test/auth-service.test.ts`

- [ ] Add tests for legacy backend `factoryCode: '000001'` becoming `tenantCode: 'PLATFORM'`.
- [ ] Add a normalization helper and apply it to login response and persisted auth state.
- [ ] Normalize platform role-menu query and save tenant parameters.
- [ ] Run focused Vitest tests.

### Task 3: Fixtures and final verification

**Files:**

- Modify: `frontend/src/mocks/handlers.ts`
- Modify: `frontend/src/test/app-shell.test.tsx`
- Modify: `backend/DATABASE/seed_postgresql_minimal_platform_admin.sql` only if a stale platform code remains in the touched seed path.

- [ ] Update platform-admin mocks to return `PLATFORM`.
- [ ] Run frontend typecheck and relevant Vitest tests.
- [ ] Run backend Maven tests for login and tenant context.
- [ ] Review the diff and verify unrelated worktree changes remain untouched.
