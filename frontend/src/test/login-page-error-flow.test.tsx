import { fireEvent, render, screen } from '@testing-library/react';
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
  it('keeps platform login page when backend returns non-admin role response', async () => {
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

    renderAt('/login/platform');

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
    expect(screen.getByTestId('location-path')).toHaveTextContent(
      '/login/platform',
    );
  });

  it('keeps platform admin login route and shows backend reason when admin login fails', async () => {
    resetAuthStore();

    renderAt('/login/platform');

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
    expect(screen.getByTestId('location-path')).toHaveTextContent(
      '/login/platform',
    );
    expect(
      screen.queryByRole('heading', { name: APP_LABELS.pageTitle.login }),
    ).not.toBeInTheDocument();
  });

  it('shows backend reason when tenant login fails', async () => {
    resetAuthStore();

    renderAt('/login');

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.password), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.login }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).not.toHaveTextContent(APP_LABELS.message.loginFailed);
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

    renderAt('/login/platform');

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
