import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appTheme } from '../app/theme';
import { PlatformTenantDetailPage } from '../pages/platform-admin/tenants/PlatformTenantDetailPage';

const {
  getPlatformTenantByCodeMock,
  dispatchTenantVerificationEmailMock,
  resendTenantVerificationEmailMock,
} = vi.hoisted(() => ({
  getPlatformTenantByCodeMock: vi.fn(),
  dispatchTenantVerificationEmailMock: vi.fn(),
  resendTenantVerificationEmailMock: vi.fn(),
}));

vi.mock(
  '../services/platform-admin/tenants/platformTenantManagementService',
  () => ({
    getPlatformTenantByCode: getPlatformTenantByCodeMock,
    dispatchTenantVerificationEmail: dispatchTenantVerificationEmailMock,
    resendTenantVerificationEmail: resendTenantVerificationEmailMock,
  }),
);

function renderPage(initialPath = '/platform/tenants/TENANT-A') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={client}>
        <ThemeProvider theme={appTheme}>
          <Routes>
            <Route
              path="/platform/tenants/:tenantCode"
              element={<PlatformTenantDetailPage />}
            />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('PlatformTenantDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dispatchTenantVerificationEmailMock.mockResolvedValue(undefined);
    resendTenantVerificationEmailMock.mockResolvedValue(undefined);
  });

  it('shows dispatch action for EMAIL_QUEUED status and triggers API call', async () => {
    getPlatformTenantByCodeMock.mockResolvedValue({
      tenantCode: 'TENANT-A',
      companyName: '테스트푸드',
      adminName: '홍길동',
      adminEmail: 'admin@test.com',
      status: 'ACTIVE',
      onboardingStatus: 'EMAIL_QUEUED',
      createdAt: '2026-06-21T10:30:00.000Z',
    });

    renderPage();

    const button = await screen.findByRole('button', { name: '메일 발송' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(dispatchTenantVerificationEmailMock).toHaveBeenCalledWith(
        'TENANT-A',
      );
    });
  });

  it('shows resend action for EMAIL_SENT status and triggers API call', async () => {
    getPlatformTenantByCodeMock.mockResolvedValue({
      tenantCode: 'TENANT-A',
      companyName: '테스트푸드',
      adminName: '홍길동',
      adminEmail: 'admin@test.com',
      status: 'ACTIVE',
      onboardingStatus: 'EMAIL_SENT',
      createdAt: '2026-06-21T10:30:00.000Z',
    });

    renderPage();

    const button = await screen.findByRole('button', { name: '메일 재발송' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(resendTenantVerificationEmailMock).toHaveBeenCalledWith(
        'TENANT-A',
      );
    });
  });

  it('shows configuration guidance message on MAIL_CONFIG_ERROR', async () => {
    getPlatformTenantByCodeMock.mockResolvedValue({
      tenantCode: 'TENANT-A',
      companyName: '테스트푸드',
      adminName: '홍길동',
      adminEmail: 'admin@test.com',
      status: 'ACTIVE',
      onboardingStatus: 'EMAIL_QUEUED',
      createdAt: '2026-06-21T10:30:00.000Z',
    });
    dispatchTenantVerificationEmailMock.mockRejectedValueOnce({
      response: {
        data: {
          errorCode: 'MAIL_CONFIG_ERROR',
          message: 'SMTP 설정 누락',
        },
      },
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '메일 발송' }));

    expect(await screen.findByText('환경 설정 확인 필요')).toBeInTheDocument();
  });

  it('shows authentication guidance message on MAIL_AUTH_ERROR', async () => {
    getPlatformTenantByCodeMock.mockResolvedValue({
      tenantCode: 'TENANT-A',
      companyName: '테스트푸드',
      adminName: '홍길동',
      adminEmail: 'admin@test.com',
      status: 'ACTIVE',
      onboardingStatus: 'EMAIL_SENT',
      createdAt: '2026-06-21T10:30:00.000Z',
    });
    resendTenantVerificationEmailMock.mockRejectedValueOnce({
      response: {
        data: {
          errorCode: 'MAIL_AUTH_ERROR',
          message: 'SMTP 인증 실패',
        },
      },
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '메일 재발송' }));

    expect(
      await screen.findByText('SMTP 계정/비밀번호 확인 필요'),
    ).toBeInTheDocument();
  });
});
