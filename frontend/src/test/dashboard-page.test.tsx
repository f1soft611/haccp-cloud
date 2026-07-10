import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { DashboardPage } from '../pages/DashboardPage';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/constants/labels';

describe('Dashboard page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });
  });

  it('renders the tenant admin dashboard shell with shared navigation and actions', async () => {
    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(await screen.findByTestId('kpi-card-ccp-rate')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '관리자 허브' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: APP_LABELS.dashboard.blocks.todos }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '공지사항' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: APP_LABELS.dashboard.hubs.users }),
    ).toHaveAttribute('href', '/org/users');
    expect(
      screen.getByRole('link', { name: APP_LABELS.dashboard.hubs.departments }),
    ).toHaveAttribute('href', '/org/departments');
  });

  it('renders the platform admin dashboard top section without the legacy login panel', async () => {
    useAuthStore.setState({
      tenantCode: 'TENANT-A',
      userId: 'platform_admin',
      role: 'PLATFORM_ADMIN',
      planCode: 'P',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(
      await screen.findByTestId('platform-admin-dashboard'),
    ).toBeInTheDocument();
    expect(screen.getByText('자주 찾는 메뉴')).toBeInTheDocument();
    expect(
      screen.queryByText(APP_LABELS.dashboard.platformAdmin.title),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('platform_admin')).not.toBeInTheDocument();
  });
});
