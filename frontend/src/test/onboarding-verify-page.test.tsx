import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appTheme } from '../app/theme';
import { OnboardingVerifyPage } from '../pages/platform-admin/tenants/OnboardingVerifyPage';

const { verifyTenantEmailMock } = vi.hoisted(() => ({
  verifyTenantEmailMock: vi.fn(),
}));

vi.mock('../services/organization/tenantService', () => ({
  verifyTenantEmail: verifyTenantEmailMock,
}));

function renderPage(initialPath = '/onboarding/verify?token=test-token') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={client}>
        <ThemeProvider theme={appTheme}>
          <Routes>
            <Route
              path="/onboarding/verify"
              element={<OnboardingVerifyPage />}
            />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('OnboardingVerifyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies token automatically and shows success state', async () => {
    verifyTenantEmailMock.mockResolvedValueOnce({
      tenantCode: 'TENANT-A',
      tenantNm: '테스트푸드',
      adminEmail: 'admin@test.com',
      loginAccountId: 1,
      verified: true,
      message: '이메일 인증이 완료되었습니다',
    });

    renderPage();

    expect(
      await screen.findByText('이메일 인증이 완료되었습니다'),
    ).toBeInTheDocument();
    expect(verifyTenantEmailMock).toHaveBeenCalledWith('test-token');
  });

  it('shows missing token message when token is absent', async () => {
    renderPage('/onboarding/verify');

    await waitFor(() => {
      expect(screen.getByText('인증 토큰이 없습니다.')).toBeInTheDocument();
    });
  });
});
