import { act, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appTheme } from '../../../../app/theme';
import { AppLayout } from '../../../../shared/components/layout/AppLayout';
import { PageHeader } from '../../../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../../../shared/store/authStore';

const mockListAccessibleMenuPaths = vi.fn<() => Promise<string[]>>();
const mockListAccessibleMenus = vi.fn();

vi.mock('../../../../services/platform-admin/platformUserMenuService', () => ({
  listAccessibleMenuPaths: () => mockListAccessibleMenuPaths(),
  listAccessibleMenus: () => mockListAccessibleMenus(),
}));

const renderLayout = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={appTheme}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/single" element={<PageHeader title="단일 화면" />} />
              <Route
                path="/group/item"
                element={<PageHeader title="하위 화면" />}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );

describe('AppLayout breadcrumb group label', () => {
  beforeEach(() => {
    mockListAccessibleMenuPaths.mockResolvedValue(['/single', '/group/item']);
    mockListAccessibleMenus.mockResolvedValue([
      {
        menuId: 1,
        parentMenuId: null,
        menuCode: 'MENU_SINGLE',
        path: '/single',
        menuNm: '단일 메뉴',
      },
      {
        menuId: 2,
        parentMenuId: null,
        menuCode: 'MENU_GROUP',
        path: '',
        menuNm: '그룹 메뉴',
      },
      {
        menuId: 3,
        parentMenuId: 2,
        menuCode: 'MENU_GROUP_ITEM',
        path: '/group/item',
        menuNm: '하위 메뉴',
      },
    ]);

    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: 'TENANT-A',
        userId: 'tenant_admin',
        role: 'TENANT_ADMIN',
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });
  });

  it('does not repeat the menu name in the breadcrumb of a single menu', async () => {
    renderLayout('/single');

    await screen.findByRole('link', { name: '단일 메뉴' });
    const heading = await screen.findByRole('heading', { name: '단일 메뉴' });

    expect(
      within(heading.parentElement as HTMLElement).queryByText('/'),
    ).not.toBeInTheDocument();
  });

  it('keeps the group name in the breadcrumb of a child menu', async () => {
    renderLayout('/group/item');

    await screen.findByRole('link', { name: '하위 메뉴' });
    const heading = await screen.findByRole('heading', { name: '하위 메뉴' });
    const header = within(heading.parentElement as HTMLElement);

    expect(header.getByText('/')).toBeInTheDocument();
    expect(header.getByText('그룹 메뉴')).toBeInTheDocument();
  });
});