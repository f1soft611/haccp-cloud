import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it } from 'vitest';
import { AppRoutes } from '../app/router/AppRoutes';
import { appTheme } from '../app/theme';
import { server } from '../mocks/server';
import { APP_LABELS } from '../shared/constants/labels';
import { useAuthStore } from '../shared/store/authStore';
import { FeedbackProvider } from '../shared/providers/FeedbackProvider';

function resetAuthStore() {
  useAuthStore.setState({
    isAuthenticated: false,
    tenantCode: '',
    userId: '',
    role: 'USER',
    accessToken: '',
    refreshToken: '',
    loginHistoryId: undefined,
    onboardingRequired: false,
    onboardingStatus: 'COMPLETED',
  });
}

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location-path">{location.pathname}</div>;
}

function renderAt(path: string) {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <FeedbackProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
            <LocationProbe />
          </MemoryRouter>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Login page error flow', () => {
  it('renders generic login page at /login without tenant domain error', async () => {
    resetAuthStore();

    renderAt('/login');

    expect(
      await screen.findByRole('heading', { name: APP_LABELS.pageTitle.login }),
    ).toBeInTheDocument();
    expect(screen.getByText(APP_LABELS.message.loginHelp)).toBeInTheDocument();
  });

  it('uses the merged page for platform admin login and rejects non-admin responses', async () => {
    resetAuthStore();

    server.use(
      http.post('/api/auth/login-jwt/admin', () =>
        HttpResponse.json({
          resultCode: '200',
          jToken: 'token-tenant-user',
          resultVO: {
            factoryCode: '000001',
            id: 'tenant_user',
            groupNm: 'ROLE_USER',
          },
        }),
      ),
    );

    renderAt('/login');

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.userId), {
      target: { value: 'tenant_user' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: APP_LABELS.action.platformAdminLogin,
      }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).not.toHaveTextContent(
      APP_LABELS.message.platformAdminLoginFailed,
    );
    expect(screen.getByTestId('location-path')).toHaveTextContent('/login');
  });

  it('shows backend reason when merged platform admin login fails', async () => {
    resetAuthStore();

    server.use(
      http.post('/api/auth/login-jwt/admin', () =>
        HttpResponse.json({
          resultCode: 'FAIL',
          message: '플랫폼 관리자 로그인에 실패했습니다.',
        }),
      ),
    );

    renderAt('/login');

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.password), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: APP_LABELS.action.platformAdminLogin,
      }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).not.toHaveTextContent(
      APP_LABELS.message.platformAdminLoginFailed,
    );
    expect(screen.getByTestId('location-path')).toHaveTextContent('/login');
    expect(
      screen.queryByRole('heading', { name: APP_LABELS.pageTitle.login }),
    ).toBeInTheDocument();
  });

  it('allows normal tenant login from the merged page', async () => {
    resetAuthStore();

    renderAt('/login');

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.userId), {
      target: { value: 'tenant_admin' },
    });
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.password), {
      target: { value: 'Passw0rd!' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.login }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).not.toHaveTextContent('도메인을 포함한 로그인 ID');
    expect(screen.getByTestId('location-path')).toHaveTextContent('/login');
  });

  it('does not clear existing auth state on failed platform admin login', async () => {
    resetAuthStore();
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      accessToken: 'token-a',
      refreshToken: 'refresh-a',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });

    server.use(
      http.post('/api/auth/login-jwt/admin', () =>
        HttpResponse.json({
          resultCode: 'FAIL',
          message: '플랫폼 관리자 로그인에 실패했습니다.',
        }),
      ),
    );

    renderAt('/login');

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.password), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: APP_LABELS.action.platformAdminLogin,
      }),
    );

    await screen.findByRole('alert');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().userId).toBe('tenant_admin');
  });
});
