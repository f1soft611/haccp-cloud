# Tenant Admin First Login Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플랫폼관리자가 업체 코드를 발급하고 메일(Mock)로 전달한 뒤, 업체관리자가 최초 로그인 시 사용자 1명 이상 + 부서 1개 이상 설정 전까지 일반 화면 접근을 막고 초기 설정 완료 후 정상 진입시키는 흐름을 구현한다.

**Architecture:** 플랫폼관리자 온보딩 화면에서 업체 코드 발급과 메일 발송을 Mock API로 처리하고 샘플 업체 목록을 함께 제공한다. 로그인 응답 계약에는 `onboardingRequired`(및 선택적 `onboardingStatus`)를 추가하고, 인증 스토어와 라우트 가드가 이 값을 기준으로 경로를 강제한다. 최초 설정 화면은 사용자/부서 생성 API를 재사용하고 완료 API를 통해 백엔드 판정값으로 상태를 종료한다.

**Tech Stack:** React 19, TypeScript, React Router 7, Zustand 5, TanStack Query 5, MUI 7, MSW, Vitest, Testing Library

---

## File Structure Map

- Modify: `frontend/src/services/authService.ts` (로그인 응답 타입 확장)
- Modify: `frontend/src/services/tenantService.ts` (업체 코드 발급 + 메일 Mock 응답 타입)
- Create: `frontend/src/services/firstLoginSetupService.ts` (상태 조회/완료 API)
- Modify: `frontend/src/shared/store/authStore.ts` (온보딩 상태 저장)
- Modify: `frontend/src/app/router/ProtectedRoute.tsx` (최초 설정 강제 리다이렉트)
- Modify: `frontend/src/app/router/AppRoutes.tsx` (신규 경로 연결)
- Modify: `frontend/src/pages/OnboardingPage.tsx` (플랫폼관리자 코드 발급/메일 발송/샘플 목록)
- Create: `frontend/src/pages/TenantFirstLoginSetupPage.tsx` (업체관리자 최초 설정 UI)
- Modify: `frontend/src/pages/LoginPage.tsx` (로그인 직후 분기 대응)
- Modify: `frontend/src/shared/ui/labels.ts` (라벨 추가)
- Modify: `frontend/src/mocks/handlers.ts` (로그인 응답/신규 API 목)
- Modify: `frontend/src/test/app-shell.test.tsx` (라우트 가드 회귀)
- Create: `frontend/src/test/platform-onboarding-page.test.tsx` (코드 발급/메일 Mock/샘플 목록 테스트)
- Create: `frontend/src/test/tenant-first-login-setup.test.tsx` (최초 설정 화면 테스트)

---

### Task 0: 플랫폼관리자 업체 코드 발급 + 메일 Mock + 샘플 데이터 도입

**Files:**

- Modify: `frontend/src/services/tenantService.ts`
- Modify: `frontend/src/pages/OnboardingPage.tsx`
- Modify: `frontend/src/shared/ui/labels.ts`
- Modify: `frontend/src/mocks/handlers.ts`
- Create: `frontend/src/test/platform-onboarding-page.test.tsx`
- Test: `frontend/src/test/platform-onboarding-page.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('issues tenant code and shows MOCK_SENT mail status', async () => {
  render(
    <AppProviders>
      <OnboardingPage />
    </AppProviders>,
  );

  await userEvent.type(
    screen.getByLabelText(APP_LABELS.field.companyName),
    '감마푸드',
  );
  await userEvent.type(
    screen.getByLabelText(APP_LABELS.field.adminName),
    '관리자감마',
  );
  await userEvent.type(
    screen.getByLabelText(APP_LABELS.field.adminEmail),
    'admin@gamma.com',
  );

  await userEvent.click(
    screen.getByRole('button', { name: APP_LABELS.action.issueTenantCode }),
  );

  expect(
    await screen.findByText(APP_LABELS.message.tenantCodeIssued),
  ).toBeInTheDocument();
  expect(screen.getByText('MOCK_SENT')).toBeInTheDocument();
});

it('shows sample tenant list on onboarding page', async () => {
  render(
    <AppProviders>
      <OnboardingPage />
    </AppProviders>,
  );

  expect(await screen.findByText('TENANT-SAMPLE-01')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/platform-onboarding-page.test.tsx`
