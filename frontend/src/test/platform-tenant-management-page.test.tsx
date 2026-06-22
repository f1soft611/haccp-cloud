import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appTheme } from '../app/theme';
import { PlatformTenantManagementPage } from '../pages/platform-admin/tenants/PlatformTenantManagementPage';

const { listPlatformTenantsMock } = vi.hoisted(() => ({
  listPlatformTenantsMock: vi.fn(),
}));

vi.mock('../services/platform/platformTenantManagementService', () => ({
  listPlatformTenants: listPlatformTenantsMock,
}));

function renderPage(initialPath = '/platform/tenants') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={client}>
        <ThemeProvider theme={appTheme}>
          <Routes>
            <Route
              path="/platform/tenants"
              element={<PlatformTenantManagementPage />}
            />
            <Route
              path="/platform/onboarding"
              element={<div data-testid="onboarding-route">onboarding</div>}
            />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('PlatformTenantManagementPage', () => {
  beforeEach(() => {
    listPlatformTenantsMock.mockReset();
    listPlatformTenantsMock.mockResolvedValue({
      items: [
        {
          tenantCode: 'TENANT-A',
          companyName: '테스트푸드',
          adminName: '홍길동',
          adminEmail: 'admin@test.com',
          status: 'ACTIVE',
          createdAt: '2026-06-21T10:30:00.000Z',
        },
      ],
      total: 1,
      active: 1,
      inactive: 0,
    });
  });

  it('renders page header, grid columns and onboarding CTA', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: '업체 관리' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '신규 온보딩' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '업체코드' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '업체명' }),
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no tenant rows', async () => {
    listPlatformTenantsMock.mockResolvedValueOnce({
      items: [],
      total: 0,
      active: 0,
      inactive: 0,
    });

    renderPage();

    expect(
      await screen.findByText('조회 결과가 없습니다.'),
    ).toBeInTheDocument();
  });

  it('navigates to onboarding page when clicking 신규 온보딩', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '신규 온보딩' }));

    expect(await screen.findByTestId('onboarding-route')).toBeInTheDocument();
  });
});
