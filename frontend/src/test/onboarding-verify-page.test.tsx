import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { OnboardingVerifyPage } from '../pages/platform-admin/tenants/OnboardingVerifyPage';
import * as tenantService from '../services/organization/tenantService';
import { appTheme } from '../app/theme';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <MemoryRouter initialEntries={['/onboarding/verify?token=abc123']}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <OnboardingVerifyPage />
          <LocationProbe />
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location-path">{location.pathname}</div>;
}

// 이메일 인증 성공 응답 mock (도메인 필드 테스트 공용)
function mockVerified() {
  vi.spyOn(tenantService, 'verifyTenantEmailByToken').mockResolvedValue({
    tenantCode: 'TENANT-1',
    tenantNo: '482913',
    tenantNm: '테스트푸드',
    adminEmail: 'admin@testfood.com',
    loginAccountId: 1,
    adminLoginCode: 'admin',
    verified: true,
    message: '인증되었습니다.',
  });
}

// 비밀번호 두 칸을 같은 값으로 채움
function fillPassword() {
  fireEvent.change(screen.getByLabelText('비밀번호'), {
    target: { value: 'Passw0rd!' },
  });
  fireEvent.change(screen.getByLabelText('비밀번호 확인'), {
    target: { value: 'Passw0rd!' },
  });
}

describe('OnboardingVerifyPage login domain field', () => {
  // 케이스 간 spy 호출 기록이 넘어가지 않도록 매번 원복
  afterEach(() => vi.restoreAllMocks());

  it('leaves the domain field empty after verification', async () => {
    mockVerified();
    renderPage();

    const domainField = (await screen.findByLabelText(
      '회사 로그인 도메인(선택)',
    )) as HTMLInputElement;

    expect(domainField.value).toBe('');
  });

  it('completes onboarding without a domain', async () => {
    mockVerified();
    const completeSpy = vi
      .spyOn(tenantService, 'completeTenantOnboarding')
      .mockResolvedValue(undefined as never);
    renderPage();

    await screen.findByLabelText('회사 로그인 도메인(선택)');
    fillPassword();
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 설정 완료' }));

    await waitFor(() => expect(completeSpy).toHaveBeenCalledTimes(1));
    expect(completeSpy.mock.calls[0][0].loginDomain).toBeUndefined();
  });

  it('blocks an invalid domain format', async () => {
    mockVerified();
    const completeSpy = vi
      .spyOn(tenantService, 'completeTenantOnboarding')
      .mockResolvedValue(undefined as never);
    renderPage();

    fireEvent.change(
      await screen.findByLabelText('회사 로그인 도메인(선택)'),
      { target: { value: 'abc' } },
    );
    fillPassword();
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 설정 완료' }));

    expect(
      await screen.findByText('유효한 도메인 형식으로 입력해 주세요.'),
    ).toBeInTheDocument();
    expect(completeSpy).not.toHaveBeenCalled();
  });

  it('moves to /login/{tenantNo} after verification', async () => {
    mockVerified();

    renderPage();

    fireEvent.click(
        await screen.findByRole('button', { name: '로그인으로 이동' }),
    );

    expect(screen.getByTestId('location-path')).toHaveTextContent(
        '/login/482913',
    );
  });
});