Expected: FAIL because 신규 라벨/서비스/샘플 목록/Mock 상태가 아직 없다.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/services/tenantService.ts (additions)
export type IssueTenantCodeResponse = {
  tenantCode: string;
  companyName: string;
  adminEmail: string;
  mailDispatchStatus: 'MOCK_SENT';
};

export async function issueTenantCode(payload: {
  companyName: string;
  adminName: string;
  adminEmail: string;
}) {
  const { data } = await apiClient.post<IssueTenantCodeResponse>(
    '/tenants/issue-code',
    payload,
  );
  return data;
}
```

```ts
// frontend/src/mocks/handlers.ts (additions)
http.post('/api/tenants/issue-code', async ({ request }) => {
  const payload = (await request.json()) as {
    companyName?: string;
    adminName?: string;
    adminEmail?: string;
  };

  if (!payload.companyName || !payload.adminName || !payload.adminEmail) {
    return HttpResponse.json({ message: 'Invalid input' }, { status: 400 });
  }

  const tenantCode = `TENANT-${String(tenants.length + 1).padStart(3, '0')}`;
  const created = {
    tenantCode,
    companyName: payload.companyName,
    createdAt: new Date().toISOString(),
  };

  tenants = [created, ...tenants];

  return HttpResponse.json({
    tenantCode,
    companyName: payload.companyName,
    adminEmail: payload.adminEmail,
    mailDispatchStatus: 'MOCK_SENT',
  });
});
```

```tsx
// frontend/src/pages/OnboardingPage.tsx (structure)
// - issueTenantCode mutation 사용
// - 성공 시 tenantCode, mailDispatchStatus 노출
// - 샘플 업체 목록(정적/목 데이터 기반) 노출
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/platform-onboarding-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/tenantService.ts frontend/src/pages/OnboardingPage.tsx frontend/src/shared/ui/labels.ts frontend/src/mocks/handlers.ts frontend/src/test/platform-onboarding-page.test.tsx
git commit -m "feat: add platform tenant-code issuance with mock mail and samples"
```

---

### Task 1: 로그인 계약과 인증 상태를 테스트로 고정

**Files:**

- Modify: `frontend/src/test/app-shell.test.tsx`
- Modify: `frontend/src/services/authService.ts`
- Modify: `frontend/src/shared/store/authStore.ts`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('redirects TENANT_ADMIN with onboardingRequired=true from /dashboard to /tenant-first-setup', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-Z',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
    onboardingRequired: true,
  });

  renderAppRoutesAt('/dashboard');

  expect(
    await screen.findByRole('heading', {
      name: APP_LABELS.pageTitle.tenantFirstSetup,
    }),
  ).toBeInTheDocument();
});

it('keeps TENANT_ADMIN on /dashboard when onboardingRequired=false', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
    onboardingRequired: false,
  });

  renderAppRoutesAt('/dashboard');

  expect(await screen.findByTestId('dashboard-admin-hub')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL because `authStore`/`ProtectedRoute`에 `onboardingRequired` 분기가 없다.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/services/authService.ts
export type LoginResponse = {
  tenantCode: string;
  userId: string;
  role: UserRole;
  accessToken: string;
  onboardingRequired?: boolean;
  onboardingStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
};
```

