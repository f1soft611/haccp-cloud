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
  updatePlatformTenantMock,
} = vi.hoisted(() => ({
  getPlatformTenantByCodeMock: vi.fn(),
  dispatchTenantVerificationEmailMock: vi.fn(),
  resendTenantVerificationEmailMock: vi.fn(),
  updatePlatformTenantMock: vi.fn(),
}));

vi.mock(
  '../services/platform-admin/tenants/platformTenantManagementService',
  () => ({
    getPlatformTenantByCode: getPlatformTenantByCodeMock,
    dispatchTenantVerificationEmail: dispatchTenantVerificationEmailMock,
    resendTenantVerificationEmail: resendTenantVerificationEmailMock,
    updatePlatformTenant: updatePlatformTenantMock,
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

  it('업체번호 칩을 표시한다', async () => {
    getPlatformTenantByCodeMock.mockResolvedValue({
      tenantCode: 'TENANT-A',
      tenantNo: '482913',
      companyName: '테스트푸드',
      adminName: '홍길동',
      adminEmail: 'admin@test.com',
      status: 'ACTIVE',
      onboardingStatus: 'ACTIVE',
      createdAt: '2026-06-21T10:30:00.000Z',
    });

    renderPage();

    expect(await screen.findByText('업체번호 482913')).toBeInTheDocument();
  });

  it('수정 다이얼로그에서 업체명을 바꿔 저장한다', async () => {
    getPlatformTenantByCodeMock.mockResolvedValue({
      tenantCode: 'TENANT-A',
      companyName: '테스트푸드',
      adminName: '홍길동',
      adminEmail: 'admin@test.com',
      status: 'ACTIVE',
      onboardingStatus: 'ACTIVE',
      businessType: '식품제조',
      businessCategory: '즉석조리식품',
      createdAt: '2026-06-21T10:30:00.000Z',
    });
    updatePlatformTenantMock.mockResolvedValue(null);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '수정' }));
    const nameInput = await screen.findByLabelText(/업체명/);
    fireEvent.change(nameInput, { target: { value: '수정푸드' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(updatePlatformTenantMock).toHaveBeenCalledWith(
          'TENANT-A',
          expect.objectContaining({
            companyName: '수정푸드',
            businessType: '식품제조',
            businessCategory: '즉석조리식품',
            removeLogo: false,
          }),
      );
    });
    expect(
        await screen.findByText('업체 정보를 수정했습니다.'),
    ).toBeInTheDocument();
  });
});
