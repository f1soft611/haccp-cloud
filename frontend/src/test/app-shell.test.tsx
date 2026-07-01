import {
  act,
  fireEvent,
  configure,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../app/App';
import { AppProviders } from '../app/providers/AppProviders';
import { appTheme } from '../app/theme';
import { AppRoutes } from '../app/router/AppRoutes';
import { server } from '../mocks/server';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { FeedbackProvider } from '../shared/providers/FeedbackProvider';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/constants/labels';
import * as platformUserMenuService from '../services/platform-admin/platformUserMenuService';
import * as dashboardService from '../services/documents/dashboardService';
import * as documentsService from '../services/documents/documentsService';

configure({ asyncUtilTimeout: 3000 });

type AuthTestState = Pick<
  ReturnType<typeof useAuthStore.getState>,
  | 'isAuthenticated'
  | 'tenantCode'
  | 'userId'
  | 'role'
  | 'accessToken'
  | 'refreshToken'
  | 'onboardingRequired'
  | 'onboardingStatus'
>;

const setAuthStoreState = (state: Partial<AuthTestState>) => {
  const currentState = useAuthStore.getState();
  const nextState = {
    ...currentState,
    ...state,
  };

  if (nextState.isAuthenticated && !nextState.accessToken) {
    const normalizedUserId = String(nextState.userId || 'user').toLowerCase();
    const tenantCode = nextState.tenantCode || 'TENANT-A';
    nextState.accessToken = `token-${tenantCode}-${normalizedUserId}`;
  }

  act(() => {
    useAuthStore.setState(nextState);
  });
};

const resetAuthStore = () => {
  setAuthStoreState({
    isAuthenticated: false,
    tenantCode: '',
    userId: '',
    role: 'USER',
    accessToken: '',
    refreshToken: '',
    onboardingRequired: false,
    onboardingStatus: 'COMPLETED',
  });
};

const renderAppRoutesAt = (initialPath: string) => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <FeedbackProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <AppRoutes />
          </MemoryRouter>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe('App shell', () => {
  beforeEach(() => {
    resetAuthStore();

    // Mock menu service to avoid MSW issues in integration tests
    vi.spyOn(
      platformUserMenuService,
      'listAccessibleMenuPaths',
    ).mockResolvedValue([
      '/dashboard',
      '/platform/tenants',
      '/platform/menus',
      '/platform/roles',
      '/platform/role-menus',
      '/platform/login-history',
      '/users',
      '/documents',
    ]);

    vi.spyOn(platformUserMenuService, 'listAccessibleMenus').mockResolvedValue([
      { path: '/dashboard', menuNm: APP_LABELS.menu.dashboard },
      {
        path: '/platform/tenants',
        menuNm: APP_LABELS.menu.platformFactoryManagement,
      },
      {
        path: '/platform/menus',
        menuNm: APP_LABELS.menu.platformMenuManagement,
      },
      {
        path: '/platform/roles',
        menuNm: APP_LABELS.menu.platformRoleManagement,
      },
      {
        path: '/platform/role-menus',
        menuNm: APP_LABELS.menu.platformRoleMenuManagement,
      },
      {
        path: '/platform/login-history',
        menuNm: APP_LABELS.menu.loginHistory,
      },
      { path: '/users', menuNm: APP_LABELS.menu.users },
      { path: '/documents', menuNm: APP_LABELS.menu.documents },
    ]);

    vi.spyOn(dashboardService, 'getDashboardMetrics').mockResolvedValue({
      totalDocuments: 12,
      draftTemplates: 2,
      updatedToday: 4,
    });
    vi.spyOn(documentsService, 'listDocuments').mockResolvedValue([]);
    vi.spyOn(
      dashboardService,
      'getPlatformAdminDashboardKpis',
    ).mockResolvedValue({
      activeTenants: 5,
      newTenantsLast7Days: 1,
      ccpDocCompletionRate: 80,
      tenantsWithoutCcpDocs: 1,
    });
    vi.spyOn(
      dashboardService,
      'listPlatformAdminTenantCodeIssuance',
    ).mockResolvedValue({
      totalIssued: 5,
      issuedThisMonth: 2,
      issuedThisWeek: 1,
      recentIssues: [],
    });
    vi.spyOn(dashboardService, 'listPlatformAdminTenants').mockResolvedValue({
      summary: {
        total: 5,
        active: 4,
        inactive: 1,
      },
      items: [],
    });
    vi.spyOn(
      dashboardService,
      'listPlatformAdminCcpDocuments',
    ).mockResolvedValue({
      overall: {
        completionRate: 80,
        completedTenants: 4,
        totalTenants: 5,
      },
      items: [],
    });

    server.use(
      http.get(/.*\/platform-admin\/user-menus\/me$/, () => {
        const menuList = [
          '/dashboard',
          '/platform/tenants',
          '/platform/menus',
          '/platform/roles',
          '/platform/role-menus',
          '/platform/login-history',
          '/users',
          '/documents',
        ].map((menuUrl) => ({ menuUrl }));

        return HttpResponse.json(menuList);
      }),
      http.get(/.*\/platform-admin\/plan-access\/me$/, () => {
        return HttpResponse.json({
          tenantId: 1,
          tenantCode: 'TENANT-A',
          planCode: 'C',
          features: {
            FEATURE_USER_MGMT: true,
            FEATURE_DOC_WORKFLOW: true,
            FEATURE_AUDIT_LOG: true,
            FEATURE_API_EXPORT: true,
          },
        });
      }),
      http.get(/.*\/platform-admin\/dashboard\/kpis$/, () => {
        return HttpResponse.json({
          activeTenants: 5,
          newTenantsLast7Days: 1,
          ccpDocCompletionRate: 80,
          tenantsWithoutCcpDocs: 1,
        });
      }),
      http.get(/.*\/platform-admin\/dashboard\/tenant-code-issuance$/, () => {
        return HttpResponse.json({
          totalIssued: 5,
          issuedThisMonth: 2,
          issuedThisWeek: 1,
          recentIssues: [],
        });
      }),
      http.get(/.*\/platform-admin\/dashboard\/tenants$/, () => {
        return HttpResponse.json({
          summary: {
            total: 5,
            active: 4,
            inactive: 1,
          },
          items: [],
        });
      }),
      http.get(/.*\/platform-admin\/dashboard\/ccp-documents$/, () => {
        return HttpResponse.json({
          overall: {
            completionRate: 80,
            completedTenants: 4,
            totalTenants: 5,
          },
          items: [],
        });
      }),
      http.get(/.*\/dashboard$/, () => {
        return HttpResponse.json({
          totalDocuments: 12,
          draftTemplates: 2,
          updatedToday: 4,
        });
      }),
      http.get(/.*\/documents$/, () => {
        return HttpResponse.json([]);
      }),
      http.post('/api/auth/login-jwt', async ({ request }) => {
        const payload = (await request.json()) as {
          id?: string;
          password?: string;
          tenantCode?: string;
          factoryCode?: string;
        };

        if (
          !payload.id ||
          !payload.password ||
          payload.password !== 'Passw0rd!'
        ) {
          return HttpResponse.json(
            { message: '로그인 정보가 올바르지 않습니다.' },
            { status: 401 },
          );
        }

        const normalizedUserId = payload.id.trim().toLowerCase();
        const role =
          normalizedUserId === 'platform_admin'
            ? 'PLATFORM_ADMIN'
            : normalizedUserId.includes('admin')
              ? 'TENANT_ADMIN'
              : 'USER';
        const tenantCode =
          payload.tenantCode || payload.factoryCode || 'TENANT-A';
        const onboardingStatus =
          role === 'TENANT_ADMIN' && tenantCode === 'TENANT-Z'
            ? 'NOT_STARTED'
            : 'COMPLETED';

        return HttpResponse.json({
          resultCode: '200',
          jToken: `token-${tenantCode}-${payload.id}`,
          refreshToken: `refresh-${tenantCode}-${payload.id}`,
          loginHistoryId: 101,
          onboardingRequired: onboardingStatus !== 'COMPLETED',
          onboardingStatus,
          resultVO: {
            factoryCode: tenantCode,
            id: payload.id,
            groupNm: role === 'PLATFORM_ADMIN' ? 'ROLE_ADMIN' : role,
          },
        });
      }),
      http.post('/auth/login-jwt', async ({ request }) => {
        const payload = (await request.json()) as {
          id?: string;
          password?: string;
          tenantCode?: string;
          factoryCode?: string;
        };

        if (
          !payload.id ||
          !payload.password ||
          payload.password !== 'Passw0rd!'
        ) {
          return HttpResponse.json(
            { message: '로그인 정보가 올바르지 않습니다.' },
            { status: 401 },
          );
        }

        const normalizedUserId = payload.id.trim().toLowerCase();
        const role =
          normalizedUserId === 'platform_admin'
            ? 'PLATFORM_ADMIN'
            : normalizedUserId.includes('admin')
              ? 'TENANT_ADMIN'
              : 'USER';
        const tenantCode =
          payload.tenantCode || payload.factoryCode || 'TENANT-A';
        const onboardingStatus =
          role === 'TENANT_ADMIN' && tenantCode === 'TENANT-Z'
            ? 'NOT_STARTED'
            : 'COMPLETED';

        return HttpResponse.json({
          resultCode: '200',
          jToken: `token-${tenantCode}-${payload.id}`,
          refreshToken: `refresh-${tenantCode}-${payload.id}`,
          loginHistoryId: 101,
          onboardingRequired: onboardingStatus !== 'COMPLETED',
          onboardingStatus,
          resultVO: {
            factoryCode: tenantCode,
            id: payload.id,
            groupNm: role === 'PLATFORM_ADMIN' ? 'ROLE_ADMIN' : role,
          },
        });
      }),
      http.get('/api/platform-admin/user-menus/me', () => {
        const menuList = [
          '/dashboard',
          '/platform/tenants',
          '/platform/menus',
          '/platform/roles',
          '/platform/role-menus',
          '/platform/login-history',
          '/users',
          '/documents',
        ].map((menuUrl) => ({ menuUrl }));

        return HttpResponse.json(menuList);
      }),
      http.get('/api/platform-admin/plan-access/me', () => {
        return HttpResponse.json({
          tenantId: 1,
          tenantCode: 'TENANT-A',
          planCode: 'C',
          features: {
            FEATURE_USER_MGMT: true,
            FEATURE_DOC_WORKFLOW: true,
            FEATURE_AUDIT_LOG: true,
            FEATURE_API_EXPORT: true,
          },
        });
      }),
      http.get('/api/dashboard', () => {
        return HttpResponse.json({
          totalDocuments: 12,
          draftTemplates: 2,
          updatedToday: 4,
        });
      }),
      http.get('/api/documents', () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/platform-admin/dashboard/kpis', () => {
        return HttpResponse.json({
          activeTenants: 5,
          newTenantsLast7Days: 1,
          ccpDocCompletionRate: 80,
          tenantsWithoutCcpDocs: 1,
        });
      }),
      http.get('/api/platform-admin/dashboard/tenant-code-issuance', () => {
        return HttpResponse.json({
          totalIssued: 5,
          issuedThisMonth: 2,
          issuedThisWeek: 1,
          recentIssues: [],
        });
      }),
      http.get('/api/platform-admin/dashboard/tenants', () => {
        return HttpResponse.json({
          summary: {
            total: 5,
            active: 4,
            inactive: 1,
          },
          items: [],
        });
      }),
      http.get('/api/platform-admin/dashboard/ccp-documents', () => {
        return HttpResponse.json({
          overall: {
            completionRate: 80,
            completedTenants: 4,
            totalTenants: 5,
          },
          items: [],
        });
      }),
      http.get(
        '/api/platform-admin/user-menus/:authorityCode',
        ({ params }) => {
          const authorityCode = String(
            params.authorityCode ?? '',
          ).toUpperCase();

          const menuPathsByAuthority: Record<string, string[]> = {
            PLATFORM_ADMIN: [
              '/dashboard',
              '/platform/tenants',
              '/platform/menus',
              '/platform/roles',
              '/platform/role-menus',
              '/platform/login-history',
            ],
            TENANT_ADMIN: ['/dashboard', '/users', '/documents'],
            TENANT_USER: ['/dashboard', '/documents'],
          };

          const menuList = (menuPathsByAuthority[authorityCode] ?? []).map(
            (menuUrl) => ({ menuUrl }),
          );

          return HttpResponse.json({ result: { menuList } });
        },
      ),
      http.get('/platform-admin/user-menus/:authorityCode', ({ params }) => {
        const authorityCode = String(params.authorityCode ?? '').toUpperCase();

        const menuPathsByAuthority: Record<string, string[]> = {
          PLATFORM_ADMIN: [
            '/dashboard',
            '/platform/tenants',
            '/platform/menus',
            '/platform/roles',
            '/platform/role-menus',
            '/platform/login-history',
          ],
          TENANT_ADMIN: ['/dashboard', '/users', '/documents'],
          TENANT_USER: ['/dashboard', '/documents'],
        };

        const menuList = (menuPathsByAuthority[authorityCode] ?? []).map(
          (menuUrl) => ({ menuUrl }),
        );

        return HttpResponse.json({ result: { menuList } });
      }),
    );
  });

  afterEach(() => {
    resetAuthStore();
    vi.restoreAllMocks();
  });

  it('shows korean login title for MVP entry point', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );
    expect(
      await screen.findByRole('heading', { name: APP_LABELS.pageTitle.login }),
    ).toBeInTheDocument();
  });

  it('redirects /login/platform to the merged login page', async () => {
    renderAppRoutesAt('/login/platform');

    expect(
      await screen.findByRole('heading', { name: APP_LABELS.pageTitle.login }),
    ).toBeInTheDocument();
  });

  it('allows authenticated user to open /account/password', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
    });

    renderAppRoutesAt('/account/password');

    expect(
      await screen.findByRole('heading', { name: '비밀번호 변경' }),
    ).toBeInTheDocument();
  });

  it('navigates to /account/password when clicking change-password button on platform dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
    });

    renderAppRoutesAt('/platform');

    fireEvent.click(
      await screen.findByRole('button', {
        name: APP_LABELS.action.changePassword,
      }),
    );

    expect(
      await screen.findByRole('heading', { name: '비밀번호 변경' }),
    ).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /account/password to /login', async () => {
    resetAuthStore();
    renderAppRoutesAt('/account/password');

    expect(
      await screen.findByRole('heading', { name: APP_LABELS.pageTitle.login }),
    ).toBeInTheDocument();
  });

  it('routes tenant admin to tenant-first-setup when onboarding is required', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-Z',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: true,
      onboardingStatus: 'NOT_STARTED',
    });

    renderAppRoutesAt('/dashboard');

    expect(
      await screen.findByTestId(
        'tenant-first-setup-route',
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-admin-hub')).not.toBeInTheDocument();
  });

  it('routes PLATFORM_ADMIN state to admin dashboard hub', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'PLATFORM_ADMIN',
      role: 'PLATFORM_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/dashboard');

    const dashboardGroupButton = await screen.findByRole('button', {
      name: /대시보드/,
    });
    expect(dashboardGroupButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('dashboard-user-hub')).not.toBeInTheDocument();
  });

  it('allows PLATFORM_ADMIN to access /platform and renders platform admin dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'PLATFORM_ADMIN',
      role: 'PLATFORM_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/platform');

    expect(
      await screen.findByTestId('platform-admin-dashboard'),
    ).toBeInTheDocument();
  });

  it('falls back to onboardingStatus when onboardingRequired is missing', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-Z',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: undefined,
      onboardingStatus: 'NOT_STARTED',
    });

    renderAppRoutesAt('/dashboard');

    expect(
      await screen.findByTestId('tenant-first-setup-route'),
    ).toBeInTheDocument();
  });

  it('renders AppLayout shell with top bar and footer but without work menu', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <FeedbackProvider>
            <MemoryRouter initialEntries={['/dashboard']}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<div>dashboard</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </FeedbackProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('top-gov-bar')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: APP_LABELS.header.searchAction }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: APP_LABELS.header.fontSizeAction }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('work-menu-bar')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: APP_LABELS.menu.dashboard }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: APP_LABELS.menu.users }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: APP_LABELS.menu.users }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: APP_LABELS.menu.platformMenuManagement,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('portal-footer')).toBeInTheDocument();
  });

  it('shows hierarchical platform admin menu and hides extra items', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: '000001',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <FeedbackProvider>
            <MemoryRouter initialEntries={['/dashboard']}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<div>dashboard</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </FeedbackProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole('button', {
        name: /대시보드/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: APP_LABELS.menu.platformGroup }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.menu.platformGroup }),
    );

    expect(
      await screen.findByRole('link', {
        name: APP_LABELS.menu.platformMenuManagement,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.menu.platformFactoryManagement,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.menu.platformRoleManagement,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.menu.platformRoleMenuManagement,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: APP_LABELS.menu.loginHistory }),
    ).toBeInTheDocument();
  });

  it('allows PLATFORM_ADMIN to access platform menu management route', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: '000001',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
    });

    renderAppRoutesAt('/platform/menus');

    expect(
      await screen.findByTestId('platform-menu-management-page'),
    ).toBeInTheDocument();
  });

  it('allows PLATFORM_ADMIN to access platform tenant management route', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: '000001',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
    });

    renderAppRoutesAt('/platform/tenants');

    expect(
      await screen.findByTestId('platform-tenant-management-page'),
    ).toBeInTheDocument();
  });

  it('redirects TENANT_ADMIN from platform menu management route to /dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/platform/menus');

    expect(
      await screen.findByTestId('dashboard-admin-hub'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('platform-menu-management-page'),
    ).not.toBeInTheDocument();
  });

  it('redirects PLATFORM_ADMIN to first allowed path when current route is not in accessible menu list', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: '000001',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    const menuSpy = vi
      .spyOn(platformUserMenuService, 'listAccessibleMenuPaths')
      .mockResolvedValue(['/dashboard']);

    renderAppRoutesAt('/platform/menus');

    const dashboardGroupButton = await screen.findByRole('button', {
      name: /대시보드/,
    });
    expect(dashboardGroupButton).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByTestId('platform-menu-management-page'),
      ).not.toBeInTheDocument();
    });

    menuSpy.mockRestore();
  });

  it('redirects USER from /users to /dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'user01',
      role: 'USER',
    });

    renderAppRoutesAt('/users');

    expect(await screen.findByTestId('dashboard-user-hub')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: APP_LABELS.pageTitle.users }),
    ).not.toBeInTheDocument();
  });

  it('shows the menu-group breadcrumb for tenant admin users page', async () => {
    vi.mocked(
      platformUserMenuService.listAccessibleMenuPaths,
    ).mockResolvedValueOnce(['/dashboard', '/org/users', '/documents']);
    vi.mocked(
      platformUserMenuService.listAccessibleMenus,
    ).mockResolvedValueOnce([
      {
        path: '/dashboard',
        menuId: 1,
        parentMenuId: null,
        menuNm: '대시보드 관리',
      },
      {
        path: '/org/users',
        menuId: 2,
        parentMenuId: 1,
        menuNm: APP_LABELS.menu.users,
      },
      {
        path: '/documents',
        menuId: 3,
        parentMenuId: 1,
        menuNm: APP_LABELS.menu.documents,
      },
    ]);

    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/org/users');

    expect(await screen.findByText('대시보드 관리')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: APP_LABELS.pageTitle.users }),
    ).toBeInTheDocument();
  });

  it('redirects USER from /departments to /dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'user01',
      role: 'USER',
    });

    renderAppRoutesAt('/departments');

    expect(await screen.findByTestId('dashboard-user-hub')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: APP_LABELS.pageTitle.departments }),
    ).not.toBeInTheDocument();
  });

  it('redirects USER from /onboarding to /dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'user01',
      role: 'USER',
    });

    renderAppRoutesAt('/onboarding');

    expect(await screen.findByTestId('dashboard-user-hub')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: APP_LABELS.pageTitle.onboarding }),
    ).not.toBeInTheDocument();
  });

  it('allows PLATFORM_ADMIN to access login history page', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: '000001',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
    });

    renderAppRoutesAt('/platform/login-history');

    expect(await screen.findByTestId('login-history-page')).toBeInTheDocument();
  });

  it('redirects TENANT_ADMIN from /platform/login-history to /dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/platform/login-history');

    expect(
      await screen.findByTestId('dashboard-admin-hub'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('login-history-page')).not.toBeInTheDocument();
  });

  it('redirects TENANT_ADMIN with onboardingRequired=true from /dashboard to tenant first setup page', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-Z',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: true,
      onboardingStatus: 'NOT_STARTED',
    });

    renderAppRoutesAt('/dashboard');

    expect(
      await screen.findByTestId('tenant-first-setup-route'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-admin-hub')).not.toBeInTheDocument();
  });

  it('redirects TENANT_ADMIN from /dashboard when onboardingStatus=NOT_STARTED and onboardingRequired is missing', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-Z',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: undefined,
      onboardingStatus: 'NOT_STARTED',
    });

    renderAppRoutesAt('/dashboard');

    expect(
      await screen.findByTestId('tenant-first-setup-route'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-admin-hub')).not.toBeInTheDocument();
  });

  it('redirects TENANT_ADMIN from /dashboard when onboardingStatus=IN_PROGRESS and onboardingRequired is missing', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-Z',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: undefined,
      onboardingStatus: 'IN_PROGRESS',
    });

    renderAppRoutesAt('/dashboard');

    expect(
      await screen.findByTestId('tenant-first-setup-route'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-admin-hub')).not.toBeInTheDocument();
  });

  it('keeps TENANT_ADMIN on /dashboard when onboardingRequired=false', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/dashboard');

    expect(
      await screen.findByTestId('dashboard-admin-hub'),
    ).toBeInTheDocument();
  });

  it('redirects TENANT_ADMIN with onboardingRequired=false from /tenant-first-setup to /dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/tenant-first-setup');

    expect(
      await screen.findByTestId('dashboard-admin-hub'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('tenant-first-setup-route'),
    ).not.toBeInTheDocument();
  });

  it('redirects PLATFORM_ADMIN from /tenant-first-setup to /dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/tenant-first-setup');

    expect(
      await screen.findByTestId('platform-admin-dashboard'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('tenant-first-setup-route'),
    ).not.toBeInTheDocument();
  });

  it('redirects USER from /tenant-first-setup to /dashboard', async () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'user01',
      role: 'USER',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    renderAppRoutesAt('/tenant-first-setup');

    expect(await screen.findByTestId('dashboard-user-hub')).toBeInTheDocument();
    expect(
      screen.queryByTestId('tenant-first-setup-route'),
    ).not.toBeInTheDocument();
  });

  it('keeps unauthenticated redirect to /login for restricted routes', async () => {
    renderAppRoutesAt('/users');

    expect(
      await screen.findByRole('heading', { name: APP_LABELS.pageTitle.login }),
    ).toBeInTheDocument();
  });

  it('redirects USER from /platform/menus to /dashboard', async () => {
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
    expect(
      screen.queryByTestId('platform-menu-management-page'),
    ).not.toBeInTheDocument();
  });
});
