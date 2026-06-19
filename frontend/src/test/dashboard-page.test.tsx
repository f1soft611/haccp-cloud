import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { AppProviders } from '../app/providers/AppProviders';
import { server } from '../mocks/server';
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

    expect(
      await screen.findByTestId('dashboard-admin-hub'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-user-hub')).not.toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: APP_LABELS.dashboard.hubs.users }),
    ).toHaveAttribute('href', '/users');
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.dashboard.hubs.departments,
      }),
    ).toHaveAttribute('href', '/departments');

    expect(
      screen.queryByTestId('platform-admin-dashboard'),
    ).not.toBeInTheDocument();
  });

  it('keeps tenant admin legacy dashboard blocks and does not render platform admin view', async () => {
    useAuthStore.setState({
      role: 'TENANT_ADMIN',
      userId: 'tenant_admin',
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
      screen.queryByTestId('platform-admin-dashboard'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: APP_LABELS.dashboard.blocks.todos,
      }),
    ).toBeInTheDocument();
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

    expect(screen.getByText('자주 찾는 메뉴')).toBeInTheDocument();
    expect(
      screen.getByText(
        APP_LABELS.dashboard.platformAdmin.topbar.loginInfoLabel,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: APP_LABELS.action.changePassword,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: APP_LABELS.action.logout,
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

    expect(
      screen.queryByRole('button', {
        name: APP_LABELS.dashboard.platformAdmin.quickActions.menuManagement,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: APP_LABELS.dashboard.platformAdmin.quickActions.roleManagement,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: APP_LABELS.dashboard.platformAdmin.quickActions
          .roleMenuManagement,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders redesigned platform admin top section without title and without userId exposure', async () => {
    useAuthStore.setState({
      role: 'PLATFORM_ADMIN',
      userId: 'platform_admin',
      displayName: '플랫폼관리자',
    });

    render(
      <AppProviders>
        <DashboardPage />
      </AppProviders>,
    );

    await screen.findByTestId('platform-admin-dashboard');

    expect(
      screen.queryByText(APP_LABELS.dashboard.platformAdmin.title),
    ).not.toBeInTheDocument();

    expect(screen.getByText('자주 찾는 메뉴')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: '비밀번호 변경' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: '플랫폼관리자' }),
    ).toBeInTheDocument();

    expect(screen.queryByText(/사용자 ID/i)).not.toBeInTheDocument();
    expect(screen.queryByText('platform_admin')).not.toBeInTheDocument();
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

    expect(screen.queryByTestId('dashboard-admin-hub')).not.toBeInTheDocument();

    expect(
      screen.queryByRole('heading', {
        name: APP_LABELS.dashboard.blocks.todos,
      }),
    ).not.toBeInTheDocument();
  });

  it('shows independent section warning when tenant list API fails', async () => {
    server.use(
      http.get('/api/platform-admin/dashboard/tenants', () =>
        HttpResponse.json({ message: 'error' }, { status: 500 }),
      ),
    );

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
      await screen.findByText('업체 목록 데이터를 불러오지 못했습니다.'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: APP_LABELS.dashboard.platformAdmin.sections.ccpDocuments,
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(APP_LABELS.dashboard.platformAdmin.errorMessage),
    ).not.toBeInTheDocument();
  });

  it('shows loading skeleton while platform admin dashboard data is pending', async () => {
    server.use(
      http.get('/api/platform-admin/dashboard/kpis', async () => {
        await delay(300);
        return HttpResponse.json({
          activeTenants: 0,
          newTenantsLast7Days: 0,
          ccpDocCompletionRate: 0,
          tenantsWithoutCcpDocs: 0,
        });
      }),
      http.get(
        '/api/platform-admin/dashboard/tenant-code-issuance',
        async () => {
          await delay(300);
          return HttpResponse.json({
            totalIssued: 0,
            issuedThisMonth: 0,
            issuedThisWeek: 0,
            recentIssues: [],
          });
        },
      ),
      http.get('/api/platform-admin/dashboard/tenants', async () => {
        await delay(300);
        return HttpResponse.json({
          summary: {
            total: 0,
            active: 0,
            inactive: 0,
          },
          items: [],
        });
      }),
      http.get('/api/platform-admin/dashboard/ccp-documents', async () => {
        await delay(300);
        return HttpResponse.json({
          overall: {
            completionRate: 0,
            completedTenants: 0,
            totalTenants: 0,
          },
          items: [],
        });
      }),
    );

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
      await screen.findByTestId('platform-admin-dashboard-skeleton'),
    ).toBeInTheDocument();
  });

  it('shows section retry button and recovers tenant list after retry', async () => {
    let shouldFailTenantList = true;

    server.use(
      http.get('/api/platform-admin/dashboard/tenants', () => {
        if (shouldFailTenantList) {
          return HttpResponse.json({ message: 'error' }, { status: 500 });
        }

        return HttpResponse.json({
          summary: {
            total: 2,
            active: 2,
            inactive: 0,
          },
          items: [
            {
              tenantCode: 'TENANT-A',
              companyName: '알파푸드',
              adminName: '관리자A',
              adminEmail: 'admin.a@alpha.com',
              status: 'ACTIVE',
              createdAt: '2026-06-10T09:00:00.000Z',
            },
            {
              tenantCode: 'TENANT-B',
              companyName: '베타HACCP',
              adminName: '관리자B',
              adminEmail: 'admin.b@beta.com',
              status: 'ACTIVE',
              createdAt: '2026-06-10T09:30:00.000Z',
            },
          ],
        });
      }),
    );

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
      await screen.findByText('업체 목록 데이터를 불러오지 못했습니다.'),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', {
      name: APP_LABELS.action.retry,
    });
    expect(retryButton).toBeInTheDocument();

    shouldFailTenantList = false;
    fireEvent.click(retryButton);

    await screen
      .findByText('업체 목록 데이터를 불러오지 못했습니다.', undefined, {
        timeout: 100,
      })
      .catch(() => {
        // error message is gone - success
      });

    await waitFor(
      () => {
        expect(
          screen.queryByText('업체 목록 데이터를 불러오지 못했습니다.'),
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
