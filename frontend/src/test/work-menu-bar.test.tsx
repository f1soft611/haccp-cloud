import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { appTheme } from '../app/theme';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useAuthStore, type UserRole } from '../shared/store/authStore';
import { APP_LABELS } from '../shared/constants/labels';

const renderLayoutWithRole = (role: UserRole, path: string) => {
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
    </ThemeProvider>,
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
  afterEach(() => {
    resetAuthStore();
  });

  it('PLATFORM_ADMIN sees dashboardGroup and systemGroup buttons but not a users link', () => {
    renderLayoutWithRole('PLATFORM_ADMIN', '/dashboard');

    expect(
      screen.getByRole('button', { name: APP_LABELS.menu.dashboardGroup }),
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

    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.menu.systemGroup }),
    );

    expect(
      await screen.findByRole('link', {
        name: APP_LABELS.menu.platformMenuManagement,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.menu.platformRoleManagement,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: APP_LABELS.menu.platformRoleMenuManagement,
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
});