```ts
// frontend/src/shared/store/authStore.ts
type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

type AuthState = {
  isAuthenticated: boolean;
  tenantCode: string;
  userId: string;
  role: UserRole;
  onboardingRequired: boolean;
  onboardingStatus: OnboardingStatus;
  login: (payload: {
    tenantCode: string;
    userId: string;
    role: UserRole;
    onboardingRequired?: boolean;
    onboardingStatus?: OnboardingStatus;
  }) => void;
  markOnboardingCompleted: () => void;
  logout: () => void;
};

const initialState = {
  isAuthenticated: false,
  tenantCode: '',
  userId: '',
  role: 'USER' as UserRole,
  onboardingRequired: false,
  onboardingStatus: 'COMPLETED' as OnboardingStatus,
};

login: ({ tenantCode, userId, role, onboardingRequired, onboardingStatus }) =>
  set({
    isAuthenticated: true,
    tenantCode,
    userId,
    role,
    onboardingRequired: onboardingRequired ?? false,
    onboardingStatus: onboardingStatus ?? 'COMPLETED',
  }),
markOnboardingCompleted: () =>
  set({ onboardingRequired: false, onboardingStatus: 'COMPLETED' }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/authService.ts frontend/src/shared/store/authStore.ts frontend/src/test/app-shell.test.tsx
git commit -m "feat: extend auth state with onboarding contract"
```

---

### Task 2: 라우트 가드와 경로를 최초 설정 플로우로 연결

**Files:**

- Modify: `frontend/src/app/router/ProtectedRoute.tsx`
- Modify: `frontend/src/app/router/AppRoutes.tsx`
- Modify: `frontend/src/test/app-shell.test.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('redirects PLATFORM_ADMIN away from tenant first setup route', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'platform_admin',
    role: 'PLATFORM_ADMIN',
    onboardingRequired: false,
  });

  renderAppRoutesAt('/tenant-first-setup');

  expect(await screen.findByTestId('dashboard-admin-hub')).toBeInTheDocument();
});

it('allows TENANT_ADMIN to open tenant first setup route', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-A',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
    onboardingRequired: true,
  });

  renderAppRoutesAt('/tenant-first-setup');

  expect(
    await screen.findByRole('heading', {
      name: APP_LABELS.pageTitle.tenantFirstSetup,
    }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx`
Expected: FAIL because `/tenant-first-setup` 라우트가 없고 가드 분기가 없다.

- [ ] **Step 3: Write minimal implementation**

```tsx
// frontend/src/app/router/ProtectedRoute.tsx (excerpt)
const onboardingRequired = useAuthStore((state) => state.onboardingRequired);
const location = useLocation();

const isTenantAdmin = role === 'TENANT_ADMIN';
const isTenantSetupRoute = location.pathname === '/tenant-first-setup';

if (isTenantAdmin && onboardingRequired && !isTenantSetupRoute) {
  return <Navigate to="/tenant-first-setup" replace />;
}

if (isTenantAdmin && !onboardingRequired && isTenantSetupRoute) {
  return <Navigate to="/dashboard" replace />;
}
```

```tsx
// frontend/src/app/router/AppRoutes.tsx (excerpt)
<Route
  path="/tenant-first-setup"
  element={
    <ProtectedRoute allowedRoles={['TENANT_ADMIN']}>
      <TenantFirstLoginSetupPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/router/ProtectedRoute.tsx frontend/src/app/router/AppRoutes.tsx frontend/src/test/app-shell.test.tsx
git commit -m "feat: enforce tenant first-login setup route guard"
```

---

### Task 3: 최초 설정 전용 서비스/페이지를 TDD로 구현

**Files:**

- Create: `frontend/src/services/firstLoginSetupService.ts`
- Create: `frontend/src/pages/TenantFirstLoginSetupPage.tsx`
- Modify: `frontend/src/shared/ui/labels.ts`
- Create: `frontend/src/test/tenant-first-login-setup.test.tsx`
- Test: `frontend/src/test/tenant-first-login-setup.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('shows setup progress counts from API', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-Z',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
    onboardingRequired: true,
  });

  render(
    <AppProviders>
      <TenantFirstLoginSetupPage />
    </AppProviders>,
  );

  expect(await screen.findByText('사용자 0 / 1')).toBeInTheDocument();
  expect(screen.getByText('부서 0 / 1')).toBeInTheDocument();
});

it('completes onboarding after user and department are created', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-Z',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
    onboardingRequired: true,
  });

  render(
    <AppProviders>
      <TenantFirstLoginSetupPage />
    </AppProviders>,
  );

  await userEvent.type(
    screen.getByLabelText(APP_LABELS.field.name),
    '신규사용자',
  );
  await userEvent.type(
    screen.getByLabelText(APP_LABELS.field.email),
    'new@tenant.com',
  );
  await userEvent.click(
    screen.getByRole('button', { name: APP_LABELS.action.addUser }),
  );

  await userEvent.type(
    screen.getByLabelText(APP_LABELS.field.departmentName),
    '생산2팀',
  );
  await userEvent.click(
    screen.getByRole('button', { name: APP_LABELS.action.addDepartment }),
  );

  await userEvent.click(
    screen.getByRole('button', { name: APP_LABELS.action.completeFirstSetup }),
  );

  expect(
    await screen.findByText(APP_LABELS.message.firstSetupCompleted),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/tenant-first-login-setup.test.tsx`
