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

  it('shows shared admin management links for TENANT_ADMIN role', async () => {
    useAuthStore.setState({
      role: 'TENANT_ADMIN',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(await screen.findByTestId('dashboard-admin-hub')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-user-hub')).not.toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: APP_LABELS.dashboard.hubs.users }),
    ).toHaveAttribute('href', '/users');
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.dashboard.hubs.departments,
      }),
    ).toHaveAttribute('href', '/departments');
  });

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

  it('shows platform admin management KPIs and sections', async () => {
    useAuthStore.setState({
      role: 'PLATFORM_ADMIN',
      userId: 'platform_admin',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', {
        name: APP_LABELS.dashboard.platformAdmin.sections.tenantCodeIssuance,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: APP_LABELS.dashboard.platformAdmin.sections.tenantList,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: APP_LABELS.dashboard.platformAdmin.sections.ccpDocuments,
      }),
    ).toBeInTheDocument();
  });

  it('hides legacy haccp operations blocks for PLATFORM_ADMIN', async () => {
    useAuthStore.setState({
      role: 'PLATFORM_ADMIN',
      userId: 'platform_admin',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    await screen.findByTestId('platform-admin-dashboard');

    expect(
      screen.queryByRole('heading', {
        name: APP_LABELS.dashboard.blocks.todos,
      }),
    ).not.toBeInTheDocument();
  });
});
