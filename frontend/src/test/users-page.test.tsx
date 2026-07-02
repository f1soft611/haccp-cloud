import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { UsersPage } from '../pages/organization/users/UsersPage';
import { useAuthStore } from '../shared/store/authStore';

describe('UsersPage', () => {
  it('shows the shared page header with dashboard group breadcrumb', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
    });

    render(
      <AppProviders>
        <UsersPage />
      </AppProviders>,
    );

    expect(await screen.findByText('대시보드 관리')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '사용자 관리' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('총 2건')).toBeInTheDocument();
    expect(
      await screen.findAllByRole('button', { name: '사용자 수정' }),
    ).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: '로그인 차단' })).toHaveLength(
      2,
    );
  });

  it('shows authority names from role data in the grid', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
    });

    render(
      <AppProviders>
        <UsersPage />
      </AppProviders>,
    );

    expect(await screen.findByText('업체 관리자')).toBeInTheDocument();
    expect(await screen.findByText('총 2건')).toBeInTheDocument();

    expect(await screen.findByText('업체 사용자')).toBeInTheDocument();
  });
});
