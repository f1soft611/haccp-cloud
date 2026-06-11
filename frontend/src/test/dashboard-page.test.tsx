import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { DashboardPage } from '../pages/DashboardPage';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/ui/labels';

describe('Dashboard page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: 'TENANT-A',
      userId: 'tenant_admin',
      role: 'TENANT_ADMIN',
    });
  });

  it('shows mixed KPI cards and haccp operations blocks', async () => {
    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(await screen.findByTestId('kpi-card-ccp-rate')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: APP_LABELS.dashboard.blocks.loginPanel,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: APP_LABELS.dashboard.blocks.todos }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: APP_LABELS.dashboard.blocks.recentHistory,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '공지사항' }),
    ).toBeInTheDocument();
  });

  it('shows user todo hub for USER role and hides admin hub', async () => {
    useAuthStore.setState({
      role: 'USER',
      userId: 'general_user',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(await screen.findByTestId('dashboard-user-hub')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-admin-hub')).not.toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: APP_LABELS.dashboard.hubs.documents }),
    ).toHaveAttribute('href', '/documents');
    expect(
      screen.getByRole('link', { name: APP_LABELS.dashboard.hubs.history }),
    ).toHaveAttribute('href', '/document-history');
  });

  it.each(['TENANT_ADMIN', 'PLATFORM_ADMIN'] as const)(
    'shows shared admin management links for %s role',
    async (adminRole) => {
      useAuthStore.setState({
        role: adminRole,
      });

      render(
        <AppProviders>
          <DashboardPage />
        </AppProviders>,
      );

      expect(
        await screen.findByTestId('dashboard-admin-hub'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('dashboard-user-hub'),
      ).not.toBeInTheDocument();

      expect(
        screen.getByRole('link', { name: APP_LABELS.dashboard.hubs.users }),
      ).toHaveAttribute('href', '/users');
      expect(
        screen.getByRole('link', {
          name: APP_LABELS.dashboard.hubs.departments,
        }),
      ).toHaveAttribute('href', '/departments');
    },
  );

  it('hides onboarding link for TENANT_ADMIN', async () => {
    useAuthStore.setState({
      role: 'TENANT_ADMIN',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    await screen.findByTestId('dashboard-admin-hub');

    expect(
      screen.queryByRole('link', {
        name: APP_LABELS.dashboard.hubs.onboarding,
      }),
    ).not.toBeInTheDocument();
  });

  it('shows onboarding link for PLATFORM_ADMIN', async () => {
    useAuthStore.setState({
      role: 'PLATFORM_ADMIN',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    await screen.findByTestId('dashboard-admin-hub');

    expect(
      screen.getByRole('link', {
        name: APP_LABELS.dashboard.hubs.onboarding,
      }),
    ).toHaveAttribute('href', '/onboarding');
  });
});
