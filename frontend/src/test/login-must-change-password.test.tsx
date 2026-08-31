import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../app/router/AppRoutes';
import { appTheme } from '../app/theme';
import { FeedbackProvider } from '../shared/providers/FeedbackProvider';
import { useAuthStore } from '../shared/store/authStore';

vi.mock('../services/organization/tenantService', async () => {
  const actual = await vi.importActual(
    '../services/organization/tenantService',
  );

  return {
    ...actual,
    getTenantByDomain: vi.fn(async (domain: string) => {
      if (domain === 'alpha.co.kr') {
        return {
          tenantId: 5,
          tenantCode: 'TENANT-A',
          tenantNm: '알파푸드',
          logoImage: '',
        };
      }

      return null;
    }),
  };
});

vi.mock('../services/auth/authService', async () => {
  const actual = await vi.importActual('../services/auth/authService');

  return {
    ...actual,
    login: vi.fn(async () => ({
      tenantCode: 'TENANT-A',
      userId: 'hong123',
      displayName: '홍길동',
      role: 'USER',
      accessToken: 'token-hong123',
      refreshToken: 'refresh-hong123',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
      mustChangePassword: true,
    })),
  };
});

vi.mock('../services/platform-admin/planAccessService', async () => {
  const actual = await vi.importActual(
    '../services/platform-admin/planAccessService',
  );

  return {
    ...actual,
    getCurrentPlanAccess: vi.fn(async () => ({
      features: {},
    })),
  };
});

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
    mustChangePassword: false,
  });
}

function renderAt(path: string) {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <FeedbackProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Login with a temp password', () => {
  it('stores mustChangePassword from the login response so ProtectedRoute can redirect', async () => {
    resetAuthStore();

    renderAt('/login/alpha.co.kr');

    fireEvent.change(await screen.findByLabelText('사용자 ID'), {
      target: { value: 'hong123' },
    });
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    fireEvent.change(await screen.findByLabelText('비밀번호'), {
      target: { value: 'hong123hong123' },
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAuthStore.getState().mustChangePassword).toBe(true);
  });
});
