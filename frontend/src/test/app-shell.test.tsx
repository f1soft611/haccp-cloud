import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';
import { AppProviders } from '../app/providers/AppProviders';
import { appTheme } from '../app/theme';
import { AppRoutes } from '../app/router/AppRoutes';
import { server } from '../mocks/server';
import { AppLayout } from '../shared/layout/AppLayout';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/ui/labels';

type AuthTestState = Pick<
  ReturnType<typeof useAuthStore.getState>,
  | 'isAuthenticated'
  | 'tenantCode'
  | 'userId'
  | 'role'
  | 'onboardingRequired'
  | 'onboardingStatus'
>;

const setAuthStoreState = (state: Partial<AuthTestState>) => {
  act(() => {
    useAuthStore.setState(state);
  });
};

const resetAuthStore = () => {
  setAuthStoreState({
    isAuthenticated: false,
    tenantCode: '',
    userId: '',
    role: 'USER',
    onboardingRequired: false,
    onboardingStatus: 'COMPLETED',
  });
};

const renderAppRoutesAt = (initialPath: string) => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRoutes />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe('App shell', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  afterEach(() => {
    resetAuthStore();
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

  it('routes tenant admin login to tenant-first-setup when onboardingRequired=true', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    fireEvent.change(
      await screen.findByLabelText(APP_LABELS.field.tenantCode),
      { target: { value: 'TENANT-Z' } },
    );
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.userId), {
      target: { value: 'tenant_admin' },
    });
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.password), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.login }),
    );

    expect(
      await screen.findByTestId('tenant-first-setup-route'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-admin-hub')).not.toBeInTheDocument();
  });

  it('warns and falls back to onboardingStatus when onboardingRequired is missing in login response', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        const payload = (await request.json()) as {
          tenantCode: string;
          userId: string;
        };

        return HttpResponse.json({
          tenantCode: payload.tenantCode,
          userId: payload.userId,
          role: 'TENANT_ADMIN',
          accessToken: `token-${payload.tenantCode}-${payload.userId}`,
          onboardingStatus: 'NOT_STARTED',
        });
      }),
    );

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    fireEvent.change(
      await screen.findByLabelText(APP_LABELS.field.tenantCode),
      { target: { value: 'TENANT-Z' } },
    );
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.userId), {
      target: { value: 'tenant_admin' },
    });
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.password), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.login }),
    );

    expect(
      await screen.findByTestId('tenant-first-setup-route'),
    ).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      'Login response missing onboardingRequired. Falling back to onboardingStatus.',
    );

    warnSpy.mockRestore();
  });

  it('renders AppLayout shell with top bar and footer but without work menu', () => {
    setAuthStoreState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<div>dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('top-gov-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('work-menu-bar')).not.toBeInTheDocument();
    expect(screen.getByTestId('portal-footer')).toBeInTheDocument();
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
});
