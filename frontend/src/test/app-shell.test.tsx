import { act, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from '../App';
import { AppProviders } from '../app/providers/AppProviders';
import { appTheme } from '../app/theme';
import { AppRoutes } from '../app/router/AppRoutes';
import { AppLayout } from '../shared/layout/AppLayout';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/ui/labels';

type AuthTestState = Pick<
  ReturnType<typeof useAuthStore.getState>,
  'isAuthenticated' | 'tenantCode' | 'userId' | 'role'
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

  it('keeps unauthenticated redirect to /login for restricted routes', async () => {
    renderAppRoutesAt('/users');

    expect(
      await screen.findByRole('heading', { name: APP_LABELS.pageTitle.login }),
    ).toBeInTheDocument();
  });
});
