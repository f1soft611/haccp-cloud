import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { http, HttpResponse } from 'msw';
import { appTheme } from '../app/theme';
import { server } from '../mocks/server';
import { TenantFirstLoginSetupPage } from '../pages/tenant-management/onboarding/TenantFirstLoginSetupPage';
import { useAuthStore } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/constants/labels';

describe('Tenant first login setup page', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: 'TENANT-Z',
        userId: 'tenant_admin',
        role: 'TENANT_ADMIN',
        onboardingRequired: true,
        onboardingStatus: 'NOT_STARTED',
      });
    });
  });

  afterEach(() => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: false,
        tenantCode: '',
        userId: '',
        role: 'USER',
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });
  });

  function renderPage() {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <TenantFirstLoginSetupPage />
        </ThemeProvider>
      </QueryClientProvider>,
    );
  }

  it('renders setup progress counts from API', async () => {
    server.use(
      http.get('/api/first-login-setup/status', () =>
        HttpResponse.json({
          tenantCode: 'TENANT-Z',
          userCount: 0,
          departmentCount: 1,
          onboardingRequired: true,
          onboardingStatus: 'IN_PROGRESS',
        }),
      ),
    );

    renderPage();

    expect(
      await screen.findByRole('heading', {
        name: APP_LABELS.pageTitle.tenantFirstSetup,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText('사용자 0 / 1')).toBeInTheDocument();
    expect(await screen.findByText('부서 1 / 1')).toBeInTheDocument();
  });

  it('uses default MSW first-login handlers end-to-end without endpoint overrides', async () => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: 'TENANT-E2E-MSW',
        userId: 'tenant_admin',
        role: 'TENANT_ADMIN',
        onboardingRequired: true,
        onboardingStatus: 'NOT_STARTED',
      });
    });

    renderPage();

    expect(await screen.findByText('사용자 0 / 1')).toBeInTheDocument();
    expect(await screen.findByText('부서 0 / 1')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.name), {
      target: { value: '최초관리자' },
    });
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.email), {
      target: { value: 'first-admin-e2e@test.com' },
    });
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.department), {
      target: { value: '품질관리팀' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.addUser }),
    );

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.departmentName), {
      target: { value: '생산1팀' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.addDepartment }),
    );

    expect(await screen.findByText('사용자 1 / 1')).toBeInTheDocument();
    expect(await screen.findByText('부서 1 / 1')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: APP_LABELS.action.completeFirstSetup,
      }),
    );

    expect(
      await screen.findByText(APP_LABELS.message.tenantFirstSetupCompleted),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().onboardingRequired).toBe(false);
    expect(useAuthStore.getState().onboardingStatus).toBe('COMPLETED');
  });

  it('completes onboarding after user and department are created', async () => {
    let userCount = 0;
    let departmentCount = 0;

    const getOnboardingStatus = () => {
      if (userCount >= 1 && departmentCount >= 1) {
        return 'COMPLETED' as const;
      }

      if (userCount === 0 && departmentCount === 0) {
        return 'NOT_STARTED' as const;
      }

      return 'IN_PROGRESS' as const;
    };

    server.use(
      http.get('/api/first-login-setup/status', () =>
        HttpResponse.json({
          tenantCode: 'TENANT-Z',
          userCount,
          departmentCount,
          onboardingRequired: !(userCount >= 1 && departmentCount >= 1),
          onboardingStatus: getOnboardingStatus(),
        }),
      ),
      http.post('/api/users', async ({ request }) => {
        const payload = (await request.json()) as {
          name?: string;
          email?: string;
          department?: string;
          role?: string;
        };

        if (
          !payload.name ||
          !payload.email ||
          !payload.department ||
          !payload.role
        ) {
          return HttpResponse.json(
            { message: 'Invalid input' },
            { status: 400 },
          );
        }

        userCount += 1;

        return HttpResponse.json({
          id: `U-${userCount}`,
          tenantCode: 'TENANT-Z',
          name: payload.name,
          email: payload.email,
          department: payload.department,
          role: payload.role,
          active: true,
        });
      }),
      http.post('/api/departments', async ({ request }) => {
        const payload = (await request.json()) as { name?: string };

        if (!payload.name) {
          return HttpResponse.json(
            { message: 'Invalid input' },
            { status: 400 },
          );
        }

        departmentCount += 1;

        return HttpResponse.json({
          id: `D-${departmentCount}`,
          tenantCode: 'TENANT-Z',
          name: payload.name,
          active: true,
        });
      }),
      http.post('/api/first-login-setup/complete', () => {
        if (userCount < 1 || departmentCount < 1) {
          return HttpResponse.json(
            { message: '사용자 1명 이상, 부서 1개 이상이 필요합니다.' },
            { status: 422 },
          );
        }

        return HttpResponse.json({
          tenantCode: 'TENANT-Z',
          userCount,
          departmentCount,
          onboardingRequired: false,
          onboardingStatus: 'COMPLETED',
        });
      }),
    );

    renderPage();

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.name), {
      target: { value: '최초관리자' },
    });
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.email), {
      target: { value: 'first-admin@test.com' },
    });
    fireEvent.change(screen.getByLabelText(APP_LABELS.field.department), {
      target: { value: '품질관리팀' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.addUser }),
    );

    fireEvent.change(screen.getByLabelText(APP_LABELS.field.departmentName), {
      target: { value: '생산1팀' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.addDepartment }),
    );

    expect(await screen.findByText('사용자 1 / 1')).toBeInTheDocument();
    expect(await screen.findByText('부서 1 / 1')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: APP_LABELS.action.completeFirstSetup,
      }),
    );

    expect(
      await screen.findByText(APP_LABELS.message.tenantFirstSetupCompleted),
    ).toBeInTheDocument();

    expect(useAuthStore.getState().onboardingRequired).toBe(false);
    expect(useAuthStore.getState().onboardingStatus).toBe('COMPLETED');
  });

  it('does not mark onboarding completed when completion response is not completed', async () => {
    server.use(
      http.get('/api/first-login-setup/status', () =>
        HttpResponse.json({
          tenantCode: 'TENANT-Z',
          userCount: 1,
          departmentCount: 1,
          onboardingRequired: false,
          onboardingStatus: 'COMPLETED',
        }),
      ),
      http.post('/api/first-login-setup/complete', () =>
        HttpResponse.json({
          completed: false,
          onboardingRequired: true,
          onboardingStatus: 'IN_PROGRESS',
        }),
      ),
    );

    renderPage();

    expect(await screen.findByText('사용자 1 / 1')).toBeInTheDocument();
    expect(await screen.findByText('부서 1 / 1')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: APP_LABELS.action.completeFirstSetup,
      }),
    );

    expect(
      await screen.findByText(
        APP_LABELS.message.tenantFirstSetupCompleteFailed,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(APP_LABELS.message.tenantFirstSetupCompleted),
    ).not.toBeInTheDocument();

    expect(useAuthStore.getState().onboardingRequired).toBe(true);
    expect(useAuthStore.getState().onboardingStatus).toBe('NOT_STARTED');
  });

  it('shows requirement error when completing setup without enough entities', async () => {
    server.use(
      http.get('/api/first-login-setup/status', () =>
        HttpResponse.json({
          tenantCode: 'TENANT-Z',
          userCount: 0,
          departmentCount: 0,
          onboardingRequired: true,
          onboardingStatus: 'NOT_STARTED',
        }),
      ),
      http.post('/api/first-login-setup/complete', () =>
        HttpResponse.json(
          { message: '사용자 1명 이상, 부서 1개 이상이 필요합니다.' },
          { status: 422 },
        ),
      ),
    );

    renderPage();

    expect(await screen.findByText('사용자 0 / 1')).toBeInTheDocument();
    expect(await screen.findByText('부서 0 / 1')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: APP_LABELS.action.completeFirstSetup,
      }),
    );

    expect(
      await screen.findByText('사용자 1명 이상, 부서 1개 이상이 필요합니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(APP_LABELS.message.tenantFirstSetupCompleted),
    ).not.toBeInTheDocument();
    expect(useAuthStore.getState().onboardingRequired).toBe(true);
    expect(useAuthStore.getState().onboardingStatus).toBe('NOT_STARTED');
  });
});
