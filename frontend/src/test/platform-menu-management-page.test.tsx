import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { PlatformMenuManagementPage } from '../pages/platform-admin/menus/PlatformMenuManagementPage';
import { useAuthStore } from '../shared/store/authStore';

const { listPlatformMenusMock } = vi.hoisted(() => ({
  listPlatformMenusMock: vi.fn(async () => [
    {
      menuId: 'PM-1',
      menuNm: '메뉴 관리',
      menuDc: '플랫폼 메뉴 관리',
      menuUrl: '/test',
      parentMenuId: null,
      menuOrdr: 1,
      iconNm: 'Menu',
      useAt: 'Y',
    },
  ]),
}));

const DEFAULT_MENUS = [
  {
    menuId: 'PM-1',
    menuNm: '메뉴 관리',
    menuDc: '플랫폼 메뉴 관리',
    menuUrl: '/test',
    parentMenuId: null,
    menuOrdr: 1,
    iconNm: 'Menu',
    useAt: 'Y',
  },
];

vi.mock('../services/platform/platformMenuService', () => ({
  listPlatformMenus: listPlatformMenusMock,
  createPlatformMenu: vi.fn(),
  updatePlatformMenu: vi.fn(),
  deletePlatformMenu: vi.fn(),
}));

function renderPage() {
  render(
    <AppProviders>
      <PlatformMenuManagementPage />
    </AppProviders>,
  );
}

describe('PlatformMenuManagementPage', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: false,
        tenantCode: '',
        userId: '',
        role: 'USER',
        accessToken: '',
        refreshToken: '',
        loginHistoryId: undefined,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });

    listPlatformMenusMock.mockReset();
    listPlatformMenusMock.mockImplementation(async () => DEFAULT_MENUS);
  });

  it('uses dark row background for platform admin theme', async () => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        tenantCode: '000001',
        userId: 'platform_admin',
        role: 'PLATFORM_ADMIN',
        accessToken: 'token',
        refreshToken: 'refresh',
        loginHistoryId: 1,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED',
      });
    });

    renderPage();

    const urlCell = await screen.findByText('/test');
    const row = urlCell.closest('tr');

    expect(row).not.toBeNull();
    expect(window.getComputedStyle(urlCell).backgroundColor).not.toBe(
      'rgb(255, 255, 255)',
    );
  });

  it('shows grid skeleton rows while menu query is loading', async () => {
    listPlatformMenusMock.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return DEFAULT_MENUS;
    });

    renderPage();

    expect(
      await screen.findByTestId('platform-menu-grid-skeleton-row-0'),
    ).toBeInTheDocument();
  });

  it('uses shared FormDialog for menu edit modal', async () => {
    renderPage();

    await screen.findByRole('heading', { name: '메뉴 관리' });

    const editIcons = await screen.findAllByTestId('EditOutlinedIcon');
    const firstEditButton = editIcons[0]?.closest('button');

    expect(firstEditButton).not.toBeNull();

    fireEvent.click(firstEditButton as HTMLButtonElement);

    expect(
      await screen.findByTestId('form-dialog-actions'),
    ).toBeInTheDocument();
  });

  it('renders add modal actions in order: 추가 then 취소', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '+ 메뉴 추가' }));

    const addButton = await screen.findByRole('button', { name: '추가' });
    const cancelButton = await screen.findByRole('button', { name: '취소' });

    const buttonPosition = addButton.compareDocumentPosition(cancelButton);
    expect(buttonPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
