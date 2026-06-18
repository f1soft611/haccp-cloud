import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { vi } from 'vitest';
import { appTheme } from '../app/theme';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useAuthStore, type UserRole } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/constants/labels';

const mockListAccessibleMenuPaths =
  vi.fn<(authorityCode: string) => Promise<string[]>>();

vi.mock('../services/platform/platformUserMenuService', () => ({
  listAccessibleMenuPaths: (authorityCode: string) =>
    mockListAccessibleMenuPaths(authorityCode),
}));

const renderLayoutWithRole = (
  role: UserRole,
  path: string,
  accessiblePaths?: string[],
) => {
  const defaultPathsByRole: Record<UserRole, string[]> = {
    PLATFORM_ADMIN: [
      '/dashboard',
      '/platform/onboarding',
      '/platform/menus',
      '/platform/roles',
      '/platform/role-menus',
    ],
    TENANT_ADMIN: ['/dashboard', '/users', '/documents'],
    USER: ['/dashboard', '/documents'],
  };

  const menuPaths = accessiblePaths ?? defaultPathsByRole[role];

  mockListAccessibleMenuPaths.mockResolvedValue(menuPaths);

  act(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      tenantCode: role === 'PLATFORM_ADMIN' ? '000001' : 'TENANT-A',
      userId:
        role === 'PLATFORM_ADMIN'
          ? 'platform_admin'
          : role === 'TENANT_ADMIN'
            ? 'tenant_admin'
            : 'user01',
      role,
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });
  });

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={appTheme}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route
                path="/dashboard"
                element={<div data-testid="dashboard-stub">dashboard</div>}
              />
              <Route
                path="/platform/menus"
                element={
                  <div data-testid="platform-menus-stub">platform menus</div>
                }
              />
              <Route
                path="/platform/roles"
                element={
                  <div data-testid="platform-roles-stub">platform roles</div>
                }
              />
              <Route
                path="/platform/role-menus"
                element={
                  <div data-testid="platform-role-menus-stub">role menus</div>
                }
              />
              <Route
                path="/users"
                element={<div data-testid="users-stub">users</div>}
              />
              <Route
                path="/documents"
                element={<div data-testid="documents-stub">documents</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

const resetAuthStore = () => {
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
};

describe('WorkMenuBar role-based visibility', () => {
  beforeEach(() => {
    mockListAccessibleMenuPaths.mockImplementation(async () => []);
  });

  afterEach(() => {
    resetAuthStore();
    mockListAccessibleMenuPaths.mockReset();
  });

  it('PLATFORM_ADMIN sees dashboardGroup and systemGroup buttons but not a users link', async () => {
    renderLayoutWithRole('PLATFORM_ADMIN', '/dashboard');

    expect(
      await screen.findByRole('button', {
        name: APP_LABELS.menu.dashboardGroup,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: APP_LABELS.menu.systemGroup }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: APP_LABELS.menu.users }),
    ).not.toBeInTheDocument();
  });

  it('clicking systemGroup button reveals platform management links but not users link', async () => {
    renderLayoutWithRole('PLATFORM_ADMIN', '/dashboard');

    const systemGroupButton = await screen.findByRole('button', {
      name: APP_LABELS.menu.systemGroup,
    });

    fireEvent.click(
      systemGroupButton,
    );

    expect(
      await screen.findByRole('link', {
        name: APP_LABELS.menu.platformMenuManagement,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.menu.platformFactoryManagement,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.menu.platformFactoryManagement,
      }),
    ).toHaveAttribute('href', '/platform/onboarding');
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.menu.platformRoleManagement,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: APP_LABELS.menu.users }),
    ).not.toBeInTheDocument();
  });

  it('USER does not see systemGroup button and does not see platformMenuManagement link', () => {
    renderLayoutWithRole('USER', '/dashboard');

    expect(
      screen.queryByRole('button', { name: APP_LABELS.menu.systemGroup }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: APP_LABELS.menu.platformMenuManagement,
      }),
    ).not.toBeInTheDocument();
  });

  it('filters platform system menus when accessible menu paths do not include platform pages', async () => {
    renderLayoutWithRole('PLATFORM_ADMIN', '/dashboard', ['/users']);

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: APP_LABELS.menu.systemGroup }),
      ).not.toBeInTheDocument();
    });
  });

  it('work-menu-bar has segmented nav variant marker', async () => {
    renderLayoutWithRole('PLATFORM_ADMIN', '/dashboard');

    await screen.findByRole('button', { name: APP_LABELS.menu.dashboardGroup });

    expect(screen.getByTestId('work-menu-bar')).toHaveAttribute(
      'data-nav-variant',
      'segmented',
    );
  });

  it('does not show placeholder menu groups before accessible menu paths are resolved', async () => {
    let resolveMenuPaths: ((paths: string[]) => void) | null = null;
    const pendingMenuPaths = new Promise<string[]>((resolve) => {
      resolveMenuPaths = resolve;
    });

    mockListAccessibleMenuPaths.mockReturnValue(pendingMenuPaths);

    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: '000001',
        userId: 'platform_admin',
        role: 'PLATFORM_ADMIN',
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ThemeProvider theme={appTheme}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route
                  path="/dashboard"
                  element={<div data-testid="dashboard-stub">dashboard</div>}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(
      screen.queryByRole('button', { name: APP_LABELS.menu.dashboardGroup }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: APP_LABELS.menu.systemGroup }),
    ).not.toBeInTheDocument();

    resolveMenuPaths?.(['/platform/onboarding', '/platform/menus']);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: APP_LABELS.menu.systemGroup }),
      ).toBeInTheDocument();
    });
  });

  it('group buttons expose aria-pressed state', async () => {
    renderLayoutWithRole('PLATFORM_ADMIN', '/dashboard');

    const systemBtn = await screen.findByRole('button', {
      name: APP_LABELS.menu.systemGroup,
    });
    expect(systemBtn).toHaveAttribute('aria-pressed');
  });
});
