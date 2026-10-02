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

describe('OnboardingVerifyPage login domain field', () => {
  it('keeps a manually entered domain instead of resetting to the email domain', async () => {
    vi.spyOn(tenantService, 'verifyTenantEmailByToken').mockResolvedValue({
      tenantCode: 'TENANT-1',
      tenantNm: '테스트푸드',
      adminEmail: 'admin@testfood.com',
      loginAccountId: 1,
      adminLoginCode: 'admin',
      verified: true,
      message: '인증되었습니다.',
    });

    renderPage();

    const domainField = (await screen.findByLabelText(
      '회사 로그인 도메인',
    )) as HTMLInputElement;

    await waitFor(() => expect(domainField.value).toBe('testfood.com'));

    fireEvent.change(domainField, { target: { value: '' } });

    await waitFor(() => expect(domainField.value).toBe(''));

    fireEvent.change(domainField, { target: { value: 'custom-login.co.kr' } });

    expect(domainField.value).toBe('custom-login.co.kr');
  });

  it('moves to /login/{tenantNo} after verification', async () => {
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

    renderPage();

    fireEvent.click(
        await screen.findByRole('button', { name: '로그인으로 이동' }),
    );

    expect(screen.getByTestId('location-path')).toHaveTextContent(
        '/login/482913',
    );
  });
});