Expected: FAIL because page/service/labels do not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/services/firstLoginSetupService.ts
import { apiClient } from './apiClient';

export type FirstSetupStatusResponse = {
  tenantCode: string;
  userCount: number;
  departmentCount: number;
  onboardingRequired: boolean;
  onboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
};

export async function getFirstSetupStatus(tenantCode: string) {
  const { data } = await apiClient.get<FirstSetupStatusResponse>(
    '/first-login-setup/status',
    {
      headers: { 'x-tenant-code': tenantCode },
    },
  );
  return data;
}

export async function completeFirstSetup(tenantCode: string) {
  const { data } = await apiClient.post<FirstSetupStatusResponse>(
    '/first-login-setup/complete',
    {},
    { headers: { 'x-tenant-code': tenantCode } },
  );
  return data;
}
```

```tsx
// frontend/src/pages/TenantFirstLoginSetupPage.tsx (structure)
// - 상태조회 useQuery
// - createUser/createDepartment mutation 재사용
// - completeFirstSetup mutation 성공 시 markOnboardingCompleted 호출
// - 진행 카운트(사용자/부서) + 완료 버튼 + 에러/성공 Alert 노출
```

```ts
// frontend/src/shared/ui/labels.ts (additions)
pageTitle: {
  tenantFirstSetup: '초기 설정',
},
action: {
  completeFirstSetup: '초기 설정 완료',
},
message: {
  firstSetupGuide: '최초 로그인 설정을 완료하면 대시보드로 이동합니다.',
  firstSetupCompleted: '초기 설정이 완료되었습니다.',
  firstSetupRequirement: '사용자 1명 이상, 부서 1개 이상이 필요합니다.',
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/tenant-first-login-setup.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/firstLoginSetupService.ts frontend/src/pages/TenantFirstLoginSetupPage.tsx frontend/src/shared/ui/labels.ts frontend/src/test/tenant-first-login-setup.test.tsx
git commit -m "feat: add tenant first-login setup page and service"
```

---

### Task 4: MSW 목 서버를 백엔드 계약과 동일하게 확장

**Files:**

- Modify: `frontend/src/mocks/handlers.ts`
- Modify: `frontend/src/test/tenant-first-login-setup.test.tsx`
- Test: `frontend/src/test/tenant-first-login-setup.test.tsx`

- [ ] **Step 1: Write the failing test for completion guard**

```tsx
it('shows requirement error when completing setup without enough entities', async () => {
  setAuthStoreState({
    isAuthenticated: true,
    tenantCode: 'TENANT-Y',
    userId: 'tenant_admin',
    role: 'TENANT_ADMIN',
    onboardingRequired: true,
  });

  render(
    <AppProviders>
      <TenantFirstLoginSetupPage />
    </AppProviders>,
  );

  await userEvent.click(
    screen.getByRole('button', { name: APP_LABELS.action.completeFirstSetup }),
  );

  expect(
    await screen.findByText(APP_LABELS.message.firstSetupRequirement),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/tenant-first-login-setup.test.tsx`
Expected: FAIL because MSW has no `/first-login-setup/*` endpoints and validation behavior.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/mocks/handlers.ts (additions)
http.get('/api/first-login-setup/status', ({ request }) => {
  const tenantCode = getTenantCodeFromHeader(request);
  const userCount = tenantScoped(users, tenantCode).length;
  const departmentCount = tenantScoped(departments, tenantCode).length;

  return HttpResponse.json({
    tenantCode,
    userCount,
    departmentCount,
    onboardingRequired: !(userCount >= 1 && departmentCount >= 1),
    onboardingStatus:
      userCount >= 1 && departmentCount >= 1
        ? 'COMPLETED'
        : userCount === 0 && departmentCount === 0
          ? 'NOT_STARTED'
          : 'IN_PROGRESS',
  });
});

http.post('/api/first-login-setup/complete', ({ request }) => {
  const tenantCode = getTenantCodeFromHeader(request);
  const userCount = tenantScoped(users, tenantCode).length;
  const departmentCount = tenantScoped(departments, tenantCode).length;

  if (userCount < 1 || departmentCount < 1) {
    return HttpResponse.json(
      { message: '사용자 1명 이상, 부서 1개 이상이 필요합니다.' },
      { status: 422 },
    );
  }

  return HttpResponse.json({
    tenantCode,
    userCount,
    departmentCount,
    onboardingRequired: false,
    onboardingStatus: 'COMPLETED',
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend ; npm run test -- src/test/tenant-first-login-setup.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/mocks/handlers.ts frontend/src/test/tenant-first-login-setup.test.tsx
git commit -m "test: align msw first-login setup contract and validation"
```

---

### Task 5: 로그인/라우팅 통합 회귀 및 전체 검증

**Files:**

- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/test/app-shell.test.tsx`
- Test: `frontend/src/test/app-shell.test.tsx`, `frontend/src/test/tenant-first-login-setup.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
it('routes tenant admin to first setup page right after login when onboardingRequired=true', async () => {
  render(
    <AppProviders>
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );

  await userEvent.click(
    screen.getByRole('button', { name: APP_LABELS.action.login }),
  );

  expect(
    await screen.findByRole('heading', {
      name: APP_LABELS.pageTitle.tenantFirstSetup,
    }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx src/test/tenant-first-login-setup.test.tsx`
Expected: FAIL because login flow does not propagate onboarding state into route behavior.

- [ ] **Step 3: Write minimal implementation**

```tsx
// frontend/src/pages/LoginPage.tsx (handleLogin success path)
setAuth({
  tenantCode: result.tenantCode,
  userId: result.userId,
  role: result.role,
  onboardingRequired: result.onboardingRequired,
  onboardingStatus: result.onboardingStatus,
});

navigate('/dashboard', { replace: true });
```

- [ ] **Step 4: Run verification suite**

Run: `cd frontend ; npm run test -- src/test/app-shell.test.tsx src/test/tenant-first-login-setup.test.tsx`
Expected: PASS.

Run: `cd frontend ; npm run lint ; npm run test ; npm run build`
Expected: lint/test/build 성공 (기존 `public/mockServiceWorker.js` 경고는 비차단).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx frontend/src/test/app-shell.test.tsx frontend/src/test/tenant-first-login-setup.test.tsx
git commit -m "feat: complete tenant-admin first-login setup flow"
```

---

## Plan Self-Review

- Spec coverage:
  - 플랫폼관리자 코드 발급 + 메일 Mock + 샘플 목록: Task 0
  - 로그인 계약 확장: Task 1
  - 가드/라우팅 강제: Task 2
  - 최초 설정 화면 + 완료 흐름: Task 3
  - 백엔드 계약형 MSW/검증: Task 4
  - 로그인 직후 통합 동작 + 전체 검증: Task 5
- Placeholder scan:
  - `TBD`, `TODO`, 추상적 지시 없이 파일/코드/명령을 모두 명시했다.
- Type consistency:
  - `onboardingRequired`, `onboardingStatus`, 경로 `/tenant-first-setup`, 완료 상태 `COMPLETED`를 전 태스크에서 일관되게 사용했다.
