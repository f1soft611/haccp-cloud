import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appTheme } from '../app/theme';
import { OnboardingVerifyPage } from '../pages/platform-admin/tenants/OnboardingVerifyPage';

const { verifyTenantEmailByTokenMock, getTenantByDomainMock } = vi.hoisted(
  () => ({
    verifyTenantEmailByTokenMock: vi.fn(),
    getTenantByDomainMock: vi.fn(),
  }),
);

vi.mock('../services/organization/tenantService', () => ({
  verifyTenantEmailByToken: verifyTenantEmailByTokenMock,
  getTenantByDomain: getTenantByDomainMock,
}));

function renderPage(
  initialPath = '/onboarding/verify?token=test-token&domain=test.com',
) {
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
    getTenantByDomainMock.mockResolvedValue({
      tenantCode: 'TENANT-A',
      tenantId: 1,
      tenantNm: '테스트푸드',
    });
  });

  it('verifies token automatically and shows success state', async () => {
    verifyTenantEmailByTokenMock.mockResolvedValueOnce({
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
    expect(verifyTenantEmailByTokenMock).toHaveBeenCalledWith('test-token');
  });

  it('verifies token automatically even without domain query', async () => {
    verifyTenantEmailByTokenMock.mockResolvedValueOnce({
      tenantCode: 'TENANT-B',
      tenantNm: '샘플업체',
      adminEmail: 'owner@sample.com',
      loginAccountId: 22,
      adminLoginCode: 'tenant.owner',
      verified: true,
      message: '이메일 인증이 완료되었습니다',
    });

    renderPage('/onboarding/verify?token=test-token-only');

    expect(
      await screen.findByText('이메일 인증이 완료되었습니다'),
    ).toBeInTheDocument();
    expect(verifyTenantEmailByTokenMock).toHaveBeenCalledWith(
      'test-token-only',
    );
  });

  it('shows missing token message when token is absent', async () => {
    renderPage('/onboarding/verify');

    await waitFor(() => {
      expect(screen.getByText('인증 토큰이 없습니다.')).toBeInTheDocument();
    });
  });

  it('shows invalid token message when api returns strict token error code', async () => {
    verifyTenantEmailByTokenMock.mockRejectedValueOnce({
      response: {
        data: {
          statusCode: '400',
          errorCode: 'INVALID_AUTH_TOKEN',
          errorMessage: '토큰이 존재하지 않습니다: invalid-token',
        },
      },
    });

    renderPage('/onboarding/verify?token=invalid-token');

    expect(
      await screen.findByText('인증 링크가 유효하지 않습니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('이메일 인증')).toBeInTheDocument();
  });
});
